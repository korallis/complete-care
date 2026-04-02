import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldAlert,
  Eye,
  Building2,
  Lock,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Safeguarding',
};

interface SafeguardingPageProps {
  params: Promise<{ orgSlug: string }>;
}

const SAFEGUARDING_SECTIONS = [
  {
    title: 'Record Concern',
    description:
      'Raise a safeguarding concern with verbatim capture, body map link, and child presentation details.',
    href: 'safeguarding/concerns/new',
    icon: ShieldAlert,
    color: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
  },
  {
    title: 'DSL Review Dashboard',
    description:
      'Review open concerns and make decisions: internal monitoring, MASH, LADO, or police referral.',
    href: 'safeguarding/dsl-review',
    icon: Eye,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-500',
  },
  {
    title: 'MASH Referrals',
    description:
      'Track Multi-Agency Safeguarding Hub referrals, reference numbers, and outcomes.',
    href: 'safeguarding/mash',
    icon: Building2,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
  },
  {
    title: 'LADO Referrals',
    description:
      'Restricted-access records for allegations against staff. DSL and senior leadership only.',
    href: 'safeguarding/lado',
    icon: Lock,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-500',
  },
  {
    title: 'Section 47 Investigations',
    description:
      'Track strategy meetings, attendees, decisions, and outcomes for Section 47 enquiries.',
    href: 'safeguarding/section47',
    icon: AlertTriangle,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-500',
  },
] as const;

export default async function SafeguardingPage({
  params,
}: SafeguardingPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safeguarding</h1>
            <p className="text-sm text-muted-foreground">
              Child-specific safeguarding workflows for children&apos;s
              residential care
            </p>
          </div>
        </div>
      </div>

      {/* Section Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAFEGUARDING_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={`/${orgSlug}/${section.href}`}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-foreground/20"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${section.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold group-hover:text-primary">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">Safeguarding Chronology</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each child has an auto-generated safeguarding chronology that
              compiles all concerns, referrals, incidents, and missing episodes
              into a single timeline. Access it from the child&apos;s profile
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
