/**
 * Properties & Tenancies — Constants
 *
 * Enum values and labels for property types, tenancy types, document types,
 * maintenance priorities, and status values.
 */

// ---------------------------------------------------------------------------
// Property types
// ---------------------------------------------------------------------------

export const PROPERTY_TYPES = [
  'shared_house',
  'individual_flat',
  'cluster',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  shared_house: 'Shared House',
  individual_flat: 'Individual Flat',
  cluster: 'Cluster',
};

// ---------------------------------------------------------------------------
// Property statuses
// ---------------------------------------------------------------------------

export const PROPERTY_STATUSES = ['active', 'inactive'] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

// ---------------------------------------------------------------------------
// Tenancy types
// ---------------------------------------------------------------------------

export const TENANCY_TYPES = ['assured', 'licensee', 'other'] as const;

export type TenancyType = (typeof TENANCY_TYPES)[number];

export const TENANCY_TYPE_LABELS: Record<TenancyType, string> = {
  assured: 'Assured',
  licensee: 'Licensee',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Tenancy statuses
// ---------------------------------------------------------------------------

export const TENANCY_STATUSES = ['active', 'ended'] as const;

export type TenancyStatus = (typeof TENANCY_STATUSES)[number];

export const TENANCY_STATUS_LABELS: Record<TenancyStatus, string> = {
  active: 'Active',
  ended: 'Ended',
};

// ---------------------------------------------------------------------------
// Property document types
// ---------------------------------------------------------------------------

export const PROPERTY_DOCUMENT_TYPES = [
  'fire_risk',
  'gas_safety',
  'electrical',
  'landlord_contact',
  'maintenance',
  'other',
] as const;

export type PropertyDocumentType = (typeof PROPERTY_DOCUMENT_TYPES)[number];

export const PROPERTY_DOCUMENT_TYPE_LABELS: Record<PropertyDocumentType, string> = {
  fire_risk: 'Fire Risk Assessment',
  gas_safety: 'Gas Safety Certificate',
  electrical: 'Electrical Inspection Certificate',
  landlord_contact: 'Landlord Contact',
  maintenance: 'Maintenance Record',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Maintenance priorities
// ---------------------------------------------------------------------------

export const MAINTENANCE_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
] as const;

export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** Colours for maintenance priority badges */
export const MAINTENANCE_PRIORITY_COLOURS: Record<MaintenancePriority, string> = {
  low: '#6b7280',     // gray
  medium: '#f59e0b',  // amber
  high: '#f97316',    // orange
  urgent: '#ef4444',  // red
};

// ---------------------------------------------------------------------------
// Maintenance statuses
// ---------------------------------------------------------------------------

export const MAINTENANCE_STATUSES = [
  'reported',
  'in_progress',
  'completed',
] as const;

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  reported: 'Reported',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a property address object into a single-line display string. */
export function formatAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
}): string {
  const parts = [address.line1];
  if (address.line2) parts.push(address.line2);
  parts.push(address.city);
  if (address.county) parts.push(address.county);
  parts.push(address.postcode);
  return parts.join(', ');
}

/** Returns true if a document expiry date is in the past. */
export function isDocumentExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return expiryDate < today;
}

/** Returns true if a document expiry date is within the warning window (default 30 days). */
export function isDocumentExpiringSoon(
  expiryDate: string | null | undefined,
  windowDays = 30,
): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= windowDays;
}
