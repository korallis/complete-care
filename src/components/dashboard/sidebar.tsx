import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { PlanBadge } from '@/components/billing/plan-badge';
import type { NavItem } from '@/lib/rbac/nav-items';
import type { Role } from '@/lib/rbac/permissions';
import type { Plan } from '@/types';

interface SidebarProps {
  navItems: NavItem[];
  orgSlug: string;
  orgName: string;
  role: Role;
  plan?: Plan;
}

export function Sidebar({ navItems, orgSlug, orgName, role, plan }: SidebarProps) {
  const roleLabel = ROLE_DISPLAY[role] ?? role;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-white/8 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,oklch(0.19_0.016_232),oklch(0.14_0.012_232))] text-white md:flex"
      aria-label="Sidebar navigation"
    >
      <div className="border-b border-white/8 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <HeartHandshake className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display block text-[1rem] font-semibold tracking-[-0.04em]">
              Complete Care
            </span>
            <span className="block pt-1 text-[0.62rem] uppercase tracking-[0.24em] text-white/42">
              operational workspace
            </span>
          </div>
        </Link>

        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/6 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[oklch(0.3_0.05_200)] text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{orgName}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/42">
                  {roleLabel}
                </p>
                {plan && <PlanBadge plan={plan} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SidebarNav items={navItems} orgSlug={orgSlug} />

      <div className="border-t border-white/8 px-5 py-4 text-[0.68rem] uppercase tracking-[0.18em] text-white/34">
        Calm coordination for every shift.
      </div>
    </aside>
  );
}

const ROLE_DISPLAY: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Manager',
  senior_carer: 'Senior Carer',
  carer: 'Carer',
  viewer: 'Viewer',
};
