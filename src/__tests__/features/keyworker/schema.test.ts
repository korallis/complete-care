/**
 * Tests for keyworker Zod validation schemas.
 *
 * Validates that schemas accept valid inputs and reject invalid ones
 * for sessions, restraints, sanctions, visitor log, and children's voice.
 */

import { describe, it, expect } from 'vitest';
import {
  createSessionSchema,
  updateSessionSchema,
  createRestraintSchema,
  createSanctionSchema,
  createVisitorSchema,
  createVoiceSchema,
} from '../../../features/keyworker/schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_DATE = '2024-06-15';
const VALID_DATETIME = '2024-06-15T14:30';
const VALID_TIME = '14:30';

// ---------------------------------------------------------------------------
// createSessionSchema
// ---------------------------------------------------------------------------

describe('createSessionSchema', () => {
  const validSession = {
    personId: VALID_UUID,
    keyworkerId: VALID_UUID,
    sessionDate: VALID_DATE,
  };

  it('accepts a minimal valid session', () => {
    const result = createSessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it('accepts a session with all fields populated', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      checkIn: 'Child appeared calm and relaxed',
      weekReview: 'Had a good week at school',
      goals: {
        shortTerm: ['Attend school every day'],
        longTerm: ['Gain a qualification'],
        progress: 'Making steady progress',
      },
      education: 'Attended all lessons',
      health: 'No health concerns',
      family: 'Contact with mother this week',
      wishesAndFeelings: 'Wants to see their dog',
      actions: [
        {
          action: 'Contact school about SEND support',
          assignedTo: 'Jane Manager',
          deadline: '2024-07-01',
          completed: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid person UUID', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a session date in wrong format', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      sessionDate: '15/06/2024',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an action with empty action text', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      actions: [{ action: '', assignedTo: 'Jane Manager', deadline: VALID_DATE, completed: false }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an action with invalid deadline format', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      actions: [{ action: 'Do something', assignedTo: 'Jane Manager', deadline: 'tomorrow', completed: false }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an action without an assignee', () => {
    const result = createSessionSchema.safeParse({
      ...validSession,
      actions: [{ action: 'Do something', assignedTo: '', deadline: VALID_DATE, completed: false }],
    });
    expect(result.success).toBe(false);
  });

  it('defaults actions to empty array', () => {
    const result = createSessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions).toEqual([]);
    }
  });
});

describe('updateSessionSchema', () => {
  it('accepts an empty update (all optional)', () => {
    const result = updateSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update with just wishesAndFeelings', () => {
    const result = updateSessionSchema.safeParse({
      wishesAndFeelings: 'Updated wishes',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createRestraintSchema
// ---------------------------------------------------------------------------

describe('createRestraintSchema', () => {
  const validRestraint = {
    personId: VALID_UUID,
    dateTime: VALID_DATETIME,
    duration: 10,
    technique: 'team_teach',
    reason: 'Child was at risk of harming themselves',
    injuryCheck: {
      childInjured: false,
      staffInjured: false,
      medicalAttentionRequired: false,
    },
  };

  it('accepts a valid restraint record', () => {
    const result = createRestraintSchema.safeParse(validRestraint);
    expect(result.success).toBe(true);
  });

  it('accepts a restraint with injury details', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      injuryCheck: {
        childInjured: true,
        childInjuryDetails: 'Slight bruising to left arm',
        staffInjured: false,
        medicalAttentionRequired: true,
        medicalAttentionDetails: 'First aid applied, no further treatment needed',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects duration of 0', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      duration: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration exceeding 480 minutes (8 hours)', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      duration: 481,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid restraint technique', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      technique: 'some_made_up_technique',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty reason', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime format', () => {
    const result = createRestraintSchema.safeParse({
      ...validRestraint,
      dateTime: '15/06/2024 14:30',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSanctionSchema
// ---------------------------------------------------------------------------

describe('createSanctionSchema', () => {
  const validSanction = {
    personId: VALID_UUID,
    dateTime: VALID_DATETIME,
    description: 'Child was asked to complete an additional household chore',
    sanctionType: 'additional_chore',
  };

  it('accepts a valid sanction', () => {
    const result = createSanctionSchema.safeParse(validSanction);
    expect(result.success).toBe(true);
  });

  it('rejects a prohibited sanction with isProhibited flag', () => {
    const result = createSanctionSchema.safeParse({
      ...validSanction,
      isProhibited: true,
      justification: 'This was incorrect and has been flagged',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sanction type', () => {
    const result = createSanctionSchema.safeParse({
      ...validSanction,
      sanctionType: 'physical_punishment',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty description', () => {
    const result = createSanctionSchema.safeParse({
      ...validSanction,
      description: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createVisitorSchema
// ---------------------------------------------------------------------------

describe('createVisitorSchema', () => {
  const validVisitor = {
    visitorName: 'Sarah Jones',
    relationship: 'parent',
    visitDate: VALID_DATE,
    arrivalTime: VALID_TIME,
  };

  it('accepts a valid visitor entry', () => {
    const result = createVisitorSchema.safeParse(validVisitor);
    expect(result.success).toBe(true);
  });

  it('accepts a visitor with optional fields', () => {
    const result = createVisitorSchema.safeParse({
      ...validVisitor,
      personVisitedId: VALID_UUID,
      departureTime: '15:30',
      idChecked: true,
      dbsChecked: true,
      notes: 'Brought birthday cake for the child',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty visitor name', () => {
    const result = createVisitorSchema.safeParse({
      ...validVisitor,
      visitorName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid relationship type', () => {
    const result = createVisitorSchema.safeParse({
      ...validVisitor,
      relationship: 'unknown_type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid arrival time format', () => {
    const result = createVisitorSchema.safeParse({
      ...validVisitor,
      arrivalTime: '2pm',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid visit date format', () => {
    const result = createVisitorSchema.safeParse({
      ...validVisitor,
      visitDate: '15/06/2024',
    });
    expect(result.success).toBe(false);
  });

  it('defaults idChecked and dbsChecked to false', () => {
    const result = createVisitorSchema.safeParse(validVisitor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.idChecked).toBe(false);
      expect(result.data.dbsChecked).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// createVoiceSchema
// ---------------------------------------------------------------------------

describe('createVoiceSchema', () => {
  const validVoice = {
    personId: VALID_UUID,
    recordedDate: VALID_DATE,
    category: 'daily_life',
    content: 'The child said they feel happy at the home',
  };

  it('accepts a valid voice entry', () => {
    const result = createVoiceSchema.safeParse(validVoice);
    expect(result.success).toBe(true);
  });

  it('accepts voice with method and action taken', () => {
    const result = createVoiceSchema.safeParse({
      ...validVoice,
      method: 'keyworker_session',
      actionTaken: 'Shared with placement review meeting',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = createVoiceSchema.safeParse({
      ...validVoice,
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createVoiceSchema.safeParse({
      ...validVoice,
      category: 'not_a_category',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createVoiceSchema.safeParse({
      ...validVoice,
      recordedDate: '15-06-2024',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid person UUID', () => {
    const result = createVoiceSchema.safeParse({
      ...validVoice,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
