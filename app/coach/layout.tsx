import { requireRole } from "@/lib/auth/guard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { APP_NAME } from "@/lib/config";

const NAV_ITEMS: NavItem[] = [{ href: "/coach", label: "Jadwal Saya" }];

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("coach");
  const tenant = await getCurrentTenant();
  return (
    <AppShell
      navItems={NAV_ITEMS}
      fullName={session.fullName}
      roleLabel="Pelatih"
      clubName={tenant?.name ?? APP_NAME}
    >
      {children}
    </AppShell>
  );
}
