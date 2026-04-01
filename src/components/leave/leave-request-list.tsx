'use client';

/**
 * LeaveRequestList -- displays leave requests with status badges and action controls.
 * Supports filtering by status and shows cancel/review actions where appropriate.
 */

import { useState, useCallback } from 'react';
import { LeaveStatusBadge, LeaveTypeBadge } from './leave-status-badge';
import type { LeaveRequestListItem } from '@/features/leave/actions';

type LeaveRequestListProps = {
  requests: LeaveRequestListItem[];
  canCancel?: boolean;
  onCancel?: (id: string) => Promise<{ success: boolean; error?: string }>;
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

export function LeaveRequestList({
  requests,
  canCancel = false,
  onCancel,
}: LeaveRequestListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = useCallback(
    async (id: string) => {
      if (!onCancel) return;
      setError(null);
      setCancellingId(id);
      try {
        const result = await onCancel(id);
        if (!result.success) {
          setError(result.error ?? 'Failed to cancel');
        }
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setCancellingId(null);
      }
    },
    [onCancel],
  );

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-[oklch(0.55_0.08_160)]"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
          No leave requests
        </p>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Leave requests will appear here once submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 mb-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[oklch(0.92_0.005_160)]">
              <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                Type
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                Dates
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                Days
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                Status
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                Reviewed By
              </th>
              {canCancel && (
                <th className="text-right py-2 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[oklch(0.96_0.003_160)] hover:bg-[oklch(0.985_0.003_160)]"
              >
                <td className="py-2.5 pr-4">
                  <LeaveTypeBadge type={r.type} />
                </td>
                <td className="py-2.5 pr-4 text-[oklch(0.35_0.04_160)]">
                  {formatDate(r.startDate)} &ndash; {formatDate(r.endDate)}
                </td>
                <td className="py-2.5 pr-4 font-medium text-[oklch(0.22_0.04_160)]">
                  {r.totalDays}
                </td>
                <td className="py-2.5 pr-4">
                  <LeaveStatusBadge status={r.status} />
                </td>
                <td className="py-2.5 pr-4 text-[oklch(0.45_0_0)]">
                  {r.reviewedByName ?? '--'}
                </td>
                {canCancel && (
                  <td className="py-2.5 text-right">
                    {(r.status === 'pending' || r.status === 'approved') && (
                      <button
                        type="button"
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
