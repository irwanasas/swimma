import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";

export default async function Home() {
  const session = await getSession();
  redirect(session ? roleHome(session.app_role) : "/login");
}
