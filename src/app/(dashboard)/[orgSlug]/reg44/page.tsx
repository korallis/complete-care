import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reg 44 Monitoring',
};

interface Reg44PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function Reg44Page({ params }: Reg44PageProps) {
  const { orgSlug } = await params;

  const sections = [
    {
      title: 'Monthly Visits',
      description:
        'Schedule and record independent visitor monthly monitoring visits.',
      href: `/${orgSlug}/reg44/visits`,
    },
    {
      title: 'Reports',
      description:
        'Structured Regulation 44 reports covering quality of care, safeguarding, health, and more.',
      href: `/${orgSlug}/reg44/reports`,
    },
    {
      title: 'Recommendations',
      description:
        'Track outstanding recommendations with priority, assignee, and due dates.',
      href: `/${orgSlug}/reg44/recommendations`,
    },
    {
      title: 'Notifiable Events (Reg 40)',
      description:
        'Record and track events that must be reported to Ofsted under Regulation 40.',
      href: `/${orgSlug}/reg44/notifiable-events`,
    },
    {
      title: 'Transition & Leaving Care',
      description:
        'Pathway plans, transition milestones, and independent living skills assessments for 16+ young people.',
      href: `/${orgSlug}/reg44/transition`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Regulation 44 Monitoring
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly monitoring reports, recommendation tracking, notifiable events,
          and transition planning for children&apos;s homes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-lg border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/50"
          >
            <h2 className="font-semibold group-hover:underline">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
