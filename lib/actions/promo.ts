"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { promoSchema } from "@/lib/validations/promo";
import { type ActionState } from "./types";

export async function createPromo(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");

  const parsed = promoSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    activeFrom: formData.get("activeFrom"),
    activeUntil: formData.get("activeUntil") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();

  let imageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${session.tenant_id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("promo")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      return { ok: false, error: "Gagal mengunggah gambar" };
    }
    imageUrl = supabase.storage.from("promo").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("promo").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    image_url: imageUrl,
    active_from: parsed.data.activeFrom,
    active_until: parsed.data.activeUntil || null,
    author_id: session.sub,
  });

  if (error) {
    return { ok: false, error: "Gagal menyimpan promo" };
  }

  revalidatePath("/admin/promo");
  revalidatePath("/parent/promo");
  return { ok: true };
}

export async function deletePromoForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const promoId = String(formData.get("promoId"));
  const supabase = await createServerSupabaseClient();
  await supabase.from("promo").delete().eq("id", promoId);
  revalidatePath("/admin/promo");
  revalidatePath("/parent/promo");
}
