'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  RotaGridData,
  RotaStaffMember,
  ShiftAssignmentWithPattern,
  Conflict,
  DragData,
} from '../lib/types';
import { ConflictDialog } from './conflict-dialog';

// --- Sub-components ---

function StaffDraggable({
  staff,
  isAssigned,
}: {
  staff: RotaStaffMember;
  isAssigned?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `staff-${staff.id}`,
    data: {
      type: 'staff',
      staffId: staff.id,
      staffName: staff.name,
    } satisfies DragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md cursor-grab active:cursor-grabbing transition-all select-none',
        isDragging && 'opacity-30',
        isAssigned ? 'bg-muted/50' : 'bg-background hover:bg-muted/30',
      )}
    >
      <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-semibold text-foreground/70">
          {staff.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{staff.name}</div>
        <div className="text-[10px] text-muted-foreground">{staff.role}</div>
      </div>
    </div>
  );
}

function ShiftSlotDroppable({
  assignmentId,
  date,
  shiftPatternId,
  children,
}: {
  assignmentId: string;
  date: string;
  shiftPatternId: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${assignmentId}`,
    data: {
      type: 'assignment-slot',
      assignmentId,
      date,
      shiftPatternId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all rounded-md',
        isOver && 'ring-2 ring-foreground/50 bg-foreground/5',
      )}
    >
      {children}
    </div>
  );
}

function ShiftBlock({
  assignment,
  onRemoveStaff,
}: {
  assignment: ShiftAssignmentWithPattern;
  onRemoveStaff?: (assignmentId: string) => void;
}) {
  const pattern = assignment.shiftPattern;
  const hasConflicts = assignment.conflicts.length > 0;
  const hasErrors = assignment.conflicts.some((c) => c.severity === 'error');
  const hasWarnings = assignment.conflicts.some((c) => c.severity === 'warning');

  return (
    <div
      className={cn(
        'group relative rounded-md px-2 py-1.5 text-[11px] leading-tight border transition-all min-h-[44px]',
        assignment.staffId
          ? 'cursor-default'
          : 'border-dashed border-border/60 bg-muted/20',
        hasErrors && 'ring-1 ring-destructive/50 border-destructive/40',
        hasWarnings && !hasErrors && 'ring-1 ring-amber-500/50 border-amber-500/40',
      )}
      style={
        assignment.staffId
          ? {
              backgroundColor: `${pattern.colour}12`,
              borderColor: `${pattern.colour}40`,
            }
          : undefined
      }
    >
      {/* Colour accent bar */}
      <div
        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
        style={{ backgroundColor: pattern.colour }}
      />

      <div className="pl-2">
        <div className="font-medium truncate" style={{ color: pattern.colour }}>
          {pattern.name}
        </div>
        <div className="text-muted-foreground tabular-nums">
          {pattern.startTime.slice(0, 5)}–{pattern.endTime.slice(0, 5)}
        </div>

        {!assignment.staffId && (
          <div className="mt-1 text-muted-foreground/60 italic">Unassigned</div>
        )}
      </div>

      {/* Conflict indicators */}
      {hasConflicts && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {hasErrors && (
            <div className="h-3.5 w-3.5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">!</span>
            </div>
          )}
          {hasWarnings && !hasErrors && (
            <div className="h-3.5 w-3.5 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">!</span>
            </div>
          )}
        </div>
      )}

      {/* Remove button */}
      {assignment.staffId && onRemoveStaff && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveStaff(assignment.id);
          }}
          className="absolute top-1 right-1 h-4 w-4 rounded-full bg-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// --- Main Grid ---

interface RotaGridProps {
  data: RotaGridData;
  onAssignStaff: (assignmentId: string, staffId: string) => void;
  onUnassignStaff: (assignmentId: string) => void;
  onOverrideConflict: (assignmentId: string, conflictType: string, reason: string) => void;
  onConfirmRota: () => void;
  canConfirm: boolean;
}

export function RotaGrid({
  data,
  onAssignStaff,
  onUnassignStaff,
  onOverrideConflict,
  onConfirmRota,
  canConfirm,
}: RotaGridProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [conflictDialogData, setConflictDialogData] = useState<{
    assignmentId: string;
    conflicts: Conflict[];
    staffName: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Count all conflicts
  const allConflicts = useMemo(() => {
    const conflicts: Conflict[] = [];
    for (const staffId of Object.keys(data.grid)) {
      for (const date of Object.keys(data.grid[staffId])) {
        for (const assignment of data.grid[staffId][date]) {
          conflicts.push(...assignment.conflicts);
        }
      }
    }
    return conflicts;
  }, [data.grid]);

  const wtdErrors = allConflicts.filter(
    (c) => c.type === 'wtd_weekly_hours' || c.type === 'wtd_rest_period',
  );
  const warnings = allConflicts.filter((c) => c.severity === 'warning');

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDrag(event.active.data.current as DragData);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) return;

      const staffData = active.data.current as DragData;
      const slotData = over.data.current as {
        type: string;
        assignmentId: string;
      };

      if (staffData?.type === 'staff' && slotData?.type === 'assignment-slot') {
        onAssignStaff(slotData.assignmentId, staffData.staffId);
      }
    },
    [onAssignStaff],
  );

  // Format date for column headers
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const num = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    return { day, num, month };
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return dateStr === today;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {data.period.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant={
                  data.period.status === 'confirmed' ? 'default' : 'outline'
                }
                className="text-[10px] uppercase tracking-wider"
              >
                {data.period.status}
              </Badge>
              {wtdErrors.length > 0 && (
                <span className="text-xs text-destructive font-medium">
                  {wtdErrors.length} WTD violation{wtdErrors.length !== 1 ? 's' : ''}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onConfirmRota}
              disabled={!canConfirm || wtdErrors.length > 0}
              className="gap-2"
            >
              {wtdErrors.length > 0 && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v7M7 11v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {wtdErrors.length > 0 ? 'WTD Violations — Cannot Confirm' : 'Confirm Rota'}
            </Button>
          </div>
        </div>

        {/* Grid layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Staff sidebar (Y-axis) */}
          <div className="w-56 shrink-0 border-r border-border flex flex-col">
            <div className="h-16 px-4 flex items-end pb-2 border-b border-border bg-muted/20">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Staff
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="py-2 px-2 space-y-1">
                {data.staff.map((staff) => (
                  <StaffDraggable
                    key={staff.id}
                    staff={staff}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Rota grid (scrollable X-axis) */}
          <ScrollArea className="flex-1">
            <div className="min-w-max">
              {/* Date header row */}
              <div className="flex h-16 border-b border-border bg-muted/20">
                {data.dates.map((dateStr) => {
                  const { day, num, month } = formatDate(dateStr);
                  const today = isToday(dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'w-40 shrink-0 px-3 flex flex-col justify-end pb-2 border-r border-border/50',
                        today && 'bg-foreground/5',
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {day}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn(
                            'text-lg font-semibold tabular-nums leading-none',
                            today && 'text-foreground',
                          )}
                        >
                          {num}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {month}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Staff rows */}
              {data.staff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex border-b border-border/30 hover:bg-muted/10 transition-colors"
                >
                  {data.dates.map((dateStr) => {
                    const assignments =
                      data.grid[staff.id]?.[dateStr] ?? [];
                    const today = isToday(dateStr);

                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'w-40 shrink-0 p-1.5 border-r border-border/30 min-h-[56px]',
                          today && 'bg-foreground/[0.02]',
                        )}
                      >
                        <div className="space-y-1">
                          {assignments.map((assignment) => (
                            <ShiftBlock
                              key={assignment.id}
                              assignment={assignment}
                              onRemoveStaff={onUnassignStaff}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Unassigned row */}
              <div className="border-b-2 border-dashed border-border/50">
                <div className="flex items-center h-8 px-3 bg-muted/10">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Unassigned Shifts
                  </span>
                </div>
                <div className="flex">
                  {data.dates.map((dateStr) => {
                    const unassigned = data.unassigned[dateStr] ?? [];
                    const today = isToday(dateStr);

                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'w-40 shrink-0 p-1.5 border-r border-border/30 min-h-[56px]',
                          today && 'bg-foreground/[0.02]',
                        )}
                      >
                        <div className="space-y-1">
                          {unassigned.map((assignment) => (
                            <ShiftSlotDroppable
                              key={assignment.id}
                              assignmentId={assignment.id}
                              date={dateStr}
                              shiftPatternId={assignment.shiftPatternId}
                            >
                              <ShiftBlock assignment={assignment} />
                            </ShiftSlotDroppable>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag && (
          <div className="rounded-md bg-background border border-foreground/20 shadow-lg px-3 py-2 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-foreground/70">
                {activeDrag.staffName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium">{activeDrag.staffName}</span>
          </div>
        )}
      </DragOverlay>

      {/* Conflict dialog */}
      {conflictDialogData && (
        <ConflictDialog
          open={!!conflictDialogData}
          onOpenChange={() => setConflictDialogData(null)}
          conflicts={conflictDialogData.conflicts}
          staffName={conflictDialogData.staffName}
          onOverride={(conflictType, reason) => {
            onOverrideConflict(
              conflictDialogData.assignmentId,
              conflictType,
              reason,
            );
            setConflictDialogData(null);
          }}
        />
      )}
    </DndContext>
  );
}
