'use client';

/**
 * SidebarNav — interactive sidebar navigation with active state tracking.
 *
 * Client Component: needs usePathname() for active link detection.
 * Renders grouped nav items (sections with headers) for the current user's role.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  NotebookPen,
  ClipboardCheck,
  Pill,
  AlertTriangle,
  UserCheck,
  Calendar,
  ShieldCheck,
  BarChart2,
  FileSearch,
  Settings,
  Building2,
  CreditCard,
  UsersRound,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem, NavSection } from '@/lib/rbac/nav-items';

// ---------------------------------------------------------------------------
// Icon registry — maps icon names from nav-items.ts to Lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  'clipboard-list': ClipboardList,
  'notebook-pen': NotebookPen,
  'clipboard-check': ClipboardCheck,
  pill: Pill,
  'alert-triangle': AlertTriangle,
  'user-check': UserCheck,
  calendar: Calendar,
  'shield-check': ShieldCheck,
  'bar-chart-2': BarChart2,
  'file-search': FileSearch,
  settings: Settings,
  'building-2': Building2,
  'credit-card': CreditCard,
  'users-round': UsersRound,
  'check-square': CheckSquare,
};

// ---------------------------------------------------------------------------
// Section config — label and display order for each NavSection
// ---------------------------------------------------------------------------

const SECTION_CONFIG: Record<NavSection, { label: string; order: number }> = {
  main: { label: '', order: 0 },
  care: { label: 'People & Care', order: 1 },
  schedule: { label: 'Schedule', order: 2 },
  staff: { label: 'Staff', order: 3 },
  operations: { label: 'Operations', order: 4 },
  admin: { label: 'Administration', order: 5 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SidebarNavProps {
  items: NavItem[];
  orgSlug: string;
  /** Called when a nav link is clicked (used to close mobile drawer) */
  onNavigate?: () => void;
}

export function SidebarNav({ items, orgSlug, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  // Group items by section
  const sections = items.reduce<Record<NavSection, NavItem[]>>(
    (acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<NavSection, NavItem[]>,
  );

  // Sort sections by display order
  const sortedSections = (Object.keys(sections) as NavSection[]).sort(
    (a, b) => SECTION_CONFIG[a].order - SECTION_CONFIG[b].order,
  );

  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="space-y-0.5" role="list">
        {sortedSections.map((section) => (
          <li key={section}>
            {/* Section header (skip for 'main' section) */}
            {section !== 'main' && SECTION_CONFIG[section].label && (
              <div
                className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.65_0_0)]"
                aria-hidden="true"
              >
                {SECTION_CONFIG[section].label}
              </div>
            )}
            <ul className="space-y-0.5" role="list">
              {sections[section].map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Settings;
                const fullHref = `/${orgSlug}${item.href}`;
                const isActive =
                  pathname === fullHref ||
                  (item.href !== '/dashboard' && pathname.startsWith(fullHref));

                return (
                  <li key={item.href}>
                    <Link
                      href={fullHref}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-[oklch(0.22_0.04_160)] text-white shadow-sm'
                          : 'text-[oklch(0.38_0_0)] hover:bg-[oklch(0.96_0.007_160)] hover:text-[oklch(0.22_0.04_160)]',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-[oklch(0.6_0_0)] group-hover:text-[oklch(0.22_0.04_160)]',
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
