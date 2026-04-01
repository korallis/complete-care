import Link from 'next/link';
import { Heart } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="bg-[oklch(0.12_0.02_160)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl bg-[oklch(0.35_0.08_160)] flex items-center justify-center"
                aria-hidden="true"
              >
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">
                Complete Care
              </span>
            </Link>
            <p className="text-sm text-[oklch(0.68_0.02_160)] leading-relaxed max-w-xs">
              The UK&apos;s only care management platform built natively for
              domiciliary care, supported living, and children&apos;s residential
              homes.
            </p>
            <p className="text-xs text-[oklch(0.52_0.01_160)] mt-4">
              Compliant with CQC & Ofsted requirements
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold text-[oklch(0.78_0.02_160)] uppercase tracking-widest mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Features', href: '/#features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Security', href: '/#security' },
                { label: 'Compliance', href: '/#compliance' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[oklch(0.62_0.01_160)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Care Domains */}
          <div>
            <h3 className="text-xs font-semibold text-[oklch(0.78_0.02_160)] uppercase tracking-widest mb-4">
              Care Domains
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Domiciliary Care', href: '/#domiciliary' },
                { label: 'Supported Living', href: '/#supported-living' },
                { label: "Children's Homes", href: '/#childrens-homes' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[oklch(0.62_0.01_160)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-[oklch(0.78_0.02_160)] uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Contact Us', href: 'mailto:hello@completecare.co.uk' },
                { label: 'Book a Demo', href: '/demo' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[oklch(0.62_0.01_160)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[oklch(0.22_0.02_160)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.48_0.01_160)]">
            © {new Date().getFullYear()} Complete Care Ltd. All rights reserved. Registered in
            England & Wales.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[oklch(0.18_0.025_160)] text-[oklch(0.72_0.06_160)] text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_160)] inline-block" aria-hidden="true" />
              CQC Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[oklch(0.18_0.025_160)] text-[oklch(0.72_0.06_160)] text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_160)] inline-block" aria-hidden="true" />
              Ofsted Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
