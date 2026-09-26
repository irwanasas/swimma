import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface SuperadminSessionClaims {
  sub: string;
  superadmin: true;
  email: string;
  full_name: string;
}

const COOKIE_NAME = "superadmin_session";
const SESSION_DURATION = "7d";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSuperadminSession(user: {
  id: string;
  email: string;
  fullName: string;
}) {
  const token = await new SignJWT({
    sub: user.id,
    superadmin: true,
    email: user.email,
    full_name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSuperadminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSuperadminSession(): Promise<SuperadminSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SuperadminSessionClaims;
  } catch {
    return null;
  }
}

export async function requireSuperadmin() {
  const session = await getSuperadminSession();
  if (!session) redirect("/superadmin/login");

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("superadmins")
    .select("id, full_name, is_active")
    .eq("id", session.sub)
    .maybeSingle();

  if (!data || !data.is_active) {
    await clearSuperadminSession();
    redirect("/superadmin/login");
  }

  return { id: session.sub, email: session.email, fullName: data.full_name as string };
}
