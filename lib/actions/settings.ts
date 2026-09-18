"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tenantBrandingSchema } from "@/lib/validations/settings";
import { type ActionState } from "./types";

export async function updateTenantBranding(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");
  const parsed = tenantBrandingSchema.safeParse({
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl ?? null,
      primary_color: parsed.data.primaryColor ?? null,
    })
    .eq("id", session.tenant_id);

  if (error) return { ok: false, error: "Gagal menyimpan identitas klub" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createLocation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return { ok: false, error: "Nama lokasi wajib diisi" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("locations").insert({ name, address: address || null });
  if (error) return { ok: false, error: "Gagal menyimpan lokasi (mungkin sudah ada)" };

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function createClassType(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { ok: false, error: "Nama jenis kelas wajib diisi" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("class_types")
    .insert({ name, description: description || null });
  if (error) return { ok: false, error: "Gagal menyimpan jenis kelas (mungkin sudah ada)" };

  revalidatePath("/admin/settings");
  return { ok: true };
}
