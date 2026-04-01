/**
 * Tests for the Ofsted compliance engine schema validation.
 *
 * Validates:
 * - createEvidenceSchema validation rules
 * - updateEvidenceSchema validation rules
 * - createRegisterEntrySchema validation rules
 * - updateRegisterEntrySchema validation rules
 * - createStatementSchema validation rules
 * - updateStatementSchema validation rules
 * - Constants integrity
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  createEvidenceSchema,
  updateEvidenceSchema,
  createRegisterEntrySchema,
  updateRegisterEntrySchema,
  createStatementSchema,
  updateStatementSchema,
} from '@/features/ofsted/schema';

import {
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
  LEGAL_STATUSES,
  LEGAL_STATUS_LABELS,
  SOP_STATUSES,
  SOP_STATUS_LABELS,
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_LABELS,
} from '@/features/ofsted/constants';

// ---------------------------------------------------------------------------
// createEvidenceSchema
// ---------------------------------------------------------------------------

describe('createEvidenceSchema', () => {
  const validInput = {
    standardId: '550e8400-e29b-41d4-a716-446655440000',
    subRequirementId: 'reg6_1',
    evidenceType: 'care_plan' as const,
    evidenceId: '660e8400-e29b-41d4-a716-446655440000',
    description: 'Annual care plan review completed',
    status: 'evidenced' as const,
  };

  it('accepts a valid complete evidence input', () => {
    const result = createEvidenceSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (required fields only)', () => {
    const result = createEvidenceSchema.safeParse({
      standardId: '550e8400-e29b-41d4-a716-446655440000',
      subRequirementId: 'reg6_1',
      evidenceType: 'manual',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('evidenced');
    }
  });

  it('rejects when standardId is not a valid UUID', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      standardId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when subRequirementId is empty', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      subRequirementId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid evidence type', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      evidenceType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null evidenceId', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      evidenceId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all evidence types', () => {
    for (const type of EVIDENCE_TYPES) {
      const result = createEvidenceSchema.safeParse({
        ...validInput,
        evidenceType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all evidence statuses', () => {
    for (const status of EVIDENCE_STATUSES) {
      const result = createEvidenceSchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects description longer than 2000 characters', () => {
    const result = createEvidenceSchema.safeParse({
      ...validInput,
      description: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateEvidenceSchema
// ---------------------------------------------------------------------------

describe('updateEvidenceSchema', () => {
  it('accepts partial updates', () => {
    const result = updateEvidenceSchema.safeParse({ status: 'partial' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateEvidenceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateEvidenceSchema.safeParse({
      evidenceType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createRegisterEntrySchema
// ---------------------------------------------------------------------------

describe('createRegisterEntrySchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    admissionDate: '2025-01-15',
    legalStatus: 'full_care_order' as const,
    placingAuthority: 'Birmingham City Council',
    socialWorkerName: 'Jane Smith',
    socialWorkerEmail: 'jane.smith@birmingham.gov.uk',
    socialWorkerPhone: '0121-303-1234',
    iroName: 'Dr. Johnson',
    emergencyContact: {
      name: 'Mary Jones',
      relationship: 'Mother',
      phone: '07700 123456',
      email: 'mary@example.com',
    },
  };

  it('accepts a valid complete register entry', () => {
    const result = createRegisterEntrySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (required fields only)', () => {
    const result = createRegisterEntrySchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      admissionDate: '2025-01-15',
      legalStatus: 'section20',
      placingAuthority: 'Leeds City Council',
      emergencyContact: {
        name: 'John Doe',
        relationship: 'Father',
        phone: '07700 654321',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects when personId is not a valid UUID', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid admissionDate format', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      admissionDate: '15/01/2025',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid legalStatus', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      legalStatus: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all legal statuses', () => {
    for (const status of LEGAL_STATUSES) {
      const result = createRegisterEntrySchema.safeParse({
        ...validInput,
        legalStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects when placingAuthority is empty', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      placingAuthority: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when emergency contact name is empty', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      emergencyContact: {
        name: '',
        relationship: 'Mother',
        phone: '07700 123456',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid dischargeDate format', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      dischargeDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null dischargeDate', () => {
    const result = createRegisterEntrySchema.safeParse({
      ...validInput,
      dischargeDate: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateRegisterEntrySchema
// ---------------------------------------------------------------------------

describe('updateRegisterEntrySchema', () => {
  it('accepts partial updates', () => {
    const result = updateRegisterEntrySchema.safeParse({
      legalStatus: 'interim_care_order',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateRegisterEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateRegisterEntrySchema.safeParse({
      admissionDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createStatementSchema
// ---------------------------------------------------------------------------

describe('createStatementSchema', () => {
  const validInput = {
    content: [
      {
        id: 'sop_aims',
        title: 'Aims and Objectives',
        content: 'Our aims are...',
        order: 1,
      },
    ],
    status: 'draft' as const,
  };

  it('accepts a valid statement input', () => {
    const result = createStatementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty content array', () => {
    const result = createStatementSchema.safeParse({
      content: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects section with empty id', () => {
    const result = createStatementSchema.safeParse({
      content: [
        { id: '', title: 'Aims', content: 'text', order: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects section with empty title', () => {
    const result = createStatementSchema.safeParse({
      content: [
        { id: 'sop_aims', title: '', content: 'text', order: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all SOP statuses', () => {
    for (const status of SOP_STATUSES) {
      const result = createStatementSchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults status to draft', () => {
    const result = createStatementSchema.safeParse({
      content: validInput.content,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });
});

// ---------------------------------------------------------------------------
// updateStatementSchema
// ---------------------------------------------------------------------------

describe('updateStatementSchema', () => {
  it('accepts partial updates', () => {
    const result = updateStatementSchema.safeParse({ status: 'current' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateStatementSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Constants integrity
// ---------------------------------------------------------------------------

describe('Ofsted constants', () => {
  it('EVIDENCE_STATUSES contains all values', () => {
    expect(EVIDENCE_STATUSES).toEqual(['evidenced', 'partial', 'missing']);
  });

  it('EVIDENCE_STATUS_LABELS has labels for all statuses', () => {
    for (const status of EVIDENCE_STATUSES) {
      expect(EVIDENCE_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('LEGAL_STATUSES contains all values', () => {
    expect(LEGAL_STATUSES).toEqual([
      'full_care_order',
      'interim_care_order',
      'section20',
      'remand',
      'other',
    ]);
  });

  it('LEGAL_STATUS_LABELS has labels for all statuses', () => {
    for (const status of LEGAL_STATUSES) {
      expect(LEGAL_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('SOP_STATUSES contains all values', () => {
    expect(SOP_STATUSES).toEqual(['draft', 'current', 'archived']);
  });

  it('SOP_STATUS_LABELS has labels for all statuses', () => {
    for (const status of SOP_STATUSES) {
      expect(SOP_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('EVIDENCE_TYPES contains all values', () => {
    expect(EVIDENCE_TYPES).toEqual([
      'care_plan',
      'note',
      'incident',
      'training',
      'document',
      'manual',
    ]);
  });

  it('EVIDENCE_TYPE_LABELS has labels for all types', () => {
    for (const type of EVIDENCE_TYPES) {
      expect(EVIDENCE_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});
