/**
 * Travel Safety feature constants — statuses, modes, alert types.
 */

export const TRAVEL_MODES = [
  'car',
  'public_transport',
  'walking',
  'cycling',
] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

export const WELFARE_CHECK_STATUSES = [
  'pending',
  'checked_in',
  'overdue',
  'escalated',
  'resolved',
] as const;
export type WelfareCheckStatus = (typeof WELFARE_CHECK_STATUSES)[number];

export const WELFARE_RESOLUTIONS = [
  'safe',
  'assistance_sent',
  'false_alarm',
  'other',
] as const;
export type WelfareResolution = (typeof WELFARE_RESOLUTIONS)[number];

export const SOS_STATUSES = [
  'active',
  'acknowledged',
  'resolved',
  'false_alarm',
] as const;
export type SosStatus = (typeof SOS_STATUSES)[number];

export const ROUTE_SUGGESTION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'ignored',
] as const;
export type RouteSuggestionStatus = (typeof ROUTE_SUGGESTION_STATUSES)[number];

export const OPTIMISATION_METHODS = [
  'manual',
  'simple_nearest',
  'api_optimised',
] as const;
export type OptimisationMethod = (typeof OPTIMISATION_METHODS)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const ACTIVITY_TYPES = [
  'stationary',
  'walking',
  'driving',
  'unknown',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Default buffer before welfare check triggers (minutes) */
export const DEFAULT_WELFARE_CHECK_BUFFER_MINUTES = 15;

/** Default GPS ping interval (seconds) */
export const DEFAULT_GPS_PING_INTERVAL_SECONDS = 60;

/** Default escalation delay (minutes) */
export const DEFAULT_ESCALATION_DELAY_MINUTES = 15;

export const WELFARE_STATUS_CONFIG: Record<
  WelfareCheckStatus,
  { label: string; colour: string }
> = {
  pending: { label: 'Pending', colour: 'bg-slate-100 text-slate-700' },
  checked_in: { label: 'Checked In', colour: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', colour: 'bg-red-100 text-red-700' },
  escalated: { label: 'Escalated', colour: 'bg-orange-100 text-orange-700' },
  resolved: { label: 'Resolved', colour: 'bg-blue-100 text-blue-700' },
};

export const SOS_STATUS_CONFIG: Record<
  SosStatus,
  { label: string; colour: string }
> = {
  active: { label: 'ACTIVE', colour: 'bg-red-100 text-red-700' },
  acknowledged: { label: 'Acknowledged', colour: 'bg-orange-100 text-orange-700' },
  resolved: { label: 'Resolved', colour: 'bg-green-100 text-green-700' },
  false_alarm: { label: 'False Alarm', colour: 'bg-gray-100 text-gray-500' },
};

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; colour: string }
> = {
  low: { label: 'Low Risk', colour: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium Risk', colour: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High Risk', colour: 'bg-red-100 text-red-700' },
};
