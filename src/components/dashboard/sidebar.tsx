/**
 * Sidebar — desktop fixed sidebar (Server Component wrapper).
 *
 * Renders the logo, org context, and role-based navigation.
 * SidebarNav handles the interactive active-state tracking (Client Component).
 */

import Link from 'next/link';
import { Heart } from 'lucide-react';
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
      className="
        hidden md:flex flex-col
        fixed inset-y-0 left-0 z-20
        w-60 border-r border-[oklch(0.91_0.005_160)]
        bg-white
      "
      aria-label="Sidebar navigation"
    >
      {/* Logo + org context */}
      <div className="flex flex-col gap-px border-b border-[oklch(0.91_0.005_160)] px-4 py-3.5">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center flex-shrink-0">
            <Heart className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold text-[oklch(0.22_0.04_160)] tracking-tight">
            Complete Care
          </span>
        </Link>

        {/* Current org */}
        <div className="flex items-center gap-2 rounded-md bg-[oklch(0.97_0.005_160)] px-2.5 py-2">
          <div
            className="w-6 h-6 rounded-md bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 select-none"
            aria-hidden="true"
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[oklch(0.22_0.04_160)] truncate leading-tight">
              {orgName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-[oklch(0.58_0_0)] capitalize leading-tight">
                {roleLabel}
              </p>
              {plan && <PlanBadge plan={plan} />}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <SidebarNav items={navItems} orgSlug={orgSlug} />

      {/* Footer */}
      <div className="border-t border-[oklch(0.91_0.005_160)] px-4 py-3">
        <p className="text-[10px] text-[oklch(0.68_0_0)] text-center">
          © {new Date().getFullYear()} Complete Care
        </p>
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
