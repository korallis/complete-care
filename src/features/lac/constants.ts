/**
 * LAC Documentation Hub — Constants
 *
 * Shared constants for legal statuses, placement plan statuses,
 * and display labels used in both server and client code.
 */

// ---------------------------------------------------------------------------
// Legal statuses (Children Act 1989 / 2004)
// ---------------------------------------------------------------------------

export const LAC_LEGAL_STATUSES = [
  'section20',
  'section31',
  'section38',
  'epo',
  'ico',
  'co',
  'sgo',
] as const;

export type LacLegalStatus = (typeof LAC_LEGAL_STATUSES)[number];

export const LAC_LEGAL_STATUS_LABELS: Record<LacLegalStatus, string> = {
  section20: 'Section 20 (Voluntary)',
  section31: 'Section 31 (Care Order)',
  section38: 'Section 38 (Interim Care Order)',
  epo: 'Emergency Protection Order',
  ico: 'Interim Care Order',
  co: 'Full Care Order',
  sgo: 'Special Guardianship Order',
};

export const LAC_LEGAL_STATUS_SHORT_LABELS: Record<LacLegalStatus, string> = {
  section20: 'S.20',
  section31: 'S.31',
  section38: 'S.38',
  epo: 'EPO',
  ico: 'ICO',
  co: 'CO',
  sgo: 'SGO',
};

// ---------------------------------------------------------------------------
// Placement plan statuses
// ---------------------------------------------------------------------------

export const PLACEMENT_PLAN_STATUSES = [
  'pending',
  'draft',
  'completed',
  'overdue',
] as const;

export type PlacementPlanStatus = (typeof PLACEMENT_PLAN_STATUSES)[number];

export const PLACEMENT_PLAN_STATUS_LABELS: Record<PlacementPlanStatus, string> = {
  pending: 'Pending',
  draft: 'Draft',
  completed: 'Completed',
  overdue: 'Overdue',
};

export const PLACEMENT_PLAN_STATUS_COLOURS: Record<PlacementPlanStatus, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  draft: 'text-blue-700 bg-blue-50 border-blue-200',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  overdue: 'text-red-700 bg-red-50 border-red-200',
};

// ---------------------------------------------------------------------------
// Working days offset — placement plans due within 5 working days
// ---------------------------------------------------------------------------

export const PLACEMENT_PLAN_DUE_WORKING_DAYS = 5;

/**
 * Calculates the due date for a placement plan given an admission date.
 * Adds 5 working days (excludes weekends).
 */
export function calculatePlacementPlanDueDate(admissionDate: string): string {
  const d = new Date(admissionDate);
  let workingDays = 0;
  while (workingDays < PLACEMENT_PLAN_DUE_WORKING_DAYS) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) {
      workingDays++;
    }
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Returns true if a placement plan's due date is in the past.
 */
export function isPlacementPlanOverdue(dueDate: string, completedDate: string | null): boolean {
  if (completedDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}
