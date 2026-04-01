'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[oklch(0.91_0.005_160)]">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-xl bg-[oklch(0.22_0.04_160)] flex items-center justify-center"
            aria-hidden="true"
          >
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
            Complete Care
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm text-[oklch(0.45_0.01_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors font-medium"
          >
            Features
          </Link>
          <Link
            href="/#compare"
            className="text-sm text-[oklch(0.45_0.01_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors font-medium"
          >
            Why Us
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[oklch(0.45_0.01_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors font-medium"
          >
            Pricing
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[oklch(0.35_0.02_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 bg-[oklch(0.22_0.04_160)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[oklch(0.28_0.05_160)] transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-[oklch(0.45_0.01_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-[oklch(0.91_0.005_160)] bg-white"
        >
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/#features"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[oklch(0.35_0.02_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#compare"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[oklch(0.35_0.02_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Why Us
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[oklch(0.35_0.02_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-[oklch(0.91_0.005_160)] flex flex-col gap-2">
            <Link
              href="/login"
              className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-[oklch(0.35_0.02_160)] border border-[oklch(0.88_0.005_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="block text-center bg-[oklch(0.22_0.04_160)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[oklch(0.28_0.05_160)] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
