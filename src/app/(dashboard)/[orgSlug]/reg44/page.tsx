import type { Metadata } from 'next';
import Link from 'next/link';
import { getReg44Overview } from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';

export const metadata: Metadata = {
  title: 'Reg 44 Monitoring',
};

interface Reg44PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function Reg44Page({ params }: Reg44PageProps) {
  const { orgSlug } = await params;
  await requireReg44PageAccess(orgSlug);
  const overview = await getReg44Overview();

  const sections = [
    {
      title: 'Monthly Visits',
      description:
        'Schedule and record independent visitor monthly monitoring visits.',
      href: `/${orgSlug}/reg44/visits`,
      metric: `${overview.visits} logged`,
    },
    {
      title: 'Reports',
      description:
        'Structured Regulation 44 reports with system evidence summaries.',
      href: `/${orgSlug}/reg44/reports`,
      metric: `${overview.reports} reports`,
    },
    {
      title: 'Recommendations',
      description:
        'Track outstanding recommendations with priority, assignee, and due dates.',
      href: `/${orgSlug}/reg44/recommendations`,
      metric: `${overview.openRecommendations} open`,
    },
    {
      title: 'Notifiable Events (Reg 40)',
      description:
        'Record and track events that must be reported to Ofsted under Regulation 40.',
      href: `/${orgSlug}/reg44/notifiable-events`,
      metric: `${overview.notifiableEvents} events`,
    },
    {
      title: 'Transition & Leaving Care',
      description:
        'Pathway plans, transition milestones, chronology, and readiness dashboards for 16+ young people.',
      href: `/${orgSlug}/reg44/transition`,
      metric: `${overview.pathwayPlans} plans · ${overview.assessments} assessments`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Regulation 44 monitoring
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live Reg 44 quality monitoring, evidence tracking, and transition
          planning.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Visits
          </p>
          <p className="mt-2 text-2xl font-semibold">{overview.visits}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reports
          </p>
          <p className="mt-2 text-2xl font-semibold">{overview.reports}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Open actions
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {overview.openRecommendations}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Transition plans
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {overview.activePathwayPlans}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border bg-white p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {section.metric}
            </p>
            <h2 className="mt-2 font-semibold group-hover:underline">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
