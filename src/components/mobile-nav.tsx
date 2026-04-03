'use client';

import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/eol-care', label: 'End of Life Care' },
  { href: '/duty-of-candour', label: 'Duty of Candour' },
  { href: '/reg45', label: 'Reg 45 Reviews' },
  { href: '/budgets', label: 'Personal Budgets' },
  { href: '/invoicing', label: 'Invoicing' },
  { href: '/ai-queries', label: 'AI Queries' },
  { href: '/custom-reports', label: 'Custom Reports' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[oklch(0.14_0.012_232)/0.72] backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="fixed inset-y-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/10 bg-[oklch(0.16_0.015_232)] text-white shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <div>
                <span className="font-display block text-base font-semibold tracking-[-0.04em]">
                  Complete Care
                </span>
                <span className="block pt-1 text-[0.62rem] uppercase tracking-[0.22em] text-white/40">
                  navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/8"
                aria-label="Close navigation"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1 px-3 py-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/72 transition-colors hover:bg-white/8 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
