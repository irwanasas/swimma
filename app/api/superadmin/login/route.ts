import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";
import { createSuperadminSession } from "@/lib/auth/superadmin";
import { superadminLoginSchema } from "@/lib/validations/auth";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const GENERIC_ERROR = "Email atau kata sandi salah";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = superadminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const supabase = createAdminSupabaseClient();
  const { data: superadmin } = await supabase
    .from("superadmins")
    .select("id, full_name, email, password_hash, is_active, failed_login_count, locked_until")
    .eq("email", email)
    .maybeSingle();

  if (!superadmin || !superadmin.is_active) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (superadmin.locked_until && new Date(superadmin.locked_until) > new Date()) {
    return NextResponse.json(
      { error: "Akun terkunci sementara karena terlalu banyak percobaan. Coba lagi nanti." },
      { status: 423 }
    );
  }

  const valid = await verifyPassword(password, superadmin.password_hash);
  if (!valid) {
    const nextCount = superadmin.failed_login_count + 1;
    await supabase
      .from("superadmins")
      .update({
        failed_login_count: nextCount,
        locked_until:
          nextCount >= LOCKOUT_THRESHOLD
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
            : null,
      })
      .eq("id", superadmin.id);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await supabase
    .from("superadmins")
    .update({ failed_login_count: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq("id", superadmin.id);

  await createSuperadminSession({
    id: superadmin.id,
    email: superadmin.email,
    fullName: superadmin.full_name,
  });

  return NextResponse.json({ redirectTo: "/superadmin" });
}
