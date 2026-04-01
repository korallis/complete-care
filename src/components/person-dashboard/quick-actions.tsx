import Link from 'next/link';

type QuickActionsProps = {
  orgSlug: string;
  personId: string;
  canEdit: boolean;
};

const ACTIONS = [
  {
    label: 'New Care Note',
    href: (orgSlug: string, personId: string) =>
      `/${orgSlug}/persons/${personId}/care-notes`,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    label: 'New Risk Assessment',
    href: (orgSlug: string, personId: string) =>
      `/${orgSlug}/persons/${personId}/risk-assessments`,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Report Incident',
    href: (orgSlug: string, personId: string) =>
      `/${orgSlug}/persons/${personId}/incidents`,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function QuickActions({ orgSlug, personId, canEdit }: QuickActionsProps) {
  if (!canEdit) return null;

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
        Quick actions
      </h3>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href(orgSlug, personId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
