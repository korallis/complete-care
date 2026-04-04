'use client';

/**
 * RotaView -- weekly/daily grid with staff columns and time rows.
 * Supports drag-and-drop visit assignment, conflict warnings,
 * bulk operations, and visual status indicators.
 */

import { useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ScheduledVisit } from '@/lib/db/schema/care-packages';
import type { Conflict } from '@/features/rota/conflicts';
import { assignVisit } from '@/features/rota/actions';
import { getTimeSlots } from '@/features/rota/constants';
import { VisitCard, type VisitCardData } from './visit-card';
import { ConflictWarning } from './conflict-warning';
import { BulkAssignModal } from './bulk-assign-modal';
import { CancellationForm } from './cancellation-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RotaVisitData = ScheduledVisit & {
  staffName: string | null;
  personName: string | null;
};

type RotaViewProps = {
  visits: RotaVisitData[];
  conflicts: Conflict[];
  staff: { id: string; name: string }[];
  startDate: string;
  endDate: string;
  viewMode: 'weekly' | 'daily';
  canManage: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RotaView({
  visits,
  conflicts,
  staff,
  startDate,
  endDate,
  viewMode,
  canManage,
}: RotaViewProps) {
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [cancellingVisit, setCancellingVisit] = useState<RotaVisitData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Build conflict lookup: visitId -> conflict messages
  const conflictMap = new Map<string, Conflict[]>();
  for (const c of conflicts) {
    const existing = conflictMap.get(c.visitId) ?? [];
    existing.push(c);
    conflictMap.set(c.visitId, existing);
  }

  // Generate date columns
  const dates = getDatesInRange(startDate, endDate);
  const displayDates = viewMode === 'daily' ? [startDate] : dates;

  // Time slots for the grid
  const timeSlots = getTimeSlots(6, 22, 60);

  // Group visits by staff+date+hour
  const visitsByCell = new Map<string, RotaVisitData[]>();
  const unassignedVisits: RotaVisitData[] = [];

  for (const v of visits) {
    if (!v.assignedStaffId) {
      unassignedVisits.push(v);
      continue;
    }
    const hour = v.scheduledStart.slice(0, 2);
    const key = `${v.assignedStaffId}:${v.date}:${hour}`;
    const existing = visitsByCell.get(key) ?? [];
    existing.push(v);
    visitsByCell.set(key, existing);
  }

  // Handle drag and drop
  const handleDrop = useCallback(
    (staffId: string, date: string) => {
      void date;
      return (e: React.DragEvent) => {
        e.preventDefault();
        const visitId = e.dataTransfer.getData('text/plain');
        if (!visitId || !canManage) return;

        startTransition(async () => {
          const result = await assignVisit({ visitId, staffId });
          if (result.success) {
            if (result.data.conflicts.length > 0) {
              toast.warning('Visit assigned with conflicts detected');
            } else {
              toast.success('Visit assigned');
            }
          } else {
            toast.error(result.error ?? 'Failed to assign visit');
          }
        });
      };
    },
    [canManage],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Toggle visit selection for bulk ops
  function toggleVisitSelection(visitId: string) {
    setSelectedVisits((prev) => {
      const next = new Set(prev);
      if (next.has(visitId)) {
        next.delete(visitId);
      } else {
        next.add(visitId);
      }
      return next;
    });
  }

  // Convert visit to card data
  function toCardData(v: RotaVisitData): VisitCardData {
    const visitConflicts = conflictMap.get(v.id);
    return {
      id: v.id,
      date: v.date,
      scheduledStart: v.scheduledStart,
      scheduledEnd: v.scheduledEnd,
      status: v.status,
      assignedStaffId: v.assignedStaffId,
      staffName: v.staffName,
      personId: v.personId,
      personName: v.personName,
      isAdHoc: v.isAdHoc,
      hasConflict: !!visitConflicts && visitConflicts.length > 0,
      conflictMessage: visitConflicts?.[0]?.message,
    };
  }

  return (
    <div className="space-y-4">
      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <ConflictWarning conflicts={conflicts} />
      )}

      {/* Toolbar */}
      {canManage && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-[oklch(0.55_0_0)]">
            {selectedVisits.size > 0 && (
              <span className="font-medium text-[oklch(0.35_0.04_160)]">
                {selectedVisits.size} visit{selectedVisits.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedVisits.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBulkAssign(true)}
                  className="rounded-lg bg-[oklch(0.45_0.1_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.4_0.1_160)] transition-colors"
                >
                  Bulk Assign ({selectedVisits.size})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVisits(new Set())}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.55_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unassigned visits */}
      {canManage && unassignedVisits.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800">
              Unassigned ({unassignedVisits.length})
              <span className="ml-2 text-xs font-normal">
                Drag to a staff column to assign
              </span>
            </h3>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {unassignedVisits.map((v) => (
              <div
                key={v.id}
                className={cn(
                  'relative',
                  selectedVisits.has(v.id) && 'ring-2 ring-[oklch(0.45_0.1_160)] rounded-lg',
                )}
              >
                {canManage && (
                  <input
                    type="checkbox"
                    checked={selectedVisits.has(v.id)}
                    onChange={() => toggleVisitSelection(v.id)}
                    className="absolute top-1 right-1 z-10 h-3.5 w-3.5 rounded border-[oklch(0.75_0_0)]"
                    aria-label={`Select visit at ${v.scheduledStart} for ${v.personName ?? 'unknown'}`}
                  />
                )}
                <VisitCard
                  visit={toCardData(v)}
                  onClick={() => {
                    if (canManage) toggleVisitSelection(v.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rota grid */}
      <div className="overflow-x-auto rounded-xl border border-[oklch(0.91_0.005_160)] bg-white">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-[oklch(0.985_0.003_160)]">
              <th className="sticky left-0 z-20 bg-[oklch(0.985_0.003_160)] border-b border-r border-[oklch(0.91_0.005_160)] px-3 py-2 text-left text-xs font-semibold text-[oklch(0.35_0.04_160)] w-20">
                Time
              </th>
              {staff.map((s) => (
                <th
                  key={s.id}
                  className="border-b border-r border-[oklch(0.91_0.005_160)] px-3 py-2 text-left text-xs font-semibold text-[oklch(0.35_0.04_160)] min-w-[160px]"
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayDates.map((date) => (
              <>
                {/* Date header row */}
                <tr key={`date-${date}`}>
                  <td
                    colSpan={staff.length + 1}
                    className="bg-[oklch(0.97_0.003_160)] px-3 py-1.5 border-b border-[oklch(0.91_0.005_160)]"
                  >
                    <span className="text-xs font-semibold text-[oklch(0.35_0.04_160)]">
                      {formatDateLabel(date)}
                    </span>
                  </td>
                </tr>
                {/* Time slot rows */}
                {timeSlots.map((time) => {
                  const hour = time.slice(0, 2);
                  return (
                    <tr key={`${date}-${time}`}>
                      <td className="sticky left-0 z-10 bg-white border-b border-r border-[oklch(0.95_0.003_160)] px-3 py-1 text-xs font-mono text-[oklch(0.55_0_0)]">
                        {time}
                      </td>
                      {staff.map((s) => {
                        const cellKey = `${s.id}:${date}:${hour}`;
                        const cellVisits = visitsByCell.get(cellKey) ?? [];

                        return (
                          <td
                            key={cellKey}
                            onDrop={handleDrop(s.id, date)}
                            onDragOver={handleDragOver}
                            className={cn(
                              'border-b border-r border-[oklch(0.95_0.003_160)] px-1.5 py-1 align-top',
                              canManage && 'hover:bg-[oklch(0.97_0.003_160)]',
                              isPending && 'opacity-50',
                            )}
                          >
                            <div className="space-y-1">
                              {cellVisits.map((v) => (
                                <div
                                  key={v.id}
                                  className={cn(
                                    'relative',
                                    selectedVisits.has(v.id) &&
                                      'ring-2 ring-[oklch(0.45_0.1_160)] rounded-lg',
                                  )}
                                >
                                  {canManage && (
                                    <input
                                      type="checkbox"
                                      checked={selectedVisits.has(v.id)}
                                      onChange={() => toggleVisitSelection(v.id)}
                                      className="absolute top-1 right-1 z-10 h-3 w-3 rounded border-[oklch(0.75_0_0)]"
                                      aria-label={`Select visit for ${v.personName ?? 'unknown'}`}
                                    />
                                  )}
                                  <VisitCard
                                    visit={toCardData(v)}
                                    compact
                                    onClick={() => {
                                      if (canManage && v.status !== 'cancelled') {
                                        setCancellingVisit(v);
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk assign modal */}
      {showBulkAssign && (
        <BulkAssignModal
          visitIds={[...selectedVisits]}
          staffOptions={staff}
          onClose={() => setShowBulkAssign(false)}
          onSuccess={() => {
            setShowBulkAssign(false);
            setSelectedVisits(new Set());
          }}
        />
      )}

      {/* Cancellation form */}
      {cancellingVisit && (
        <CancellationForm
          visitId={cancellingVisit.id}
          visitDate={cancellingVisit.date}
          visitTime={cancellingVisit.scheduledStart}
          onClose={() => setCancellingVisit(null)}
          onSuccess={() => setCancellingVisit(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}
