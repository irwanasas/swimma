"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { payrollRunSchema } from "@/lib/validations/payroll";
import { type ActionState } from "./types";

export async function createPayrollRun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");

  const parsed = payrollRunSchema.safeParse({
    coachId: formData.get("coachId"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    baseSalary: formData.get("baseSalary"),
    bonus: formData.get("bonus") || 0,
    thr: formData.get("thr") || 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const input = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_payroll_run", {
    p_coach_id: input.coachId,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_base_salary: input.baseSalary,
    p_bonus: input.bonus,
    p_thr: input.thr,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Gaji untuk pelatih dan periode ini sudah pernah dibuat" };
    }
    return { ok: false, error: "Gagal membuat gaji" };
  }

  revalidatePath("/admin/payroll");
  revalidatePath("/admin/cash-ledger");
  return { ok: true };
}
