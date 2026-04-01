/**
 * Tests for care plan schema, validation, and utilities.
 *
 * Validates:
 * - care_plans and care_plan_versions tables have required columns
 * - Zod validation schemas work correctly
 * - Review date calculation utilities
 * - Diff comparison algorithm
 * - Templates generate correct sections
 * - RBAC permissions for care_plans resource
 */

import { describe, it, expect } from 'vitest';
import { carePlans } from '@/lib/db/schema/care-plans';
import { carePlanVersions } from '@/lib/db/schema/care-plan-versions';
import {
  createCarePlanSchema,
  updateCarePlanSchema,
  calculateNextReviewDate,
  isReviewOverdue,
  isReviewDueSoon,
  getReviewStatus,
} from '@/features/care-plans/schema';
import {
  diffText,
  computeCarePlanDiff,
  formatVersion,
  getStatusVariant,
} from '@/features/care-plans/utils';
import {
  CARE_PLAN_TEMPLATES,
  TEMPLATE_LIST,
  createSectionsFromTemplate,
  createSection,
  SECTION_DEFAULTS,
} from '@/features/care-plans/templates';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// care_plans table schema
// ---------------------------------------------------------------------------

describe('care_plans table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(carePlans);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('title');
    expect(columns).toContain('status');
    expect(columns).toContain('version');
    expect(columns).toContain('sections');
    expect(columns).toContain('template');
    expect(columns).toContain('reviewFrequency');
    expect(columns).toContain('nextReviewDate');
    expect(columns).toContain('approvedAt');
    expect(columns).toContain('submittedAt');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
    expect(columns).toContain('deletedAt');
  });

  it('has approval-related columns', () => {
    const columns = Object.keys(carePlans);
    expect(columns).toContain('approvedById');
    expect(columns).toContain('authorisedBy');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(carePlans);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// care_plan_versions table schema
// ---------------------------------------------------------------------------

describe('care_plan_versions table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(carePlanVersions);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('carePlanId');
    expect(columns).toContain('versionNumber');
    expect(columns).toContain('title');
    expect(columns).toContain('sections');
    expect(columns).toContain('status');
    expect(columns).toContain('createdById');
    expect(columns).toContain('createdByName');
    expect(columns).toContain('createdAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(carePlanVersions);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createCarePlanSchema
// ---------------------------------------------------------------------------

describe('createCarePlanSchema', () => {
  it('validates a valid input', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Comprehensive Care Plan',
      template: 'comprehensive',
      sections: [],
      reviewFrequency: 'monthly',
      nextReviewDate: '2026-04-30',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const result = createCarePlanSchema.safeParse({
      title: 'My Care Plan',
      sections: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
      sections: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid review frequency', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Plan',
      sections: [],
      reviewFrequency: 'yearly',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null template (blank plan)', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Blank Plan',
      template: null,
      sections: [],
    });
    expect(result.success).toBe(true);
  });

  it('validates review date format', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Plan',
      sections: [],
      nextReviewDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('defaults reviewFrequency to monthly', () => {
    const result = createCarePlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Plan',
      sections: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviewFrequency).toBe('monthly');
    }
  });
});

// ---------------------------------------------------------------------------
// updateCarePlanSchema
// ---------------------------------------------------------------------------

describe('updateCarePlanSchema', () => {
  it('validates partial update', () => {
    const result = updateCarePlanSchema.safeParse({
      title: 'Updated Title',
    });
    expect(result.success).toBe(true);
  });

  it('validates sections update', () => {
    const result = updateCarePlanSchema.safeParse({
      sections: [
        {
          id: 'section-1',
          type: 'health',
          title: 'Health',
          content: 'Patient has hypertension',
          order: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid section type', () => {
    const result = updateCarePlanSchema.safeParse({
      sections: [
        {
          id: 'section-1',
          type: 'unknown_type',
          title: 'Unknown',
          content: '',
          order: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// calculateNextReviewDate
// ---------------------------------------------------------------------------

describe('calculateNextReviewDate', () => {
  it('calculates weekly next review date', () => {
    const from = new Date('2026-04-01');
    const result = calculateNextReviewDate(from, 'weekly');
    expect(result).toBe('2026-04-08');
  });

  it('calculates monthly next review date', () => {
    const from = new Date('2026-04-01');
    const result = calculateNextReviewDate(from, 'monthly');
    expect(result).toBe('2026-05-01');
  });

  it('calculates quarterly next review date', () => {
    const from = new Date('2026-04-01');
    const result = calculateNextReviewDate(from, 'quarterly');
    expect(result).toBe('2026-07-01');
  });
});

// ---------------------------------------------------------------------------
// isReviewOverdue / isReviewDueSoon / getReviewStatus
// ---------------------------------------------------------------------------

describe('review status utilities', () => {
  it('isReviewOverdue — returns true for past date', () => {
    expect(isReviewOverdue('2025-01-01')).toBe(true);
  });

  it('isReviewOverdue — returns false for future date', () => {
    expect(isReviewOverdue('2099-01-01')).toBe(false);
  });

  it('isReviewOverdue — returns false for null', () => {
    expect(isReviewOverdue(null)).toBe(false);
  });

  it('isReviewDueSoon — returns true for date within 7 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const dateStr = soon.toISOString().slice(0, 10);
    expect(isReviewDueSoon(dateStr)).toBe(true);
  });

  it('isReviewDueSoon — returns false for date beyond 7 days', () => {
    expect(isReviewDueSoon('2099-12-31')).toBe(false);
  });

  it('getReviewStatus — overdue', () => {
    expect(getReviewStatus('2020-01-01')).toBe('overdue');
  });

  it('getReviewStatus — none for null', () => {
    expect(getReviewStatus(null)).toBe('none');
  });

  it('getReviewStatus — upcoming for far future', () => {
    expect(getReviewStatus('2099-01-01')).toBe('upcoming');
  });
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

describe('care plan templates', () => {
  it('defines 5 templates (including blank)', () => {
    expect(TEMPLATE_LIST).toHaveLength(5);
  });

  it('comprehensive template has all 9 sections', () => {
    const template = CARE_PLAN_TEMPLATES.comprehensive;
    expect(template.sectionTypes).toHaveLength(9);
    expect(template.sectionTypes).toContain('personal_details');
    expect(template.sectionTypes).toContain('health');
    expect(template.sectionTypes).toContain('mobility');
    expect(template.sectionTypes).toContain('nutrition');
    expect(template.sectionTypes).toContain('continence');
    expect(template.sectionTypes).toContain('personal_care');
    expect(template.sectionTypes).toContain('communication');
    expect(template.sectionTypes).toContain('social');
    expect(template.sectionTypes).toContain('end_of_life');
  });

  it('blank template has no sections', () => {
    const template = CARE_PLAN_TEMPLATES.blank;
    expect(template.sectionTypes).toHaveLength(0);
  });

  it('createSectionsFromTemplate generates correct section count', () => {
    const sections = createSectionsFromTemplate('comprehensive');
    expect(sections).toHaveLength(9);
  });

  it('createSectionsFromTemplate for blank returns empty array', () => {
    const sections = createSectionsFromTemplate('blank');
    expect(sections).toHaveLength(0);
  });

  it('each section has a unique id', () => {
    const sections = createSectionsFromTemplate('comprehensive');
    const ids = sections.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('sections have correct order indices', () => {
    const sections = createSectionsFromTemplate('comprehensive');
    sections.forEach((s, idx) => {
      expect(s.order).toBe(idx);
    });
  });

  it('createSection generates section with correct type and title', () => {
    const section = createSection('health', 0);
    expect(section.type).toBe('health');
    expect(section.title).toBe(SECTION_DEFAULTS.health.title);
    expect(section.content).toBe('');
    expect(section.order).toBe(0);
  });

  it('all section types have defaults defined', () => {
    const sectionTypes = [
      'personal_details',
      'health',
      'mobility',
      'nutrition',
      'continence',
      'personal_care',
      'communication',
      'social',
      'end_of_life',
      'custom',
    ];
    for (const type of sectionTypes) {
      expect(SECTION_DEFAULTS[type as keyof typeof SECTION_DEFAULTS]).toBeDefined();
      expect(SECTION_DEFAULTS[type as keyof typeof SECTION_DEFAULTS].title).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// diffText utility
// ---------------------------------------------------------------------------

describe('diffText', () => {
  it('returns unchanged lines when texts are identical', () => {
    const result = diffText('line1\nline2', 'line1\nline2');
    expect(result.every((l) => l.type === 'unchanged')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('marks added lines correctly', () => {
    const result = diffText('line1', 'line1\nline2');
    const added = result.filter((l) => l.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].text).toBe('line2');
  });

  it('marks removed lines correctly', () => {
    const result = diffText('line1\nline2', 'line1');
    const removed = result.filter((l) => l.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].text).toBe('line2');
  });

  it('handles empty strings', () => {
    const result = diffText('', '');
    expect(result).toHaveLength(1); // single empty line
  });
});

// ---------------------------------------------------------------------------
// computeCarePlanDiff
// ---------------------------------------------------------------------------

describe('computeCarePlanDiff', () => {
  const baseVersion = {
    title: 'Care Plan v1',
    sections: [
      { id: 's1', type: 'health' as const, title: 'Health', content: 'Patient has hypertension', order: 0 },
      { id: 's2', type: 'mobility' as const, title: 'Mobility', content: 'Can walk independently', order: 1 },
    ],
  };

  it('detects title change', () => {
    const newVersion = { ...baseVersion, title: 'Care Plan v2' };
    const diff = computeCarePlanDiff(baseVersion, newVersion);
    expect(diff.titleChanged).toBe(true);
    expect(diff.oldTitle).toBe('Care Plan v1');
    expect(diff.newTitle).toBe('Care Plan v2');
  });

  it('detects no title change when unchanged', () => {
    const diff = computeCarePlanDiff(baseVersion, { ...baseVersion });
    expect(diff.titleChanged).toBe(false);
  });

  it('detects modified section', () => {
    const newVersion = {
      ...baseVersion,
      sections: [
        { ...baseVersion.sections[0], content: 'Patient has hypertension — controlled with medication' },
        baseVersion.sections[1],
      ],
    };
    const diff = computeCarePlanDiff(baseVersion, newVersion);
    expect(diff.modifiedSections).toHaveLength(1);
    expect(diff.modifiedSections[0]).toBe('Health');
  });

  it('detects added section', () => {
    const newVersion = {
      ...baseVersion,
      sections: [
        ...baseVersion.sections,
        { id: 's3', type: 'nutrition' as const, title: 'Nutrition', content: 'Normal diet', order: 2 },
      ],
    };
    const diff = computeCarePlanDiff(baseVersion, newVersion);
    expect(diff.addedSections).toHaveLength(1);
    expect(diff.addedSections[0]).toBe('Nutrition');
  });

  it('detects removed section', () => {
    const newVersion = {
      ...baseVersion,
      sections: [baseVersion.sections[0]],
    };
    const diff = computeCarePlanDiff(baseVersion, newVersion);
    expect(diff.removedSections).toHaveLength(1);
    expect(diff.removedSections[0]).toBe('Mobility');
  });

  it('returns empty changes for identical versions', () => {
    const diff = computeCarePlanDiff(baseVersion, { ...baseVersion });
    expect(diff.titleChanged).toBe(false);
    expect(diff.addedSections).toHaveLength(0);
    expect(diff.removedSections).toHaveLength(0);
    expect(diff.modifiedSections).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// formatVersion / getStatusVariant
// ---------------------------------------------------------------------------

describe('formatVersion', () => {
  it('formats version number with v prefix', () => {
    expect(formatVersion(1)).toBe('v1');
    expect(formatVersion(12)).toBe('v12');
  });
});

describe('getStatusVariant', () => {
  it('returns correct variants', () => {
    expect(getStatusVariant('approved')).toBe('default');
    expect(getStatusVariant('review')).toBe('secondary');
    expect(getStatusVariant('draft')).toBe('outline');
    expect(getStatusVariant('archived')).toBe('secondary');
    expect(getStatusVariant('unknown')).toBe('outline');
  });
});

// ---------------------------------------------------------------------------
// RBAC — care_plans resource
// ---------------------------------------------------------------------------

describe('RBAC — care_plans resource', () => {
  it('owner can read care plans', () => {
    expect(hasPermission('owner', 'read', 'care_plans')).toBe(true);
  });

  it('all roles can read care plans', () => {
    for (const role of ['owner', 'admin', 'manager', 'senior_carer', 'carer', 'viewer'] as const) {
      expect(hasPermission(role, 'read', 'care_plans')).toBe(true);
    }
  });

  it('owner can create care plans', () => {
    expect(hasPermission('owner', 'create', 'care_plans')).toBe(true);
  });

  it('carer CANNOT create care plans', () => {
    expect(hasPermission('carer', 'create', 'care_plans')).toBe(false);
  });

  it('viewer CANNOT create care plans', () => {
    expect(hasPermission('viewer', 'create', 'care_plans')).toBe(false);
  });

  it('senior_carer can create care plans', () => {
    expect(hasPermission('senior_carer', 'create', 'care_plans')).toBe(true);
  });

  it('manager can approve care plans', () => {
    expect(hasPermission('manager', 'approve', 'care_plans')).toBe(true);
  });

  it('senior_carer can approve care plans', () => {
    expect(hasPermission('senior_carer', 'approve', 'care_plans')).toBe(true);
  });

  it('carer CANNOT approve care plans', () => {
    expect(hasPermission('carer', 'approve', 'care_plans')).toBe(false);
  });

  it('viewer CANNOT approve care plans', () => {
    expect(hasPermission('viewer', 'approve', 'care_plans')).toBe(false);
  });

  it('owner can export care plans', () => {
    expect(hasPermission('owner', 'export', 'care_plans')).toBe(true);
  });
});
