/**
 * Tests for LAC documentation hub — schema, validation, and utilities.
 *
 * Validates:
 * - lac_records, placement_plans, lac_status_changes tables have required columns
 * - Zod validation schemas work correctly
 * - Due date calculation utility (5 working days)
 * - Overdue detection utility
 * - Constants correctness
 */

import { describe, it, expect } from 'vitest';
import { lacRecords, placementPlans, lacStatusChanges } from '@/lib/db/schema/lac';
import {
  createLacRecordSchema,
  updateLacRecordSchema,
  createPlacementPlanSchema,
  updatePlacementPlanSchema,
  createStatusChangeSchema,
} from '@/features/lac/schema';
import {
  LAC_LEGAL_STATUSES,
  LAC_LEGAL_STATUS_LABELS,
  LAC_LEGAL_STATUS_SHORT_LABELS,
  PLACEMENT_PLAN_STATUSES,
  PLACEMENT_PLAN_STATUS_LABELS,
  calculatePlacementPlanDueDate,
  isPlacementPlanOverdue,
} from '@/features/lac/constants';

// ---------------------------------------------------------------------------
// lac_records table schema
// ---------------------------------------------------------------------------

describe('lac_records table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(lacRecords);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('legalStatus');
    expect(columns).toContain('legalStatusDate');
    expect(columns).toContain('placingAuthority');
    expect(columns).toContain('socialWorkerName');
    expect(columns).toContain('socialWorkerEmail');
    expect(columns).toContain('socialWorkerPhone');
    expect(columns).toContain('iroName');
    expect(columns).toContain('iroEmail');
    expect(columns).toContain('iroPhone');
    expect(columns).toContain('admissionDate');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(lacRecords);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// placement_plans table schema
// ---------------------------------------------------------------------------

describe('placement_plans table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(placementPlans);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('lacRecordId');
    expect(columns).toContain('dueDate');
    expect(columns).toContain('completedDate');
    expect(columns).toContain('content');
    expect(columns).toContain('status');
    expect(columns).toContain('reviewDate');
    expect(columns).toContain('reviewedById');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(placementPlans);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// lac_status_changes table schema
// ---------------------------------------------------------------------------

describe('lac_status_changes table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(lacStatusChanges);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('lacRecordId');
    expect(columns).toContain('previousStatus');
    expect(columns).toContain('newStatus');
    expect(columns).toContain('changedDate');
    expect(columns).toContain('reason');
    expect(columns).toContain('changedById');
    expect(columns).toContain('changedByName');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(lacStatusChanges);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createLacRecordSchema
// ---------------------------------------------------------------------------

describe('createLacRecordSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    legalStatus: 'section20' as const,
    legalStatusDate: '2026-03-15',
    placingAuthority: 'London Borough of Camden',
    socialWorkerName: 'Jane Smith',
    socialWorkerEmail: 'jane.smith@camden.gov.uk',
    socialWorkerPhone: '020 1234 5678',
    iroName: 'John Doe',
    iroEmail: 'john.doe@camden.gov.uk',
    iroPhone: '020 9876 5432',
    admissionDate: '2026-03-20',
  };

  it('validates a complete valid input', () => {
    const result = createLacRecordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('validates a minimal valid input', () => {
    const result = createLacRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      legalStatus: 'section31',
      legalStatusDate: '2026-03-15',
      placingAuthority: 'Camden',
      admissionDate: '2026-03-20',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const { personId, ...rest } = validInput;
    const result = createLacRecordSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid personId', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing placingAuthority', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      placingAuthority: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid legalStatus', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      legalStatus: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      legalStatusDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid legal statuses', () => {
    for (const status of LAC_LEGAL_STATUSES) {
      const result = createLacRecordSchema.safeParse({
        ...validInput,
        legalStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts nullable optional fields', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      socialWorkerName: null,
      socialWorkerEmail: null,
      socialWorkerPhone: null,
      iroName: null,
      iroEmail: null,
      iroPhone: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email for social worker', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      socialWorkerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email for IRO', () => {
    const result = createLacRecordSchema.safeParse({
      ...validInput,
      iroEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateLacRecordSchema
// ---------------------------------------------------------------------------

describe('updateLacRecordSchema', () => {
  it('validates partial update with one field', () => {
    const result = updateLacRecordSchema.safeParse({
      placingAuthority: 'Updated Authority',
    });
    expect(result.success).toBe(true);
  });

  it('validates partial update with legal status', () => {
    const result = updateLacRecordSchema.safeParse({
      legalStatus: 'co',
    });
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = updateLacRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid legal status', () => {
    const result = updateLacRecordSchema.safeParse({
      legalStatus: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createPlacementPlanSchema
// ---------------------------------------------------------------------------

describe('createPlacementPlanSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    lacRecordId: '660e8400-e29b-41d4-a716-446655440000',
    dueDate: '2026-03-25',
    content: {
      objectives: 'Key objectives',
      arrangements: 'Living arrangements',
    },
    status: 'draft' as const,
  };

  it('validates a valid input', () => {
    const result = createPlacementPlanSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('validates minimal input', () => {
    const result = createPlacementPlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      lacRecordId: '660e8400-e29b-41d4-a716-446655440000',
      dueDate: '2026-03-25',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const { personId, ...rest } = validInput;
    const result = createPlacementPlanSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing lacRecordId', () => {
    const { lacRecordId, ...rest } = validInput;
    const result = createPlacementPlanSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createPlacementPlanSchema.safeParse({
      ...validInput,
      dueDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('defaults status to pending', () => {
    const result = createPlacementPlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      lacRecordId: '660e8400-e29b-41d4-a716-446655440000',
      dueDate: '2026-03-25',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('pending');
    }
  });

  it('accepts all valid statuses', () => {
    for (const status of PLACEMENT_PLAN_STATUSES) {
      const result = createPlacementPlanSchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// updatePlacementPlanSchema
// ---------------------------------------------------------------------------

describe('updatePlacementPlanSchema', () => {
  it('validates partial update', () => {
    const result = updatePlacementPlanSchema.safeParse({
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });

  it('validates content update', () => {
    const result = updatePlacementPlanSchema.safeParse({
      content: { objectives: 'Updated objectives' },
    });
    expect(result.success).toBe(true);
  });

  it('validates completedDate', () => {
    const result = updatePlacementPlanSchema.safeParse({
      completedDate: '2026-04-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updatePlacementPlanSchema.safeParse({
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createStatusChangeSchema
// ---------------------------------------------------------------------------

describe('createStatusChangeSchema', () => {
  const validInput = {
    lacRecordId: '550e8400-e29b-41d4-a716-446655440000',
    previousStatus: 'section20' as const,
    newStatus: 'ico' as const,
    changedDate: '2026-03-25',
    reason: 'Court granted interim care order',
  };

  it('validates a valid input', () => {
    const result = createStatusChangeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('validates without optional reason', () => {
    const { reason, ...rest } = validInput;
    const result = createStatusChangeSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('rejects invalid previous status', () => {
    const result = createStatusChangeSchema.safeParse({
      ...validInput,
      previousStatus: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid new status', () => {
    const result = createStatusChangeSchema.safeParse({
      ...validInput,
      newStatus: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing lacRecordId', () => {
    const { lacRecordId, ...rest } = validInput;
    const result = createStatusChangeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('LAC constants', () => {
  it('defines 7 legal statuses', () => {
    expect(LAC_LEGAL_STATUSES).toHaveLength(7);
  });

  it('all legal statuses have labels', () => {
    for (const status of LAC_LEGAL_STATUSES) {
      expect(LAC_LEGAL_STATUS_LABELS[status]).toBeTruthy();
      expect(LAC_LEGAL_STATUS_SHORT_LABELS[status]).toBeTruthy();
    }
  });

  it('defines 4 placement plan statuses', () => {
    expect(PLACEMENT_PLAN_STATUSES).toHaveLength(4);
  });

  it('all placement plan statuses have labels', () => {
    for (const status of PLACEMENT_PLAN_STATUSES) {
      expect(PLACEMENT_PLAN_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('legal statuses include all required types', () => {
    expect(LAC_LEGAL_STATUSES).toContain('section20');
    expect(LAC_LEGAL_STATUSES).toContain('section31');
    expect(LAC_LEGAL_STATUSES).toContain('section38');
    expect(LAC_LEGAL_STATUSES).toContain('epo');
    expect(LAC_LEGAL_STATUSES).toContain('ico');
    expect(LAC_LEGAL_STATUSES).toContain('co');
    expect(LAC_LEGAL_STATUSES).toContain('sgo');
  });
});

// ---------------------------------------------------------------------------
// calculatePlacementPlanDueDate
// ---------------------------------------------------------------------------

describe('calculatePlacementPlanDueDate', () => {
  it('adds 5 working days (Mon admission)', () => {
    // 2026-03-16 is a Monday
    const result = calculatePlacementPlanDueDate('2026-03-16');
    // 5 working days later = 2026-03-23 (Monday)
    expect(result).toBe('2026-03-23');
  });

  it('adds 5 working days (Wed admission)', () => {
    // 2026-03-18 is a Wednesday
    const result = calculatePlacementPlanDueDate('2026-03-18');
    // Wed+5 working days = next Wed (skips weekend)
    expect(result).toBe('2026-03-25');
  });

  it('skips weekends (Fri admission)', () => {
    // 2026-03-20 is a Friday
    const result = calculatePlacementPlanDueDate('2026-03-20');
    // Fri -> Mon(1) -> Tue(2) -> Wed(3) -> Thu(4) -> Fri(5) = 2026-03-27
    expect(result).toBe('2026-03-27');
  });

  it('skips weekends (Thu admission)', () => {
    // 2026-03-19 is a Thursday
    const result = calculatePlacementPlanDueDate('2026-03-19');
    // Thu -> Fri(1) -> [Sat,Sun skip] -> Mon(2) -> Tue(3) -> Wed(4) -> Thu(5) = 2026-03-26
    expect(result).toBe('2026-03-26');
  });
});

// ---------------------------------------------------------------------------
// isPlacementPlanOverdue
// ---------------------------------------------------------------------------

describe('isPlacementPlanOverdue', () => {
  it('returns true for past due date with no completion', () => {
    expect(isPlacementPlanOverdue('2020-01-01', null)).toBe(true);
  });

  it('returns false for future due date', () => {
    expect(isPlacementPlanOverdue('2099-12-31', null)).toBe(false);
  });

  it('returns false if completed', () => {
    expect(isPlacementPlanOverdue('2020-01-01', '2020-01-02')).toBe(false);
  });
});
