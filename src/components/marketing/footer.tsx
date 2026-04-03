import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';

const FOOTER_GROUPS = [
  {
    title: 'Platform',
    links: [
      { label: 'Domains', href: '/#domains' },
      { label: 'Workflow', href: '/#workflow' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Security', href: '/privacy' },
    ],
  },
  {
    title: 'Use cases',
    links: [
      { label: 'Domiciliary care', href: '/#domains' },
      { label: 'Supported living', href: '/#domains' },
      { label: "Children's homes", href: '/#domains' },
      { label: 'Compliance teams', href: '/#evidence' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Book a demo', href: '/demo' },
      { label: 'Contact', href: 'mailto:hello@completecare.co.uk' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[oklch(0.15_0.012_232)] text-white">
      <div className="section-frame py-16 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr] lg:gap-20">
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.28_0.05_200)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                <HeartHandshake className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div>
                <span className="font-display block text-lg font-semibold tracking-[-0.04em]">
                  Complete Care
                </span>
                <span className="block pt-1 text-[0.65rem] uppercase tracking-[0.24em] text-white/45">
                  built for real care work
                </span>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">
              One operating system for domiciliary care, supported living, and
              children&apos;s residential homes — designed to help teams stay calm,
              compliant, and coordinated.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/60">
                CQC aware
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/60">
                Ofsted ready
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/60">
                multi-service teams
              </span>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-white/70">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/42 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Complete Care Ltd. Registered in England &amp;
            Wales.
          </p>
          <p>
            Designed for calm operations, inspection confidence, and better daily
            handover.
          </p>
        </div>
      </div>
    </footer>
  );
}
