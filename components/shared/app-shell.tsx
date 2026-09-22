import { LogoutButton } from "./logout-button";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

export interface NavItem {
  href: string;
  label: string;
}

export function AppShell({
  navItems,
  fullName,
  roleLabel,
  clubName,
  children,
}: {
  navItems: NavItem[];
  fullName: string;
  roleLabel: string;
  clubName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold tracking-tight text-primary">{clubName}</span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col sm:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto bg-sidebar p-2 sm:w-56 sm:flex-col sm:gap-0.5 sm:border-r sm:border-sidebar-border sm:p-4">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.href.split("/").length <= 2}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
