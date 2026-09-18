"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword, generateTempPassword } from "@/lib/auth/password";
import { childSchema, childUpdateSchema } from "@/lib/validations/members";
import { type ActionState } from "./types";

export interface DuplicateChildMatch {
  id: string;
  full_name: string;
  date_of_birth: string;
  parent_name: string;
  similarity: number;
}

export async function searchDuplicateChildren(
  fullName: string,
  dateOfBirth: string
): Promise<DuplicateChildMatch[]> {
  await requireActionRole("admin");
  if (!fullName.trim()) return [];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("search_similar_children", {
    p_full_name: fullName,
    p_date_of_birth: dateOfBirth || null,
  });
  if (error || !data) return [];
  return data as DuplicateChildMatch[];
}

export interface ParentMatch {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export async function searchParentByContact(contact: string): Promise<ParentMatch[]> {
  const session = await requireActionRole("admin");
  const trimmed = contact.trim();
  if (!trimmed) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("tenant_id", session.tenant_id)
    .eq("role", "parent")
    .or(`email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
    .limit(5);
  return (data as ParentMatch[]) ?? [];
}

export async function createChild(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");

  const raw = {
    parentMode: formData.get("parentMode"),
    existingParentId: formData.get("existingParentId") || undefined,
    parentFullName: formData.get("parentFullName") || undefined,
    parentEmail: formData.get("parentEmail") || undefined,
    parentPhone: formData.get("parentPhone") || undefined,
    childFullName: formData.get("childFullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    notes: formData.get("notes") || undefined,
    address: formData.get("address") || undefined,
    preferredLocationId: formData.get("preferredLocationId") || undefined,
  };

  const parsed = childSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const input = parsed.data;

  const supabase = createAdminSupabaseClient();
  let parentId: string | undefined =
    input.parentMode === "existing" ? input.existingParentId : undefined;

  if (input.parentMode === "new") {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("tenant_id", session.tenant_id)
      .eq("email", input.parentEmail)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: "Email orang tua sudah terdaftar. Pilih dari daftar orang tua yang ada.",
      };
    }

    const { data: parent, error: parentError } = await supabase
      .from("profiles")
      .insert({
        tenant_id: session.tenant_id,
        role: "parent",
        full_name: input.parentFullName,
        email: input.parentEmail,
        phone: input.parentPhone,
        must_change_password: true,
      })
      .select("id")
      .single();

    if (parentError || !parent) {
      return { ok: false, error: "Gagal membuat akun orang tua" };
    }

    const passwordHash = await hashPassword(generateTempPassword());
    const { error: credError } = await supabase
      .from("auth_credentials")
      .insert({ profile_id: parent.id, password_hash: passwordHash });

    if (credError) {
      await supabase.from("profiles").delete().eq("id", parent.id);
      return { ok: false, error: "Gagal membuat kredensial orang tua" };
    }

    parentId = parent.id;
  }

  if (!parentId) {
    return { ok: false, error: "Orang tua wajib dipilih atau dibuat" };
  }

  const { error: childError } = await supabase.from("children").insert({
    tenant_id: session.tenant_id,
    parent_id: parentId,
    full_name: input.childFullName,
    date_of_birth: input.dateOfBirth,
    notes: input.notes ?? null,
    address: input.address ?? null,
    preferred_location_id: input.preferredLocationId ?? null,
  });

  if (childError) {
    return { ok: false, error: "Gagal menyimpan data anak" };
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function updateChild(
  childId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");

  const parsed = childUpdateSchema.safeParse({
    childFullName: formData.get("childFullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    notes: formData.get("notes") || undefined,
    address: formData.get("address") || undefined,
    preferredLocationId: formData.get("preferredLocationId") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("children")
    .update({
      full_name: input.childFullName,
      date_of_birth: input.dateOfBirth,
      notes: input.notes ?? null,
      address: input.address ?? null,
      preferred_location_id: input.preferredLocationId ?? null,
    })
    .eq("id", childId);

  if (error) {
    return { ok: false, error: "Gagal memperbarui data anak" };
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${childId}`);
  return { ok: true };
}

export async function toggleChildActiveForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const childId = String(formData.get("childId"));
  const isActive = formData.get("isActive") === "true";

  const supabase = await createServerSupabaseClient();
  await supabase.from("children").update({ is_active: isActive }).eq("id", childId);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${childId}`);
}
