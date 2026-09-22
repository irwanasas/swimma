"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { packageSchema, subscriptionSchema, generateInvoicesSchema } from "@/lib/validations/billing";
import { type ActionState } from "./types";

export async function createPackage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");
  const pricingMode = formData.get("pricingMode");
  const parsed = packageSchema.safeParse(
    pricingMode === "session_pack"
      ? {
          pricingMode: "session_pack",
          name: formData.get("name"),
          price: formData.get("price"),
          sessionsIncluded: formData.get("sessionsIncluded"),
          validityWeeks: formData.get("validityWeeks"),
          description: formData.get("description") || undefined,
        }
      : {
          pricingMode: "cycle",
          name: formData.get("name"),
          price: formData.get("price"),
          billingCycle: formData.get("billingCycle"),
          description: formData.get("description") || undefined,
        }
  );
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("membership_packages").insert(
    parsed.data.pricingMode === "session_pack"
      ? {
          name: parsed.data.name,
          price: parsed.data.price,
          pricing_mode: "session_pack",
          sessions_included: parsed.data.sessionsIncluded,
          validity_weeks: parsed.data.validityWeeks,
          description: parsed.data.description ?? null,
        }
      : {
          name: parsed.data.name,
          price: parsed.data.price,
          pricing_mode: "cycle",
          billing_cycle: parsed.data.billingCycle,
          description: parsed.data.description ?? null,
        }
  );
  if (error) return { ok: false, error: "Gagal menyimpan paket" };

  revalidatePath("/admin/billing/packages");
  return { ok: true };
}

export async function createSubscription(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");
  const parsed = subscriptionSchema.safeParse({
    childId: formData.get("childId"),
    packageId: formData.get("packageId"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("subscriptions").insert({
    child_id: parsed.data.childId,
    package_id: parsed.data.packageId,
    start_date: parsed.data.startDate,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Anak ini sudah memiliki langganan aktif" };
    }
    return { ok: false, error: "Gagal menyimpan langganan" };
  }

  revalidatePath("/admin/billing/subscriptions");
  return { ok: true };
}

export async function cancelSubscriptionForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const subscriptionId = String(formData.get("subscriptionId"));
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", end_date: new Date().toISOString().slice(0, 10) })
    .eq("id", subscriptionId);
  revalidatePath("/admin/billing/subscriptions");
}

export async function generateInvoices(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");
  const parsed = generateInvoicesSchema.safeParse({
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("generate_invoices_for_period", {
    p_period_start: parsed.data.periodStart,
    p_period_end: parsed.data.periodEnd,
    p_due_date: parsed.data.dueDate,
    p_tenant_id: session.tenant_id,
  });

  if (error) return { ok: false, error: "Gagal membuat tagihan" };

  revalidatePath("/admin/billing/invoices");
  return { ok: true, message: `${(data as unknown[])?.length ?? 0} tagihan baru dibuat` };
}

export async function markInvoicePaidForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const invoiceId = String(formData.get("invoiceId"));
  const supabase = await createServerSupabaseClient();
  await supabase.rpc("mark_invoice_paid", { p_invoice_id: invoiceId });
  revalidatePath("/admin/billing/invoices");
  revalidatePath("/admin/cash-ledger");
}

export async function voidInvoiceForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const invoiceId = String(formData.get("invoiceId"));
  const supabase = await createServerSupabaseClient();
  await supabase.from("invoices").update({ status: "void" }).eq("id", invoiceId).eq("status", "outstanding");
  revalidatePath("/admin/billing/invoices");
}
