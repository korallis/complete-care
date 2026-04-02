import { describe, it, expect } from 'vitest';
import {
  baselineAssessmentSchema,
  progressRecordSchema,
  positiveBehaviourSchema,
  behaviourIncidentSchema,
  statementOfPurposeSchema,
} from './schemas';

describe('baselineAssessmentSchema', () => {
  it('accepts a valid assessment', () => {
    const result = baselineAssessmentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      assessmentTool: 'outcomes_star',
      assessmentDate: '2026-03-15',
      domainScores: {
        physical: 5,
        emotional: 4,
        identity: 6,
        relationships: 3,
        social: 7,
        self_care: 8,
        education: 5,
      },
      notes: 'Initial assessment completed.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects scores outside 1-10 range', () => {
    const result = baselineAssessmentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      assessmentTool: 'berri',
      assessmentDate: '2026-03-15',
      domainScores: { physical: 11 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid assessment tool', () => {
    const result = baselineAssessmentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      assessmentTool: 'unknown_tool',
      assessmentDate: '2026-03-15',
      domainScores: { physical: 5 },
    });
    expect(result.success).toBe(false);
  });
});

describe('progressRecordSchema', () => {
  it('accepts a valid progress record', () => {
    const result = progressRecordSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      assessmentId: '00000000-0000-0000-0000-000000000002',
      domain: 'emotional',
      score: 6,
      narrative: 'Noticeable improvement in emotional regulation.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid domain', () => {
    const result = progressRecordSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      assessmentId: '00000000-0000-0000-0000-000000000002',
      domain: 'non_existent',
      score: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe('positiveBehaviourSchema', () => {
  it('accepts a valid positive behaviour', () => {
    const result = positiveBehaviourSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      description: 'Helped set the table without being asked.',
      category: 'cooperation',
      points: 3,
      occurredAt: '2026-03-28T14:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = positiveBehaviourSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      description: '',
      category: 'kindness',
      points: 1,
      occurredAt: '2026-03-28T14:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('behaviourIncidentSchema', () => {
  it('accepts a valid ABC incident', () => {
    const result = behaviourIncidentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      antecedent: 'Was asked to turn off the TV for bedtime.',
      behaviour: 'Threw the remote control and shouted.',
      consequence: 'Staff used calm verbal de-escalation; young person went to room.',
      severity: 'medium',
      behaviourType: 'verbal_aggression',
      location: 'Living room',
      durationMinutes: 10,
      deescalationUsed: 'Verbal de-escalation, empathic listening.',
      physicalIntervention: false,
      staffInvolved: ['Sarah T.', 'James W.'],
      occurredAt: '2026-03-28T21:15:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required ABC fields', () => {
    const result = behaviourIncidentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      antecedent: 'Trigger event.',
      // missing behaviour and consequence
      severity: 'low',
      behaviourType: 'other',
      occurredAt: '2026-03-28T21:15:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = behaviourIncidentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      antecedent: 'A',
      behaviour: 'B',
      consequence: 'C',
      severity: 'extreme',
      behaviourType: 'other',
      occurredAt: '2026-03-28T21:15:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('statementOfPurposeSchema', () => {
  it('accepts a valid statement', () => {
    const result = statementOfPurposeSchema.safeParse({
      title: 'Statement of Purpose — Oakwood House',
      content: 'Full document content here.',
      status: 'draft',
      nextReviewDate: '2027-03-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = statementOfPurposeSchema.safeParse({
      title: '',
      content: 'Content.',
    });
    expect(result.success).toBe(false);
  });
});
