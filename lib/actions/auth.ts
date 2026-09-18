"use server";

import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validations/auth";
import { roleHome } from "@/lib/auth/roles";

export interface ChangePasswordState {
  error?: string;
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Kata sandi tidak valid" };
  }

  const supabase = createAdminSupabaseClient();
  const passwordHash = await hashPassword(parsed.data.newPassword);

  await supabase
    .from("auth_credentials")
    .update({ password_hash: passwordHash })
    .eq("profile_id", session.sub);

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", session.sub);

  await createSession({
    id: session.sub,
    email: session.email,
    fullName: session.full_name,
    role: session.app_role,
    tenantId: session.tenant_id,
  });

  redirect(roleHome(session.app_role));
}
