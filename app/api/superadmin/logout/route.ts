import { NextResponse } from "next/server";
import { clearSuperadminSession } from "@/lib/auth/superadmin";

export async function POST() {
  await clearSuperadminSession();
  return NextResponse.json({ ok: true });
}
