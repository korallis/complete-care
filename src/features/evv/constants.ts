/**
 * EVV feature constants — verification methods, statuses, and display helpers.
 */

// ---------------------------------------------------------------------------
// Verification methods
// ---------------------------------------------------------------------------

export const VERIFICATION_METHODS = ['gps', 'qr', 'manual'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  gps: 'GPS Location',
  qr: 'QR Code Scan',
  manual: 'Manual Override',
};

// ---------------------------------------------------------------------------
// Visit EVV status (traffic-light)
// ---------------------------------------------------------------------------

export const EVV_STATUSES = [
  'pending',
  'on_track',
  'late',
  'overdue',
  'checked_in',
  'completed',
  'missed',
] as const;
export type EvvStatus = (typeof EVV_STATUSES)[number];

export const EVV_STATUS_LABELS: Record<EvvStatus, string> = {
  pending: 'Pending',
  on_track: 'On Track',
  late: 'Late',
  overdue: 'Overdue',
  checked_in: 'Checked In',
  completed: 'Completed',
  missed: 'Missed',
};

export const EVV_STATUS_STYLES: Record<
  EvvStatus,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  on_track: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  late: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  overdue: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  checked_in: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  missed: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

/** Default geofence radius in metres */
export const DEFAULT_GEOFENCE_RADIUS = 50;

/** Grace period in minutes before a visit is considered "late" */
export const DEFAULT_LATE_GRACE_MINUTES = 15;

/** Time in minutes after scheduled end before a visit is "overdue" */
export const DEFAULT_OVERDUE_MINUTES = 30;

/** Time in minutes after scheduled start with no check-in to mark as "missed" */
export const DEFAULT_MISSED_THRESHOLD_MINUTES = 60;

/** Earth radius in metres for Haversine calculation */
export const EARTH_RADIUS_METRES = 6_371_000;

// ---------------------------------------------------------------------------
// Override approval statuses
// ---------------------------------------------------------------------------

export const OVERRIDE_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type OverrideStatus = (typeof OVERRIDE_STATUSES)[number];

export const OVERRIDE_STATUS_LABELS: Record<OverrideStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

/**
 * Determine the traffic-light EVV status for a visit.
 */
export function getEvvStatus(opts: {
  scheduledStart: string; // HH:MM
  scheduledEnd: string; // HH:MM
  date: string; // YYYY-MM-DD
  checkInTime: Date | null;
  checkOutTime: Date | null;
  now?: Date;
  lateGraceMinutes?: number;
  overdueMinutes?: number;
  missedThresholdMinutes?: number;
}): EvvStatus {
  const {
    scheduledStart,
    scheduledEnd,
    date,
    checkInTime,
    checkOutTime,
    now = new Date(),
    lateGraceMinutes = DEFAULT_LATE_GRACE_MINUTES,
    overdueMinutes = DEFAULT_OVERDUE_MINUTES,
    missedThresholdMinutes = DEFAULT_MISSED_THRESHOLD_MINUTES,
  } = opts;

  // If both check-in and check-out recorded, it's completed
  if (checkInTime && checkOutTime) return 'completed';

  // If checked in but not out, it's in progress
  if (checkInTime && !checkOutTime) return 'checked_in';

  // From here: no check-in yet
  const [startH, startM] = scheduledStart.split(':').map(Number);
  const [endH, endM] = scheduledEnd.split(':').map(Number);

  const scheduledStartDate = new Date(`${date}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
  const scheduledEndDate = new Date(`${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);

  const minutesSinceStart = (now.getTime() - scheduledStartDate.getTime()) / 60_000;
  const minutesSinceEnd = (now.getTime() - scheduledEndDate.getTime()) / 60_000;

  // Visit hasn't started yet
  if (minutesSinceStart < 0) return 'pending';

  // Past missed threshold — no check-in at all
  if (minutesSinceStart >= missedThresholdMinutes) return 'missed';

  // Past scheduled end + overdue buffer
  if (minutesSinceEnd >= overdueMinutes) return 'overdue';

  // Past grace period — late
  if (minutesSinceStart >= lateGraceMinutes) return 'late';

  // Within grace period
  return 'on_track';
}
