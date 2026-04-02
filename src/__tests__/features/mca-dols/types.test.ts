/**
 * MCA & DoLS — type and validation tests.
 *
 * Tests the core business logic:
 * - MCA outcome derivation (two-stage test)
 * - Zod schema validation (conditional fields, regulatory rules)
 * - DoLS expiry helpers
 */
import { describe, it, expect } from 'vitest';
import {
  deriveMcaOutcome,
  mcaAssessmentSchema,
  bestInterestDecisionSchema,
  dolsApplicationSchema,
  lpaAdrtRecordSchema,
  dolsRestrictionSchema,
  isDolsExpiringSoon,
  isDolsExpired,
} from '../../../features/mca-dols/types';

// ---------------------------------------------------------------------------
// deriveMcaOutcome
// ---------------------------------------------------------------------------

describe('deriveMcaOutcome', () => {
  it('returns "has_capacity" when diagnostic test is negative (no impairment)', () => {
    // VAL-ASSESS-001: Auto-conclude on diagnostic "No"
    const result = deriveMcaOutcome({ diagnosticTestResult: false });
    expect(result).toBe('has_capacity');
  });

  it('returns "has_capacity" when diagnostic is positive but all functional criteria pass', () => {
    const result = deriveMcaOutcome({
      diagnosticTestResult: true,
      canUnderstand: true,
      canRetain: true,
      canUseOrWeigh: true,
      canCommunicate: true,
    });
    expect(result).toBe('has_capacity');
  });

  it('returns "lacks_capacity" when any single functional criterion fails', () => {
    // VAL-ASSESS-002: Failing ANY ONE → lacks_capacity
    const scenarios = [
      { canUnderstand: false, canRetain: true, canUseOrWeigh: true, canCommunicate: true },
      { canUnderstand: true, canRetain: false, canUseOrWeigh: true, canCommunicate: true },
      { canUnderstand: true, canRetain: true, canUseOrWeigh: false, canCommunicate: true },
      { canUnderstand: true, canRetain: true, canUseOrWeigh: true, canCommunicate: false },
    ];

    for (const scenario of scenarios) {
      const result = deriveMcaOutcome({
        diagnosticTestResult: true,
        ...scenario,
      });
      expect(result).toBe('lacks_capacity');
    }
  });

  it('returns "lacks_capacity" when multiple functional criteria fail', () => {
    const result = deriveMcaOutcome({
      diagnosticTestResult: true,
      canUnderstand: false,
      canRetain: false,
      canUseOrWeigh: true,
      canCommunicate: false,
    });
    expect(result).toBe('lacks_capacity');
  });

  it('returns "has_capacity" when diagnostic is negative regardless of functional values', () => {
    // Even with functional test failures, diagnostic "No" → has_capacity
    const result = deriveMcaOutcome({
      diagnosticTestResult: false,
      canUnderstand: false,
      canRetain: false,
      canUseOrWeigh: false,
      canCommunicate: false,
    });
    expect(result).toBe('has_capacity');
  });
});

// ---------------------------------------------------------------------------
// mcaAssessmentSchema
// ---------------------------------------------------------------------------

describe('mcaAssessmentSchema', () => {
  const baseInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    decisionToBeAssessed: 'Whether to move to residential care',
    assessorId: '550e8400-e29b-41d4-a716-446655440001',
    diagnosticTestEvidence: 'Clinical assessment showed no impairment',
    supportStepsTaken: 'Information provided in simple language',
    assessmentDate: '2026-01-15',
  };

  it('accepts valid input with diagnostic = false (no functional test needed)', () => {
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: false,
    });
    expect(result.success).toBe(true);
  });

  it('requires functional test fields when diagnostic = true', () => {
    // VAL-ASSESS-002: Functional test required when diagnostic is positive
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('canUnderstand');
      expect(paths).toContain('canRetain');
      expect(paths).toContain('canUseOrWeigh');
      expect(paths).toContain('canCommunicate');
    }
  });

  it('accepts valid input with all functional test fields when diagnostic = true', () => {
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: true,
      canUnderstand: true,
      canUnderstandEvidence: 'Able to repeat back information',
      canRetain: true,
      canRetainEvidence: 'Retained information for 30 minutes',
      canUseOrWeigh: false,
      canUseOrWeighEvidence: 'Unable to weigh pros and cons',
      canCommunicate: true,
      canCommunicateEvidence: 'Communicates verbally',
    });
    expect(result.success).toBe(true);
  });

  it('requires evidence for each functional criterion when diagnostic = true', () => {
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: true,
      canUnderstand: true,
      canUnderstandEvidence: '', // Empty evidence
      canRetain: true,
      canRetainEvidence: 'Some evidence',
      canUseOrWeigh: true,
      canUseOrWeighEvidence: 'Some evidence',
      canCommunicate: true,
      canCommunicateEvidence: 'Some evidence',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing decision to be assessed', () => {
    // VAL-ASSESS-001: Decision-specificity
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: false,
      decisionToBeAssessed: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing diagnostic evidence', () => {
    // VAL-ASSESS-001: Mandatory evidence
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: false,
      diagnosticTestEvidence: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing support steps', () => {
    // VAL-ASSESS-002: Support steps required
    const result = mcaAssessmentSchema.safeParse({
      ...baseInput,
      diagnosticTestResult: false,
      supportStepsTaken: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bestInterestDecisionSchema
// ---------------------------------------------------------------------------

describe('bestInterestDecisionSchema', () => {
  const validInput = {
    mcaAssessmentId: '550e8400-e29b-41d4-a716-446655440002',
    personId: '550e8400-e29b-41d4-a716-446655440000',
    decisionBeingMade: 'Move to residential care',
    personsConsulted: [
      { name: 'Jane Doe', role: 'Daughter', relationship: 'Next of kin', views: 'Agrees with the move' },
    ],
    personWishesFeelingsBeliefs: 'Previously expressed wish to stay at home',
    lessRestrictiveOptionsConsidered: 'Domiciliary care — insufficient for needs',
    decisionReached: 'Move to residential care in the person\'s best interest',
    decisionMakerName: 'Dr Smith',
    decisionMakerRole: 'Consultant',
    decisionDate: '2026-01-16',
  };

  it('accepts valid best interest decision', () => {
    // VAL-ASSESS-003: All required fields present
    const result = bestInterestDecisionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('requires at least one person consulted', () => {
    const result = bestInterestDecisionSchema.safeParse({
      ...validInput,
      personsConsulted: [],
    });
    expect(result.success).toBe(false);
  });

  it('requires all fields on persons consulted', () => {
    const result = bestInterestDecisionSchema.safeParse({
      ...validInput,
      personsConsulted: [{ name: '', role: '', relationship: '', views: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing decision maker details', () => {
    const result = bestInterestDecisionSchema.safeParse({
      ...validInput,
      decisionMakerName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing less restrictive options', () => {
    const result = bestInterestDecisionSchema.safeParse({
      ...validInput,
      lessRestrictiveOptionsConsidered: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dolsApplicationSchema
// ---------------------------------------------------------------------------

describe('dolsApplicationSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    managingAuthority: 'Sunrise Care Home',
    supervisoryBody: 'Birmingham City Council',
    applicationDate: '2026-01-10',
    reason: 'Person under continuous supervision and not free to leave',
    restrictions: 'Continuous supervision, locked front door',
    status: 'applied' as const,
  };

  it('accepts valid DoLS application', () => {
    // VAL-ASSESS-004: All required fields
    const result = dolsApplicationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('requires authorisation dates when status is granted', () => {
    // VAL-ASSESS-004: Status lifecycle
    const result = dolsApplicationSchema.safeParse({
      ...validInput,
      status: 'granted',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('authorisationStartDate');
      expect(paths).toContain('authorisationEndDate');
    }
  });

  it('accepts granted status with authorisation dates', () => {
    const result = dolsApplicationSchema.safeParse({
      ...validInput,
      status: 'granted',
      authorisationStartDate: '2026-01-15',
      authorisationEndDate: '2026-07-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects authorisation exceeding 12 months', () => {
    // VAL-ASSESS-005: Max 12 months
    const result = dolsApplicationSchema.safeParse({
      ...validInput,
      status: 'granted',
      authorisationStartDate: '2026-01-15',
      authorisationEndDate: '2027-02-15', // 13 months
    });
    expect(result.success).toBe(false);
  });

  it('accepts authorisation of exactly 12 months', () => {
    const result = dolsApplicationSchema.safeParse({
      ...validInput,
      status: 'granted',
      authorisationStartDate: '2026-01-15',
      authorisationEndDate: '2027-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('allows linked MCA and best interest IDs', () => {
    // VAL-ASSESS-004: Linked to MCA/best-interest
    const result = dolsApplicationSchema.safeParse({
      ...validInput,
      linkedMcaId: '550e8400-e29b-41d4-a716-446655440003',
      linkedBestInterestId: '550e8400-e29b-41d4-a716-446655440004',
    });
    expect(result.success).toBe(true);
  });

  it('defaults expiryAlertDays to 28', () => {
    const result = dolsApplicationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiryAlertDays).toBe(28);
    }
  });
});

// ---------------------------------------------------------------------------
// lpaAdrtRecordSchema
// ---------------------------------------------------------------------------

describe('lpaAdrtRecordSchema', () => {
  it('accepts valid LPA health record', () => {
    const result = lpaAdrtRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'lpa_health',
      details: 'John Smith holds LPA for health and welfare',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid ADRT record', () => {
    const result = lpaAdrtRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'adrt',
      details: 'Refuses resuscitation',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid record type', () => {
    const result = lpaAdrtRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordType: 'invalid_type',
      details: 'Something',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dolsRestrictionSchema
// ---------------------------------------------------------------------------

describe('dolsRestrictionSchema', () => {
  it('accepts valid restriction', () => {
    const result = dolsRestrictionSchema.safeParse({
      dolsApplicationId: '550e8400-e29b-41d4-a716-446655440005',
      personId: '550e8400-e29b-41d4-a716-446655440000',
      restrictionType: 'Locked doors',
      description: 'Front and back doors locked at all times',
      justification: 'Person at risk of wandering into traffic',
      startDate: '2026-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('requires justification', () => {
    const result = dolsRestrictionSchema.safeParse({
      dolsApplicationId: '550e8400-e29b-41d4-a716-446655440005',
      personId: '550e8400-e29b-41d4-a716-446655440000',
      restrictionType: 'Locked doors',
      description: 'Front and back doors locked',
      justification: '',
      startDate: '2026-01-15',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DoLS expiry helpers
// ---------------------------------------------------------------------------

describe('isDolsExpiringSoon', () => {
  it('returns false when no end date', () => {
    expect(isDolsExpiringSoon(null, 28)).toBe(false);
    expect(isDolsExpiringSoon(undefined, 28)).toBe(false);
  });

  it('returns true when within alert window', () => {
    // VAL-ASSESS-005: Alerts at configurable lead time
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 14 days from now
    expect(isDolsExpiringSoon(endDate.toISOString(), 28)).toBe(true); // Within 28-day window
  });

  it('returns false when outside alert window', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60); // 60 days from now
    expect(isDolsExpiringSoon(endDate.toISOString(), 28)).toBe(false);
  });

  it('returns false when already expired', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    expect(isDolsExpiringSoon(endDate.toISOString(), 28)).toBe(false);
  });
});

describe('isDolsExpired', () => {
  it('returns false when no end date', () => {
    expect(isDolsExpired(null)).toBe(false);
  });

  it('returns true when past end date', () => {
    // VAL-ASSESS-005: Expired DoLS prominently flagged
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    expect(isDolsExpired(endDate.toISOString())).toBe(true);
  });

  it('returns false when before end date', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    expect(isDolsExpired(endDate.toISOString())).toBe(false);
  });
});
