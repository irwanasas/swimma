import { requireSuperadmin } from "@/lib/auth/superadmin";
import { SuperadminLogoutButton } from "@/components/shared/superadmin-logout-button";

export default async function SuperadminPortalLayout({ children }: { children: React.ReactNode }) {
  const superadmin = await requireSuperadmin();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold tracking-tight text-primary">
            Swimma Platform
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            Superadmin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{superadmin.fullName}</span>
          <SuperadminLogoutButton />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
