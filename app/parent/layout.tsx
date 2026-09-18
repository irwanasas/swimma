import { requireRole } from "@/lib/auth/guard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { APP_NAME } from "@/lib/config";

const NAV_ITEMS: NavItem[] = [
  { href: "/parent", label: "Jadwal Anak" },
  { href: "/parent/billing", label: "Tagihan" },
  { href: "/parent/promo", label: "Promo" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("parent");
  const tenant = await getCurrentTenant();
  return (
    <AppShell
      navItems={NAV_ITEMS}
      fullName={session.fullName}
      roleLabel="Orang Tua"
      clubName={tenant?.name ?? APP_NAME}
    >
      {children}
    </AppShell>
  );
}
