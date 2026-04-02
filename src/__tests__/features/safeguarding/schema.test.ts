/**
 * Safeguarding Zod validation schema tests.
 * Verifies validation rules for all safeguarding feature inputs.
 */
import { describe, it, expect } from 'vitest';
import {
  createConcernSchema,
  createCorrectionSchema,
  createDslReviewSchema,
  createLadoReferralSchema,
  updateLadoReferralSchema,
  createSection47Schema,
  createMashReferralSchema,
  createChronologyEntrySchema,
} from '@/features/safeguarding/schema';

// ---------------------------------------------------------------------------
// createConcernSchema
// ---------------------------------------------------------------------------

describe('createConcernSchema', () => {
  const validConcern = {
    childId: '550e8400-e29b-41d4-a716-446655440000',
    observedAt: new Date('2026-04-01T10:00:00'),
    description: 'Child was observed with unexplained bruising on left arm.',
    severity: 'high' as const,
  };

  it('validates a minimal valid concern', () => {
    const result = createConcernSchema.safeParse(validConcern);
    expect(result.success).toBe(true);
  });

  it('validates a fully populated concern', () => {
    const full = {
      ...validConcern,
      verbatimAccount: 'The child said: "He hit me when no one was looking"',
      childPresentation: 'Visibly distressed, tearful, withdrawn',
      bodyMapId: '550e8400-e29b-41d4-a716-446655440001',
      location: 'Living room',
      category: 'physical',
      witnesses: 'Jane Smith (Senior Carer)',
      immediateActions: 'Child comforted and separated from alleged perpetrator',
    };
    const result = createConcernSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it('rejects missing childId', () => {
    const missing = {
      observedAt: validConcern.observedAt,
      description: validConcern.description,
      severity: validConcern.severity,
    };
    const result = createConcernSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it('rejects invalid childId (not UUID)', () => {
    const result = createConcernSchema.safeParse({
      ...validConcern,
      childId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short description', () => {
    const result = createConcernSchema.safeParse({
      ...validConcern,
      description: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = createConcernSchema.safeParse({
      ...validConcern,
      severity: 'extreme',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid severity levels', () => {
    for (const severity of ['low', 'medium', 'high', 'critical']) {
      const result = createConcernSchema.safeParse({
        ...validConcern,
        severity,
      });
      expect(result.success).toBe(true);
    }
  });

  it('coerces observedAt string to Date', () => {
    const result = createConcernSchema.safeParse({
      ...validConcern,
      observedAt: '2026-04-01T10:00:00',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.observedAt).toBeInstanceOf(Date);
    }
  });
});

// ---------------------------------------------------------------------------
// createCorrectionSchema
// ---------------------------------------------------------------------------

describe('createCorrectionSchema', () => {
  const validCorrection = {
    concernId: '550e8400-e29b-41d4-a716-446655440000',
    fieldName: 'description',
    correctedValue: 'Corrected description with additional detail.',
    reason: 'Original description omitted important context.',
  };

  it('validates a valid correction', () => {
    const result = createCorrectionSchema.safeParse(validCorrection);
    expect(result.success).toBe(true);
  });

  it('rejects empty fieldName', () => {
    const result = createCorrectionSchema.safeParse({
      ...validCorrection,
      fieldName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short reason', () => {
    const result = createCorrectionSchema.safeParse({
      ...validCorrection,
      reason: 'Hi',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createDslReviewSchema
// ---------------------------------------------------------------------------

describe('createDslReviewSchema', () => {
  const validReview = {
    concernId: '550e8400-e29b-41d4-a716-446655440000',
    decision: 'internal_monitoring' as const,
    rationale: 'The concern is being monitored internally with enhanced supervision.',
  };

  it('validates a valid internal monitoring decision', () => {
    const result = createDslReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('validates an external referral with required fields', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      decision: 'refer_to_mash',
      referralDate: new Date('2026-04-01'),
      referralAgency: 'Local Authority MASH Team',
    });
    expect(result.success).toBe(true);
  });

  it('rejects external referral decision without referralDate', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      decision: 'refer_to_mash',
    });
    expect(result.success).toBe(false);
  });

  it('rejects external referral to LADO without referralDate', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      decision: 'refer_to_lado',
    });
    expect(result.success).toBe(false);
  });

  it('rejects external referral to police without referralDate', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      decision: 'refer_to_police',
    });
    expect(result.success).toBe(false);
  });

  it('does not require referralDate for internal monitoring', () => {
    const result = createDslReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('accepts all four decision pathways', () => {
    const decisions = [
      'internal_monitoring',
      'refer_to_mash',
      'refer_to_lado',
      'refer_to_police',
    ] as const;
    for (const decision of decisions) {
      const data =
        decision === 'internal_monitoring'
          ? { ...validReview, decision }
          : { ...validReview, decision, referralDate: new Date() };
      const result = createDslReviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid decision', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      decision: 'dismiss',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short rationale', () => {
    const result = createDslReviewSchema.safeParse({
      ...validReview,
      rationale: 'Short',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createLadoReferralSchema
// ---------------------------------------------------------------------------

describe('createLadoReferralSchema', () => {
  const validLado = {
    childId: '550e8400-e29b-41d4-a716-446655440000',
    allegationAgainstStaffName: 'John Smith',
    allegationDetails: 'Staff member was observed using excessive force during a restraint.',
    referralDate: new Date('2026-04-01'),
  };

  it('validates a valid LADO referral', () => {
    const result = createLadoReferralSchema.safeParse(validLado);
    expect(result.success).toBe(true);
  });

  it('rejects missing staff name', () => {
    const result = createLadoReferralSchema.safeParse({
      ...validLado,
      allegationAgainstStaffName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short allegation details', () => {
    const result = createLadoReferralSchema.safeParse({
      ...validLado,
      allegationDetails: 'Short',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateLadoReferralSchema
// ---------------------------------------------------------------------------

describe('updateLadoReferralSchema', () => {
  it('validates a status update', () => {
    const result = updateLadoReferralSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'investigation_ongoing',
    });
    expect(result.success).toBe(true);
  });

  it('validates an outcome update', () => {
    const result = updateLadoReferralSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      outcome: 'substantiated',
      employmentAction: 'suspended',
      outcomeDate: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid outcome value', () => {
    const result = updateLadoReferralSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      outcome: 'invalid_outcome',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid employment action', () => {
    const result = updateLadoReferralSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      employmentAction: 'fired',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSection47Schema
// ---------------------------------------------------------------------------

describe('createSection47Schema', () => {
  it('validates a valid Section 47 investigation', () => {
    const result = createSection47Schema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      strategyMeetingDate: new Date('2026-04-05T14:00:00'),
      strategyMeetingAttendees: [
        { name: 'Dr Jane Brown', role: 'Paediatrician', organisation: 'NHS Trust' },
        { name: 'PC John Doe', role: 'Police Officer', organisation: 'Met Police' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates minimal input (childId only)', () => {
    const result = createSection47Schema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid attendee structure', () => {
    const result = createSection47Schema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      strategyMeetingAttendees: [{ name: '' }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createMashReferralSchema
// ---------------------------------------------------------------------------

describe('createMashReferralSchema', () => {
  it('validates a valid MASH referral', () => {
    const result = createMashReferralSchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      referralDate: new Date('2026-04-01'),
      referralReason:
        'Child disclosed physical abuse by family member during weekend visit.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too-short referral reason', () => {
    const result = createMashReferralSchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      referralDate: new Date(),
      referralReason: 'Short',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createChronologyEntrySchema
// ---------------------------------------------------------------------------

describe('createChronologyEntrySchema', () => {
  it('validates a valid manual chronology entry', () => {
    const result = createChronologyEntrySchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      eventDate: new Date('2025-06-15'),
      title: 'Previous school exclusion',
      description:
        'Child was excluded from previous school for aggressive behaviour towards peers.',
    });
    expect(result.success).toBe(true);
  });

  it('defaults significance to standard', () => {
    const result = createChronologyEntrySchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      eventDate: new Date(),
      title: 'Historical event',
      description: 'A historical event recorded for completeness.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.significance).toBe('standard');
    }
  });

  it('rejects too-short title', () => {
    const result = createChronologyEntrySchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      eventDate: new Date(),
      title: 'Hi',
      description: 'Valid description that is long enough.',
    });
    expect(result.success).toBe(false);
  });

  it('accepts restricted entries', () => {
    const result = createChronologyEntrySchema.safeParse({
      childId: '550e8400-e29b-41d4-a716-446655440000',
      eventDate: new Date(),
      title: 'Restricted historical event',
      description: 'A restricted event only visible to DSL and leadership.',
      isRestricted: true,
      significance: 'critical',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRestricted).toBe(true);
      expect(result.data.significance).toBe('critical');
    }
  });
});
