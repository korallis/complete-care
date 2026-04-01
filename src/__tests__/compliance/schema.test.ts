/**
 * Tests for the compliance dashboard schema validation.
 *
 * Validates:
 * - createAgencySchema validation rules
 * - updateAgencySchema validation rules
 * - createAgencyWorkerSchema validation rules
 * - createRecruitmentRecordSchema validation rules
 * - updateRecruitmentRecordSchema validation rules
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
  createAgencySchema,
  updateAgencySchema,
  createAgencyWorkerSchema,
  updateAgencyWorkerSchema,
  createRecruitmentRecordSchema,
  updateRecruitmentRecordSchema,
  AGENCY_STATUSES,
  AGENCY_STATUS_LABELS,
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  REFERENCE_STATUSES,
  COMPLIANCE_AREAS,
  COMPLIANCE_AREA_LABELS,
  RAG_COLOURS,
} from '@/features/compliance/schema';

// ---------------------------------------------------------------------------
// createAgencySchema
// ---------------------------------------------------------------------------

describe('createAgencySchema', () => {
  const validInput = {
    agencyName: 'Care Staff Direct',
    contactEmail: 'hello@example.com',
    contactPhone: '01onal234567',
    contractStart: '2025-01-01',
    contractEnd: '2025-12-31',
    status: 'active' as const,
  };

  it('accepts a valid complete agency input', () => {
    const result = createAgencySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (name only)', () => {
    const result = createAgencySchema.safeParse({
      agencyName: 'Temp Staff Ltd',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });

  it('rejects when agencyName is empty', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      agencyName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects agencyName longer than 255 characters', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      agencyName: 'A'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      contactEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null contactEmail', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      contactEmail: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid contractStart format', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      contractStart: '01-01-2025',
    });
    expect(result.success).toBe(false);
  });

  it('accepts both agency statuses', () => {
    for (const status of AGENCY_STATUSES) {
      const result = createAgencySchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = createAgencySchema.safeParse({
      ...validInput,
      status: 'suspended',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateAgencySchema
// ---------------------------------------------------------------------------

describe('updateAgencySchema', () => {
  it('accepts partial updates', () => {
    const result = updateAgencySchema.safeParse({ status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateAgencySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateAgencySchema.safeParse({
      contractStart: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createAgencyWorkerSchema
// ---------------------------------------------------------------------------

describe('createAgencyWorkerSchema', () => {
  const validInput = {
    agencyId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Jane Smith',
    role: 'Care Worker',
    startDate: '2025-01-15',
    dbsCertificateNumber: 'DBS123456',
  };

  it('accepts a valid complete worker input', () => {
    const result = createAgencyWorkerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (agencyId + name)', () => {
    const result = createAgencyWorkerSchema.safeParse({
      agencyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when agencyId is not a valid UUID', () => {
    const result = createAgencyWorkerSchema.safeParse({
      ...validInput,
      agencyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when name is empty', () => {
    const result = createAgencyWorkerSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid startDate format', () => {
    const result = createAgencyWorkerSchema.safeParse({
      ...validInput,
      startDate: '15-01-2025',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateAgencyWorkerSchema
// ---------------------------------------------------------------------------

describe('updateAgencyWorkerSchema', () => {
  it('accepts partial updates', () => {
    const result = updateAgencyWorkerSchema.safeParse({
      role: 'Senior Care Worker',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateAgencyWorkerSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createRecruitmentRecordSchema
// ---------------------------------------------------------------------------

describe('createRecruitmentRecordSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    interviewDate: '2025-02-01',
    references: [
      {
        id: 'ref-1',
        refereeName: 'Dr. Jones',
        relationship: 'Previous Employer',
        contactEmail: 'jones@hospital.nhs.uk',
        status: 'pending' as const,
      },
    ],
    offerDate: '2025-02-15',
    offerStatus: 'pending' as const,
    startDate: '2025-03-01',
    notes: 'Strong candidate',
  };

  it('accepts a valid complete recruitment record', () => {
    const result = createRecruitmentRecordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (staffProfileId only)', () => {
    const result = createRecruitmentRecordSchema.safeParse({
      staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offerStatus).toBe('pending');
      expect(result.data.references).toEqual([]);
    }
  });

  it('rejects when staffProfileId is not a valid UUID', () => {
    const result = createRecruitmentRecordSchema.safeParse({
      ...validInput,
      staffProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid interviewDate format', () => {
    const result = createRecruitmentRecordSchema.safeParse({
      ...validInput,
      interviewDate: '01/02/2025',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all offer statuses', () => {
    for (const status of OFFER_STATUSES) {
      const result = createRecruitmentRecordSchema.safeParse({
        ...validInput,
        offerStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects notes longer than 2000 characters', () => {
    const result = createRecruitmentRecordSchema.safeParse({
      ...validInput,
      notes: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('validates reference entries', () => {
    const result = createRecruitmentRecordSchema.safeParse({
      ...validInput,
      references: [
        {
          id: 'ref-1',
          refereeName: '', // empty - should fail
          relationship: 'Manager',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all reference statuses', () => {
    for (const status of REFERENCE_STATUSES) {
      const result = createRecruitmentRecordSchema.safeParse({
        ...validInput,
        references: [
          {
            id: 'ref-1',
            refereeName: 'Dr. Smith',
            relationship: 'Supervisor',
            status,
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// updateRecruitmentRecordSchema
// ---------------------------------------------------------------------------

describe('updateRecruitmentRecordSchema', () => {
  it('accepts partial updates', () => {
    const result = updateRecruitmentRecordSchema.safeParse({
      offerStatus: 'accepted',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateRecruitmentRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateRecruitmentRecordSchema.safeParse({
      interviewDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants integrity
// ---------------------------------------------------------------------------

describe('Compliance constants', () => {
  it('AGENCY_STATUSES contains both values', () => {
    expect(AGENCY_STATUSES).toEqual(['active', 'inactive']);
  });

  it('AGENCY_STATUS_LABELS has labels for all statuses', () => {
    for (const status of AGENCY_STATUSES) {
      expect(AGENCY_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('OFFER_STATUSES contains expected values', () => {
    expect(OFFER_STATUSES).toEqual(['pending', 'accepted', 'declined']);
  });

  it('OFFER_STATUS_LABELS has labels for all statuses', () => {
    for (const status of OFFER_STATUSES) {
      expect(OFFER_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('REFERENCE_STATUSES contains expected values', () => {
    expect(REFERENCE_STATUSES).toEqual(['pending', 'received', 'verified']);
  });

  it('COMPLIANCE_AREAS contains all expected areas', () => {
    expect(COMPLIANCE_AREAS).toEqual([
      'dbs',
      'training',
      'supervision',
      'right_to_work',
      'qualifications',
    ]);
  });

  it('COMPLIANCE_AREA_LABELS has labels for all areas', () => {
    for (const area of COMPLIANCE_AREAS) {
      expect(COMPLIANCE_AREA_LABELS[area]).toBeTruthy();
    }
  });

  it('RAG_COLOURS contains expected values', () => {
    expect(RAG_COLOURS).toEqual(['green', 'amber', 'red', 'grey']);
  });
});
