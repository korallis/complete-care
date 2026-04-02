import { EXPORT_STATUS_LABELS } from '@/features/gdpr';
import { dataExports } from '@/lib/db/schema';
import { ActionButton, EmptyState, formatDate, Input, Select, StatusPill } from './shared';

type ExportRecord = typeof dataExports.$inferSelect;

interface ExportJobsTableProps {
  exports: ExportRecord[];
  canManage: boolean;
  createAction?: (formData: FormData) => Promise<void>;
}

export function ExportJobsTable({ exports, canManage, createAction }: ExportJobsTableProps) {
  return (
    <div className="space-y-6">
      {canManage && createAction && (
        <form action={createAction} className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Create export job</h2>
            <p className="text-sm text-[oklch(0.5_0_0)]">
              Queue JSON, CSV, or PDF portability exports and keep a visible export ledger for validators.
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Export type</span>
              <Select name="exportType" defaultValue="person_data">
                <option value="sar">SAR</option>
                <option value="person_data">Person data</option>
                <option value="bulk">Bulk export</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Format</span>
              <Select name="format" defaultValue="json">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Person ID</span>
              <Input name="personId" placeholder="Optional UUID" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">SAR ID</span>
              <Input name="sarId" placeholder="Optional UUID" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton type="submit">Queue export</ActionButton>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
        <div className="border-b border-[oklch(0.93_0.005_150)] px-6 py-4">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Export ledger</h2>
        </div>
        <div className="p-6">
          {exports.length === 0 ? (
            <EmptyState title="No export jobs yet" description="Queued exports will appear here with status, timestamps, and linked request identifiers." />
          ) : (
            <div className="space-y-4">
              {exports.map((job) => (
                <article key={job.id} className="rounded-xl border border-[oklch(0.93_0.005_150)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[oklch(0.18_0.03_160)]">{job.exportType.replace('_', ' ')}</h3>
                        <StatusPill status={job.status} label={EXPORT_STATUS_LABELS[job.status] ?? job.status} />
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm text-[oklch(0.48_0_0)] sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Format</dt>
                          <dd className="uppercase">{job.format}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Created</dt>
                          <dd>{formatDate(job.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Completed</dt>
                          <dd>{formatDate(job.completedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">File path</dt>
                          <dd className="break-all">{job.filePath ?? 'Pending generation'}</dd>
                        </div>
                      </dl>
                      {(job.personId || job.sarId || job.errorMessage) && (
                        <div className="mt-3 space-y-1 text-sm text-[oklch(0.48_0_0)]">
                          {job.personId && <p>Person: {job.personId}</p>}
                          {job.sarId && <p>SAR: {job.sarId}</p>}
                          {job.errorMessage && <p className="text-rose-700">Error: {job.errorMessage}</p>}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl bg-[oklch(0.985_0.005_150)] px-3 py-2 text-sm text-[oklch(0.5_0_0)]">
                      <p className="font-medium text-[oklch(0.18_0.03_160)]">{job.fileSizeBytes ? `${job.fileSizeBytes.toLocaleString()} bytes` : 'Awaiting output'}</p>
                      <p>Initiated export evidence</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
