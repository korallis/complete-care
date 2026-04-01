'use client';

/**
 * SupervisionDetail — view a completed supervision with all template sections
 * and action tracking.
 */

import {
  SupervisionStatusBadge,
  SupervisionTypeBadge,
  SupervisionFrequencyBadge,
} from './supervision-status-badge';
import { GOAL_STATUS_LABELS } from '@/features/supervisions/schema';
import type { GoalStatus } from '@/features/supervisions/schema';
import { GOAL_STATUS_STYLES } from '@/features/supervisions/constants';
import type { Supervision } from '@/lib/db/schema/supervisions';
import type { DevelopmentGoal, ActionAgreed } from '@/lib/db/schema/supervisions';

type SupervisionDetailProps = {
  supervision: Supervision;
  staffName: string;
  supervisorName: string;
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '--';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

function GoalStatusBadge({ status }: { status: string }) {
  const style = GOAL_STATUS_STYLES[status as GoalStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  };
  const label = GOAL_STATUS_LABELS[status as GoalStatus] ?? status;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function SupervisionDetail({
  supervision,
  staffName,
  supervisorName,
}: SupervisionDetailProps) {
  const goals = (supervision.developmentGoals ?? []) as DevelopmentGoal[];
  const actions = (supervision.actionsAgreed ?? []) as ActionAgreed[];

  const sectionClass = 'space-y-2';
  const sectionHeaderClass =
    'text-sm font-semibold text-[oklch(0.22_0.04_160)] border-b border-[oklch(0.92_0.005_160)] pb-2';
  const contentClass = 'text-sm text-[oklch(0.35_0.04_160)] whitespace-pre-wrap';
  const emptyClass = 'text-sm text-[oklch(0.55_0_0)] italic';

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SupervisionStatusBadge status={supervision.status} />
          <SupervisionTypeBadge type={supervision.type} />
          <SupervisionFrequencyBadge frequency={supervision.frequency} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">Staff member</span>
            <span className="text-[oklch(0.22_0.04_160)] font-medium">{staffName}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">Supervisor</span>
            <span className="text-[oklch(0.22_0.04_160)] font-medium">{supervisorName}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">Scheduled</span>
            <span className="text-[oklch(0.22_0.04_160)]">{formatDate(supervision.scheduledDate)}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">Completed</span>
            <span className="text-[oklch(0.22_0.04_160)]">{formatDate(supervision.completedDate)}</span>
          </div>
        </div>
      </div>

      {/* Workload Discussion */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Workload Discussion</h4>
        {supervision.workloadDiscussion ? (
          <p className={contentClass}>{supervision.workloadDiscussion}</p>
        ) : (
          <p className={emptyClass}>No workload discussion recorded.</p>
        )}
      </div>

      {/* Wellbeing Check */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Wellbeing Check</h4>
        {supervision.wellbeingCheck ? (
          <p className={contentClass}>{supervision.wellbeingCheck}</p>
        ) : (
          <p className={emptyClass}>No wellbeing check recorded.</p>
        )}
      </div>

      {/* Development Goals */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Development Goals</h4>
        {goals.length === 0 ? (
          <p className={emptyClass}>No development goals recorded.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-[oklch(0.92_0.005_160)] bg-[oklch(0.985_0.003_160)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-[oklch(0.22_0.04_160)] font-medium">{goal.goal}</p>
                  <GoalStatusBadge status={goal.status} />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-[oklch(0.55_0_0)]">
                  {goal.targetDate && (
                    <span>Target: {formatDate(goal.targetDate)}</span>
                  )}
                  {goal.notes && (
                    <span className="italic">{goal.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Concerns Raised */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>Concerns Raised</h4>
        {supervision.concernsRaised ? (
          <p className={contentClass}>{supervision.concernsRaised}</p>
        ) : (
          <p className={emptyClass}>No concerns raised.</p>
        )}
      </div>

      {/* Actions Agreed */}
      <div className={sectionClass}>
        <h4 className={sectionHeaderClass}>
          Actions Agreed
          {actions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-[oklch(0.55_0_0)]">
              ({actions.filter((a) => a.completed).length}/{actions.length} completed)
            </span>
          )}
        </h4>
        {actions.length === 0 ? (
          <p className={emptyClass}>No actions agreed.</p>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <div
                key={action.id}
                className={`rounded-lg border p-3 ${
                  action.completed
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-[oklch(0.92_0.005_160)] bg-[oklch(0.985_0.003_160)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 flex-shrink-0 ${action.completed ? 'text-emerald-600' : 'text-[oklch(0.75_0_0)]'}`}>
                    {action.completed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${action.completed ? 'text-[oklch(0.45_0_0)] line-through' : 'text-[oklch(0.22_0.04_160)] font-medium'}`}>
                      {action.action}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-[oklch(0.55_0_0)]">
                      {action.assigneeName && (
                        <span>Assigned to: {action.assigneeName}</span>
                      )}
                      {action.deadline && (
                        <span>Due: {formatDate(action.deadline)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next due date */}
      {supervision.nextDueDate && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <span className="font-medium text-blue-800">Next supervision due: </span>
          <span className="text-blue-700">{formatDate(supervision.nextDueDate)}</span>
        </div>
      )}
    </div>
  );
}
