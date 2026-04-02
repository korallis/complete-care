'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Complaint } from '@/lib/db/schema/complaints';
import { COMPLAINT_STATUSES, SATISFACTION_OPTIONS } from '../schema';
import type { CreateComplaintInput } from '../schema';
import type { createComplaint, updateComplaint } from '../actions';

type ComplaintsPanelProps = {
  initialComplaints: Complaint[];
  personId: string;
  canCreate: boolean;
  canUpdate: boolean;
  onCreate: typeof createComplaint;
  onUpdate: typeof updateComplaint;
};

export function ComplaintsPanel({
  initialComplaints,
  personId,
  canCreate,
  canUpdate,
  onCreate,
  onUpdate,
}: ComplaintsPanelProps) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [form, setForm] = useState({
    complaintDate: new Date().toISOString().slice(0, 10),
    raisedBy: '',
    nature: '',
    desiredOutcome: '',
    advocacyOffered: false,
    advocacyNotes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onCreate({
      personId,
      complaintDate: form.complaintDate,
      raisedBy: form.raisedBy,
      nature: form.nature,
      desiredOutcome: form.desiredOutcome || undefined,
      advocacyOffered: form.advocacyOffered,
      advocacyNotes: form.advocacyNotes || undefined,
      status: 'received',
    });
    setIsSubmitting(false);
    if (!result.success || !result.data) {
      toast.error(
        !result.success
          ? result.error ?? 'Failed to save complaint'
          : 'Failed to save complaint',
      );
      return;
    }
    setComplaints([result.data, ...complaints]);
    toast.success('Complaint recorded');
  }

  async function updateStatus(
    complaint: Complaint,
    status: CreateComplaintInput['status'],
  ) {
    const result = await onUpdate(complaint.id, { status });
    if (!result.success || !result.data) {
      toast.error(
        !result.success
          ? result.error ?? 'Failed to update complaint'
          : 'Failed to update complaint',
      );
      return;
    }
    setComplaints((current) =>
      current.map((item) => (item.id === complaint.id ? result.data! : item)),
    );
    toast.success('Complaint stage updated');
  }

  async function recordSatisfaction(
    complaint: Complaint,
    satisfaction: NonNullable<CreateComplaintInput['satisfaction']>,
  ) {
    const result = await onUpdate(complaint.id, { satisfaction, status: 'closed' });
    if (!result.success || !result.data) {
      toast.error(
        !result.success
          ? result.error ?? 'Failed to record satisfaction'
          : 'Failed to record satisfaction',
      );
      return;
    }
    setComplaints((current) =>
      current.map((item) => (item.id === complaint.id ? result.data! : item)),
    );
    toast.success('Complaint closed with satisfaction outcome');
  }

  return (
    <div className="space-y-6">
      {canCreate && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={form.complaintDate}
              onChange={(e) => setForm({ ...form, complaintDate: e.target.value })}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
            <input
              value={form.raisedBy}
              onChange={(e) => setForm({ ...form, raisedBy: e.target.value })}
              placeholder="Raised by / on behalf of"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={form.nature}
            onChange={(e) => setForm({ ...form, nature: e.target.value })}
            rows={3}
            placeholder="Nature of complaint"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <textarea
            value={form.desiredOutcome}
            onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
            rows={2}
            placeholder="Desired outcome"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={form.advocacyOffered}
              onChange={(e) => setForm({ ...form, advocacyOffered: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="font-semibold">Advocacy prompt:</span> The child has the right to an advocate — has an advocate been offered?
            </span>
          </label>
          <textarea
            value={form.advocacyNotes}
            onChange={(e) => setForm({ ...form, advocacyNotes: e.target.value })}
            rows={2}
            placeholder="Advocacy response / notes"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            {isSubmitting ? 'Saving…' : 'Record complaint'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {complaints.map((complaint) => (
          <article key={complaint.id} className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
                  Complaint raised by {complaint.raisedBy}
                </h3>
                <p className="text-xs text-[oklch(0.55_0_0)]">{complaint.complaintDate}</p>
              </div>
              <span className="rounded-full bg-[oklch(0.985_0.003_160)] px-2 py-1 text-xs font-medium text-[oklch(0.35_0.04_160)]">
                {complaint.status.replaceAll('_', ' ')}
              </span>
            </div>
            <p className="mt-3 text-sm text-[oklch(0.35_0_0)]">{complaint.nature}</p>
            {complaint.desiredOutcome && (
              <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">
                <span className="font-medium text-[oklch(0.35_0_0)]">Desired outcome:</span>{' '}
                {complaint.desiredOutcome}
              </p>
            )}
            <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">
              <span className="font-medium text-[oklch(0.35_0_0)]">Advocacy offered:</span>{' '}
              {complaint.advocacyOffered ? 'Yes' : 'No'}
            </p>
            {canUpdate && complaint.status !== 'closed' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {COMPLAINT_STATUSES.filter((status) => status !== complaint.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateStatus(complaint, status)}
                    className="rounded-md border border-[oklch(0.88_0.005_160)] px-3 py-1 text-xs font-medium"
                  >
                    Move to {status.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            )}
            {canUpdate && complaint.status === 'outcome_communicated' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {SATISFACTION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => recordSatisfaction(complaint, option)}
                    className="rounded-md border border-[oklch(0.88_0.005_160)] px-3 py-1 text-xs font-medium"
                  >
                    Mark {option.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
