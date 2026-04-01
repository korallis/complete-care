/**
 * Documents & Body Map — Constants
 *
 * Enum values and labels for document categories, retention policies,
 * body map regions, entry types, and body sides.
 */

// ---------------------------------------------------------------------------
// Document categories
// ---------------------------------------------------------------------------

export const DOCUMENT_CATEGORIES = [
  'care_plan',
  'assessment',
  'correspondence',
  'consent',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  care_plan: 'Care Plan',
  assessment: 'Assessment',
  correspondence: 'Correspondence',
  consent: 'Consent',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Retention policies
// ---------------------------------------------------------------------------

export const RETENTION_POLICIES = [
  'standard',
  'extended',
  'permanent',
] as const;

export type RetentionPolicy = (typeof RETENTION_POLICIES)[number];

export const RETENTION_POLICY_LABELS: Record<RetentionPolicy, string> = {
  standard: 'Standard (3 years)',
  extended: 'Extended (7 years)',
  permanent: 'Permanent',
};

// ---------------------------------------------------------------------------
// Allowed file types
// ---------------------------------------------------------------------------

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
] as const;

/** Maximum file size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Body map — sides
// ---------------------------------------------------------------------------

export const BODY_SIDES = ['front', 'back'] as const;

export type BodySide = (typeof BODY_SIDES)[number];

export const BODY_SIDE_LABELS: Record<BodySide, string> = {
  front: 'Front',
  back: 'Back',
};

// ---------------------------------------------------------------------------
// Body map — regions
// ---------------------------------------------------------------------------

export const BODY_REGIONS = [
  'head',
  'neck',
  'chest',
  'abdomen',
  'upper_back',
  'lower_back',
  'left_shoulder',
  'right_shoulder',
  'left_arm',
  'right_arm',
  'left_hand',
  'right_hand',
  'left_hip',
  'right_hip',
  'left_leg',
  'right_leg',
  'left_foot',
  'right_foot',
  'other',
] as const;

export type BodyRegion = (typeof BODY_REGIONS)[number];

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  left_shoulder: 'Left Shoulder',
  right_shoulder: 'Right Shoulder',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  left_hip: 'Left Hip',
  right_hip: 'Right Hip',
  left_leg: 'Left Leg',
  right_leg: 'Right Leg',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Body map — entry types
// ---------------------------------------------------------------------------

export const ENTRY_TYPES = [
  'injury',
  'wound',
  'bruise',
  'mark',
  'other',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  injury: 'Injury',
  wound: 'Wound',
  bruise: 'Bruise',
  mark: 'Mark',
  other: 'Other',
};

/** Colours for body map markers by entry type */
export const ENTRY_TYPE_COLOURS: Record<EntryType, string> = {
  injury: '#ef4444',   // red
  wound: '#f97316',    // orange
  bruise: '#8b5cf6',   // purple
  mark: '#3b82f6',     // blue
  other: '#6b7280',    // gray
};

// ---------------------------------------------------------------------------
// Body region detection from coordinates
// ---------------------------------------------------------------------------

/**
 * Determines the approximate body region based on click coordinates
 * (as percentages) on the body outline SVG.
 *
 * The coordinate system assumes a standard human outline where:
 * - x: 0% = far left, 100% = far right
 * - y: 0% = top (head), 100% = bottom (feet)
 */
export function detectBodyRegion(
  xPercent: number,
  yPercent: number,
  side: BodySide,
): BodyRegion {
  // Head area
  if (yPercent < 15) return 'head';
  // Neck area
  if (yPercent >= 15 && yPercent < 20) return 'neck';

  // Shoulder/arm area (left)
  if (xPercent < 30 && yPercent >= 20 && yPercent < 35) return 'left_shoulder';
  if (xPercent < 25 && yPercent >= 35 && yPercent < 50) return 'left_arm';
  if (xPercent < 25 && yPercent >= 50 && yPercent < 55) return 'left_hand';

  // Shoulder/arm area (right)
  if (xPercent > 70 && yPercent >= 20 && yPercent < 35) return 'right_shoulder';
  if (xPercent > 75 && yPercent >= 35 && yPercent < 50) return 'right_arm';
  if (xPercent > 75 && yPercent >= 50 && yPercent < 55) return 'right_hand';

  // Torso
  if (yPercent >= 20 && yPercent < 35) {
    return side === 'front' ? 'chest' : 'upper_back';
  }
  if (yPercent >= 35 && yPercent < 50) {
    return side === 'front' ? 'abdomen' : 'lower_back';
  }

  // Hip area
  if (yPercent >= 50 && yPercent < 58) {
    if (xPercent < 50) return 'left_hip';
    return 'right_hip';
  }

  // Legs
  if (yPercent >= 58 && yPercent < 85) {
    if (xPercent < 50) return 'left_leg';
    return 'right_leg';
  }

  // Feet
  if (yPercent >= 85) {
    if (xPercent < 50) return 'left_foot';
    return 'right_foot';
  }

  return 'other';
}
