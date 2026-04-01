/**
 * Training feature constants — default courses, labels, display helpers, and static config.
 */

import type { TrainingCategory, TrainingStatus, QualificationStatus } from './schema';

// ---------------------------------------------------------------------------
// Default care sector training courses
// Seeded per-org on first use. Orgs can customise/add their own.
// ---------------------------------------------------------------------------

export type DefaultCourse = {
  name: string;
  category: TrainingCategory;
  requiredForRoles: string[];
  validityMonths: number;
};

export const DEFAULT_CARE_SECTOR_COURSES: DefaultCourse[] = [
  // Mandatory training (all staff)
  {
    name: 'Moving and Handling',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'Fire Safety',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse', 'Activities Coordinator', 'Chef / Cook', 'Domestic / Housekeeper', 'Maintenance', 'Administrator', 'Office Manager'],
    validityMonths: 12,
  },
  {
    name: 'Health and Safety',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse', 'Activities Coordinator', 'Chef / Cook', 'Domestic / Housekeeper', 'Maintenance', 'Administrator', 'Office Manager'],
    validityMonths: 12,
  },
  {
    name: 'Safeguarding Adults',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'Infection Prevention and Control',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'Food Hygiene',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Chef / Cook'],
    validityMonths: 36,
  },
  {
    name: 'Basic Life Support (BLS)',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'First Aid',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 36,
  },
  {
    name: 'Equality, Diversity and Inclusion',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse', 'Activities Coordinator', 'Chef / Cook', 'Domestic / Housekeeper', 'Maintenance', 'Administrator', 'Office Manager'],
    validityMonths: 12,
  },
  {
    name: 'Data Protection and GDPR',
    category: 'mandatory',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse', 'Activities Coordinator', 'Administrator', 'Office Manager'],
    validityMonths: 12,
  },
  // Clinical training (care staff)
  {
    name: 'Medication Administration',
    category: 'clinical',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'Mental Capacity Act and DoLS',
    category: 'clinical',
    requiredForRoles: ['Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'Dementia Awareness',
    category: 'clinical',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Healthcare Assistant', 'Support Worker', 'Nurse'],
    validityMonths: 12,
  },
  {
    name: 'End of Life Care',
    category: 'clinical',
    requiredForRoles: ['Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Nurse'],
    validityMonths: 24,
  },
  // Specialist training
  {
    name: 'Positive Behaviour Support',
    category: 'specialist',
    requiredForRoles: ['Care Worker', 'Senior Care Worker', 'Team Leader', 'Deputy Manager', 'Registered Manager', 'Support Worker'],
    validityMonths: 12,
  },
  // Management training
  {
    name: 'Supervision and Appraisal',
    category: 'management',
    requiredForRoles: ['Team Leader', 'Deputy Manager', 'Registered Manager'],
    validityMonths: 24,
  },
];

// ---------------------------------------------------------------------------
// Training status styling — used by TrainingStatusBadge
// ---------------------------------------------------------------------------

export const TRAINING_STATUS_STYLES: Record<
  TrainingStatus,
  { bg: string; text: string; dot: string }
> = {
  current: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  expiring_soon: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  expired: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  not_completed: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
};

// ---------------------------------------------------------------------------
// Qualification status styling
// ---------------------------------------------------------------------------

export const QUALIFICATION_STATUS_STYLES: Record<
  QualificationStatus,
  { bg: string; text: string; dot: string }
> = {
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  working_towards: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
};

// ---------------------------------------------------------------------------
// RAG matrix cell colours
// ---------------------------------------------------------------------------

export const RAG_CELL_STYLES = {
  green: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    label: 'Current',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'Expiring Soon',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: 'Expired / Missing',
  },
  grey: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Not Required',
  },
} as const;

export type RagColour = keyof typeof RAG_CELL_STYLES;

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

/** Amber alert threshold — 30 days before expiry date */
export const TRAINING_AMBER_ALERT_DAYS = 30;

/** Red alert threshold — expired or missing */
export const TRAINING_RED_ALERT_DAYS = 0;

// ---------------------------------------------------------------------------
// Training category styling
// ---------------------------------------------------------------------------

export const TRAINING_CATEGORY_STYLES: Record<
  TrainingCategory,
  { bg: string; text: string }
> = {
  mandatory: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  clinical: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  specialist: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  management: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  other: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
};
