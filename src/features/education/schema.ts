/**
 * Zod validation schemas for education tracking feature.
 * Used in server actions and client-side form validation.
 */
import { z } from 'zod';

// ── Shared enums ──────────────────────────────────────────────────────

export const pepTermValues = ['autumn', 'spring', 'summer'] as const;
export const pepStatusValues = ['draft', 'scheduled', 'completed', 'reviewed'] as const;
export const senStatusValues = ['none', 'sen_support', 'ehcp', 'assessment_pending'] as const;
export const attendanceMarkValues = [
  'present',
  'late',
  'authorised_absent',
  'unauthorised_absent',
  'excluded',
  'not_required',
] as const;
export const exclusionTypeValues = ['fixed_term', 'permanent'] as const;
export const sdqRespondentValues = ['self', 'parent_carer', 'teacher'] as const;

// ── School record ─────────────────────────────────────────────────────

export const schoolRecordSchema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  schoolAddress: z.string().optional(),
  schoolPhone: z.string().optional(),
  yearGroup: z.string().optional(),
  senStatus: z.enum(senStatusValues).default('none'),
  ehcpInPlace: z.boolean().default(false),
  designatedTeacherName: z.string().optional(),
  designatedTeacherEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(true),
  notes: z.string().optional(),
});

export type SchoolRecordFormData = z.infer<typeof schoolRecordSchema>;

// ── PEP ───────────────────────────────────────────────────────────────

export const pepSchema = z.object({
  schoolRecordId: z.string().uuid('Please select a school'),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  term: z.enum(pepTermValues),
  status: z.enum(pepStatusValues).default('draft'),
  currentAttainment: z.string().optional(),
  targets: z.string().optional(),
  barriersToLearning: z.string().optional(),
  emotionalWellbeing: z.string().optional(),
  attendanceSummary: z.string().optional(),
  extraCurricular: z.string().optional(),
  ppPlusAllocation: z.coerce.number().int().min(0).optional(),
  ppPlusPlannedUse: z.string().optional(),
  ppPlusActualSpend: z.coerce.number().int().min(0).optional(),
  meetingDate: z.string().optional(),
  meetingNotes: z.string().optional(),
});

export type PepFormData = z.infer<typeof pepSchema>;

// ── PEP attendee ──────────────────────────────────────────────────────

export const pepAttendeeSchema = z.object({
  pepId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  attended: z.boolean().default(false),
});

export type PepAttendeeFormData = z.infer<typeof pepAttendeeSchema>;

// ── Attendance ────────────────────────────────────────────────────────

export const educationAttendanceSchema = z.object({
  schoolRecordId: z.string().uuid(),
  date: z.string().min(1, 'Date is required'),
  amMark: z.enum(attendanceMarkValues),
  pmMark: z.enum(attendanceMarkValues),
  notes: z.string().optional(),
});

export type EducationAttendanceFormData = z.infer<typeof educationAttendanceSchema>;

// ── Exclusion ─────────────────────────────────────────────────────────

export const exclusionRecordSchema = z.object({
  schoolRecordId: z.string().uuid(),
  exclusionType: z.enum(exclusionTypeValues),
  reason: z.string().min(1, 'Reason is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  durationDays: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  appealLodged: z.boolean().default(false),
  appealOutcome: z.string().optional(),
});

export type ExclusionRecordFormData = z.infer<typeof exclusionRecordSchema>;

// ── Pupil Premium Plus ────────────────────────────────────────────────

export const pupilPremiumPlusSchema = z.object({
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  allocationAmount: z.coerce.number().int().min(0, 'Amount must be positive'),
  plannedUse: z.string().min(1, 'Planned use is required'),
  category: z.string().optional(),
  actualSpend: z.coerce.number().int().min(0).default(0),
  evidenceOfImpact: z.string().optional(),
});

export type PupilPremiumPlusFormData = z.infer<typeof pupilPremiumPlusSchema>;

// ── SDQ ───────────────────────────────────────────────────────────────

const sdqSubscaleScore = z.coerce.number().int().min(0).max(10);

export const sdqAssessmentSchema = z
  .object({
    assessmentDate: z.string().min(1, 'Date is required'),
    respondent: z.enum(sdqRespondentValues),
    emotionalScore: sdqSubscaleScore,
    conductScore: sdqSubscaleScore,
    hyperactivityScore: sdqSubscaleScore,
    peerScore: sdqSubscaleScore,
    prosocialScore: sdqSubscaleScore,
    impactScore: z.coerce.number().int().min(0).max(10).optional(),
    notes: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    totalDifficulties:
      data.emotionalScore +
      data.conductScore +
      data.hyperactivityScore +
      data.peerScore,
  }));

export type SdqAssessmentFormData = z.input<typeof sdqAssessmentSchema>;
export type SdqAssessmentParsed = z.output<typeof sdqAssessmentSchema>;
