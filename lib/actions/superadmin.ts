"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function updateTenantSubscription(formData: FormData): Promise<void> {
  const superadmin = await requireSuperadmin();

  const tenantId = String(formData.get("tenantId"));
  const planId = String(formData.get("planId"));
  const status = String(formData.get("status"));
  const notes = String(formData.get("notes") || "");

  if (!["trial", "active", "suspended", "cancelled"].includes(status)) {
    return;
  }

  const supabase = createAdminSupabaseClient();

  await supabase.from("platform_subscriptions").upsert(
    {
      tenant_id: tenantId,
      plan_id: planId,
      status,
      notes: notes || null,
      activated_at: status === "active" ? new Date().toISOString() : undefined,
      activated_by: status === "active" ? superadmin.email : undefined,
    },
    { onConflict: "tenant_id" }
  );

  await supabase.from("tenants").update({ is_active: status !== "suspended" }).eq("id", tenantId);

  revalidatePath("/superadmin");
}
