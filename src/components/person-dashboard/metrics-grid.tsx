import type { DashboardMetrics } from '@/features/person-dashboard/types';

type MetricsGridProps = {
  metrics: DashboardMetrics;
};

const METRIC_CARDS: {
  key: keyof DashboardMetrics;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}[] = [
  {
    key: 'activeCarePlans',
    label: 'Active Care Plans',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    colorClass: 'text-[oklch(0.45_0.12_160)]',
    bgClass: 'bg-[oklch(0.94_0.03_160)]',
  },
  {
    key: 'recentNotes',
    label: 'Notes (7 days)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    colorClass: 'text-[oklch(0.45_0.12_250)]',
    bgClass: 'bg-[oklch(0.94_0.03_250)]',
  },
  {
    key: 'openHighRiskAssessments',
    label: 'High/Critical Risks',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  {
    key: 'openIncidents',
    label: 'Open Incidents',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
  },
];

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {METRIC_CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgClass} ${card.colorClass}`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
                {metrics[card.key]}
              </p>
              <p className="text-xs text-[oklch(0.55_0_0)]">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
