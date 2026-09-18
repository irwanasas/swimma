"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type ActionState } from "./types";

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
