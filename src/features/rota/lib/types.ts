/**
 * Domain types for the rota / shift-pattern feature.
 */

import type { ShiftPattern, ShiftAssignment, RotaPeriod } from '@/lib/db/schema/shift-patterns';

// --- Enums as union types ---

export type CareDomain = 'domiciliary_care' | 'supported_living' | 'complex_care' | 'childrens_home';

export type ShiftType = 'standard' | 'sleep_in' | 'waking_night' | 'on_call';

export type RotaPatternType = '2on2off' | '4on4off' | '5on2off' | 'custom';

export type PeriodType = 'week' | 'fortnight' | 'four_week';

export type RotaStatus = 'draft' | 'published' | 'confirmed' | 'archived';

export type AssignmentStatus =
  | 'unassigned'
  | 'assigned'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type ConflictType = 'double_booking' | 'wtd_weekly_hours' | 'wtd_rest_period' | 'skills_gap';

// --- Conflict detection result types ---

export interface Conflict {
  type: ConflictType;
  severity: 'error' | 'warning';
  message: string;
  /** Can this conflict be overridden by a coordinator? */
  overridable: boolean;
  /** Related assignment IDs */
  relatedAssignmentIds?: string[];
  /** Missing qualification names (for skills_gap) */
  missingQualifications?: string[];
}

export interface WtdViolation {
  type: 'wtd_weekly_hours' | 'wtd_rest_period';
  weekStartDate: string;
  currentHours?: number;
  maxHours?: number;
  restHoursBetweenShifts?: number;
  minRestHours?: number;
}

// --- Staff member type for rota display ---

export interface RotaStaffMember {
  id: string;
  name: string;
  role: string;
  qualifications: string[];
  /** Contracted weekly hours */
  contractedHours?: number;
}

// --- Rota grid display types ---

export interface RotaGridCell {
  date: string; // ISO date string
  assignments: ShiftAssignmentWithPattern[];
  isToday: boolean;
}

export interface ShiftAssignmentWithPattern extends ShiftAssignment {
  shiftPattern: ShiftPattern;
  conflicts: Conflict[];
}

export interface RotaGridData {
  period: RotaPeriod;
  staff: RotaStaffMember[];
  /** Map: staffId -> date -> assignments */
  grid: Record<string, Record<string, ShiftAssignmentWithPattern[]>>;
  /** Unassigned shifts by date */
  unassigned: Record<string, ShiftAssignmentWithPattern[]>;
  dates: string[];
}

// --- Drag-and-drop types ---

export interface DragData {
  type: 'staff';
  staffId: string;
  staffName: string;
}

export interface DropData {
  type: 'assignment-slot';
  assignmentId: string;
  date: string;
  shiftPatternId: string;
}
