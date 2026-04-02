/**
 * Rota feature constants -- cancellation reasons, status indicators, and display helpers.
 */

// ---------------------------------------------------------------------------
// Cancellation reason codes
// ---------------------------------------------------------------------------

export const CANCELLATION_REASONS = [
  'client_request',
  'client_unwell',
  'client_hospital',
  'client_unavailable',
  'staff_sickness',
  'staff_unavailable',
  'severe_weather',
  'duplicate_booking',
  'no_longer_needed',
  'other',
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  client_request: 'Client Request',
  client_unwell: 'Client Unwell',
  client_hospital: 'Client in Hospital',
  client_unavailable: 'Client Unavailable',
  staff_sickness: 'Staff Sickness',
  staff_unavailable: 'Staff Unavailable',
  severe_weather: 'Severe Weather',
  duplicate_booking: 'Duplicate Booking',
  no_longer_needed: 'No Longer Needed',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Hospital admission statuses
// ---------------------------------------------------------------------------

export const ADMISSION_STATUSES = ['admitted', 'discharged'] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  admitted: 'Admitted',
  discharged: 'Discharged',
};

export const ADMISSION_STATUS_STYLES: Record<
  AdmissionStatus,
  { bg: string; text: string; dot: string }
> = {
  admitted: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  discharged: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

// ---------------------------------------------------------------------------
// Rota view modes
// ---------------------------------------------------------------------------

export const ROTA_VIEW_MODES = ['weekly', 'daily'] as const;
export type RotaViewMode = (typeof ROTA_VIEW_MODES)[number];

// ---------------------------------------------------------------------------
// Conflict types
// ---------------------------------------------------------------------------

export const CONFLICT_TYPES = [
  'double_booking',
  'travel_time',
  'availability',
] as const;

export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  double_booking: 'Double Booking',
  travel_time: 'Insufficient Travel Time',
  availability: 'Staff Unavailable',
};

export const CONFLICT_SEVERITY: Record<ConflictType, 'error' | 'warning'> = {
  double_booking: 'error',
  travel_time: 'warning',
  availability: 'error',
};

// ---------------------------------------------------------------------------
// Visit assignment status (visual indicators)
// ---------------------------------------------------------------------------

export const ASSIGNMENT_INDICATORS = {
  unassigned: {
    label: 'Unassigned',
    bg: 'bg-amber-50 border-amber-300',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  assigned: {
    label: 'Assigned',
    bg: 'bg-blue-50 border-blue-300',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-violet-50 border-violet-300',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 border-emerald-300',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-50 border-slate-300',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  missed: {
    label: 'Missed',
    bg: 'bg-red-50 border-red-300',
    text: 'text-red-800',
    dot: 'bg-red-500',
  },
} as const;

export type AssignmentIndicator = keyof typeof ASSIGNMENT_INDICATORS;

/**
 * Derive the visual indicator for a visit based on its status and assignment.
 */
export function getVisitIndicator(
  status: string,
  assignedStaffId: string | null,
): AssignmentIndicator {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'missed') return 'missed';
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (!assignedStaffId) return 'unassigned';
  return 'assigned';
}

// ---------------------------------------------------------------------------
// Time slot configuration (for rota grid)
// ---------------------------------------------------------------------------

/** Default time slots for the rota grid (30-minute intervals from 06:00 to 22:00) */
export function getTimeSlots(
  startHour = 6,
  endHour = 22,
  intervalMinutes = 30,
): string[] {
  const slots: string[] = [];
  let totalMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (totalMinutes <= endMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    slots.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    );
    totalMinutes += intervalMinutes;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Minimum travel time between visits (in minutes)
// ---------------------------------------------------------------------------

export const MIN_TRAVEL_TIME_MINUTES = 15;
