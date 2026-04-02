import {
  DATA_TYPE_LABELS,
  LEGAL_BASIS_LABELS,
  RETENTION_FLAG_STATUS_LABELS,
} from '@/features/gdpr';
import { dataRetentionFlags, dataRetentionPolicies } from '@/lib/db/schema';
import { ActionButton, EmptyState, formatDate, Input, Select, StatusPill, Textarea } from './shared';

type PolicyRecord = typeof dataRetentionPolicies.$inferSelect;
type FlagRecord = typeof dataRetentionFlags.$inferSelect;

interface RetentionPolicyPanelProps {
  policies: PolicyRecord[];
  flags: FlagRecord[];
  canManage: boolean;
  createPolicyAction?: (formData: FormData) => Promise<void>;
  updatePolicyAction?: (formData: FormData) => Promise<void>;
  reviewFlagAction?: (formData: FormData) => Promise<void>;
}

const legalBasisOptions = Object.entries(LEGAL_BASIS_LABELS);
const dataTypeOptions = Object.entries(DATA_TYPE_LABELS);

export function RetentionPolicyPanel({
  policies,
  flags,
  canManage,
  createPolicyAction,
  updatePolicyAction,
  reviewFlagAction,
}: RetentionPolicyPanelProps) {
  return (
    <div className="space-y-6">
      {canManage && createPolicyAction && (
        <form action={createPolicyAction} className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Add retention policy</h2>
            <p className="text-sm text-[oklch(0.5_0_0)]">
              Create per-record-type retention windows, including the 75-year rule for children&apos;s records.
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Data type</span>
              <Select name="dataType" defaultValue="person">
                {dataTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Retention days</span>
              <Input type="number" name="retentionDays" min="1" defaultValue="1095" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Warning days</span>
              <Input type="number" name="warningDays" min="1" defaultValue="30" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Legal basis</span>
              <Select name="legalBasis" defaultValue="legal_obligation">
                {legalBasisOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 self-end rounded-lg border border-[oklch(0.9_0.005_150)] px-3 py-2 text-sm">
              <input type="checkbox" name="isStatutory" value="true" />
              Statutory retention
            </label>
            <label className="flex items-center gap-2 self-end rounded-lg border border-[oklch(0.9_0.005_150)] px-3 py-2 text-sm">
              <input type="checkbox" name="autoDeleteEnabled" value="true" />
              Enable auto-delete proposal
            </label>
            <label className="space-y-2 text-sm md:col-span-2 xl:col-span-3">
              <span className="font-medium">Description</span>
              <Textarea name="description" rows={3} placeholder="Reference the policy basis and any destructive-action safeguards" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton type="submit">Create policy</ActionButton>
          </div>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
          <div className="border-b border-[oklch(0.93_0.005_150)] px-6 py-4">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Retention policies</h2>
          </div>
          <div className="p-6 space-y-4">
            {policies.length === 0 ? (
              <EmptyState title="No retention policies configured" description="Add a policy to enforce deletion review and retention warnings." />
            ) : (
              policies.map((policy) => (
                <article key={policy.id} className="rounded-xl border border-[oklch(0.93_0.005_150)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[oklch(0.18_0.03_160)]">{DATA_TYPE_LABELS[policy.dataType] ?? policy.dataType}</h3>
                      <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">{LEGAL_BASIS_LABELS[policy.legalBasis] ?? policy.legalBasis}</p>
                      {policy.description && (
                        <p className="mt-2 text-sm text-[oklch(0.48_0_0)]">{policy.description}</p>
                      )}
                    </div>
                    <div className="rounded-xl bg-[oklch(0.985_0.005_150)] px-3 py-2 text-right text-sm">
                      <p className="font-semibold text-[oklch(0.18_0.03_160)]">{policy.retentionDays} days</p>
                      <p className="text-[oklch(0.5_0_0)]">Warn {policy.warningDays} days before</p>
                    </div>
                  </div>
                  {canManage && updatePolicyAction && (
                    <form action={updatePolicyAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <input type="hidden" name="id" value={policy.id} />
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                        Retention days
                        <Input type="number" min="1" name="retentionDays" defaultValue={String(policy.retentionDays)} />
                      </label>
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                        Warning days
                        <Input type="number" min="1" name="warningDays" defaultValue={String(policy.warningDays)} />
                      </label>
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                        Legal basis
                        <Select name="legalBasis" defaultValue={policy.legalBasis}>
                          {legalBasisOptions.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)] md:col-span-2">
                        Description
                        <Input name="description" defaultValue={policy.description ?? ''} />
                      </label>
                      <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-5">
                        <label className="flex items-center gap-2 text-sm text-[oklch(0.4_0_0)]">
                          <input type="checkbox" name="autoDeleteEnabled" value="true" defaultChecked={policy.autoDeleteEnabled} />
                          Auto-delete enabled
                        </label>
                        <ActionButton type="submit" variant="secondary">Save policy</ActionButton>
                      </div>
                    </form>
                  )}
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
          <div className="border-b border-[oklch(0.93_0.005_150)] px-6 py-4">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">Deletion review queue</h2>
          </div>
          <div className="p-6 space-y-4">
            {flags.length === 0 ? (
              <EmptyState title="No retention flags" description="Flags will appear here when records enter the warning or expiry window." />
            ) : (
              flags.map((flag) => (
                <article key={flag.id} className="rounded-xl border border-[oklch(0.93_0.005_150)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[oklch(0.18_0.03_160)]">{flag.entityType}</h3>
                        <StatusPill status={flag.status} label={RETENTION_FLAG_STATUS_LABELS[flag.status] ?? flag.status} />
                      </div>
                      <p className="mt-1 text-sm text-[oklch(0.5_0_0)]">Record ID: {flag.entityId}</p>
                      <p className="mt-1 text-sm text-[oklch(0.48_0_0)]">Expires {formatDate(flag.retentionExpiresAt)}</p>
                      {flag.retentionReason && (
                        <p className="mt-2 text-sm text-[oklch(0.48_0_0)]">Reason kept: {flag.retentionReason}</p>
                      )}
                    </div>
                  </div>
                  {canManage && reviewFlagAction && (
                    <form action={reviewFlagAction} className="mt-4 grid gap-2">
                      <input type="hidden" name="id" value={flag.id} />
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                        Review decision
                        <Select name="decision" defaultValue={flag.status === 'retained' ? 'retained' : 'approved_for_deletion'}>
                          <option value="approved_for_deletion">Approve for deletion</option>
                          <option value="retained">Retain beyond policy</option>
                        </Select>
                      </label>
                      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-[oklch(0.5_0_0)]">
                        Reason
                        <Textarea name="reason" rows={2} placeholder="Why this record is kept or approved for deletion" defaultValue={flag.retentionReason ?? ''} />
                      </label>
                      <ActionButton type="submit" variant="secondary">Record review</ActionButton>
                    </form>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
