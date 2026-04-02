/**
 * Zod validation schemas for the Missing from Care feature.
 * Used by server actions and client-side forms.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const riskLevelEnum = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof riskLevelEnum>;

export const episodeStatusEnum = z.enum(['open', 'returned', 'closed']);
export type EpisodeStatus = z.infer<typeof episodeStatusEnum>;

export const rhiStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'overdue',
  'escalated',
]);
export type RhiStatus = z.infer<typeof rhiStatusEnum>;

export const buildEnum = z.enum(['slim', 'average', 'stocky', 'heavy']);

export const returnMethodEnum = z.enum([
  'self',
  'found_by_police',
  'found_by_staff',
  'other',
]);

export const exploitationConcernEnum = z.enum([
  'none',
  'cse',
  'cce',
  'county_lines',
  'trafficking',
  'other',
]);

export const timelineActionTypeEnum = z.enum([
  'absence_noticed',
  'search_conducted',
  'police_notified',
  'authority_notified',
  'ri_notified',
  'sighting_reported',
  'child_returned',
  'wellbeing_check',
  'escalation_triggered',
  'note_added',
  'rhi_created',
]);

// ---------------------------------------------------------------------------
// Philomena Profile
// ---------------------------------------------------------------------------

export const knownAssociateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  notes: z.string().optional(),
});

export const likelyLocationSchema = z.object({
  location: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const socialMediaSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  handle: z.string().min(1, 'Handle is required'),
});

export const createPhilomenaProfileSchema = z.object({
  personId: z.string().uuid(),
  photoUrl: z.string().url().nullable().optional(),
  heightCm: z.number().int().positive().nullable().optional(),
  build: buildEnum.nullable().optional(),
  hairDescription: z.string().nullable().optional(),
  eyeColour: z.string().nullable().optional(),
  distinguishingFeatures: z.string().nullable().optional(),
  ethnicity: z.string().nullable().optional(),
  knownAssociates: z.array(knownAssociateSchema).optional(),
  likelyLocations: z.array(likelyLocationSchema).optional(),
  phoneNumbers: z.array(z.string()).optional(),
  socialMedia: z.array(socialMediaSchema).optional(),
  riskCse: z.boolean().default(false),
  riskCce: z.boolean().default(false),
  riskCountyLines: z.boolean().default(false),
  riskTrafficking: z.boolean().default(false),
  riskNotes: z.string().nullable().optional(),
  medicalNeeds: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  medications: z.string().nullable().optional(),
  gpDetails: z.string().nullable().optional(),
});

export const updatePhilomenaProfileSchema =
  createPhilomenaProfileSchema.partial().extend({
    id: z.string().uuid(),
  });

// ---------------------------------------------------------------------------
// Missing Episode
// ---------------------------------------------------------------------------

export const createMissingEpisodeSchema = z.object({
  personId: z.string().uuid(),
  absenceNoticedAt: z.coerce.date(),
  lastSeenAt: z.coerce.date().nullable().optional(),
  lastSeenLocation: z.string().nullable().optional(),
  lastSeenClothing: z.string().nullable().optional(),
  initialActionsTaken: z.string().min(1, 'Initial actions are required'),
  riskLevel: riskLevelEnum,
  riskAssessmentNotes: z.string().nullable().optional(),
  escalationThresholdMinutes: z.number().int().positive().default(30),
});

export const recordPoliceNotificationSchema = z.object({
  episodeId: z.string().uuid(),
  policeReference: z.string().min(1, 'Police reference number is required'),
  notifiedAt: z.coerce.date(),
});

export const recordAuthorityNotificationSchema = z.object({
  episodeId: z.string().uuid(),
  placingAuthorityContact: z.string().min(1, 'Contact name is required'),
  notifiedAt: z.coerce.date(),
});

export const recordReturnSchema = z.object({
  episodeId: z.string().uuid(),
  returnedAt: z.coerce.date(),
  returnMethod: returnMethodEnum,
  wellbeingCheckNotes: z.string().nullable().optional(),
});

export const addTimelineEntrySchema = z.object({
  episodeId: z.string().uuid(),
  actionType: timelineActionTypeEnum,
  description: z.string().min(1, 'Description is required'),
  occurredAt: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Return Home Interview (RHI)
// ---------------------------------------------------------------------------

export const completeRhiSchema = z.object({
  id: z.string().uuid(),
  whereChildWas: z.string().min(1, 'Location is required'),
  whoChildWasWith: z.string().nullable().optional(),
  whatHappened: z.string().nullable().optional(),
  childAccount: z.string().nullable().optional(),
  risksIdentified: z.string().nullable().optional(),
  exploitationConcerns: z.array(exploitationConcernEnum).optional(),
  exploitationDetails: z.string().nullable().optional(),
  safeguardingReferralNeeded: z.boolean().default(false),
  actionsRecommended: z.string().nullable().optional(),
  childDeclined: z.boolean().default(false),
  declineReason: z.string().nullable().optional(),
});

export const escalateRhiSchema = z.object({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Photo staleness check (3-month threshold)
// ---------------------------------------------------------------------------

export const PHOTO_STALENESS_DAYS = 90;

/**
 * Returns true if the photo is stale (older than 3 months).
 */
export function isPhotoStale(photoUpdatedAt: Date | null): boolean {
  if (!photoUpdatedAt) return true;
  const now = new Date();
  const diffMs = now.getTime() - photoUpdatedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > PHOTO_STALENESS_DAYS;
}

// ---------------------------------------------------------------------------
// Escalation threshold defaults by risk level
// ---------------------------------------------------------------------------

export const DEFAULT_ESCALATION_THRESHOLDS: Record<RiskLevel, number> = {
  high: 30,
  medium: 60,
  low: 120,
};

/**
 * Returns true if the escalation threshold has been exceeded.
 */
export function isEscalationDue(
  absenceNoticedAt: Date,
  thresholdMinutes: number,
): boolean {
  const now = new Date();
  const diffMs = now.getTime() - absenceNoticedAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes >= thresholdMinutes;
}

/**
 * Returns the 72-hour deadline from a return timestamp.
 */
export function calculateRhiDeadline(returnedAt: Date): Date {
  return new Date(returnedAt.getTime() + 72 * 60 * 60 * 1000);
}

/**
 * Returns true if the RHI deadline has been breached.
 */
export function isRhiOverdue(deadlineAt: Date): boolean {
  return new Date() > deadlineAt;
}
