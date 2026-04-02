import Link from 'next/link';

interface GdprDashboardProps {
  orgSlug: string;
  stats: {
    totalSars: number;
    overdueSars: number;
    erasureRequests: number;
    retentionFlags: number;
    expiringFlags: number;
    exportJobs: number;
  };
}

const sections = [
  {
    key: 'sars',
    title: 'Subject access requests',
    description:
      'Track Article 15 requests, deadlines, export readiness, and fulfilment state.',
  },
  {
    key: 'erasure',
    title: 'Erasure workflows',
    description:
      'Review Article 17 requests, record exemptions, and preserve anonymisation evidence.',
  },
  {
    key: 'retention',
    title: 'Retention & deletion review',
    description:
      'Configure retention windows, children-specific exceptions, and destructive-action guardrails.',
  },
  {
    key: 'exports',
    title: 'Export jobs',
    description:
      'Generate JSON/CSV/PDF portability packages and keep an auditable export ledger.',
  },
] as const;

export function GdprDashboard({ orgSlug, stats }: GdprDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[oklch(0.48_0.02_160)]">
              GDPR control centre
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
              Privacy operations and data portability
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[oklch(0.5_0_0)]">
              Manage SARs, erasure requests, retention review, and export evidence from one
              org-scoped workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Open SARs" value={stats.totalSars} hint={`${stats.overdueSars} overdue`} />
            <Metric label="Erasure requests" value={stats.erasureRequests} hint="Article 17 workflow" />
            <Metric label="Retention flags" value={stats.retentionFlags} hint={`${stats.expiringFlags} expiring soon`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.key}
            href={`/${orgSlug}/settings/gdpr/${section.key}`}
            className="group rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-5 shadow-sm transition-colors hover:border-[oklch(0.82_0.02_160)] hover:bg-[oklch(0.985_0.005_150)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] group-hover:underline">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">{section.description}</p>
              </div>
              <span className="text-sm font-medium text-[oklch(0.38_0.06_160)]">Open →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
            Evidence packaging reminders
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[oklch(0.48_0_0)]">
            <li>• Record retention exceptions for children&apos;s case records with the 75-year rule.</li>
            <li>• Keep rejection reasons and anonymisation notes explicit for destructive actions.</li>
            <li>• Use export jobs as the audit-friendly ledger for generated portability packages.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
            Current workload
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            <MetricRow label="Overdue SARs" value={stats.overdueSars} />
            <MetricRow label="Retention flags" value={stats.retentionFlags} />
            <MetricRow label="Export jobs" value={stats.exportJobs} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl bg-[oklch(0.985_0.005_150)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[oklch(0.5_0_0)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[oklch(0.18_0.03_160)]">{value}</p>
      <p className="text-xs text-[oklch(0.5_0_0)]">{hint}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[oklch(0.985_0.005_150)] px-4 py-3">
      <dt className="text-[oklch(0.5_0_0)]">{label}</dt>
      <dd className="font-semibold text-[oklch(0.18_0.03_160)]">{value}</dd>
    </div>
  );
}
