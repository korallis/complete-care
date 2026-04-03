'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Activity, ShieldCheck } from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';

const STATIC_DASHBOARD_ROOTS = new Set([
  'dashboard',
  'eol-care',
  'duty-of-candour',
  'reg45',
  'budgets',
  'invoicing',
  'ai-queries',
  'custom-reports',
  'new-organisation',
  'permission-denied',
]);

function isOrgScopedPath(pathname: string): boolean {
  const [firstSegment] = pathname.split('/').filter(Boolean);

  if (!firstSegment) {
    return false;
  }

  return !STATIC_DASHBOARD_ROOTS.has(firstSegment);
}

export function DashboardRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isOrgScopedPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_18%),linear-gradient(180deg,oklch(0.2_0.01_220),oklch(0.17_0.012_232))] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/8 bg-[linear-gradient(180deg,oklch(0.19_0.016_232),oklch(0.14_0.012_232))] lg:flex">
        <div className="border-b border-white/8 px-6 py-6">
          <span className="font-display text-[1.15rem] font-semibold tracking-[-0.05em] text-white">
            Complete Care
          </span>
          <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/50">
            A calmer workspace for live care operations, compliance rhythm, and next
            actions.
          </p>
        </div>
        <nav className="flex-1 px-3 py-5">
          <div className="mb-3 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/34">
            Workspace
          </div>
          <div className="space-y-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/eol-care', label: 'End of Life Care' },
              { href: '/duty-of-candour', label: 'Duty of Candour' },
              { href: '/reg45', label: 'Reg 45 Reviews' },
              { href: '/budgets', label: 'Personal Budgets' },
              { href: '/invoicing', label: 'Invoicing' },
              { href: '/ai-queries', label: 'AI Queries' },
              { href: '/custom-reports', label: 'Custom Reports' },
            ].map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-white/66 transition-all duration-200 hover:bg-white/8 hover:text-white"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/4 text-[0.68rem] uppercase tracking-[0.18em] text-white/45 transition-colors group-hover:border-white/16 group-hover:bg-white/10 group-hover:text-white/72">
                  {item.label.slice(0, 1)}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
        <div className="border-t border-white/8 p-5">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-white/46">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              trust posture
            </div>
            <p className="mt-3 text-sm leading-6 text-white/68">
              Designed for fast scanning, lower stress handover, and
              inspection-ready signal.
            </p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/8 bg-[oklch(0.14_0.012_232)/0.88] backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div>
            <p className="font-display text-[1rem] font-semibold tracking-[-0.04em] text-white">
              Complete Care
            </p>
            <p className="pt-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              operational workspace
            </p>
          </div>
          <MobileNav />
        </div>
      </header>

      <main className="lg:pl-72">
        <div className="min-h-[100dvh] px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
          <div className="min-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_32px_120px_-40px_rgba(2,6,23,0.82)] backdrop-blur-sm lg:min-h-[calc(100dvh-3rem)]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 text-sm text-white/55">
              <div className="flex items-center gap-2 uppercase tracking-[0.18em]">
                <Activity className="h-4 w-4" aria-hidden="true" />
                live operations
              </div>
              <p className="hidden text-xs uppercase tracking-[0.18em] text-white/36 sm:block">
                one system across every service
              </p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
