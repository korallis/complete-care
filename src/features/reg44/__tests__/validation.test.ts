import { describe, it, expect } from 'vitest';
import {
  createVisitSchema,
  updateVisitSchema,
  createReportSchema,
  createRecommendationSchema,
  createNotifiableEventSchema,
  createPathwayPlanSchema,
  createMilestoneSchema,
  createAssessmentSchema,
} from '../validation';

describe('Reg 44 Validation Schemas', () => {
  // -----------------------------------------------------------------------
  // Visits
  // -----------------------------------------------------------------------

  describe('createVisitSchema', () => {
    it('accepts valid visit data', () => {
      const result = createVisitSchema.safeParse({
        visitDate: '2026-04-01',
        visitorName: 'Jane Smith',
        childrenSpokenTo: ['Child A', 'Child B'],
        staffSpokenTo: ['Staff A'],
        recordsReviewed: ['Daily logs'],
        areasInspected: ['Kitchen', 'Bedrooms'],
      });
      expect(result.success).toBe(true);
    });

    it('requires visitDate', () => {
      const result = createVisitSchema.safeParse({
        visitorName: 'Jane Smith',
      });
      expect(result.success).toBe(false);
    });

    it('requires visitorName', () => {
      const result = createVisitSchema.safeParse({
        visitDate: '2026-04-01',
        visitorName: '',
      });
      expect(result.success).toBe(false);
    });

    it('defaults status to scheduled', () => {
      const result = createVisitSchema.parse({
        visitDate: '2026-04-01',
        visitorName: 'Jane Smith',
      });
      expect(result.status).toBe('scheduled');
    });

    it('validates status enum', () => {
      const result = createVisitSchema.safeParse({
        visitDate: '2026-04-01',
        visitorName: 'Jane Smith',
        status: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateVisitSchema', () => {
    it('requires id', () => {
      const result = updateVisitSchema.safeParse({
        visitorName: 'Updated Name',
      });
      expect(result.success).toBe(false);
    });

    it('allows partial updates', () => {
      const result = updateVisitSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Reports
  // -----------------------------------------------------------------------

  describe('createReportSchema', () => {
    it('accepts valid report data', () => {
      const result = createReportSchema.safeParse({
        visitId: '550e8400-e29b-41d4-a716-446655440000',
        sections: {
          qualityOfCare: 'Good standard of care observed.',
          viewsOfChildren: 'Children expressed satisfaction.',
          education: 'Educational provision is adequate.',
          health: 'Health needs are met.',
          safeguarding: 'Safeguarding procedures in place.',
          staffing: 'Adequate staffing levels.',
          environment: 'Clean and well-maintained.',
          complaintsAndConcerns: 'No complaints received.',
          recommendations: 'Minor improvements needed.',
        },
      });
      expect(result.success).toBe(true);
    });

    it('requires visitId as UUID', () => {
      const result = createReportSchema.safeParse({
        visitId: 'not-a-uuid',
        sections: { qualityOfCare: '' },
      });
      expect(result.success).toBe(false);
    });

    it('defaults report status to draft', () => {
      const result = createReportSchema.parse({
        visitId: '550e8400-e29b-41d4-a716-446655440000',
        sections: {},
      });
      expect(result.status).toBe('draft');
    });
  });

  // -----------------------------------------------------------------------
  // Recommendations
  // -----------------------------------------------------------------------

  describe('createRecommendationSchema', () => {
    it('accepts valid recommendation', () => {
      const result = createRecommendationSchema.safeParse({
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Install additional fire safety equipment',
        priority: 'high',
        dueDate: '2026-05-01',
      });
      expect(result.success).toBe(true);
    });

    it('requires description', () => {
      const result = createRecommendationSchema.safeParse({
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('validates priority enum', () => {
      const result = createRecommendationSchema.safeParse({
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test',
        priority: 'critical',
      });
      expect(result.success).toBe(false);
    });

    it('defaults priority to medium', () => {
      const result = createRecommendationSchema.parse({
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test recommendation',
      });
      expect(result.priority).toBe('medium');
    });
  });

  // -----------------------------------------------------------------------
  // Notifiable Events (Reg 40)
  // -----------------------------------------------------------------------

  describe('createNotifiableEventSchema', () => {
    it('accepts valid event data', () => {
      const result = createNotifiableEventSchema.safeParse({
        category: 'absconding',
        eventDate: '2026-04-01',
        description: 'Young person left the home without permission at 10pm.',
        childrenInvolved: ['YP-001'],
        notificationDate: '2026-04-02',
        ofstedReference: 'OFS-2026-1234',
      });
      expect(result.success).toBe(true);
    });

    it('validates category enum', () => {
      const result = createNotifiableEventSchema.safeParse({
        category: 'minor_incident',
        eventDate: '2026-04-01',
        description: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('requires description', () => {
      const result = createNotifiableEventSchema.safeParse({
        category: 'death',
        eventDate: '2026-04-01',
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('defaults status to draft', () => {
      const result = createNotifiableEventSchema.parse({
        category: 'serious_injury',
        eventDate: '2026-04-01',
        description: 'Fall resulting in broken arm.',
      });
      expect(result.status).toBe('draft');
    });
  });

  // -----------------------------------------------------------------------
  // Pathway Plans
  // -----------------------------------------------------------------------

  describe('createPathwayPlanSchema', () => {
    it('accepts valid pathway plan', () => {
      const result = createPathwayPlanSchema.safeParse({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        dateOfBirth: '2009-06-15',
        personalAdviser: 'Sarah Williams',
        planStartDate: '2026-04-01',
        planReviewDate: '2026-10-01',
        sections: {
          accommodation: 'Supported lodgings arranged.',
          education: 'Enrolled in college.',
          employment: 'Part-time role secured.',
          health: 'Registered with GP.',
          financialSupport: 'Universal Credit application submitted.',
          relationships: 'Family mediation ongoing.',
          identity: 'Life story work completed.',
          practicalSkills: 'Cooking and budgeting sessions attended.',
        },
      });
      expect(result.success).toBe(true);
    });

    it('requires personId', () => {
      const result = createPathwayPlanSchema.safeParse({
        planStartDate: '2026-04-01',
        sections: {},
      });
      expect(result.success).toBe(false);
    });

    it('requires planStartDate', () => {
      const result = createPathwayPlanSchema.safeParse({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        planStartDate: '',
        sections: {},
      });
      expect(result.success).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Milestones
  // -----------------------------------------------------------------------

  describe('createMilestoneSchema', () => {
    it('accepts valid milestone', () => {
      const result = createMilestoneSchema.safeParse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Open bank account',
        category: 'finance',
        targetDate: '2026-06-01',
      });
      expect(result.success).toBe(true);
    });

    it('validates category enum', () => {
      const result = createMilestoneSchema.safeParse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        category: 'cooking',
      });
      expect(result.success).toBe(false);
    });

    it('defaults status to not-started', () => {
      const result = createMilestoneSchema.parse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Register with GP',
        category: 'health',
      });
      expect(result.status).toBe('not-started');
    });
  });

  // -----------------------------------------------------------------------
  // Independent Living Assessments
  // -----------------------------------------------------------------------

  describe('createAssessmentSchema', () => {
    it('accepts valid assessment', () => {
      const result = createAssessmentSchema.safeParse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        assessmentDate: '2026-04-01',
        assessorName: 'Dr. Smith',
        skills: {
          dailyLiving: [{ skill: 'Cooking', rating: 3, notes: 'Can make basic meals' }],
          financialCapability: [{ skill: 'Budgeting', rating: 2, notes: '' }],
          healthAndWellbeing: [],
          socialAndRelationships: [],
          educationAndWork: [],
          housingKnowledge: [],
        },
        overallScore: 65,
        isBaseline: true,
      });
      expect(result.success).toBe(true);
    });

    it('validates skill rating range (1-5)', () => {
      const result = createAssessmentSchema.safeParse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        assessmentDate: '2026-04-01',
        assessorName: 'Dr. Smith',
        skills: {
          dailyLiving: [{ skill: 'Cooking', rating: 6, notes: '' }],
          financialCapability: [],
          healthAndWellbeing: [],
          socialAndRelationships: [],
          educationAndWork: [],
          housingKnowledge: [],
        },
      });
      expect(result.success).toBe(false);
    });

    it('requires assessorName', () => {
      const result = createAssessmentSchema.safeParse({
        pathwayPlanId: '550e8400-e29b-41d4-a716-446655440000',
        assessmentDate: '2026-04-01',
        assessorName: '',
        skills: {},
      });
      expect(result.success).toBe(false);
    });
  });
});
