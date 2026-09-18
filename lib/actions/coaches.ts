"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { coachSchema, coachUpdateSchema } from "@/lib/validations/coaches";
import { type ActionState } from "./types";

export async function createCoach(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");

  const parsed = coachSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const input = parsed.data;

  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("tenant_id", session.tenant_id)
    .eq("email", input.email)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Email sudah terdaftar" };
  }

  const { data: coach, error } = await supabase
    .from("profiles")
    .insert({
      tenant_id: session.tenant_id,
      role: "coach",
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      must_change_password: true,
    })
    .select("id")
    .single();

  if (error || !coach) {
    return { ok: false, error: "Gagal membuat akun pelatih" };
  }

  const passwordHash = await hashPassword(generateTempPassword());
  const { error: credError } = await supabase
    .from("auth_credentials")
    .insert({ profile_id: coach.id, password_hash: passwordHash });

  if (credError) {
    await supabase.from("profiles").delete().eq("id", coach.id);
    return { ok: false, error: "Gagal membuat kredensial pelatih" };
  }

  revalidatePath("/admin/coaches");
  return { ok: true };
}

export async function updateCoach(
  coachId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");

  const parsed = coachUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone ?? null })
    .eq("id", coachId)
    .eq("role", "coach");

  if (error) {
    return { ok: false, error: "Gagal memperbarui data pelatih" };
  }

  revalidatePath("/admin/coaches");
  revalidatePath(`/admin/coaches/${coachId}`);
  return { ok: true };
}

export async function toggleCoachActiveForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const coachId = String(formData.get("coachId"));
  const isActive = formData.get("isActive") === "true";

  const supabase = await createServerSupabaseClient();
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", coachId);

  revalidatePath("/admin/coaches");
  revalidatePath(`/admin/coaches/${coachId}`);
}
