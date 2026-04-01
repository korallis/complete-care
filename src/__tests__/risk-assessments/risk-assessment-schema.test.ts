/**
 * Tests for risk assessment schema, templates, scoring, and alerts.
 *
 * Validates:
 * - risk_assessments table has required columns
 * - Zod validation schemas work correctly
 * - Template scoring correctness
 * - Risk level calculation per template thresholds
 * - Alert logic (overdue → amber, high-risk → red)
 * - RBAC permissions for assessments resource
 */

import { describe, it, expect } from 'vitest';
import { riskAssessments } from '@/lib/db/schema/risk-assessments';
import {
  createRiskAssessmentSchema,
  completeRiskAssessmentSchema,
  calculateNextReviewDate,
  isReviewOverdue,
  isReviewDueSoon,
} from '@/features/risk-assessments/schema';
import {
  calculateTotalScore,
  calculateRiskLevel,
  calculateAssessmentResult,
  isAssessmentComplete,
  getUnansweredQuestions,
  RISK_LEVEL_LABELS,
  getMaxScore,
} from '@/features/risk-assessments/scoring';
import {
  RISK_ASSESSMENT_TEMPLATES,
  TEMPLATE_LIST,
  getTemplate,
  TEMPLATE_LABELS,
} from '@/features/risk-assessments/templates';
import {
  isHighRiskAlert,
  isOverdueAlert,
  getAssessmentAlerts,
  getAlertsForAssessments,
  getHighestSeverity,
  getNotificationType,
} from '@/features/risk-assessments/alerts';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// risk_assessments table schema
// ---------------------------------------------------------------------------

describe('risk_assessments table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(riskAssessments);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('templateId');
    expect(columns).toContain('scores');
    expect(columns).toContain('totalScore');
    expect(columns).toContain('riskLevel');
    expect(columns).toContain('status');
    expect(columns).toContain('version');
    expect(columns).toContain('completedById');
    expect(columns).toContain('completedByName');
    expect(columns).toContain('completedAt');
    expect(columns).toContain('reviewFrequency');
    expect(columns).toContain('reviewDate');
    expect(columns).toContain('notes');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(riskAssessments);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createRiskAssessmentSchema
// ---------------------------------------------------------------------------

describe('createRiskAssessmentSchema', () => {
  it('validates a valid input', () => {
    const result = createRiskAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      templateId: 'falls',
      reviewFrequency: 'monthly',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const result = createRiskAssessmentSchema.safeParse({
      templateId: 'falls',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid templateId', () => {
    const result = createRiskAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      templateId: 'invalid_template',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 7 valid template IDs', () => {
    const templates = [
      'falls',
      'waterlow',
      'must',
      'moving_handling',
      'fire_peep',
      'medication',
      'choking',
    ];
    for (const templateId of templates) {
      const result = createRiskAssessmentSchema.safeParse({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        templateId,
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults reviewFrequency to monthly', () => {
    const result = createRiskAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      templateId: 'falls',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviewFrequency).toBe('monthly');
    }
  });

  it('rejects invalid reviewFrequency', () => {
    const result = createRiskAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      templateId: 'falls',
      reviewFrequency: 'yearly',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// completeRiskAssessmentSchema
// ---------------------------------------------------------------------------

describe('completeRiskAssessmentSchema', () => {
  it('validates valid scores', () => {
    const result = completeRiskAssessmentSchema.safeParse({
      scores: { falls_history: 2, falls_mobility: 1 },
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional notes', () => {
    const result = completeRiskAssessmentSchema.safeParse({
      scores: { falls_history: 0 },
      notes: 'Patient is stable.',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional review date', () => {
    const result = completeRiskAssessmentSchema.safeParse({
      scores: { falls_history: 0 },
      reviewDate: '2026-05-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid review date format', () => {
    const result = completeRiskAssessmentSchema.safeParse({
      scores: { falls_history: 0 },
      reviewDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative scores', () => {
    const result = completeRiskAssessmentSchema.safeParse({
      scores: { falls_history: -1 },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

describe('risk assessment templates', () => {
  it('defines 7 templates', () => {
    expect(TEMPLATE_LIST).toHaveLength(7);
  });

  it('all templates have the correct structure', () => {
    for (const template of TEMPLATE_LIST) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.questions.length).toBeGreaterThan(0);
      expect(template.thresholds).toBeDefined();
      expect(template.thresholds.low).toBeDefined();
      expect(template.thresholds.medium).toBeDefined();
      expect(template.thresholds.high).toBeDefined();
      expect(template.thresholds.critical).toBeDefined();
      expect(template.defaultReviewFrequency).toBeTruthy();
    }
  });

  it('all templates have labels defined', () => {
    for (const template of TEMPLATE_LIST) {
      expect(TEMPLATE_LABELS[template.id]).toBeTruthy();
    }
  });

  it('getTemplate returns template for valid ID', () => {
    const template = getTemplate('falls');
    expect(template).toBeDefined();
    expect(template?.id).toBe('falls');
  });

  it('getTemplate returns undefined for invalid ID', () => {
    const template = getTemplate('invalid');
    expect(template).toBeUndefined();
  });

  it('falls template has 6 questions', () => {
    expect(RISK_ASSESSMENT_TEMPLATES.falls.questions).toHaveLength(6);
  });

  it('waterlow template has 7 questions', () => {
    expect(RISK_ASSESSMENT_TEMPLATES.waterlow.questions).toHaveLength(7);
  });

  it('MUST template has 5 questions', () => {
    expect(RISK_ASSESSMENT_TEMPLATES.must.questions).toHaveLength(5);
  });

  it('all question IDs are unique within each template', () => {
    for (const template of TEMPLATE_LIST) {
      const ids = template.questions.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('all question options have non-negative values', () => {
    for (const template of TEMPLATE_LIST) {
      for (const question of template.questions) {
        for (const option of question.options) {
          expect(option.value).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('threshold ranges are contiguous and complete', () => {
    for (const template of TEMPLATE_LIST) {
      const { thresholds } = template;
      // Low starts at 0
      expect(thresholds.low.min).toBe(0);
      // Medium starts where low max ends + 1
      expect(thresholds.medium.min).toBe(thresholds.low.max + 1);
      // High starts where medium max ends + 1
      expect(thresholds.high.min).toBe(thresholds.medium.max + 1);
      // Critical starts where high max ends + 1
      expect(thresholds.critical.min).toBe(thresholds.high.max + 1);
    }
  });
});

// ---------------------------------------------------------------------------
// Scoring engine
// ---------------------------------------------------------------------------

describe('scoring engine', () => {
  describe('calculateTotalScore', () => {
    it('sums all score values', () => {
      expect(calculateTotalScore({ a: 1, b: 2, c: 3 })).toBe(6);
    });

    it('returns 0 for empty scores', () => {
      expect(calculateTotalScore({})).toBe(0);
    });

    it('handles single score', () => {
      expect(calculateTotalScore({ a: 5 })).toBe(5);
    });
  });

  describe('calculateRiskLevel', () => {
    const fallsThresholds = RISK_ASSESSMENT_TEMPLATES.falls.thresholds;

    it('returns low for score 0', () => {
      expect(calculateRiskLevel(0, fallsThresholds)).toBe('low');
    });

    it('returns low for score 3 (falls)', () => {
      expect(calculateRiskLevel(3, fallsThresholds)).toBe('low');
    });

    it('returns medium for score 4 (falls)', () => {
      expect(calculateRiskLevel(4, fallsThresholds)).toBe('medium');
    });

    it('returns high for score 9 (falls)', () => {
      expect(calculateRiskLevel(9, fallsThresholds)).toBe('high');
    });

    it('returns critical for score 15 (falls)', () => {
      expect(calculateRiskLevel(15, fallsThresholds)).toBe('critical');
    });

    it('returns critical for score above max (falls)', () => {
      expect(calculateRiskLevel(99, fallsThresholds)).toBe('critical');
    });
  });

  describe('calculateAssessmentResult', () => {
    it('calculates falls assessment correctly (all low)', () => {
      const scores = {
        falls_history: 0,
        falls_mobility: 0,
        falls_medication: 0,
        falls_cognition: 0,
        falls_vision: 0,
        falls_continence: 0,
      };
      const result = calculateAssessmentResult(scores, 'falls');
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe('low');
    });

    it('calculates falls assessment correctly (all high)', () => {
      const scores = {
        falls_history: 3,
        falls_mobility: 3,
        falls_medication: 3,
        falls_cognition: 3,
        falls_vision: 3,
        falls_continence: 3,
      };
      const result = calculateAssessmentResult(scores, 'falls');
      expect(result.totalScore).toBe(18);
      expect(result.riskLevel).toBe('critical');
    });

    it('calculates MUST assessment (low = 0)', () => {
      const scores = {
        must_bmi: 0,
        must_weight_loss: 0,
        must_acute_disease: 0,
        must_fluid_intake: 0,
        must_eating_difficulty: 0,
      };
      const result = calculateAssessmentResult(scores, 'must');
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe('low');
    });

    it('calculates MUST assessment (medium = 1)', () => {
      const scores = {
        must_bmi: 1,
        must_weight_loss: 0,
        must_acute_disease: 0,
        must_fluid_intake: 0,
        must_eating_difficulty: 0,
      };
      const result = calculateAssessmentResult(scores, 'must');
      expect(result.totalScore).toBe(1);
      expect(result.riskLevel).toBe('medium');
    });

    it('returns low for unknown template', () => {
      const result = calculateAssessmentResult({ a: 5 }, 'nonexistent');
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('isAssessmentComplete', () => {
    it('returns true when all questions answered', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.must;
      const scores = {
        must_bmi: 0,
        must_weight_loss: 0,
        must_acute_disease: 0,
        must_fluid_intake: 0,
        must_eating_difficulty: 0,
      };
      expect(isAssessmentComplete(scores, template)).toBe(true);
    });

    it('returns false when questions missing', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.must;
      const scores = { must_bmi: 0 };
      expect(isAssessmentComplete(scores, template)).toBe(false);
    });
  });

  describe('getUnansweredQuestions', () => {
    it('returns empty array when all answered', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.must;
      const scores = {
        must_bmi: 0,
        must_weight_loss: 0,
        must_acute_disease: 0,
        must_fluid_intake: 0,
        must_eating_difficulty: 0,
      };
      expect(getUnansweredQuestions(scores, template)).toHaveLength(0);
    });

    it('returns unanswered question IDs', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.must;
      const scores = { must_bmi: 0 };
      const unanswered = getUnansweredQuestions(scores, template);
      expect(unanswered).toHaveLength(4);
      expect(unanswered).toContain('must_weight_loss');
    });
  });

  describe('getMaxScore', () => {
    it('calculates max score for falls template', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.falls;
      // 6 questions * max 3 each = 18
      expect(getMaxScore(template)).toBe(18);
    });

    it('calculates max score for waterlow template', () => {
      const template = RISK_ASSESSMENT_TEMPLATES.waterlow;
      // Some questions have max 4, compute manually
      const max = template.questions.reduce(
        (sum, q) => sum + Math.max(...q.options.map((o) => o.value)),
        0,
      );
      expect(getMaxScore(template)).toBe(max);
    });
  });

  describe('RISK_LEVEL_LABELS', () => {
    it('has labels for all levels', () => {
      expect(RISK_LEVEL_LABELS.low).toBe('Low');
      expect(RISK_LEVEL_LABELS.medium).toBe('Medium');
      expect(RISK_LEVEL_LABELS.high).toBe('High');
      expect(RISK_LEVEL_LABELS.critical).toBe('Critical');
    });
  });
});

// ---------------------------------------------------------------------------
// Review date utilities
// ---------------------------------------------------------------------------

describe('review date utilities', () => {
  it('calculateNextReviewDate — weekly', () => {
    const result = calculateNextReviewDate(new Date('2026-04-01'), 'weekly');
    expect(result).toBe('2026-04-08');
  });

  it('calculateNextReviewDate — monthly', () => {
    const result = calculateNextReviewDate(new Date('2026-04-01'), 'monthly');
    expect(result).toBe('2026-05-01');
  });

  it('calculateNextReviewDate — quarterly', () => {
    const result = calculateNextReviewDate(new Date('2026-04-01'), 'quarterly');
    expect(result).toBe('2026-07-01');
  });

  it('isReviewOverdue — true for past date', () => {
    expect(isReviewOverdue('2025-01-01')).toBe(true);
  });

  it('isReviewOverdue — false for future date', () => {
    expect(isReviewOverdue('2099-01-01')).toBe(false);
  });

  it('isReviewOverdue — false for null', () => {
    expect(isReviewOverdue(null)).toBe(false);
  });

  it('isReviewDueSoon — true within 7 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(isReviewDueSoon(soon.toISOString().slice(0, 10))).toBe(true);
  });

  it('isReviewDueSoon — false for far future', () => {
    expect(isReviewDueSoon('2099-12-31')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Alert logic
// ---------------------------------------------------------------------------

describe('alert logic', () => {
  describe('isHighRiskAlert', () => {
    it('returns true for high', () => {
      expect(isHighRiskAlert('high')).toBe(true);
    });

    it('returns true for critical', () => {
      expect(isHighRiskAlert('critical')).toBe(true);
    });

    it('returns false for medium', () => {
      expect(isHighRiskAlert('medium')).toBe(false);
    });

    it('returns false for low', () => {
      expect(isHighRiskAlert('low')).toBe(false);
    });
  });

  describe('isOverdueAlert', () => {
    it('returns true for past date', () => {
      expect(isOverdueAlert('2020-01-01')).toBe(true);
    });

    it('returns false for future date', () => {
      expect(isOverdueAlert('2099-01-01')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isOverdueAlert(null)).toBe(false);
    });
  });

  describe('getAssessmentAlerts', () => {
    it('returns red alert for high-risk completed assessment', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'high',
        reviewDate: '2099-01-01',
        status: 'completed',
      });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('red');
    });

    it('returns red alert for critical-risk completed assessment', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'critical',
        reviewDate: '2099-01-01',
        status: 'completed',
      });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('red');
    });

    it('returns amber alert for overdue review', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'low',
        reviewDate: '2020-01-01',
        status: 'completed',
      });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('amber');
    });

    it('returns both red and amber when high-risk + overdue', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'high',
        reviewDate: '2020-01-01',
        status: 'completed',
      });
      expect(alerts).toHaveLength(2);
      expect(alerts.some((a) => a.severity === 'red')).toBe(true);
      expect(alerts.some((a) => a.severity === 'amber')).toBe(true);
    });

    it('returns no alerts for low-risk future review', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'low',
        reviewDate: '2099-01-01',
        status: 'completed',
      });
      expect(alerts).toHaveLength(0);
    });

    it('returns no alerts for draft assessments', () => {
      const alerts = getAssessmentAlerts({
        id: 'a1',
        templateId: 'falls',
        personId: 'p1',
        riskLevel: 'high',
        reviewDate: '2020-01-01',
        status: 'draft',
      });
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getAlertsForAssessments', () => {
    it('aggregates alerts across multiple assessments', () => {
      const alerts = getAlertsForAssessments([
        {
          id: 'a1',
          templateId: 'falls',
          personId: 'p1',
          riskLevel: 'high',
          reviewDate: '2099-01-01',
          status: 'completed',
        },
        {
          id: 'a2',
          templateId: 'waterlow',
          personId: 'p1',
          riskLevel: 'low',
          reviewDate: '2020-01-01',
          status: 'completed',
        },
      ]);
      expect(alerts).toHaveLength(2);
    });
  });

  describe('getHighestSeverity', () => {
    it('returns null for empty alerts', () => {
      expect(getHighestSeverity([])).toBeNull();
    });

    it('returns red when any red alert exists', () => {
      expect(
        getHighestSeverity([
          {
            severity: 'amber',
            title: 't',
            message: 'm',
            assessmentId: 'a',
            templateId: 't',
            personId: 'p',
          },
          {
            severity: 'red',
            title: 't',
            message: 'm',
            assessmentId: 'a',
            templateId: 't',
            personId: 'p',
          },
        ]),
      ).toBe('red');
    });

    it('returns amber when only amber alerts', () => {
      expect(
        getHighestSeverity([
          {
            severity: 'amber',
            title: 't',
            message: 'm',
            assessmentId: 'a',
            templateId: 't',
            personId: 'p',
          },
        ]),
      ).toBe('amber');
    });
  });

  describe('getNotificationType', () => {
    it('returns correct type for red', () => {
      expect(getNotificationType('red')).toBe('risk_alert_high');
    });

    it('returns correct type for amber', () => {
      expect(getNotificationType('amber')).toBe('risk_alert_overdue');
    });
  });
});

// ---------------------------------------------------------------------------
// RBAC — assessments resource
// ---------------------------------------------------------------------------

describe('RBAC — assessments resource', () => {
  it('all roles can read assessments', () => {
    for (const role of [
      'owner',
      'admin',
      'manager',
      'senior_carer',
      'carer',
      'viewer',
    ] as const) {
      expect(hasPermission(role, 'read', 'assessments')).toBe(true);
    }
  });

  it('owner can create assessments', () => {
    expect(hasPermission('owner', 'create', 'assessments')).toBe(true);
  });

  it('senior_carer can create assessments', () => {
    expect(hasPermission('senior_carer', 'create', 'assessments')).toBe(true);
  });

  it('carer CANNOT create assessments', () => {
    expect(hasPermission('carer', 'create', 'assessments')).toBe(false);
  });

  it('viewer CANNOT create assessments', () => {
    expect(hasPermission('viewer', 'create', 'assessments')).toBe(false);
  });

  it('manager can approve assessments', () => {
    expect(hasPermission('manager', 'approve', 'assessments')).toBe(true);
  });

  it('carer CANNOT approve assessments', () => {
    expect(hasPermission('carer', 'approve', 'assessments')).toBe(false);
  });
});
