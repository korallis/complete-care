import { MobileNav } from '@/components/mobile-nav';

/**
 * Dashboard layout — responsive shell with mobile navigation.
 * Sidebar on desktop (lg+), bottom nav or hamburger on mobile/tablet.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-14 items-center border-b px-6">
          <span className="text-lg font-bold">Complete Care</span>
        </div>
        <nav className="space-y-1 px-3 py-4">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/eol-care" label="End of Life Care" />
          <NavLink href="/duty-of-candour" label="Duty of Candour" />
          <NavLink href="/reg45" label="Reg 45 Reviews" />
          <NavLink href="/budgets" label="Personal Budgets" />
          <NavLink href="/invoicing" label="Invoicing" />
          <NavLink href="/ai-queries" label="AI Queries" />
          <NavLink href="/custom-reports" label="Custom Reports" />
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <span className="text-lg font-bold">Complete Care</span>
        <MobileNav />
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground"
    >
      {label}
    </a>
  );
}
