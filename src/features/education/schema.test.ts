import { describe, it, expect } from 'vitest';
import {
  schoolRecordSchema,
  pepSchema,
  pepAttendeeSchema,
  educationAttendanceSchema,
  exclusionRecordSchema,
  pupilPremiumPlusSchema,
  sdqAssessmentSchema,
} from './schema';

describe('schoolRecordSchema', () => {
  it('validates a minimal valid school record', () => {
    const result = schoolRecordSchema.safeParse({ schoolName: 'Test Academy' });
    expect(result.success).toBe(true);
  });

  it('rejects empty school name', () => {
    const result = schoolRecordSchema.safeParse({ schoolName: '' });
    expect(result.success).toBe(false);
  });

  it('allows optional fields', () => {
    const result = schoolRecordSchema.safeParse({
      schoolName: 'Oak Hill School',
      yearGroup: '9',
      senStatus: 'ehcp',
      ehcpInPlace: true,
      designatedTeacherName: 'Ms Smith',
      designatedTeacherEmail: 'smith@school.co.uk',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senStatus).toBe('ehcp');
      expect(result.data.ehcpInPlace).toBe(true);
    }
  });

  it('rejects invalid SEN status', () => {
    const result = schoolRecordSchema.safeParse({
      schoolName: 'Test',
      senStatus: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('pepSchema', () => {
  it('validates a complete PEP', () => {
    const result = pepSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      academicYear: '2025-2026',
      term: 'autumn',
      currentAttainment: 'Working towards expected standard',
      targets: 'Improve reading comprehension',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid academic year format', () => {
    const result = pepSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      academicYear: '2025',
      term: 'autumn',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid term', () => {
    const result = pepSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      academicYear: '2025-2026',
      term: 'winter',
    });
    expect(result.success).toBe(false);
  });
});

describe('pepAttendeeSchema', () => {
  it('validates attendee data', () => {
    const result = pepAttendeeSchema.safeParse({
      pepId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Ms Jones',
      role: 'Designated Teacher',
      attended: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = pepAttendeeSchema.safeParse({
      pepId: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      role: 'Teacher',
    });
    expect(result.success).toBe(false);
  });
});

describe('educationAttendanceSchema', () => {
  it('validates attendance record', () => {
    const result = educationAttendanceSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2025-09-01',
      amMark: 'present',
      pmMark: 'late',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid attendance mark', () => {
    const result = educationAttendanceSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2025-09-01',
      amMark: 'tardy',
      pmMark: 'present',
    });
    expect(result.success).toBe(false);
  });
});

describe('exclusionRecordSchema', () => {
  it('validates fixed-term exclusion', () => {
    const result = exclusionRecordSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      exclusionType: 'fixed_term',
      reason: 'Persistent disruptive behaviour',
      startDate: '2025-10-15',
      durationDays: 3,
    });
    expect(result.success).toBe(true);
  });

  it('validates permanent exclusion', () => {
    const result = exclusionRecordSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      exclusionType: 'permanent',
      reason: 'Serious breach of school behaviour policy',
      startDate: '2025-11-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing reason', () => {
    const result = exclusionRecordSchema.safeParse({
      schoolRecordId: '550e8400-e29b-41d4-a716-446655440000',
      exclusionType: 'fixed_term',
      reason: '',
      startDate: '2025-10-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('pupilPremiumPlusSchema', () => {
  it('validates PP+ record', () => {
    const result = pupilPremiumPlusSchema.safeParse({
      academicYear: '2025-2026',
      allocationAmount: 250000,
      plannedUse: '1:1 tutoring for maths catch-up',
      actualSpend: 125000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative allocation', () => {
    const result = pupilPremiumPlusSchema.safeParse({
      academicYear: '2025-2026',
      allocationAmount: -100,
      plannedUse: 'Tutoring',
    });
    expect(result.success).toBe(false);
  });
});

describe('sdqAssessmentSchema', () => {
  it('validates SDQ and computes total difficulties', () => {
    const result = sdqAssessmentSchema.safeParse({
      assessmentDate: '2025-09-15',
      respondent: 'teacher',
      emotionalScore: 3,
      conductScore: 2,
      hyperactivityScore: 5,
      peerScore: 2,
      prosocialScore: 8,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalDifficulties).toBe(12); // 3+2+5+2
      expect(result.data.prosocialScore).toBe(8);
    }
  });

  it('rejects scores above 10', () => {
    const result = sdqAssessmentSchema.safeParse({
      assessmentDate: '2025-09-15',
      respondent: 'self',
      emotionalScore: 11,
      conductScore: 2,
      hyperactivityScore: 5,
      peerScore: 2,
      prosocialScore: 8,
    });
    expect(result.success).toBe(false);
  });

  it('rejects scores below 0', () => {
    const result = sdqAssessmentSchema.safeParse({
      assessmentDate: '2025-09-15',
      respondent: 'parent_carer',
      emotionalScore: -1,
      conductScore: 2,
      hyperactivityScore: 5,
      peerScore: 2,
      prosocialScore: 8,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid respondent', () => {
    const result = sdqAssessmentSchema.safeParse({
      assessmentDate: '2025-09-15',
      respondent: 'social_worker',
      emotionalScore: 3,
      conductScore: 2,
      hyperactivityScore: 5,
      peerScore: 2,
      prosocialScore: 8,
    });
    expect(result.success).toBe(false);
  });

  it('allows optional impact score', () => {
    const result = sdqAssessmentSchema.safeParse({
      assessmentDate: '2025-09-15',
      respondent: 'teacher',
      emotionalScore: 3,
      conductScore: 2,
      hyperactivityScore: 5,
      peerScore: 2,
      prosocialScore: 8,
      impactScore: 4,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.impactScore).toBe(4);
    }
  });
});
