/**
 * Ofsted Compliance Engine — Constants
 *
 * Shared constants for evidence statuses, legal statuses,
 * statement of purpose statuses, and compliance scoring thresholds.
 */

// ---------------------------------------------------------------------------
// Evidence statuses
// ---------------------------------------------------------------------------

export const EVIDENCE_STATUSES = ['evidenced', 'partial', 'missing'] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  evidenced: 'Fully Evidenced',
  partial: 'Partially Evidenced',
  missing: 'No Evidence',
};

export const EVIDENCE_STATUS_COLOURS: Record<EvidenceStatus, string> = {
  evidenced: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  partial: 'text-amber-700 bg-amber-50 border-amber-200',
  missing: 'text-red-700 bg-red-50 border-red-200',
};

// ---------------------------------------------------------------------------
// Legal statuses (Schedule 4 — children's register)
// ---------------------------------------------------------------------------

export const LEGAL_STATUSES = [
  'full_care_order',
  'interim_care_order',
  'section20',
  'remand',
  'other',
] as const;

export type LegalStatus = (typeof LEGAL_STATUSES)[number];

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  full_care_order: 'Full Care Order',
  interim_care_order: 'Interim Care Order',
  section20: 'Section 20 (Voluntary)',
  remand: 'Remand',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Statement of Purpose statuses
// ---------------------------------------------------------------------------

export const SOP_STATUSES = ['draft', 'current', 'archived'] as const;

export type SopStatus = (typeof SOP_STATUSES)[number];

export const SOP_STATUS_LABELS: Record<SopStatus, string> = {
  draft: 'Draft',
  current: 'Current',
  archived: 'Archived',
};

// ---------------------------------------------------------------------------
// Evidence types
// ---------------------------------------------------------------------------

export const EVIDENCE_TYPES = [
  'care_plan',
  'note',
  'incident',
  'training',
  'document',
  'manual',
] as const;

export type EvidenceTypeValue = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceTypeValue, string> = {
  care_plan: 'Care Plan',
  note: 'Care Note',
  incident: 'Incident Report',
  training: 'Training Record',
  document: 'Document',
  manual: 'Manual Entry',
};

// ---------------------------------------------------------------------------
// Compliance scoring
// ---------------------------------------------------------------------------

/**
 * Compute a compliance score as a percentage.
 * Fully evidenced = 1 point, partial = 0.5 points, missing = 0 points.
 */
export function computeComplianceScore(counts: {
  evidenced: number;
  partial: number;
  missing: number;
}): number {
  const total = counts.evidenced + counts.partial + counts.missing;
  if (total === 0) return 0;
  const score = (counts.evidenced + counts.partial * 0.5) / total;
  return Math.round(score * 100);
}

/**
 * Get a RAG colour for a compliance score percentage.
 */
export function scoreToRag(
  score: number,
): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

/**
 * Get a human-readable label for a compliance score.
 */
export function scoreToLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Requires Improvement';
  return 'Inadequate';
}

// ---------------------------------------------------------------------------
// Statement of Purpose default sections
// ---------------------------------------------------------------------------

/**
 * Default sections for a new Statement of Purpose per Regulation 16 / Schedule 1.
 */
export const DEFAULT_SOP_SECTIONS = [
  {
    id: 'sop_aims',
    title: 'Aims and Objectives',
    content: '',
    order: 1,
  },
  {
    id: 'sop_ethos',
    title: 'Ethos and Philosophy of Care',
    content: '',
    order: 2,
  },
  {
    id: 'sop_facilities',
    title: 'Facilities and Services',
    content: '',
    order: 3,
  },
  {
    id: 'sop_location',
    title: 'Location and Environment',
    content: '',
    order: 4,
  },
  {
    id: 'sop_admission',
    title: 'Admission Criteria and Process',
    content: '',
    order: 5,
  },
  {
    id: 'sop_staffing',
    title: 'Staffing Structure and Qualifications',
    content: '',
    order: 6,
  },
  {
    id: 'sop_education',
    title: 'Education Arrangements',
    content: '',
    order: 7,
  },
  {
    id: 'sop_health',
    title: 'Health Care Provision',
    content: '',
    order: 8,
  },
  {
    id: 'sop_safeguarding',
    title: 'Safeguarding and Child Protection',
    content: '',
    order: 9,
  },
  {
    id: 'sop_complaints',
    title: 'Complaints and Representations',
    content: '',
    order: 10,
  },
  {
    id: 'sop_contact',
    title: 'Contact Arrangements',
    content: '',
    order: 11,
  },
  {
    id: 'sop_fire',
    title: 'Fire Safety and Emergency Procedures',
    content: '',
    order: 12,
  },
] as const;
