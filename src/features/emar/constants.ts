/**
 * EMAR Constants — routes, labels, and option lists.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function emarBasePath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/emar`;
}

export function medicationsPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/emar/medications`;
}

export function newMedicationPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/emar/medications/new`;
}

export function medicationDetailPath(
  orgSlug: string,
  personId: string,
  medicationId: string,
): string {
  return `/${orgSlug}/persons/${personId}/emar/medications/${medicationId}`;
}

// ---------------------------------------------------------------------------
// Medication statuses
// ---------------------------------------------------------------------------

export const MEDICATION_STATUSES = [
  'active',
  'discontinued',
  'suspended',
  'completed',
] as const;

export type MedicationStatusValue = (typeof MEDICATION_STATUSES)[number];

export const MEDICATION_STATUS_LABELS: Record<MedicationStatusValue, string> = {
  active: 'Active',
  discontinued: 'Discontinued',
  suspended: 'Suspended',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// Administration statuses
// ---------------------------------------------------------------------------

export const ADMINISTRATION_STATUSES = [
  'given',
  'refused',
  'not_available',
  'self_administered',
  'withheld',
  'omitted',
] as const;

export type AdministrationStatusValue = (typeof ADMINISTRATION_STATUSES)[number];

export const ADMINISTRATION_STATUS_LABELS: Record<AdministrationStatusValue, string> = {
  given: 'Given',
  refused: 'Refused',
  not_available: 'Not Available',
  self_administered: 'Self-Administered',
  withheld: 'Withheld',
  omitted: 'Omitted',
};

/** Statuses that require a reason */
export const STATUSES_REQUIRING_REASON: AdministrationStatusValue[] = [
  'refused',
  'not_available',
  'withheld',
  'omitted',
];

// ---------------------------------------------------------------------------
// Routes (administration routes, not URL routes)
// ---------------------------------------------------------------------------

export const MEDICATION_ROUTES = [
  'oral',
  'topical',
  'injection',
  'inhaled',
  'rectal',
  'sublingual',
  'patch',
  'other',
] as const;

export type MedicationRouteValue = (typeof MEDICATION_ROUTES)[number];

export const MEDICATION_ROUTE_LABELS: Record<MedicationRouteValue, string> = {
  oral: 'Oral',
  topical: 'Topical',
  injection: 'Injection',
  inhaled: 'Inhaled',
  rectal: 'Rectal',
  sublingual: 'Sublingual',
  patch: 'Transdermal Patch',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Frequencies
// ---------------------------------------------------------------------------

export const MEDICATION_FREQUENCIES = [
  'regular',
  'prn',
  'once_only',
] as const;

export type MedicationFrequencyValue = (typeof MEDICATION_FREQUENCIES)[number];

export const MEDICATION_FREQUENCY_LABELS: Record<MedicationFrequencyValue, string> = {
  regular: 'Regular',
  prn: 'PRN (As Needed)',
  once_only: 'Once Only',
};

// ---------------------------------------------------------------------------
// Dose units
// ---------------------------------------------------------------------------

export const DOSE_UNITS = [
  'mg',
  'mcg',
  'g',
  'ml',
  'units',
  'puffs',
  'drops',
  'patches',
  'tablets',
  'capsules',
  'sachets',
  'suppositories',
  'other',
] as const;

export type DoseUnitValue = (typeof DOSE_UNITS)[number];

export const DOSE_UNIT_LABELS: Record<DoseUnitValue, string> = {
  mg: 'mg',
  mcg: 'mcg',
  g: 'g',
  ml: 'ml',
  units: 'units',
  puffs: 'puffs',
  drops: 'drops',
  patches: 'patches',
  tablets: 'tablets',
  capsules: 'capsules',
  sachets: 'sachets',
  suppositories: 'suppositories',
  other: 'other',
};

// ---------------------------------------------------------------------------
// Common time presets for quick selection
// ---------------------------------------------------------------------------

export const COMMON_TIME_PRESETS = [
  { label: 'Morning (08:00)', value: '08:00' },
  { label: 'Midday (12:00)', value: '12:00' },
  { label: 'Afternoon (14:00)', value: '14:00' },
  { label: 'Evening (18:00)', value: '18:00' },
  { label: 'Night (22:00)', value: '22:00' },
] as const;

export const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'mon', short: 'Mon' },
  { label: 'Tuesday', value: 'tue', short: 'Tue' },
  { label: 'Wednesday', value: 'wed', short: 'Wed' },
  { label: 'Thursday', value: 'thu', short: 'Thu' },
  { label: 'Friday', value: 'fri', short: 'Fri' },
  { label: 'Saturday', value: 'sat', short: 'Sat' },
  { label: 'Sunday', value: 'sun', short: 'Sun' },
] as const;
