'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignInvestigator,
  createHomelyRemedyProtocol,
  createTopicalMar,
  deactivateHomelyRemedyProtocol,
  discontinueTopicalMar,
  recordHomelyRemedyAdministration,
  recordTopicalAdministration,
  reportMedicationError,
  updateInvestigation,
} from '@/features/emar/errors/actions';
import { generateHandoverReport, signHandoverReport } from '@/features/emar/stock/actions';
import type { ControlledDrugStaffMember } from '@/features/emar/actions/controlled-drugs';

type PersonOption = {
  id: string;
  fullName: string;
};

type StockOption = {
  id: string;
  medicationName: string;
  strength: string;
};

type ErrorRow = {
  id: string;
  errorType: string;
  severity: string;
  occurredAt: Date;
  discoveredAt: Date;
  personId: string | null;
  personName: string | null;
  medicationStockId: string | null;
  medicationName: string | null;
  description: string;
  investigationStatus: string;
  investigatorId: string | null;
  gpNotified: boolean;
  personInformed: boolean;
  createdAt: Date;
};

type HandoverRow = {
  id: string;
  shiftType: string;
  shiftStartAt: Date;
  shiftEndAt: Date;
  summary: {
    administrations?: { total?: number; onTime?: number; late?: number; missed?: number };
    refusals?: unknown[];
    prnUsage?: unknown[];
    errors?: unknown[];
    notes?: string;
  };
  outgoingSignedAt: Date | null;
  incomingSignedAt: Date | null;
  isCompleted: boolean;
  handoverNotes: string | null;
  createdAt: Date;
};

type TopicalRow = {
  id: string;
  personId: string;
  personName: string;
  medicationStockId: string | null;
  medicationName: string;
  instructions: string;
  frequency: string;
  isActive: boolean;
  startDate: string | Date;
  endDate: string | Date | null;
};

type HomelyRow = {
  id: string;
  medicationName: string;
  form: string;
  strength: string;
  indication: string;
  approvedBy: string;
  approvedDate: string | Date;
  reviewDate: string | Date | null;
  isActive: boolean;
  maxDose24Hours: string;
};

interface ErrorHandoverPageClientProps {
  organisationId: string;
  currentUserId: string;
  canCreate: boolean;
  canManage: boolean;
  people: PersonOption[];
  stockOptions: StockOption[];
  staffMembers: ControlledDrugStaffMember[];
  errors: ErrorRow[];
  handovers: HandoverRow[];
  topicalRecords: TopicalRow[];
  homelyProtocols: HomelyRow[];
}

type Notice = { tone: 'success' | 'error'; message: string } | null;

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400';
const labelClassName =
  'mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500';

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB');
}

function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ErrorHandoverPageClient({
  organisationId,
  currentUserId,
  canCreate,
  canManage,
  people,
  stockOptions,
  staffMembers,
  errors,
  handovers,
  topicalRecords,
  homelyProtocols,
}: ErrorHandoverPageClientProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(work: () => Promise<void>, successMessage: string) {
    setNotice(null);
    startTransition(async () => {
      try {
        await work();
        setNotice({ tone: 'success', message: successMessage });
        router.refresh();
      } catch (error) {
        setNotice({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Open errors" value={errors.filter((row) => row.investigationStatus !== 'closed').length} />
        <MetricCard label="Handovers" value={handovers.length} />
        <MetricCard label="Active topical MAR" value={topicalRecords.filter((row) => row.isActive).length} />
        <MetricCard label="Active homely protocols" value={homelyProtocols.filter((row) => row.isActive).length} />
      </section>

      {canCreate ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await reportMedicationError(organisationId, currentUserId, {
                  errorType: String(formData.get('errorType') ?? 'wrong_time'),
                  severity: String(formData.get('severity') ?? 'low'),
                  occurredAt: toIsoDateTime(String(formData.get('occurredAt') ?? '')),
                  discoveredAt: toIsoDateTime(String(formData.get('discoveredAt') ?? '')),
                  personId: optionalString(formData.get('personId')),
                  medicationStockId: optionalString(formData.get('medicationStockId')),
                  involvedStaffId: optionalString(formData.get('involvedStaffId')),
                  description: String(formData.get('description') ?? ''),
                  immediateActions: optionalString(formData.get('immediateActions')),
                });
                event.currentTarget.reset();
              }, 'Medication error logged.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Report medication error</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Error type">
                <select name="errorType" defaultValue="wrong_time" className={inputClassName}>
                  {['wrong_dose', 'wrong_person', 'wrong_time', 'missed', 'wrong_medication', 'wrong_route', 'wrong_form', 'omission', 'extra_dose', 'expired_medication', 'documentation_error', 'storage_error', 'other'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Severity">
                <select name="severity" defaultValue="low" className={inputClassName}>
                  {['no_harm', 'low', 'moderate', 'severe', 'death'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Occurred at">
                <input name="occurredAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="Discovered at">
                <input name="discoveredAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="Person">
                <select name="personId" defaultValue="" className={inputClassName}>
                  <option value="">Not linked to one person</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Medication stock">
                <select name="medicationStockId" defaultValue="" className={inputClassName}>
                  <option value="">Not linked</option>
                  {stockOptions.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.medicationName} · {stock.strength}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Involved staff">
                <select name="involvedStaffId" defaultValue="" className={inputClassName}>
                  <option value="">Unknown / not recorded</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Immediate actions">
                <input name="immediateActions" className={inputClassName} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={4} required className={inputClassName} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save error
            </button>
          </form>

          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                const errorId = String(formData.get('errorId') ?? '');
                const investigatorId = optionalString(formData.get('investigatorId'));
                if (investigatorId) {
                  await assignInvestigator(organisationId, errorId, investigatorId, currentUserId);
                }
                await updateInvestigation(organisationId, errorId, currentUserId, {
                  investigationStatus: String(formData.get('investigationStatus') ?? 'under_investigation'),
                  investigationFindings: optionalString(formData.get('investigationFindings')),
                  rootCause: optionalString(formData.get('rootCause')),
                  correctiveActions: optionalString(formData.get('correctiveActions')),
                  externallyReported: Boolean(formData.get('externallyReported')),
                  externalReportingDetails: optionalString(formData.get('externalReportingDetails')),
                  personInformed: Boolean(formData.get('personInformed')),
                  gpNotified: Boolean(formData.get('gpNotified')),
                  lessonsLearned: optionalString(formData.get('lessonsLearned')),
                });
                event.currentTarget.reset();
              }, 'Investigation updated.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Update investigation</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Error">
                <select name="errorId" required className={inputClassName}>
                  <option value="">Select medication error</option>
                  {errors.map((error) => (
                    <option key={error.id} value={error.id}>
                      {error.errorType.replaceAll('_', ' ')} · {formatDateTime(error.occurredAt)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Investigator">
                <select name="investigatorId" defaultValue="" className={inputClassName}>
                  <option value="">Leave unchanged</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select name="investigationStatus" defaultValue="under_investigation" className={inputClassName}>
                  {['reported', 'under_investigation', 'resolved', 'closed'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="External reporting details">
                <input name="externalReportingDetails" className={inputClassName} />
              </Field>
              <Field label="Investigation findings">
                <textarea name="investigationFindings" rows={3} className={inputClassName} />
              </Field>
              <Field label="Root cause">
                <textarea name="rootCause" rows={3} className={inputClassName} />
              </Field>
              <Field label="Corrective actions">
                <textarea name="correctiveActions" rows={3} className={inputClassName} />
              </Field>
              <Field label="Lessons learned">
                <textarea name="lessonsLearned" rows={3} className={inputClassName} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="externallyReported" />
                Externally reported
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="personInformed" />
                Person / family informed
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="gpNotified" />
                GP notified
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending || !canManage}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save investigation
            </button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Open medication errors</h2>
          </div>
          <div className="space-y-4 p-6">
            {errors.length === 0 ? (
              <p className="text-sm text-slate-500">No medication errors recorded.</p>
            ) : (
              errors.map((error) => (
                <div key={error.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">
                        {error.errorType.replaceAll('_', ' ')} · {error.severity.replaceAll('_', ' ')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateTime(error.occurredAt)}
                        {error.personName ? ` · ${error.personName}` : ''}
                        {error.medicationName ? ` · ${error.medicationName}` : ''}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {error.investigationStatus.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{error.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await generateHandoverReport(organisationId, currentUserId, {
                  shiftType: String(formData.get('shiftType') ?? 'day'),
                  shiftStartAt: toIsoDateTime(String(formData.get('shiftStartAt') ?? '')),
                  shiftEndAt: toIsoDateTime(String(formData.get('shiftEndAt') ?? '')),
                  handoverNotes: optionalString(formData.get('handoverNotes')),
                });
                event.currentTarget.reset();
              }, 'Handover report generated from live EMAR data.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Generate handover</h2>
            <p className="mt-1 text-xs text-slate-500">
              Summary is compiled from administrations, PRN usage, errors, and controlled-drug balances in the selected shift window.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Shift type">
                <select name="shiftType" defaultValue="day" className={inputClassName}>
                  {['day', 'night', 'twilight', 'long_day'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start time">
                <input name="shiftStartAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="End time">
                <input name="shiftEndAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="Notes for incoming shift">
                <textarea name="handoverNotes" rows={3} className={inputClassName} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending || !canCreate}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Generate handover
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Recent handovers</h2>
            </div>
            <div className="space-y-4 p-6">
              {handovers.length === 0 ? (
                <p className="text-sm text-slate-500">No handovers generated yet.</p>
              ) : (
                handovers.map((handover) => (
                  <div key={handover.id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {handover.shiftType.replaceAll('_', ' ')} shift
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(handover.shiftStartAt)} → {formatDateTime(handover.shiftEndAt)}
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {handover.isCompleted ? 'Signed' : 'Pending sign-off'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <div>
                        Administrations: {handover.summary?.administrations?.total ?? 0} total ·
                        {' '}
                        {handover.summary?.administrations?.late ?? 0} late ·
                        {' '}
                        {handover.summary?.administrations?.missed ?? 0} missed
                      </div>
                      <div>
                        Refusals: {handover.summary?.refusals?.length ?? 0} · PRN usage:{' '}
                        {handover.summary?.prnUsage?.length ?? 0} · Errors:{' '}
                        {handover.summary?.errors?.length ?? 0}
                      </div>
                      <p>{handover.summary?.notes ?? 'No summary notes recorded.'}</p>
                      {handover.handoverNotes ? (
                        <p className="text-slate-500">Notes: {handover.handoverNotes}</p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              async () => {
                                await signHandoverReport(
                                  organisationId,
                                  handover.id,
                                  currentUserId,
                                  'outgoing',
                                );
                              },
                              'Outgoing handover sign-off recorded.',
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Sign outgoing
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              async () => {
                                await signHandoverReport(
                                  organisationId,
                                  handover.id,
                                  currentUserId,
                                  'incoming',
                                );
                              },
                              'Incoming handover sign-off recorded.',
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Sign incoming
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await createTopicalMar(organisationId, currentUserId, {
                  personId: String(formData.get('personId') ?? ''),
                  medicationStockId: optionalString(formData.get('medicationStockId')),
                  medicationName: String(formData.get('medicationName') ?? ''),
                  instructions: String(formData.get('instructions') ?? ''),
                  frequency: String(formData.get('frequency') ?? 'once_daily'),
                  frequencyDescription: optionalString(formData.get('frequencyDescription')),
                  prescriber: optionalString(formData.get('prescriber')),
                  startDate: String(formData.get('startDate') ?? ''),
                  endDate: optionalString(formData.get('endDate')),
                });
                event.currentTarget.reset();
              }, 'Topical MAR created.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Create topical MAR</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Person">
                <select name="personId" required className={inputClassName}>
                  <option value="">Select person</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stock link">
                <select name="medicationStockId" defaultValue="" className={inputClassName}>
                  <option value="">No stock link</option>
                  {stockOptions.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.medicationName} · {stock.strength}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Medication name">
                <input name="medicationName" required className={inputClassName} />
              </Field>
              <Field label="Frequency">
                <select name="frequency" defaultValue="once_daily" className={inputClassName}>
                  {['as_needed', 'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'other'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Instructions">
                <textarea name="instructions" rows={3} required className={inputClassName} />
              </Field>
              <Field label="Frequency detail">
                <input name="frequencyDescription" className={inputClassName} />
              </Field>
              <Field label="Prescriber">
                <input name="prescriber" className={inputClassName} />
              </Field>
              <Field label="Start date">
                <input name="startDate" type="date" required className={inputClassName} />
              </Field>
              <Field label="End date">
                <input name="endDate" type="date" className={inputClassName} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending || !canCreate}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save topical MAR
            </button>
          </form>

          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await recordTopicalAdministration(organisationId, currentUserId, {
                  topicalMarId: String(formData.get('topicalMarId') ?? ''),
                  administeredAt: toIsoDateTime(String(formData.get('administeredAt') ?? '')),
                  status: String(formData.get('status') ?? 'applied'),
                  applicationSite: String(formData.get('applicationSite') ?? ''),
                  skinCondition: optionalString(formData.get('skinCondition')),
                  adverseReaction: optionalString(formData.get('adverseReaction')),
                  notes: optionalString(formData.get('notes')),
                });
                event.currentTarget.reset();
              }, 'Topical administration recorded.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Record topical administration</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Topical MAR">
                <select name="topicalMarId" required className={inputClassName}>
                  <option value="">Select record</option>
                  {topicalRecords.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.personName} · {record.medicationName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select name="status" defaultValue="applied" className={inputClassName}>
                  {['applied', 'refused', 'not_required', 'skin_condition_prevented'].map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Administered at">
                <input name="administeredAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="Application site">
                <input name="applicationSite" required className={inputClassName} />
              </Field>
              <Field label="Skin condition">
                <input name="skinCondition" className={inputClassName} />
              </Field>
              <Field label="Adverse reaction">
                <input name="adverseReaction" className={inputClassName} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} className={inputClassName} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending || !canCreate}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save topical administration
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await createHomelyRemedyProtocol(organisationId, currentUserId, {
                  medicationName: String(formData.get('medicationName') ?? ''),
                  form: String(formData.get('form') ?? ''),
                  strength: String(formData.get('strength') ?? ''),
                  indication: String(formData.get('indication') ?? ''),
                  dosageInstructions: String(formData.get('dosageInstructions') ?? ''),
                  maxDose24Hours: String(formData.get('maxDose24Hours') ?? ''),
                  contraindications: optionalString(formData.get('contraindications')),
                  sideEffects: optionalString(formData.get('sideEffects')),
                  interactions: optionalString(formData.get('interactions')),
                  maxDurationDays: optionalNumber(formData.get('maxDurationDays')),
                  approvedBy: String(formData.get('approvedBy') ?? ''),
                  approvedDate: String(formData.get('approvedDate') ?? ''),
                  reviewDate: optionalString(formData.get('reviewDate')),
                });
                event.currentTarget.reset();
              }, 'Homely remedy protocol created.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Create homely remedy protocol</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Medication name">
                <input name="medicationName" required className={inputClassName} />
              </Field>
              <Field label="Form">
                <input name="form" required className={inputClassName} />
              </Field>
              <Field label="Strength">
                <input name="strength" required className={inputClassName} />
              </Field>
              <Field label="Indication">
                <input name="indication" required className={inputClassName} />
              </Field>
              <Field label="Dosage instructions">
                <textarea name="dosageInstructions" rows={3} required className={inputClassName} />
              </Field>
              <Field label="Maximum dose in 24h">
                <input name="maxDose24Hours" required className={inputClassName} />
              </Field>
              <Field label="Approved by">
                <input name="approvedBy" required className={inputClassName} />
              </Field>
              <Field label="Approved date">
                <input name="approvedDate" type="date" required className={inputClassName} />
              </Field>
              <Field label="Review date">
                <input name="reviewDate" type="date" className={inputClassName} />
              </Field>
              <Field label="Max duration days">
                <input name="maxDurationDays" type="number" min="1" className={inputClassName} />
              </Field>
              <Field label="Contraindications">
                <textarea name="contraindications" rows={2} className={inputClassName} />
              </Field>
              <Field label="Interactions">
                <textarea name="interactions" rows={2} className={inputClassName} />
              </Field>
              <Field label="Side effects">
                <textarea name="sideEffects" rows={2} className={inputClassName} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isPending || !canCreate}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save protocol
            </button>
          </form>

          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              runAction(async () => {
                await recordHomelyRemedyAdministration(organisationId, currentUserId, {
                  protocolId: String(formData.get('protocolId') ?? ''),
                  personId: String(formData.get('personId') ?? ''),
                  administeredAt: toIsoDateTime(String(formData.get('administeredAt') ?? '')),
                  doseGiven: String(formData.get('doseGiven') ?? ''),
                  reason: String(formData.get('reason') ?? ''),
                  outcome: optionalString(formData.get('outcome')),
                  gpInformed: Boolean(formData.get('gpInformed')),
                  notes: optionalString(formData.get('notes')),
                });
                event.currentTarget.reset();
              }, 'Homely remedy administration recorded.');
            }}
          >
            <h2 className="text-base font-semibold text-slate-900">Record homely remedy use</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Protocol">
                <select name="protocolId" required className={inputClassName}>
                  <option value="">Select protocol</option>
                  {homelyProtocols.map((protocol) => (
                    <option key={protocol.id} value={protocol.id}>
                      {protocol.medicationName} · {protocol.maxDose24Hours}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Person">
                <select name="personId" required className={inputClassName}>
                  <option value="">Select person</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Administered at">
                <input name="administeredAt" type="datetime-local" required className={inputClassName} />
              </Field>
              <Field label="Dose given">
                <input name="doseGiven" required className={inputClassName} />
              </Field>
              <Field label="Reason">
                <input name="reason" required className={inputClassName} />
              </Field>
              <Field label="Outcome">
                <input name="outcome" className={inputClassName} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={3} className={inputClassName} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="gpInformed" />
                GP informed
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending || !canCreate}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save administration
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SummaryList
          title="Topical MAR records"
          emptyMessage="No topical MAR records created."
          items={topicalRecords.map((record) => ({
            id: record.id,
            title: `${record.personName} · ${record.medicationName}`,
            body: `${record.frequency.replaceAll('_', ' ')} · ${record.instructions}`,
            meta: `${formatDate(record.startDate)}${record.endDate ? ` → ${formatDate(record.endDate)}` : ''}`,
            actions: canManage && record.isActive ? (
              <button
                type="button"
                onClick={() =>
                  runAction(
                    async () => {
                      await discontinueTopicalMar(
                        organisationId,
                        record.id,
                        currentUserId,
                        new Date().toISOString().slice(0, 10),
                      );
                    },
                    'Topical MAR discontinued.',
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Discontinue
              </button>
            ) : null,
          }))}
        />
        <SummaryList
          title="Homely remedy protocols"
          emptyMessage="No homely remedy protocols created."
          items={homelyProtocols.map((protocol) => ({
            id: protocol.id,
            title: `${protocol.medicationName} · ${protocol.strength}`,
            body: `${protocol.indication} · max ${protocol.maxDose24Hours}`,
            meta: `Approved by ${protocol.approvedBy} on ${formatDate(protocol.approvedDate)}${protocol.reviewDate ? ` · review ${formatDate(protocol.reviewDate)}` : ''}`,
            actions: canManage && protocol.isActive ? (
              <button
                type="button"
                onClick={() =>
                  runAction(
                    async () => {
                      await deactivateHomelyRemedyProtocol(
                        organisationId,
                        protocol.id,
                        currentUserId,
                      );
                    },
                    'Homely remedy protocol deactivated.',
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Deactivate
              </button>
            ) : null,
          }))}
        />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

function SummaryList({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    title: string;
    body: string;
    meta: string;
    actions: React.ReactNode;
  }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4 p-6">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.body}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.meta}</div>
                </div>
                {item.actions}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : undefined;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const parsed = optionalString(value);
  return parsed ? Number(parsed) : undefined;
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}
