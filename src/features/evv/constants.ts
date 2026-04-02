/**
 * EVV feature constants — visit statuses, alert types, verification methods.
 */

export const VISIT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'missed',
  'cancelled',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_TYPES = [
  'personal_care',
  'medication',
  'meal_prep',
  'wellness_check',
  'other',
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const CHECK_EVENT_TYPES = ['check_in', 'check_out'] as const;
export type CheckEventType = (typeof CHECK_EVENT_TYPES)[number];

export const VERIFICATION_METHODS = [
  'gps',
  'qr_code',
  'nfc',
  'manual_override',
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const ALERT_TYPES = [
  'late_start',
  'missed',
  'late_checkout',
  'geofence_breach',
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_STATUSES = [
  'active',
  'acknowledged',
  'resolved',
  'escalated',
] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

/** Default geofence radius in metres */
export const DEFAULT_GEOFENCE_RADIUS_METRES = 100;

/** Default grace period before late alert in minutes */
export const DEFAULT_GRACE_PERIOD_MINUTES = 15;

/** Default escalation delay in minutes */
export const DEFAULT_ESCALATION_DELAY_MINUTES = 30;

/** Default threshold for marking a visit as missed in minutes */
export const DEFAULT_MISSED_THRESHOLD_MINUTES = 60;

/** Status display labels and colours for the dashboard */
export const VISIT_STATUS_CONFIG: Record<
  VisitStatus,
  { label: string; colour: string; dotColour: string }
> = {
  scheduled: {
    label: 'Scheduled',
    colour: 'bg-slate-100 text-slate-700',
    dotColour: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    colour: 'bg-blue-100 text-blue-700',
    dotColour: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    colour: 'bg-green-100 text-green-700',
    dotColour: 'bg-green-500',
  },
  missed: {
    label: 'Missed',
    colour: 'bg-red-100 text-red-700',
    dotColour: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    colour: 'bg-gray-100 text-gray-500',
    dotColour: 'bg-gray-400',
  },
};

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; colour: string }
> = {
  low: { label: 'Low', colour: 'bg-blue-100 text-blue-700' },
  medium: { label: 'Medium', colour: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', colour: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', colour: 'bg-red-100 text-red-700' },
};
