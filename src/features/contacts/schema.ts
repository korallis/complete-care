/**
 * Zod validation schemas for the contacts feature.
 * Used by server actions and client-side form validation.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const contactTypeEnum = z.enum([
  'face_to_face',
  'phone',
  'video',
  'letter',
]);
export type ContactType = z.infer<typeof contactTypeEnum>;

export const supervisionLevelEnum = z.enum([
  'unsupervised',
  'supervised_by_staff',
  'supervised_by_sw',
]);
export type SupervisionLevel = z.infer<typeof supervisionLevelEnum>;

export const relationshipEnum = z.enum([
  'mother',
  'father',
  'sibling',
  'grandparent',
  'aunt_uncle',
  'social_worker',
  'other',
]);
export type Relationship = z.infer<typeof relationshipEnum>;

export const scheduleStatusEnum = z.enum([
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
]);
export type ScheduleStatus = z.infer<typeof scheduleStatusEnum>;

// ---------------------------------------------------------------------------
// Approved Contact
// ---------------------------------------------------------------------------

export const createApprovedContactSchema = z
  .object({
    personId: z.string().uuid(),
    name: z.string().min(1, 'Name is required').max(200),
    relationship: relationshipEnum,
    phone: z.string().max(30).optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    allowedContactTypes: z.array(contactTypeEnum).min(1, 'At least one contact type is required'),
    frequency: z.string().max(100).optional().or(z.literal('')),
    supervisionLevel: supervisionLevelEnum,
    hasRestrictions: z.boolean().default(false),
    courtOrderReference: z.string().max(100).optional().or(z.literal('')),
    courtOrderDate: z.string().optional().or(z.literal('')),
    courtOrderConditions: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.hasRestrictions) {
        return !!data.courtOrderReference && !!data.courtOrderConditions;
      }
      return true;
    },
    {
      message:
        'Court order reference and conditions are required when restrictions are active',
      path: ['courtOrderReference'],
    },
  );

export type CreateApprovedContactInput = z.infer<typeof createApprovedContactSchema>;

export const updateApprovedContactSchema = createApprovedContactSchema
  .innerType()
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export type UpdateApprovedContactInput = z.infer<typeof updateApprovedContactSchema>;

// ---------------------------------------------------------------------------
// Contact Schedule
// ---------------------------------------------------------------------------

export const createContactScheduleSchema = z
  .object({
    personId: z.string().uuid(),
    approvedContactId: z.string().uuid(),
    contactType: contactTypeEnum,
    scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
    durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
    supervisionLevel: supervisionLevelEnum,
    location: z.string().max(500).optional().or(z.literal('')),
    /** Manager override fields — required when scheduling a restricted contact */
    managerOverride: z.boolean().default(false),
    overrideJustification: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.managerOverride) {
        return !!data.overrideJustification;
      }
      return true;
    },
    {
      message: 'Justification is required when overriding a restriction',
      path: ['overrideJustification'],
    },
  );

export type CreateContactScheduleInput = z.infer<typeof createContactScheduleSchema>;

export const updateContactScheduleStatusSchema = z.object({
  id: z.string().uuid(),
  status: scheduleStatusEnum,
});

export type UpdateContactScheduleStatusInput = z.infer<typeof updateContactScheduleStatusSchema>;

// ---------------------------------------------------------------------------
// Contact Record
// ---------------------------------------------------------------------------

export const createContactRecordSchema = z.object({
  personId: z.string().uuid(),
  approvedContactId: z.string().uuid(),
  contactScheduleId: z.string().uuid().optional().or(z.literal('')),
  contactType: contactTypeEnum,
  contactDate: z.string().min(1, 'Contact date is required'),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
  supervisionLevel: supervisionLevelEnum,
  whoPresent: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(500).optional().or(z.literal('')),
  emotionalBefore: z.string().max(1000).optional().or(z.literal('')),
  emotionalDuring: z.string().max(1000).optional().or(z.literal('')),
  emotionalAfter: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  concerns: z.string().max(5000).optional().or(z.literal('')),
  disclosures: z.string().max(5000).optional().or(z.literal('')),
});

export type CreateContactRecordInput = z.infer<typeof createContactRecordSchema>;
