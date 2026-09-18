import { requireRole } from "@/lib/auth/guard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { APP_NAME } from "@/lib/config";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/members", label: "Anggota" },
  { href: "/admin/coaches", label: "Pelatih" },
  { href: "/admin/schedule", label: "Jadwal" },
  { href: "/admin/billing/packages", label: "Paket" },
  { href: "/admin/billing/subscriptions", label: "Langganan" },
  { href: "/admin/billing/invoices", label: "Tagihan" },
  { href: "/admin/cash-ledger", label: "Buku Kas" },
  { href: "/admin/payroll", label: "Gaji Pelatih" },
  { href: "/admin/promo", label: "Promo" },
  { href: "/admin/reports", label: "Laporan" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");
  const tenant = await getCurrentTenant();
  return (
    <AppShell
      navItems={NAV_ITEMS}
      fullName={session.fullName}
      roleLabel="Admin"
      clubName={tenant?.name ?? APP_NAME}
    >
      {children}
    </AppShell>
  );
}
