import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerClubSchema } from "@/lib/validations/onboarding";

const TRIAL_DAYS = 14;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }
  const { tenantName, tenantSlug, adminFullName, adminEmail, password } = parsed.data;

  const supabase = createAdminSupabaseClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name: tenantName, slug: tenantSlug })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    if (tenantError?.code === "23505") {
      return NextResponse.json({ error: "Kode klub sudah digunakan" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal mendaftarkan klub" }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      tenant_id: tenant.id,
      role: "admin",
      full_name: adminFullName,
      email: adminEmail,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json({ error: "Gagal membuat akun admin" }, { status: 500 });
  }

  const passwordHash = await hashPassword(password);
  const { error: credError } = await supabase
    .from("auth_credentials")
    .insert({ profile_id: profile.id, password_hash: passwordHash });

  if (credError) {
    await supabase.from("profiles").delete().eq("id", profile.id);
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json({ error: "Gagal membuat kredensial admin" }, { status: 500 });
  }

  const { data: trialPlan } = await supabase
    .from("platform_plans")
    .select("id")
    .eq("name", "Trial")
    .maybeSingle();

  if (trialPlan) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await supabase.from("platform_subscriptions").insert({
      tenant_id: tenant.id,
      plan_id: trialPlan.id,
      status: "trial",
      trial_ends_at: trialEndsAt,
    });
  }

  await createSession({
    id: profile.id,
    email: adminEmail,
    fullName: adminFullName,
    role: "admin",
    tenantId: tenant.id,
  });

  return NextResponse.json({ redirectTo: "/admin" });
}
