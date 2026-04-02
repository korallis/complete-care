'use client';

import { isRhiOverdue } from '../schema';
import type { ReturnHomeInterview } from '@/lib/db/schema';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800' },
  escalated: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

function formatCountdown(deadlineAt: Date): string {
  const diffMs = deadlineAt.getTime() - Date.now();
  if (diffMs <= 0) return 'OVERDUE';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}h ${minutes}m remaining`;
}

/**
 * Return Home Interview card — shows deadline countdown, completion status,
 * and escalation state. Used on the manager dashboard.
 */
export function RhiCard({
  rhi,
  childName,
}: {
  rhi: ReturnHomeInterview;
  childName: string;
}) {
  const overdue = isRhiOverdue(rhi.deadlineAt);
  const isIncomplete = rhi.status === 'pending' || rhi.status === 'in_progress';
  const statusStyle = STATUS_STYLES[rhi.status] ?? STATUS_STYLES.pending;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        overdue && isIncomplete
          ? 'border-red-300 bg-red-50/30'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{childName}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Return Home Interview
          </p>
        </div>

        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${statusStyle.bg} ${statusStyle.text}`}
        >
          {rhi.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Deadline countdown */}
      {isIncomplete && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase">
              72-hour Deadline
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                overdue ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {formatCountdown(rhi.deadlineAt)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                overdue ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: overdue
                  ? '100%'
                  : `${Math.min(100, ((72 * 60 * 60 * 1000 - (rhi.deadlineAt.getTime() - Date.now())) / (72 * 60 * 60 * 1000)) * 100)}%`,
              }}
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Deadline:{' '}
            {rhi.deadlineAt.toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Overdue escalation warning */}
      {overdue && isIncomplete && !rhi.escalatedToRi && (
        <div className="mt-3 rounded border border-red-300 bg-red-100 px-3 py-2">
          <p className="text-xs font-bold text-red-800 uppercase">
            Overdue — Escalate to Responsible Individual
          </p>
        </div>
      )}

      {rhi.escalatedToRi && (
        <div className="mt-3 rounded border border-purple-200 bg-purple-50 px-3 py-2">
          <p className="text-xs text-purple-700">
            <span className="font-medium">Escalated to RI</span>
            {rhi.escalatedAt && (
              <span>
                {' '}
                on{' '}
                {rhi.escalatedAt.toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Completed RHI summary */}
      {rhi.status === 'completed' && (
        <div className="mt-3 space-y-1.5 text-xs">
          {rhi.childDeclined ? (
            <p className="text-amber-700">
              <span className="font-medium">Child declined interview.</span>
              {rhi.declineReason && <span> Reason: {rhi.declineReason}</span>}
            </p>
          ) : (
            <>
              {rhi.whereChildWas && (
                <p>
                  <span className="font-medium text-gray-700">Where: </span>
                  {rhi.whereChildWas}
                </p>
              )}
              {rhi.whoChildWasWith && (
                <p>
                  <span className="font-medium text-gray-700">With: </span>
                  {rhi.whoChildWasWith}
                </p>
              )}
              {rhi.exploitationConcerns &&
                rhi.exploitationConcerns.length > 0 &&
                rhi.exploitationConcerns[0] !== 'none' && (
                  <div className="flex flex-wrap gap-1">
                    {rhi.exploitationConcerns.map((concern) => (
                      <span
                        key={concern}
                        className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 uppercase"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                )}
              {rhi.safeguardingReferralNeeded && (
                <p className="font-medium text-red-600">
                  Safeguarding referral required
                </p>
              )}
            </>
          )}
          {rhi.completedAt && (
            <p className="text-gray-500">
              Completed:{' '}
              {rhi.completedAt.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
