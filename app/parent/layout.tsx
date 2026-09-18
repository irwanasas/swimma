import { requireRole } from "@/lib/auth/guard";
import { AppShell, type NavItem } from "@/components/shared/app-shell";

const NAV_ITEMS: NavItem[] = [
  { href: "/parent", label: "Jadwal Anak" },
  { href: "/parent/billing", label: "Tagihan" },
  { href: "/parent/promo", label: "Promo" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("parent");
  return (
    <AppShell navItems={NAV_ITEMS} fullName={session.fullName} roleLabel="Orang Tua">
      {children}
    </AppShell>
  );
}
