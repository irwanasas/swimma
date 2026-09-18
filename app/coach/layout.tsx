import { requireRole } from "@/lib/auth/guard";
import { AppShell, type NavItem } from "@/components/shared/app-shell";

const NAV_ITEMS: NavItem[] = [{ href: "/coach", label: "Jadwal Saya" }];

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("coach");
  return (
    <AppShell navItems={NAV_ITEMS} fullName={session.fullName} roleLabel="Pelatih">
      {children}
    </AppShell>
  );
}
