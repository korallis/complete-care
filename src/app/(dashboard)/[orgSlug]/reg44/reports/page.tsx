import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createReg44Report,
  getReg44AutoSummary,
  listReg44Reports,
  listReg44Visits,
  updateReg44Report,
} from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';
import {
  REPORT_SECTION_LABELS,
  REPORT_STATUSES,
  type ReportStatus,
} from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Reg 44 Reports',
};

interface ReportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function createReportAction(formData: FormData) {
  'use server';

  const result = await createReg44Report({
    visitId: String(formData.get('visitId') ?? ''),
    sections: {
      qualityOfCare: String(formData.get('qualityOfCare') ?? ''),
      viewsOfChildren: String(formData.get('viewsOfChildren') ?? ''),
      education: String(formData.get('education') ?? ''),
      health: String(formData.get('health') ?? ''),
      safeguarding: String(formData.get('safeguarding') ?? ''),
      staffing: String(formData.get('staffing') ?? ''),
      environment: String(formData.get('environment') ?? ''),
      complaintsAndConcerns: String(
        formData.get('complaintsAndConcerns') ?? '',
      ),
      recommendations: String(formData.get('recommendations') ?? ''),
    },
    summary: String(formData.get('summary') ?? ''),
    status: 'draft',
  });

  if (!result.success) throw new Error(result.error);
}

async function updateReportStatusAction(formData: FormData) {
  'use server';

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'draft') as ReportStatus;
  const result = await updateReg44Report(id, { status });
  if (!result.success) throw new Error(result.error);
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { orgSlug } = await params;
  const access = await requireReg44PageAccess(orgSlug);
  const [reports, visits, autoSummary] = await Promise.all([
    listReg44Reports(),
    listReg44Visits(),
    getReg44AutoSummary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reg 44 reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured monthly monitoring reports with auto-populated evidence
            prompts.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <aside className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Auto-populated evidence snapshot</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium">Quality of care</dt>
              <dd className="text-muted-foreground">
                {autoSummary.qualityOfCare}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Views of children</dt>
              <dd className="text-muted-foreground">
                {autoSummary.viewsOfChildren}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Complaints & concerns</dt>
              <dd className="text-muted-foreground">
                {autoSummary.complaintsAndConcerns}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Recommendations</dt>
              <dd className="text-muted-foreground">
                {autoSummary.recommendations}
              </dd>
            </div>
          </dl>
        </aside>

        {access.canManageQuality && (
          <form
            action={createReportAction}
            className="rounded-xl border bg-white p-6 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Linked visit</span>
                <select
                  required
                  name="visitId"
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select a completed or scheduled visit</option>
                  {visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {String(visit.visitDate)} — {visit.visitorName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Executive summary</span>
                <input
                  name="summary"
                  defaultValue={autoSummary.qualityOfCare}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(REPORT_SECTION_LABELS).map(([key, label]) => {
                const defaultValue =
                  key === 'qualityOfCare'
                    ? autoSummary.qualityOfCare
                    : key === 'viewsOfChildren'
                      ? autoSummary.viewsOfChildren
                      : key === 'complaintsAndConcerns'
                        ? autoSummary.complaintsAndConcerns
                        : key === 'recommendations'
                          ? autoSummary.recommendations
                          : '';

                return (
                  <label key={key} className="space-y-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <textarea
                      name={key}
                      defaultValue={defaultValue}
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                );
              })}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
            >
              Create draft report
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            No reports created yet. Link a monthly visit to generate a report.
          </div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Report for visit {report.visitId}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {report.summary || 'No executive summary recorded'}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                  {report.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.entries(report.sections).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {REPORT_SECTION_LABELS[key]}
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">
                      {value || 'No narrative recorded'}
                    </p>
                  </div>
                ))}
              </div>
              {access.canManageQuality && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {REPORT_STATUSES.filter((status) => status !== report.status).map(
                    (status) => (
                      <form key={status} action={updateReportStatusAction}>
                        <input type="hidden" name="id" value={report.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className="rounded-md border px-3 py-1 text-xs font-medium"
                        >
                          Mark {status}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
