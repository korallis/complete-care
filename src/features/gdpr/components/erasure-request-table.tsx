import { ERASURE_STATUS_LABELS } from '@/features/gdpr';
import { erasureRequests } from '@/lib/db/schema';
import { ActionButton, EmptyState, formatDate, Input, StatusPill, Textarea, Select } from './shared';

type ErasureRecord = typeof erasureRequests.$inferSelect;

interface ErasureRequestTableProps {
  requests: ErasureRecord[];
  canManage: boolean;
  createAction?: (formData: FormData) => Promise<void>;
  statusAction?: (formData: FormData) => Promise<void>;
}

export function ErasureRequestTable({
  requests,
  canManage,
  createAction,
  statusAction,
}: ErasureRequestTableProps) {
  return (
    <div className="space-y-6">
      {canManage && createAction && (
        <form action={createAction} className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Log erasure request</h2>
            <p className="text-sm text-[oklch(0.5_0_0)]">
              Record Article 17 requests and preserve notes about exemptions or anonymisation scope.
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Subject name</span>
              <Input name="subjectName" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Subject email</span>
              <Input type="email" name="subjectEmail" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Received at</span>
              <Input type="date" name="receivedAt" required />
            </label>
            <label className="space-y-2 text-sm md:col-span-2 xl:col-span-4">
              <span className="font-medium">Notes</span>
              <Textarea name="notes" rows={3} placeholder="Capture legal-obligation carve-outs, anonymisation plan, or reviewer guidance" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton type="submit">Create erasure request</ActionButton>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
        <div className="border-b border-[oklch(0.93_0.005_150)] px-6 py-4">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Erasure workflow queue</h2>
        </div>
        <div className="p-6">
          {requests.length === 0 ? (
            <EmptyState title="No erasure requests yet" description="Start the workflow here when a data subject asks for deletion or anonymisation." />
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <article key={request.id} className="rounded-xl border border-[oklch(0.93_0.005_150)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[oklch(0.18_0.03_160)]">{request.subjectName}</h3>
                        <StatusPill status={request.status} label={ERASURE_STATUS_LABELS[request.status] ?? request.status} />
                      </div>
                      <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">{request.subjectEmail}</p>
                      <dl className="mt-3 grid gap-2 text-sm text-[oklch(0.48_0_0)] sm:grid-cols-3">
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Received</dt>
                          <dd>{formatDate(request.receivedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Deadline</dt>
                          <dd>{formatDate(request.deadlineAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[oklch(0.35_0.02_160)]">Completed</dt>
                          <dd>{formatDate(request.completedAt)}</dd>
                        </div>
                      </dl>
                      {(request.notes || request.rejectionReason) && (
                        <div className="mt-3 space-y-2">
                          {request.notes && (
                            <p className="rounded-lg bg-[oklch(0.985_0.005_150)] px-3 py-2 text-sm text-[oklch(0.48_0_0)]">{request.notes}</p>
                          )}
                          {request.rejectionReason && (
                            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Reason: {request.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {canManage && statusAction && (
                      <form action={statusAction} className="grid min-w-[260px] gap-2 rounded-xl bg-[oklch(0.985_0.005_150)] p-3">
                        <input type="hidden" name="id" value={request.id} />
                        <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                          Next status
                          <Select name="status" defaultValue={request.status}>
                            {Object.entries(ERASURE_STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </Select>
                        </label>
                        <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                          Rejection reason
                          <Textarea name="rejectionReason" rows={2} placeholder="Required only for rejected requests" defaultValue={request.rejectionReason ?? ''} />
                        </label>
                        <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                          Anonymised fields summary
                          <Input name="anonymisedFields" placeholder='[{"tableName":"persons","fieldsRedacted":["name"]}]' defaultValue={request.anonymisedFields ? JSON.stringify(request.anonymisedFields) : ''} />
                        </label>
                        <ActionButton type="submit" variant="secondary">Update request</ActionButton>
                      </form>
                    )}
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
