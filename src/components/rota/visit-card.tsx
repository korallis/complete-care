'use client';

/**
 * VisitCard -- draggable visit card with status indicator for the rota grid.
 */

import { cn } from '@/lib/utils';
import {
  ASSIGNMENT_INDICATORS,
  getVisitIndicator,
  type AssignmentIndicator,
} from '@/features/rota/constants';

export type VisitCardData = {
  id: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  assignedStaffId: string | null;
  staffName: string | null;
  personId: string;
  personName: string | null;
  isAdHoc: boolean;
  hasConflict?: boolean;
  conflictMessage?: string;
};

type VisitCardProps = {
  visit: VisitCardData;
  onDragStart?: (visitId: string) => void;
  onClick?: (visitId: string) => void;
  compact?: boolean;
};

export function VisitCard({ visit, onDragStart, onClick, compact = false }: VisitCardProps) {
  const indicator: AssignmentIndicator = getVisitIndicator(
    visit.status,
    visit.assignedStaffId,
  );
  const style = ASSIGNMENT_INDICATORS[indicator];

  return (
    <div
      draggable={visit.status === 'scheduled' || visit.status === 'in_progress'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', visit.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(visit.id);
      }}
      onClick={() => onClick?.(visit.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(visit.id);
        }
      }}
      className={cn(
        'rounded-lg border px-3 py-2 cursor-pointer transition-all',
        'hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)/0.3]',
        style.bg,
        visit.hasConflict && 'ring-2 ring-red-400',
        compact && 'px-2 py-1',
      )}
      aria-label={`Visit for ${visit.personName ?? 'Unknown'} at ${visit.scheduledStart}, status: ${style.label}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn('h-2 w-2 rounded-full flex-shrink-0', style.dot)}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-xs font-semibold truncate',
                style.text,
                compact && 'text-[10px]',
              )}
            >
              {visit.scheduledStart}
              {!compact && ` - ${visit.scheduledEnd}`}
            </span>
          </div>
          <p
            className={cn(
              'text-xs font-medium text-[oklch(0.22_0.04_160)] truncate mt-0.5',
              compact && 'text-[10px]',
            )}
          >
            {visit.personName ?? 'Unknown client'}
          </p>
          {!compact && visit.staffName && (
            <p className="text-[10px] text-[oklch(0.55_0_0)] truncate mt-0.5">
              {visit.staffName}
            </p>
          )}
          {!compact && visit.isAdHoc && (
            <span className="text-[10px] text-amber-600 font-medium">
              Ad-hoc
            </span>
          )}
        </div>
      </div>
      {visit.hasConflict && visit.conflictMessage && (
        <p className="text-[10px] text-red-600 mt-1 truncate">
          {visit.conflictMessage}
        </p>
      )}
    </div>
  );
}
