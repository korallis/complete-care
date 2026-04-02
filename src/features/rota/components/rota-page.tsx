'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RotaGrid } from './rota-grid';
import { ShiftPatternList } from './shift-pattern-list';
import type {
  RotaGridData,
  ShiftAssignmentWithPattern,
  RotaStaffMember,
} from '../lib/types';
import type { ShiftPatternFormData } from '../lib/validation';
import type { ShiftPattern, RotaPeriod } from '@/lib/db/schema/shift-patterns';
import {
  validateWtdCompliance,
  detectDoubleBookings,
  detectSkillsGap,
} from '../lib/wtd-checks';

type TabView = 'rota' | 'patterns';

interface RotaPageProps {
  organisationId: string;
  initialPatterns: ShiftPattern[];
  initialPeriod: RotaPeriod | null;
  initialAssignments: ShiftAssignmentWithPattern[];
  staff: RotaStaffMember[];
}

export function RotaPage({
  organisationId,
  initialPatterns,
  initialPeriod,
  initialAssignments,
  staff,
}: RotaPageProps) {
  const [activeTab, setActiveTab] = useState<TabView>('rota');
  const [patterns, setPatterns] = useState<ShiftPattern[]>(initialPatterns);
  const [assignments, setAssignments] =
    useState<ShiftAssignmentWithPattern[]>(initialAssignments);

  // Generate grid data
  const gridData = useMemo((): RotaGridData | null => {
    if (!initialPeriod) return null;

    const startDate = new Date(initialPeriod.startDate);
    const endDate = new Date(initialPeriod.endDate);
    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    // Build grid: staffId -> date -> assignments
    const grid: Record<string, Record<string, ShiftAssignmentWithPattern[]>> = {};
    const unassigned: Record<string, ShiftAssignmentWithPattern[]> = {};

    for (const staffMember of staff) {
      grid[staffMember.id] = {};
      for (const date of dates) {
        grid[staffMember.id][date] = [];
      }
    }
    for (const date of dates) {
      unassigned[date] = [];
    }

    // Run conflict detection per staff member
    for (const assignment of assignments) {
      const date = new Date(assignment.shiftDate).toISOString().slice(0, 10);

      if (assignment.staffId && grid[assignment.staffId]) {
        grid[assignment.staffId][date] =
          grid[assignment.staffId][date] ?? [];
        grid[assignment.staffId][date].push(assignment);
      } else {
        unassigned[date] = unassigned[date] ?? [];
        unassigned[date].push(assignment);
      }
    }

    // Detect conflicts for each staff member
    for (const staffMember of staff) {
      const staffAssignments = assignments.filter(
        (a) => a.staffId === staffMember.id,
      );

      // WTD checks
      const shifts = staffAssignments.map((a) => ({
        assignmentId: a.id,
        date: new Date(a.shiftDate).toISOString().slice(0, 10),
        startTime: a.shiftPattern.startTime,
        endTime: a.shiftPattern.endTime,
        isOvernight: a.shiftPattern.isOvernight,
        paidMinutes: a.shiftPattern.paidMinutes,
        durationMinutes: a.shiftPattern.durationMinutes,
      }));

      const wtdConflicts = validateWtdCompliance(shifts, dates[0]);
      const bookingConflicts = detectDoubleBookings(shifts);

      // Apply conflicts to assignments
      for (const conflict of [...wtdConflicts, ...bookingConflicts]) {
        if (conflict.relatedAssignmentIds) {
          for (const id of conflict.relatedAssignmentIds) {
            for (const date of dates) {
              const cellAssignments = grid[staffMember.id]?.[date];
              if (cellAssignments) {
                const found = cellAssignments.find((a) => a.id === id);
                if (found) {
                  found.conflicts.push(conflict);
                }
              }
            }
          }
        }
      }

      // Skills gap checks
      for (const assignment of staffAssignments) {
        const required = assignment.shiftPattern.requiredQualifications ?? [];
        if (required.length > 0) {
          const skillsConflict = detectSkillsGap(
            required,
            staffMember.qualifications,
          );
          if (skillsConflict) {
            assignment.conflicts.push(skillsConflict);
          }
        }
      }
    }

    return {
      period: initialPeriod,
      staff,
      grid,
      unassigned,
      dates,
    };
  }, [initialPeriod, assignments, staff]);

  const handleAssignStaff = useCallback(
    async (assignmentId: string, staffId: string) => {
      // Optimistic update
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, staffId, status: 'assigned' as const, conflicts: [] }
            : a,
        ),
      );

      // Server action would go here:
      // await assignStaffToShift(organisationId, userId, { shiftAssignmentId: assignmentId, staffId });
    },
    [],
  );

  const handleUnassignStaff = useCallback(
    async (assignmentId: string) => {
      // Optimistic update
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, staffId: null, status: 'unassigned' as const, conflicts: [] }
            : a,
        ),
      );
    },
    [],
  );

  const handleOverrideConflict = useCallback(
    async (assignmentId: string, conflictType: string, _reason: string) => {
      // Server action: createConflictOverride(...)
      // Then remove the conflict from local state
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, conflicts: a.conflicts.filter((c) => c.type !== conflictType) }
            : a,
        ),
      );
    },
    [],
  );

  const handleConfirmRota = useCallback(async () => {
    // Server action: confirmRotaPeriod(...)
  }, []);

  const handleCreatePattern = useCallback(
    async (_data: ShiftPatternFormData) => {
      // Server action: createShiftPattern(organisationId, data)
    },
    [],
  );

  const handleUpdatePattern = useCallback(
    async (_id: string, _data: ShiftPatternFormData) => {
      // Server action: updateShiftPattern(organisationId, id, data)
    },
    [],
  );

  const handleDeletePattern = useCallback(
    async (id: string) => {
      setPatterns((prev) => prev.filter((p) => p.id !== id));
      // Server action: deleteShiftPattern(organisationId, id)
    },
    [],
  );

  const hasWtdViolations = useMemo(() => {
    return assignments.some((a) =>
      a.conflicts.some(
        (c) => c.type === 'wtd_weekly_hours' || c.type === 'wtd_rest_period',
      ),
    );
  }, [assignments]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Top nav */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-6 px-6 h-14">
          <h1 className="text-base font-semibold tracking-tight">Scheduling</h1>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('rota')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'rota'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              Rota Grid
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('patterns')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'patterns'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              Shift Patterns
              <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                {patterns.length}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'rota' && gridData && (
          <RotaGrid
            data={gridData}
            onAssignStaff={handleAssignStaff}
            onUnassignStaff={handleUnassignStaff}
            onOverrideConflict={handleOverrideConflict}
            onConfirmRota={handleConfirmRota}
            canConfirm={!hasWtdViolations}
          />
        )}

        {activeTab === 'rota' && !gridData && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="5" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                <path d="M3 11h22M8 5V3M20 5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
              </svg>
            </div>
            <p className="text-sm font-medium">No active rota period</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Create a rota period to start building the schedule for your team
            </p>
            <Button className="mt-4" size="sm">
              Create Rota Period
            </Button>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="max-w-3xl mx-auto px-6 py-8">
            <ShiftPatternList
              patterns={patterns}
              onCreatePattern={handleCreatePattern}
              onUpdatePattern={handleUpdatePattern}
              onDeletePattern={handleDeletePattern}
            />
          </div>
        )}
      </div>
    </div>
  );
}
