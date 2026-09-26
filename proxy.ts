import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "app_session";
const SUPERADMIN_COOKIE_NAME = "superadmin_session";
const ROLE_HOMES: Record<string, string> = {
  admin: "/admin",
  coach: "/coach",
  parent: "/parent",
};
const PROTECTED_PREFIXES = ["/admin", "/coach", "/parent", "/change-password"];

function getSecret() {
  return new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
}

async function readAppRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.app_role as string) ?? null;
  } catch {
    return null;
  }
}

async function hasSuperadminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SUPERADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.superadmin === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin")) {
    const isSuperadmin = await hasSuperadminSession(request);
    if (pathname === "/superadmin/login") {
      if (isSuperadmin) return NextResponse.redirect(new URL("/superadmin", request.url));
      return NextResponse.next();
    }
    if (!isSuperadmin) return NextResponse.redirect(new URL("/superadmin/login", request.url));
    return NextResponse.next();
  }

  const appRole = await readAppRole(request);

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !appRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/login") && appRole) {
    return NextResponse.redirect(new URL(ROLE_HOMES[appRole] ?? "/login", request.url));
  }

  const roleSection = pathname.split("/")[1];
  if (appRole && ["admin", "coach", "parent"].includes(roleSection) && roleSection !== appRole) {
    return NextResponse.redirect(new URL(ROLE_HOMES[appRole] ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
