'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  LayoutDashboard,
  Users,
  ClipboardList,
  NotebookPen,
  ClipboardCheck,
  Pill,
  AlertTriangle,
  UserCheck,
  Building,
  Calendar,
  CalendarClock,
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
  'calendar-clock': CalendarClock,
  'shield-check': ShieldCheck,
  'bar-chart-2': BarChart2,
  'file-search': FileSearch,
  settings: Settings,
  building: Building,
  'building-2': Building2,
  award: Award,
  'credit-card': CreditCard,
  'users-round': UsersRound,
  'check-square': CheckSquare,
};

const SECTION_CONFIG: Record<NavSection, { label: string; order: number }> = {
  main: { label: 'Overview', order: 0 },
  care: { label: 'People & Care', order: 1 },
  schedule: { label: 'Schedule', order: 2 },
  staff: { label: 'Staff', order: 3 },
  operations: { label: 'Operations', order: 4 },
  admin: { label: 'Administration', order: 5 },
};

interface SidebarNavProps {
  items: NavItem[];
  orgSlug: string;
  onNavigate?: () => void;
}

export function SidebarNav({ items, orgSlug, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const sections = items.reduce<Record<NavSection, NavItem[]>>(
    (acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<NavSection, NavItem[]>,
  );

  const sortedSections = (Object.keys(sections) as NavSection[]).sort(
    (a, b) => SECTION_CONFIG[a].order - SECTION_CONFIG[b].order,
  );

  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-3">
      <ul className="space-y-4" role="list">
        {sortedSections.map((section) => (
          <li key={section}>
            {SECTION_CONFIG[section].label && (
              <div
                className="px-3 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/34"
                aria-hidden="true"
              >
                {SECTION_CONFIG[section].label}
              </div>
            )}
            <ul className="space-y-1" role="list">
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
                        'group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[oklch(0.3_0.05_200)] text-white shadow-[0_18px_40px_-28px_rgba(56,189,248,0.8)]'
                          : 'text-white/66 hover:bg-white/7 hover:text-white',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-colors',
                          isActive
                            ? 'border-white/12 bg-white/10'
                            : 'border-white/8 bg-transparent group-hover:border-white/16 group-hover:bg-white/6',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 transition-colors',
                            isActive
                              ? 'text-white'
                              : 'text-white/54 group-hover:text-white/82',
                          )}
                          aria-hidden="true"
                        />
                      </span>
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
