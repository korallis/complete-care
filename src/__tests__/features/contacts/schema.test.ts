/**
 * Zod schema validation tests for the contacts feature.
 *
 * VAL-CHILD-014: Court order restrictions require reference and conditions.
 * VAL-CHILD-015: Contact records capture emotional presentation.
 */
import { describe, it, expect } from 'vitest';
import {
  createApprovedContactSchema,
  createContactScheduleSchema,
  createContactRecordSchema,
  updateContactScheduleStatusSchema,
  contactTypeEnum,
  supervisionLevelEnum,
  relationshipEnum,
  scheduleStatusEnum,
} from '../../../features/contacts/schema';

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

describe('enum schemas', () => {
  it('contactTypeEnum accepts valid values', () => {
    expect(contactTypeEnum.safeParse('face_to_face').success).toBe(true);
    expect(contactTypeEnum.safeParse('phone').success).toBe(true);
    expect(contactTypeEnum.safeParse('video').success).toBe(true);
    expect(contactTypeEnum.safeParse('letter').success).toBe(true);
  });

  it('contactTypeEnum rejects invalid values', () => {
    expect(contactTypeEnum.safeParse('telegram').success).toBe(false);
  });

  it('supervisionLevelEnum accepts valid values', () => {
    expect(supervisionLevelEnum.safeParse('unsupervised').success).toBe(true);
    expect(supervisionLevelEnum.safeParse('supervised_by_staff').success).toBe(true);
    expect(supervisionLevelEnum.safeParse('supervised_by_sw').success).toBe(true);
  });

  it('relationshipEnum accepts valid values', () => {
    expect(relationshipEnum.safeParse('mother').success).toBe(true);
    expect(relationshipEnum.safeParse('father').success).toBe(true);
    expect(relationshipEnum.safeParse('social_worker').success).toBe(true);
  });

  it('scheduleStatusEnum accepts valid values', () => {
    expect(scheduleStatusEnum.safeParse('scheduled').success).toBe(true);
    expect(scheduleStatusEnum.safeParse('completed').success).toBe(true);
    expect(scheduleStatusEnum.safeParse('cancelled').success).toBe(true);
    expect(scheduleStatusEnum.safeParse('no_show').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createApprovedContactSchema
// ---------------------------------------------------------------------------

describe('createApprovedContactSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Jane Doe',
    relationship: 'mother',
    allowedContactTypes: ['phone', 'face_to_face'],
    supervisionLevel: 'supervised_by_staff',
    hasRestrictions: false,
  };

  it('accepts valid input without restrictions', () => {
    const result = createApprovedContactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty allowedContactTypes', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      allowedContactTypes: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid personId (not a UUID)', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('VAL-CHILD-014: requires court order details when restricted', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      hasRestrictions: true,
    });
    expect(result.success).toBe(false);
  });

  it('VAL-CHILD-014: accepts restricted contact with court order details', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      hasRestrictions: true,
      courtOrderReference: 'CO-2024-001',
      courtOrderConditions: 'No unsupervised contact. Social worker must be present.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields as empty strings', () => {
    const result = createApprovedContactSchema.safeParse({
      ...validInput,
      phone: '',
      email: '',
      address: '',
      frequency: '',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createContactScheduleSchema
// ---------------------------------------------------------------------------

describe('createContactScheduleSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    approvedContactId: '660e8400-e29b-41d4-a716-446655440000',
    contactType: 'phone',
    scheduledAt: '2026-04-10T14:00',
    supervisionLevel: 'supervised_by_staff',
  };

  it('accepts valid schedule input', () => {
    const result = createContactScheduleSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing scheduledAt', () => {
    const result = createContactScheduleSchema.safeParse({
      ...validInput,
      scheduledAt: '',
    });
    expect(result.success).toBe(false);
  });

  it('VAL-CHILD-014: requires justification for manager override', () => {
    const result = createContactScheduleSchema.safeParse({
      ...validInput,
      managerOverride: true,
    });
    expect(result.success).toBe(false);
  });

  it('VAL-CHILD-014: accepts override with justification', () => {
    const result = createContactScheduleSchema.safeParse({
      ...validInput,
      managerOverride: true,
      overrideJustification: 'Supervised visit agreed with social worker on 2026-04-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional duration', () => {
    const result = createContactScheduleSchema.safeParse({
      ...validInput,
      durationMinutes: 60,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateContactScheduleStatusSchema
// ---------------------------------------------------------------------------

describe('updateContactScheduleStatusSchema', () => {
  it('accepts valid status update', () => {
    const result = updateContactScheduleStatusSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateContactScheduleStatusSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createContactRecordSchema
// ---------------------------------------------------------------------------

describe('createContactRecordSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    approvedContactId: '660e8400-e29b-41d4-a716-446655440000',
    contactType: 'face_to_face',
    contactDate: '2026-04-02T14:00',
    supervisionLevel: 'supervised_by_staff',
  };

  it('accepts valid minimal record', () => {
    const result = createContactRecordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('VAL-CHILD-015: accepts emotional presentation fields', () => {
    const result = createContactRecordSchema.safeParse({
      ...validInput,
      emotionalBefore: 'Anxious',
      emotionalDuring: 'Happy',
      emotionalAfter: 'Calm',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emotionalBefore).toBe('Anxious');
      expect(result.data.emotionalDuring).toBe('Happy');
      expect(result.data.emotionalAfter).toBe('Calm');
    }
  });

  it('accepts concerns and disclosures', () => {
    const result = createContactRecordSchema.safeParse({
      ...validInput,
      concerns: 'Child appeared distressed during goodbyes',
      disclosures: 'Child said "mummy hit me"',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing contactDate', () => {
    const result = createContactRecordSchema.safeParse({
      ...validInput,
      contactDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional scheduleId as empty string', () => {
    const result = createContactRecordSchema.safeParse({
      ...validInput,
      contactScheduleId: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full record with all fields', () => {
    const result = createContactRecordSchema.safeParse({
      ...validInput,
      contactScheduleId: '770e8400-e29b-41d4-a716-446655440000',
      durationMinutes: 45,
      whoPresent: 'Child, Mother, Staff Member A',
      location: 'Visiting room',
      emotionalBefore: 'Excited',
      emotionalDuring: 'Happy',
      emotionalAfter: 'Tearful',
      notes: 'Good interaction overall. Child reluctant to leave.',
      concerns: 'Child upset at end of visit',
      disclosures: '',
    });
    expect(result.success).toBe(true);
  });
});
