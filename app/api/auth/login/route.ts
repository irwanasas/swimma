import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/validations/auth";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const GENERIC_ERROR = "Email atau kata sandi salah";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const supabase = createAdminSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email, full_name, is_active")
    .eq("email", email)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: credentials } = await supabase
    .from("auth_credentials")
    .select("password_hash, failed_login_count, locked_until")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!credentials) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (credentials.locked_until && new Date(credentials.locked_until) > new Date()) {
    return NextResponse.json(
      { error: "Akun terkunci sementara karena terlalu banyak percobaan. Coba lagi nanti." },
      { status: 423 }
    );
  }

  const valid = await verifyPassword(password, credentials.password_hash);
  if (!valid) {
    const nextCount = credentials.failed_login_count + 1;
    await supabase
      .from("auth_credentials")
      .update({
        failed_login_count: nextCount,
        locked_until:
          nextCount >= LOCKOUT_THRESHOLD
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
            : null,
      })
      .eq("profile_id", profile.id);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await supabase
    .from("auth_credentials")
    .update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  await createSession({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  });

  return NextResponse.json({ redirectTo: roleHome(profile.role) });
}
