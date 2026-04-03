'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, HeartHandshake } from 'lucide-react';

const LINKS = [
  { href: '/#domains', label: 'Domains' },
  { href: '/#workflow', label: 'Workflow' },
  { href: '/#evidence', label: 'Why it lands' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-white/55 bg-[oklch(0.985_0.002_95)/0.82] px-4 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:px-6"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex flex-shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[oklch(0.18_0.018_232)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="leading-none">
            <span className="font-display block text-[0.95rem] font-semibold tracking-[-0.04em] text-[oklch(0.19_0.015_235)]">
              Complete Care
            </span>
            <span className="block pt-1 text-[0.62rem] uppercase tracking-[0.24em] text-[oklch(0.45_0.015_220)]">
              care operations system
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[oklch(0.42_0.018_225)] transition-colors hover:text-[oklch(0.22_0.05_205)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-[oklch(0.32_0.018_225)] transition-colors hover:text-[oklch(0.19_0.015_235)]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-[oklch(0.19_0.015_235)] px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-px"
          >
            Start with one service
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[oklch(0.86_0.015_220)] text-[oklch(0.34_0.018_225)] transition-colors hover:bg-white md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="section-frame pt-3 md:hidden">
          <div
            id="mobile-menu"
            className="surface-panel overflow-hidden rounded-[1.75rem] border border-white/60 px-4 py-4"
          >
            <div className="space-y-1">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-[oklch(0.3_0.018_225)] transition-colors hover:bg-[oklch(0.94_0.01_205)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-[oklch(0.9_0.012_220)] pt-4">
              <Link
                href="/login"
                className="rounded-2xl border border-[oklch(0.88_0.012_220)] px-4 py-3 text-center text-sm font-medium text-[oklch(0.32_0.018_225)]"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-2xl bg-[oklch(0.19_0.015_235)] px-4 py-3 text-center text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Start with one service
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
