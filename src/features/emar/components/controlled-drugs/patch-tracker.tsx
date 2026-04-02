'use client';

/**
 * Transdermal Patch Tracker — application site, rotation schedule, disposal.
 * VAL-EMAR-020: Transdermal patch tracking with witnessed disposal.
 */

import { useState, type FormEvent } from 'react';
import { PATCH_SITES, PATCH_DISPOSAL_METHODS, type PatchSite, type PatchDisposalMethod } from '../../types';
import { formatPatchSite, getNextPatchSite } from '../../lib/cd-register';

export interface PatchRecord {
  id: string;
  applicationSite: string;
  appliedAt: Date;
  removedAt: Date | null;
  scheduledRemovalAt: Date | null;
  appliedByName: string;
  applicationWitnessName: string;
  removedByName: string | null;
  removalWitnessName: string | null;
  disposalMethod: string | null;
  status: 'active' | 'removed' | 'overdue';
}

interface PatchTrackerProps {
  registerId: string;
  medicationId: string;
  personId: string;
  personName: string;
  name: string;
  patches: PatchRecord[];
  rotationHistory: string[];
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  onApply: (data: {
    registerId: string;
    medicationId: string;
    personId: string;
    applicationSite: PatchSite;
    applicationSiteDetail?: string;
    appliedAt: Date;
    scheduledRemovalAt?: Date;
    appliedBy: string;
    applicationWitnessedBy: string;
    notes?: string;
  }) => Promise<void>;
  onRemove: (data: {
    patchId: string;
    removedAt: Date;
    removedBy: string;
    removalWitnessedBy: string;
    disposalMethod: PatchDisposalMethod;
    notes?: string;
  }) => Promise<void>;
}

const statusBadges: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  removed: 'bg-slate-50 text-slate-600 border-slate-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};


export function PatchTracker({
  registerId,
  medicationId,
  personId,
  personName,
  name: drugName,
  patches,
  rotationHistory,
  currentUserId,
  staffMembers,
  onApply,
  onRemove,
}: PatchTrackerProps) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [removingPatchId, setRemovingPatchId] = useState<string | null>(null);

  const recommendedSite = getNextPatchSite(rotationHistory);
  const activePatch = patches.find((p) => p.status === 'active' || p.status === 'overdue');
  const availableWitnesses = staffMembers.filter((s) => s.id !== currentUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Transdermal Patch Tracker
              </h3>
              <p className="text-xs text-slate-500">
                {drugName} &middot; {personName}
              </p>
            </div>
          </div>
          {!activePatch && (
            <button
              onClick={() => setShowApplyForm(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Apply New Patch
            </button>
          )}
        </div>

        {/* Active Patch Status */}
        {activePatch && (
          <div className={`mt-4 rounded-lg border p-4 ${activePatch.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${activePatch.status === 'overdue' ? 'text-red-800' : 'text-emerald-800'}`}>
                  {activePatch.status === 'overdue' ? 'OVERDUE FOR REMOVAL' : 'Active Patch'}
                </span>
                <p className={`text-xs ${activePatch.status === 'overdue' ? 'text-red-700' : 'text-emerald-700'}`}>
                  Site: {formatPatchSite(activePatch.applicationSite)} &middot; Applied:{' '}
                  {activePatch.appliedAt.toLocaleDateString('en-GB')}
                  {activePatch.scheduledRemovalAt && (
                    <> &middot; Due: {activePatch.scheduledRemovalAt.toLocaleDateString('en-GB')}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setRemovingPatchId(activePatch.id)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Remove &amp; Dispose
              </button>
            </div>
          </div>
        )}

        {/* Recommended Next Site */}
        <div className="mt-3 text-xs text-slate-500">
          Recommended next application site:{' '}
          <span className="font-medium text-slate-700">
            {formatPatchSite(recommendedSite)}
          </span>
        </div>
      </div>

      {/* Apply Form */}
      {showApplyForm && (
        <ApplyPatchForm
          registerId={registerId}
          medicationId={medicationId}
          personId={personId}
          recommendedSite={recommendedSite}
          currentUserId={currentUserId}
          staffMembers={availableWitnesses}
          onSubmit={async (data) => {
            await onApply(data);
            setShowApplyForm(false);
          }}
          onCancel={() => setShowApplyForm(false)}
        />
      )}

      {/* Remove Form */}
      {removingPatchId && (
        <RemovePatchForm
          patchId={removingPatchId}
          currentUserId={currentUserId}
          staffMembers={availableWitnesses}
          onSubmit={async (data) => {
            await onRemove(data);
            setRemovingPatchId(null);
          }}
          onCancel={() => setRemovingPatchId(null)}
        />
      )}

      {/* Patch History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h4 className="text-sm font-medium text-slate-700">Patch History</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {patches.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No patch records yet.
            </div>
          )}
          {patches.map((patch) => (
            <div key={patch.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadges[patch.status]}`}>
                    {patch.status}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {formatPatchSite(patch.applicationSite)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Applied: {patch.appliedAt.toLocaleDateString('en-GB')} by {patch.appliedByName} (witness: {patch.applicationWitnessName})
                  {patch.removedAt && (
                    <> &middot; Removed: {patch.removedAt.toLocaleDateString('en-GB')} by {patch.removedByName} (witness: {patch.removalWitnessName})</>
                  )}
                  {patch.disposalMethod && (
                    <> &middot; Disposal: {patch.disposalMethod.replace(/_/g, ' ')}</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-forms
// ---------------------------------------------------------------------------

function ApplyPatchForm({
  registerId,
  medicationId,
  personId,
  recommendedSite,
  currentUserId,
  staffMembers,
  onSubmit,
  onCancel,
}: {
  registerId: string;
  medicationId: string;
  personId: string;
  recommendedSite: string;
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  onSubmit: (data: Parameters<PatchTrackerProps['onApply']>[0]) => Promise<void>;
  onCancel: () => void;
}) {
  const [site, setSite] = useState<PatchSite>(recommendedSite as PatchSite);
  const [siteDetail, setSiteDetail] = useState('');
  const [witness, setWitness] = useState('');
  const [scheduledRemoval, setScheduledRemoval] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!witness) { setError('Witness is required'); return; }
    setIsSubmitting(true);
    try {
      await onSubmit({
        registerId,
        medicationId,
        personId,
        applicationSite: site,
        applicationSiteDetail: siteDetail || undefined,
        appliedAt: new Date(),
        scheduledRemovalAt: scheduledRemoval ? new Date(scheduledRemoval) : undefined,
        appliedBy: currentUserId,
        applicationWitnessedBy: witness,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-violet-200 bg-violet-50/30 p-6">
      <h4 className="mb-4 text-sm font-semibold text-slate-900">Apply New Patch</h4>
      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Application Site *</label>
          <select value={site} onChange={(e) => setSite(e.target.value as PatchSite)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {PATCH_SITES.map((s) => (
              <option key={s} value={s}>{formatPatchSite(s)}{s === recommendedSite ? ' (recommended)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Witness *</label>
          <select value={witness} onChange={(e) => setWitness(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Select witness...</option>
            {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Scheduled Removal</label>
          <input type="datetime-local" value={scheduledRemoval} onChange={(e) => setScheduledRemoval(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </div>
        {site === 'other' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Site Detail *</label>
            <input type="text" value={siteDetail} onChange={(e) => setSiteDetail(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
          {isSubmitting ? 'Applying...' : 'Apply Patch'}
        </button>
      </div>
    </form>
  );
}

function RemovePatchForm({
  patchId,
  currentUserId,
  staffMembers,
  onSubmit,
  onCancel,
}: {
  patchId: string;
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  onSubmit: (data: Parameters<PatchTrackerProps['onRemove']>[0]) => Promise<void>;
  onCancel: () => void;
}) {
  const [witness, setWitness] = useState('');
  const [disposalMethod, setDisposalMethod] = useState<PatchDisposalMethod>('clinical_waste');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!witness) { setError('Witness is required for patch removal and disposal'); return; }
    setIsSubmitting(true);
    try {
      await onSubmit({
        patchId,
        removedAt: new Date(),
        removedBy: currentUserId,
        removalWitnessedBy: witness,
        disposalMethod,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
      <h4 className="mb-4 text-sm font-semibold text-slate-900">Remove &amp; Dispose Patch</h4>
      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Disposal Method *</label>
          <select value={disposalMethod} onChange={(e) => setDisposalMethod(e.target.value as PatchDisposalMethod)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {PATCH_DISPOSAL_METHODS.map((m) => (
              <option key={m} value={m}>{m.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Disposal Witness *</label>
          <select value={witness} onChange={(e) => setWitness(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Select witness...</option>
            {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {isSubmitting ? 'Removing...' : 'Confirm Removal & Disposal'}
        </button>
      </div>
    </form>
  );
}
