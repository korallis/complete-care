'use client';

/**
 * LeaveRequestForm -- form for submitting a new leave request.
 * Includes date range picker, leave type selection, and working days calculation.
 */

import { useState, useCallback } from 'react';
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  calculateWorkingDays,
  type LeaveType,
} from '@/features/leave/schema';
import type { RequestLeaveInput } from '@/features/leave/schema';

type LeaveRequestFormProps = {
  staffProfileId: string;
  onSubmit: (data: RequestLeaveInput) => Promise<{ success: boolean; error?: string }>;
};

export function LeaveRequestForm({
  staffProfileId,
  onSubmit,
}: LeaveRequestFormProps) {
  const [type, setType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const workingDays =
    startDate && endDate && endDate >= startDate
      ? calculateWorkingDays(startDate, endDate)
      : 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      if (!startDate || !endDate) {
        setError('Please select both start and end dates');
        return;
      }

      if (endDate < startDate) {
        setError('End date must be on or after start date');
        return;
      }

      if (workingDays === 0) {
        setError('Selected dates contain no working days');
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await onSubmit({
          staffProfileId,
          type,
          startDate,
          endDate,
          totalDays: workingDays,
          reason: reason.trim() || null,
        });

        if (result.success) {
          setSuccess(true);
          setType('annual');
          setStartDate('');
          setEndDate('');
          setReason('');
        } else {
          setError(result.error ?? 'Failed to submit leave request');
        }
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [staffProfileId, type, startDate, endDate, reason, workingDays, onSubmit],
  );

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
        Request Leave
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave type */}
        <div>
          <label
            htmlFor="leave-type"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1"
          >
            Leave Type
          </label>
          <select
            id="leave-type"
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="w-full rounded-lg border border-[oklch(0.85_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.15_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.15_160)]"
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.85_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.15_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.15_160)]"
              required
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.85_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.55_0.15_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.15_160)]"
              required
            />
          </div>
        </div>

        {/* Working days indicator */}
        {startDate && endDate && endDate >= startDate && (
          <div className="rounded-lg bg-blue-50/80 border border-blue-200 px-3 py-2">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">{workingDays}</span> working day
              {workingDays !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Reason */}
        <div>
          <label
            htmlFor="leave-reason"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1"
          >
            Reason{' '}
            <span className="text-[oklch(0.55_0_0)] font-normal">(optional)</span>
          </label>
          <textarea
            id="leave-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Briefly describe the reason for your leave..."
            className="w-full rounded-lg border border-[oklch(0.85_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:border-[oklch(0.55_0.15_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.15_160)] resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
            <p className="text-sm text-emerald-700">
              Leave request submitted successfully. Awaiting manager approval.
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !startDate || !endDate || workingDays === 0}
          className="w-full rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.3_0.06_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.15_160)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
}
