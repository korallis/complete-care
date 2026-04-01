'use client';

/**
 * LeaveApprovalCard -- manager approval/denial card for a single leave request.
 * Displays request details with approve/deny buttons and an optional review note.
 */

import { useState, useCallback } from 'react';
import { LeaveTypeBadge, LeaveStatusBadge } from './leave-status-badge';
import type { LeaveRequestListItem } from '@/features/leave/actions';
import type { ReviewLeaveInput } from '@/features/leave/schema';

type LeaveApprovalCardProps = {
  request: LeaveRequestListItem;
  onReview: (
    id: string,
    input: ReviewLeaveInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '--';
  try {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export function LeaveApprovalCard({
  request,
  onReview,
}: LeaveApprovalCardProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = useCallback(
    async (status: 'approved' | 'denied') => {
      setError(null);
      setIsSubmitting(true);
      try {
        const result = await onReview(request.id, {
          status,
          reviewNote: reviewNote.trim() || null,
        });
        if (!result.success) {
          setError(result.error ?? 'Failed to process review');
        }
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [request.id, reviewNote, onReview],
  );

  const isPending = request.status === 'pending';

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            {request.staffName}
          </p>
          <div className="flex items-center gap-2">
            <LeaveTypeBadge type={request.type} />
            <LeaveStatusBadge status={request.status} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
            {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)]">
            {formatDate(request.startDate)} &ndash; {formatDate(request.endDate)}
          </p>
        </div>
      </div>

      {request.reason && (
        <div className="mb-3 rounded-lg bg-[oklch(0.97_0.003_160)] p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide mb-1">
            Reason
          </p>
          <p className="text-sm text-[oklch(0.35_0.04_160)]">{request.reason}</p>
        </div>
      )}

      {isPending && (
        <>
          <div className="mb-3">
            <label
              htmlFor={`review-note-${request.id}`}
              className="block text-xs font-medium text-[oklch(0.55_0_0)] mb-1"
            >
              Review note (optional)
            </label>
            <textarea
              id={`review-note-${request.id}`}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Add a note for the staff member..."
              className="w-full rounded-lg border border-[oklch(0.85_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:border-[oklch(0.55_0.15_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.15_160)] resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 mb-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleReview('approved')}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => handleReview('denied')}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Deny'}
            </button>
          </div>
        </>
      )}

      {!isPending && request.reviewNote && (
        <div className="rounded-lg bg-[oklch(0.97_0.003_160)] p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide mb-1">
            Review Note
          </p>
          <p className="text-sm text-[oklch(0.35_0.04_160)]">
            {request.reviewNote}
          </p>
          {request.reviewedByName && (
            <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
              -- {request.reviewedByName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
