import { describe, it, expect } from 'vitest';
import {
  createReferralSchema,
  createMatchingAssessmentSchema,
  recordDecisionSchema,
  updateChecklistItemSchema,
  completeAdmissionSchema,
  referralStatusEnum,
  riskRatingEnum,
  recommendationEnum,
} from './schema';

describe('Admissions Zod schemas', () => {
  // ── Enums ────────────────────────────────────────────────────────────

  describe('referralStatusEnum', () => {
    it('accepts valid statuses', () => {
      expect(referralStatusEnum.parse('received')).toBe('received');
      expect(referralStatusEnum.parse('assessment_complete')).toBe(
        'assessment_complete',
      );
      expect(referralStatusEnum.parse('accepted')).toBe('accepted');
      expect(referralStatusEnum.parse('declined')).toBe('declined');
      expect(referralStatusEnum.parse('admitted')).toBe('admitted');
    });

    it('rejects invalid status', () => {
      expect(() => referralStatusEnum.parse('invalid')).toThrow();
    });
  });

  describe('riskRatingEnum', () => {
    it('accepts low, medium, high', () => {
      expect(riskRatingEnum.parse('low')).toBe('low');
      expect(riskRatingEnum.parse('medium')).toBe('medium');
      expect(riskRatingEnum.parse('high')).toBe('high');
    });
  });

  describe('recommendationEnum', () => {
    it('accepts valid recommendations', () => {
      expect(recommendationEnum.parse('accept')).toBe('accept');
      expect(recommendationEnum.parse('decline')).toBe('decline');
      expect(recommendationEnum.parse('accept_with_conditions')).toBe(
        'accept_with_conditions',
      );
    });
  });

  // ── createReferralSchema ─────────────────────────────────────────────

  describe('createReferralSchema', () => {
    const validReferral = {
      childFirstName: 'Jane',
      childLastName: 'Doe',
      childDateOfBirth: '2012-05-15',
      childGender: 'female',
      referralReason: 'Current placement has broken down',
      placingAuthorityName: 'London Borough of Camden',
      socialWorkerName: 'Sarah Smith',
      socialWorkerEmail: 'sarah.smith@camden.gov.uk',
    };

    it('validates a minimal valid referral', () => {
      const result = createReferralSchema.safeParse(validReferral);
      expect(result.success).toBe(true);
    });

    it('validates a full referral with optional fields', () => {
      const result = createReferralSchema.safeParse({
        ...validReferral,
        childEthnicity: 'White British',
        childNationality: 'British',
        childLanguage: 'English',
        childReligion: 'None',
        needs: {
          physical: ['Mobility support'],
          emotional: ['Attachment disorder'],
          educational: ['SEN'],
          medical: ['Asthma'],
        },
        behaviours: [
          {
            description: 'Physical aggression',
            triggers: ['Transition times'],
            managementStrategies: ['De-escalation'],
          },
        ],
        medicalInformation: {
          diagnosis: 'ADHD',
          medication: 'Methylphenidate',
          allergies: 'None known',
          gpDetails: 'Dr Jones, Camden Practice',
        },
        backgroundSummary: 'Background details...',
        placementHistory: [
          {
            placementType: 'Foster care',
            provider: 'ABC Fostering',
            startDate: '2020-01-01',
            endDate: '2023-06-01',
            reason: 'Placement breakdown',
          },
        ],
        socialWorkerPhone: '020 7123 4567',
        teamManagerName: 'John Manager',
        teamManagerEmail: 'john.manager@camden.gov.uk',
        legalStatus: 'section_31',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const result = createReferralSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects invalid social worker email', () => {
      const result = createReferralSchema.safeParse({
        ...validReferral,
        socialWorkerEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('allows empty team manager email', () => {
      const result = createReferralSchema.safeParse({
        ...validReferral,
        teamManagerEmail: '',
      });
      expect(result.success).toBe(true);
    });
  });

  // ── createMatchingAssessmentSchema ───────────────────────────────────

  describe('createMatchingAssessmentSchema', () => {
    const validAssessment = {
      referralId: '123e4567-e89b-12d3-a456-426614174000',
      overallRiskRating: 'medium' as const,
      recommendation: 'accept_with_conditions' as const,
      recommendationRationale:
        'Child can be accommodated with additional staffing',
    };

    it('validates a minimal valid assessment', () => {
      const result =
        createMatchingAssessmentSchema.safeParse(validAssessment);
      expect(result.success).toBe(true);
    });

    it('validates a full assessment with risk entries', () => {
      const result = createMatchingAssessmentSchema.safeParse({
        ...validAssessment,
        riskToExisting: [
          {
            childName: 'Existing Child A',
            riskDescription: 'Physical aggression risk',
            likelihood: 'medium',
            severity: 'high',
            mitigations: 'Separate activities during transition period',
          },
        ],
        riskToRating: 'medium',
        riskFromExisting: [
          {
            childName: 'Existing Child B',
            riskDescription: 'Emotional contagion',
            likelihood: 'low',
            severity: 'low',
          },
        ],
        riskFromRating: 'low',
        compatibilityFactors: [
          {
            factor: 'Age',
            assessment: 'Similar age to existing children',
            rating: 'compatible' as const,
          },
        ],
        currentOccupancy: 3,
        maxCapacity: 4,
        bedsAvailable: 1,
        capacityNotes: 'One bed in shared room',
        conditions: 'Additional night staff required for first 2 weeks',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing referralId', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { referralId: _removed, ...rest } = validAssessment;
      const result = createMatchingAssessmentSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid risk rating', () => {
      const result = createMatchingAssessmentSchema.safeParse({
        ...validAssessment,
        overallRiskRating: 'extreme',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── recordDecisionSchema ─────────────────────────────────────────────

  describe('recordDecisionSchema', () => {
    it('validates an acceptance', () => {
      const result = recordDecisionSchema.safeParse({
        referralId: '123e4567-e89b-12d3-a456-426614174000',
        decision: 'accepted',
        reason: 'Child matches our profile and we have capacity',
      });
      expect(result.success).toBe(true);
    });

    it('validates a decline', () => {
      const result = recordDecisionSchema.safeParse({
        referralId: '123e4567-e89b-12d3-a456-426614174000',
        decision: 'declined',
        reason: 'No capacity — at maximum occupancy',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing reason', () => {
      const result = recordDecisionSchema.safeParse({
        referralId: '123e4567-e89b-12d3-a456-426614174000',
        decision: 'accepted',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── updateChecklistItemSchema ────────────────────────────────────────

  describe('updateChecklistItemSchema', () => {
    it('validates marking an item complete', () => {
      const result = updateChecklistItemSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        completed: true,
      });
      expect(result.success).toBe(true);
    });

    it('validates marking an item incomplete', () => {
      const result = updateChecklistItemSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        completed: false,
        notes: 'Awaiting document from social worker',
      });
      expect(result.success).toBe(true);
    });
  });

  // ── completeAdmissionSchema ──────────────────────────────────────────

  describe('completeAdmissionSchema', () => {
    it('validates a valid admission completion', () => {
      const result = completeAdmissionSchema.safeParse({
        referralId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = completeAdmissionSchema.safeParse({
        referralId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  // ── VAL-CHILD-007: Workflow stages ───────────────────────────────────

  describe('VAL-CHILD-007: staged workflow validation', () => {
    it('defines all required workflow statuses', () => {
      const statuses = referralStatusEnum.options;
      expect(statuses).toContain('received');
      expect(statuses).toContain('assessment_complete');
      expect(statuses).toContain('accepted');
      expect(statuses).toContain('declined');
      expect(statuses).toContain('admitted');
      expect(statuses).toHaveLength(5);
    });
  });

  // ── VAL-CHILD-024: Risk assessment coverage ─────────────────────────

  describe('VAL-CHILD-024: risk assessment covers all dimensions', () => {
    it('assessment schema includes risk-to fields', () => {
      const shape = createMatchingAssessmentSchema.shape;
      expect(shape.riskToExisting).toBeDefined();
      expect(shape.riskToRating).toBeDefined();
    });

    it('assessment schema includes risk-from fields', () => {
      const shape = createMatchingAssessmentSchema.shape;
      expect(shape.riskFromExisting).toBeDefined();
      expect(shape.riskFromRating).toBeDefined();
    });

    it('assessment schema includes compatibility factors', () => {
      const shape = createMatchingAssessmentSchema.shape;
      expect(shape.compatibilityFactors).toBeDefined();
    });

    it('assessment schema includes capacity fields', () => {
      const shape = createMatchingAssessmentSchema.shape;
      expect(shape.currentOccupancy).toBeDefined();
      expect(shape.maxCapacity).toBeDefined();
      expect(shape.bedsAvailable).toBeDefined();
    });

    it('assessment schema requires overall rating and recommendation', () => {
      // These are required — omitting them should fail
      const result = createMatchingAssessmentSchema.safeParse({
        referralId: '123e4567-e89b-12d3-a456-426614174000',
        recommendationRationale: 'Some reason',
      });
      expect(result.success).toBe(false);
    });
  });
});
