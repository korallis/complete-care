/**
 * Types for the auto-scheduling engine.
 */

/** Represents a staff member with their availability and qualifications for scheduling. */
export interface SchedulableStaff {
  id: string;
  name: string;
  qualifications: string[];
  /** Maximum contracted hours per week */
  maxWeeklyHours: number;
  /** Hours already scheduled this week */
  scheduledHours: number;
  /** Hourly cost */
  hourlyRate: number;
  /** Day-of-week availability windows */
  availability: AvailabilityWindow[];
  /** Location/area the staff member is based in */
  baseLocation?: string;
}

export interface AvailabilityWindow {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: 'available' | 'unavailable' | 'preferred';
}

/** Represents a slot that needs to be filled in the schedule. */
export interface ScheduleSlot {
  id: string;
  shiftDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  requiredRole?: string;
  requiredQualifications: string[];
  locationId?: string;
  /** Minimum number of staff needed */
  minStaff: number;
}

/** A hard constraint that must be satisfied. */
export interface HardConstraint {
  type: 'qualification' | 'availability' | 'min_staffing' | 'max_hours';
  check: (staff: SchedulableStaff, slot: ScheduleSlot) => boolean;
}

/** A soft constraint that contributes to scoring. */
export interface SoftConstraint {
  type: 'continuity' | 'geography' | 'cost' | 'preference';
  weight: number;
  score: (staff: SchedulableStaff, slot: ScheduleSlot) => number;
}

/** Result of assigning a staff member to a slot. */
export interface Assignment {
  slotId: string;
  staffId: string | null;
  suitabilityScore: number;
  status: 'assigned' | 'unfilled';
}

/** Summary of a schedule run's trade-offs. */
export interface ScheduleSummary {
  totalSlots: number;
  filledSlots: number;
  unfilledSlots: number;
  overallScore: number;
  tradeOffs: TradeOff[];
}

export interface TradeOff {
  constraint: string;
  score: number;
  maxScore: number;
  details: string;
}

/** Candidate for gap-filling, ranked by suitability. */
export interface GapFillCandidate {
  staffId: string;
  staffName: string;
  suitabilityScore: number;
  /** Breakdown of why this score was given */
  reasons: GapFillReason[];
}

export interface GapFillReason {
  factor: 'skills' | 'availability' | 'hours_remaining' | 'cost';
  score: number;
  detail: string;
}
