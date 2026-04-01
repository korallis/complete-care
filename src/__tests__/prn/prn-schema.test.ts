/**
 * Tests for PRN Management Zod validation schemas.
 *
 * Validates:
 * - createPrnProtocolSchema accepts valid input
 * - createPrnProtocolSchema rejects invalid input
 * - recordPrnAdministrationSchema validation
 * - recordFollowUpSchema validation
 * - preDoseAssessmentSchema validation (pain score 0-10)
 * - postDoseAssessmentSchema validation (effectiveness outcomes)
 */

import { describe, it, expect } from 'vitest';
import {
  createPrnProtocolSchema,
  updatePrnProtocolSchema,
  recordPrnAdministrationSchema,
  recordFollowUpSchema,
  preDoseAssessmentSchema,
  postDoseAssessmentSchema,
} from '@/features/prn/schema';

// ---------------------------------------------------------------------------
// createPrnProtocolSchema
// ---------------------------------------------------------------------------

describe('createPrnProtocolSchema', () => {
  const validInput = {
    medicationId: '550e8400-e29b-41d4-a716-446655440000',
    indication: 'Pain relief',
    signsSymptoms: [
      { description: 'Facial grimacing' },
      { description: 'Guarding' },
    ],
    doseRange: '500mg - 1000mg',
    maxDose24hr: '4000mg',
    minInterval: 240,
    nonPharmAlternatives: 'Repositioning, cold compress',
    expectedEffect: 'Pain reduced to below 4/10 within 30 minutes',
    escalationCriteria: 'If pain persists above 7/10 after 2 doses, contact GP',
    followUpMinutes: 60,
  };

  it('accepts valid complete input', () => {
    const result = createPrnProtocolSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts input with optional fields omitted', () => {
    const required = {
      medicationId: validInput.medicationId,
      indication: validInput.indication,
      doseRange: validInput.doseRange,
      maxDose24hr: validInput.maxDose24hr,
      minInterval: validInput.minInterval,
      expectedEffect: validInput.expectedEffect,
    };
    const result = createPrnProtocolSchema.safeParse(required);
    expect(result.success).toBe(true);
  });

  it('defaults followUpMinutes to 60', () => {
    const input = {
      medicationId: validInput.medicationId,
      indication: validInput.indication,
      doseRange: validInput.doseRange,
      maxDose24hr: validInput.maxDose24hr,
      minInterval: validInput.minInterval,
      expectedEffect: validInput.expectedEffect,
    };
    const result = createPrnProtocolSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followUpMinutes).toBe(60);
    }
  });

  it('rejects missing indication', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      indication: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('indication');
    }
  });

  it('rejects invalid medication ID', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      medicationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing dose range', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      doseRange: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing max dose', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      maxDose24hr: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero min interval', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      minInterval: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative min interval', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      minInterval: -60,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing expected effect', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      expectedEffect: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sign/symptom', () => {
    const result = createPrnProtocolSchema.safeParse({
      ...validInput,
      signsSymptoms: [{ description: '' }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updatePrnProtocolSchema
// ---------------------------------------------------------------------------

describe('updatePrnProtocolSchema', () => {
  it('accepts partial updates', () => {
    const result = updatePrnProtocolSchema.safeParse({
      indication: 'Anxiety management',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = updatePrnProtocolSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid min interval', () => {
    const result = updatePrnProtocolSchema.safeParse({
      minInterval: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// preDoseAssessmentSchema
// ---------------------------------------------------------------------------

describe('preDoseAssessmentSchema', () => {
  it('accepts valid pain score', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 7,
      symptoms: ['Facial grimacing'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts pain score 0', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 0,
      symptoms: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts pain score 10', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 10,
      symptoms: ['Crying', 'Guarding'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects pain score below 0', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: -1,
      symptoms: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects pain score above 10', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 11,
      symptoms: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects decimal pain score', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 5.5,
      symptoms: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts with notes', () => {
    const result = preDoseAssessmentSchema.safeParse({
      painScore: 6,
      symptoms: [],
      notes: 'Patient reports discomfort when moving',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// postDoseAssessmentSchema
// ---------------------------------------------------------------------------

describe('postDoseAssessmentSchema', () => {
  it('accepts "yes" effectiveness', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 2,
      effectAchieved: 'yes',
    });
    expect(result.success).toBe(true);
  });

  it('accepts "partial" effectiveness', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 5,
      effectAchieved: 'partial',
      notes: 'Some relief but still uncomfortable',
    });
    expect(result.success).toBe(true);
  });

  it('accepts "no" effectiveness', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 8,
      effectAchieved: 'no',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid effectiveness value', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 3,
      effectAchieved: 'maybe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing effectAchieved', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 3,
    });
    expect(result.success).toBe(false);
  });

  it('rejects pain score above 10', () => {
    const result = postDoseAssessmentSchema.safeParse({
      painScore: 15,
      effectAchieved: 'yes',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordPrnAdministrationSchema
// ---------------------------------------------------------------------------

describe('recordPrnAdministrationSchema', () => {
  const validAdmin = {
    prnProtocolId: '550e8400-e29b-41d4-a716-446655440000',
    medicationId: '550e8400-e29b-41d4-a716-446655440001',
    personId: '550e8400-e29b-41d4-a716-446655440002',
    preDoseAssessment: {
      painScore: 7,
      symptoms: ['Facial grimacing'],
    },
  };

  it('accepts valid administration input', () => {
    const result = recordPrnAdministrationSchema.safeParse(validAdmin);
    expect(result.success).toBe(true);
  });

  it('accepts with optional administeredAt', () => {
    const result = recordPrnAdministrationSchema.safeParse({
      ...validAdmin,
      administeredAt: '2026-04-01T10:30:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid protocol ID', () => {
    const result = recordPrnAdministrationSchema.safeParse({
      ...validAdmin,
      prnProtocolId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid medication ID', () => {
    const result = recordPrnAdministrationSchema.safeParse({
      ...validAdmin,
      medicationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid person ID', () => {
    const result = recordPrnAdministrationSchema.safeParse({
      ...validAdmin,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pain score in pre-dose assessment', () => {
    const result = recordPrnAdministrationSchema.safeParse({
      ...validAdmin,
      preDoseAssessment: { painScore: 11, symptoms: [] },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordFollowUpSchema
// ---------------------------------------------------------------------------

describe('recordFollowUpSchema', () => {
  const validFollowUp = {
    prnAdministrationId: '550e8400-e29b-41d4-a716-446655440000',
    postDoseAssessment: {
      painScore: 2,
      effectAchieved: 'yes' as const,
      notes: 'Pain resolved',
    },
    followUpActions: null,
  };

  it('accepts valid follow-up input', () => {
    const result = recordFollowUpSchema.safeParse(validFollowUp);
    expect(result.success).toBe(true);
  });

  it('accepts with follow-up actions', () => {
    const result = recordFollowUpSchema.safeParse({
      ...validFollowUp,
      postDoseAssessment: {
        painScore: 6,
        effectAchieved: 'partial',
      },
      followUpActions: 'Applied cold compress, reassess in 30 minutes',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid administration ID', () => {
    const result = recordFollowUpSchema.safeParse({
      ...validFollowUp,
      prnAdministrationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing effectiveness outcome', () => {
    const result = recordFollowUpSchema.safeParse({
      prnAdministrationId: validFollowUp.prnAdministrationId,
      postDoseAssessment: {
        painScore: 3,
      },
    });
    expect(result.success).toBe(false);
  });
});
