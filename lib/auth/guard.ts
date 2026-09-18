import { redirect } from "next/navigation";
import { getSession, clearSession } from "./session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { roleHome, type AppRole } from "./roles";

export class UnauthorizedError extends Error {}

export async function requireRole(role: AppRole) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.app_role !== role) redirect(roleHome(session.app_role));

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_active, must_change_password, full_name")
    .eq("id", session.sub)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await clearSession();
    redirect("/login?deactivated=1");
  }
  if (profile.must_change_password) {
    redirect("/change-password");
  }

  return {
    id: session.sub,
    email: session.email,
    role: session.app_role,
    tenantId: session.tenant_id,
    fullName: profile.full_name as string,
  };
}

export async function requireActionRole(role: AppRole | AppRole[]) {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Anda harus login");
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.app_role)) {
    throw new UnauthorizedError("Anda tidak memiliki akses untuk aksi ini");
  }
  return session;
}
