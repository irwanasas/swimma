"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { manualAdjustmentSchema } from "@/lib/validations/cash-ledger";
import { type ActionState } from "./types";

export async function addManualAdjustment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireActionRole("admin");

  const parsed = manualAdjustmentSchema.safeParse({
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("cash_ledger").insert({
    category: "manual_adjustment",
    direction: parsed.data.direction,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    created_by: session.sub,
  });

  if (error) {
    return { ok: false, error: "Gagal menyimpan penyesuaian" };
  }

  revalidatePath("/admin/cash-ledger");
  return { ok: true };
}
