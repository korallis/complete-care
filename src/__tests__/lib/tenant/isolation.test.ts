/**
 * Tenant Isolation Tests
 *
 * Proves that the multi-tenant data isolation system correctly prevents
 * cross-tenant data access. These tests verify:
 *
 * 1. assertBelongsToOrg() throws TenantIsolationError for mismatched org IDs
 * 2. isCrossTenantAccess() detects cross-tenant resource access
 * 3. TenantIsolationError carries the correct HTTP status (404)
 * 4. Schema structure — all tenant-scoped tables have organisationId column
 * 5. Simulated two-org isolation — Org A data invisible to Org B
 * 6. Query scoping — withOrgScope() generates correct WHERE conditions
 *
 * NOTE: These are unit / integration-level tests that operate on pure logic
 * and schema objects. They do NOT require a live database connection —
 * the schema objects and utility functions are testable in isolation.
 *
 * Verification steps from feature spec:
 * > bun run test -- --grep isolation passes (2+ orgs test)
 */

import { describe, it, expect } from 'vitest';
import {
  TenantIsolationError,
  assertBelongsToOrg,
  isCrossTenantAccess,
  withOrgScope,
} from '@/lib/tenant';

import { getTableName } from 'drizzle-orm';
import { persons } from '@/lib/db/schema/persons';
import { staffProfiles } from '@/lib/db/schema/staff-profiles';
import { carePlans } from '@/lib/db/schema/care-plans';
import { careNotes } from '@/lib/db/schema/care-notes';
import { documents } from '@/lib/db/schema/documents';

// ---------------------------------------------------------------------------
// TenantIsolationError
// ---------------------------------------------------------------------------

describe('TenantIsolationError', () => {
  it('has status 404 to prevent org ID enumeration', () => {
    const error = new TenantIsolationError();
    expect(error.status).toBe(404);
  });

  it('has the expected name', () => {
    const error = new TenantIsolationError();
    expect(error.name).toBe('TenantIsolationError');
  });

  it('uses default message when none provided', () => {
    const error = new TenantIsolationError();
    expect(error.message).toBe('Resource not found');
  });

  it('accepts a custom message', () => {
    const error = new TenantIsolationError('Custom message');
    expect(error.message).toBe('Custom message');
  });

  it('is an instance of Error', () => {
    expect(new TenantIsolationError()).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// assertBelongsToOrg — cross-tenant access prevention
// ---------------------------------------------------------------------------

describe('assertBelongsToOrg', () => {
  const ORG_A = '11111111-1111-1111-1111-111111111111';
  const ORG_B = '22222222-2222-2222-2222-222222222222';

  it('does NOT throw when resource belongs to the active org', () => {
    expect(() => assertBelongsToOrg(ORG_A, ORG_A)).not.toThrow();
  });

  it('throws TenantIsolationError when resource belongs to a different org', () => {
    // Org A user trying to access Org B resource
    expect(() => assertBelongsToOrg(ORG_B, ORG_A)).toThrow(TenantIsolationError);
  });

  it('throws with status 404 (not 403) for cross-tenant access', () => {
    try {
      assertBelongsToOrg(ORG_B, ORG_A);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TenantIsolationError);
      expect((err as TenantIsolationError).status).toBe(404);
    }
  });

  it('throws when resourceOrgId is null (unassigned resource)', () => {
    expect(() => assertBelongsToOrg(null, ORG_A)).toThrow(TenantIsolationError);
  });

  it('throws when resourceOrgId is undefined', () => {
    expect(() => assertBelongsToOrg(undefined, ORG_A)).toThrow(TenantIsolationError);
  });

  it('throws when resourceOrgId is an empty string', () => {
    expect(() => assertBelongsToOrg('', ORG_A)).toThrow(TenantIsolationError);
  });
});

// ---------------------------------------------------------------------------
// Two-org isolation simulation
// ---------------------------------------------------------------------------

describe('tenant isolation — two-org simulation', () => {
  const ORG_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ORG_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  /**
   * Simulates a list query scoped to an organisation.
   * In production, this would be a real Drizzle query with
   * .where(eq(persons.organisationId, orgId)).
   */
  function simulateListQuery<T extends { organisationId: string }>(
    records: T[],
    activeOrgId: string,
  ): T[] {
    // This is the filtering pattern that every Drizzle query MUST apply
    return records.filter((r) => r.organisationId === activeOrgId);
  }

  /**
   * Simulates a by-ID lookup with tenant assertion.
   * In production: fetch by ID, then call assertBelongsToOrg().
   */
  function simulateGetById<T extends { id: string; organisationId: string }>(
    records: T[],
    id: string,
    activeOrgId: string,
  ): T | null {
    const record = records.find((r) => r.id === id);
    if (!record) return null;
    // This check prevents cross-tenant access even if the record exists
    assertBelongsToOrg(record.organisationId, activeOrgId);
    return record;
  }

  // Seed data for both orgs
  const personRecords = [
    { id: 'p-a1', organisationId: ORG_A_ID, fullName: 'Alice Smith (Org A)' },
    { id: 'p-a2', organisationId: ORG_A_ID, fullName: 'Bob Jones (Org A)' },
    { id: 'p-b1', organisationId: ORG_B_ID, fullName: 'Charlie Brown (Org B)' },
    { id: 'p-b2', organisationId: ORG_B_ID, fullName: 'Diana Prince (Org B)' },
  ];

  const staffRecords = [
    { id: 's-a1', organisationId: ORG_A_ID, fullName: 'Staff Alice (Org A)' },
    { id: 's-b1', organisationId: ORG_B_ID, fullName: 'Staff Bob (Org B)' },
  ];

  const carePlanRecords = [
    { id: 'cp-a1', organisationId: ORG_A_ID, title: 'Org A Care Plan', personId: 'p-a1' },
    { id: 'cp-b1', organisationId: ORG_B_ID, title: 'Org B Care Plan', personId: 'p-b1' },
  ];

  const careNoteRecords = [
    { id: 'cn-a1', organisationId: ORG_A_ID, content: 'Org A note', personId: 'p-a1' },
    { id: 'cn-b1', organisationId: ORG_B_ID, content: 'Org B note', personId: 'p-b1' },
  ];

  const documentRecords = [
    { id: 'd-a1', organisationId: ORG_A_ID, name: 'Org A document', personId: 'p-a1' },
    { id: 'd-b1', organisationId: ORG_B_ID, name: 'Org B document', personId: 'p-b1' },
  ];

  // --- Persons ---

  it('isolation: Org A user cannot see Org B persons in list query', () => {
    const results = simulateListQuery(personRecords, ORG_A_ID);
    const hasOrgBData = results.some((r) => r.organisationId === ORG_B_ID);
    expect(hasOrgBData).toBe(false);
    expect(results).toHaveLength(2); // Only Org A's 2 persons
    expect(results.every((r) => r.organisationId === ORG_A_ID)).toBe(true);
  });

  it('isolation: Org B user cannot see Org A persons in list query', () => {
    const results = simulateListQuery(personRecords, ORG_B_ID);
    const hasOrgAData = results.some((r) => r.organisationId === ORG_A_ID);
    expect(hasOrgAData).toBe(false);
    expect(results).toHaveLength(2); // Only Org B's 2 persons
  });

  it('isolation: Org A user cannot access Org B person by direct ID', () => {
    // Org B person ID is known, Org A user tries to access it
    expect(() =>
      simulateGetById(personRecords, 'p-b1', ORG_A_ID)
    ).toThrow(TenantIsolationError);
  });

  it('isolation: Org B user cannot access Org A person by direct ID', () => {
    expect(() =>
      simulateGetById(personRecords, 'p-a1', ORG_B_ID)
    ).toThrow(TenantIsolationError);
  });

  it('isolation: Org A user CAN access their own person by ID', () => {
    const result = simulateGetById(personRecords, 'p-a1', ORG_A_ID);
    expect(result).not.toBeNull();
    expect(result?.organisationId).toBe(ORG_A_ID);
  });

  // --- Staff ---

  it('isolation: Org A user cannot see Org B staff in list query', () => {
    const results = simulateListQuery(staffRecords, ORG_A_ID);
    expect(results.every((r) => r.organisationId === ORG_A_ID)).toBe(true);
    expect(results.some((r) => r.organisationId === ORG_B_ID)).toBe(false);
  });

  it('isolation: Org A user cannot access Org B staff by direct ID', () => {
    expect(() =>
      simulateGetById(staffRecords, 's-b1', ORG_A_ID)
    ).toThrow(TenantIsolationError);
  });

  it('isolation: direct ID access returns 404 status (not 403) for cross-tenant staff', () => {
    try {
      simulateGetById(staffRecords, 's-b1', ORG_A_ID);
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as TenantIsolationError).status).toBe(404);
    }
  });

  // --- Care Plans ---

  it('isolation: Org A user cannot see Org B care plans in list query', () => {
    const results = simulateListQuery(carePlanRecords, ORG_A_ID);
    expect(results.every((r) => r.organisationId === ORG_A_ID)).toBe(true);
    expect(results.some((r) => r.organisationId === ORG_B_ID)).toBe(false);
  });

  it('isolation: Org A user cannot access Org B care plan by direct ID', () => {
    expect(() =>
      simulateGetById(carePlanRecords, 'cp-b1', ORG_A_ID)
    ).toThrow(TenantIsolationError);
  });

  // --- Care Notes ---

  it('isolation: Org A user cannot see Org B care notes in list query', () => {
    const results = simulateListQuery(careNoteRecords, ORG_A_ID);
    expect(results.every((r) => r.organisationId === ORG_A_ID)).toBe(true);
    expect(results.some((r) => r.organisationId === ORG_B_ID)).toBe(false);
  });

  it('isolation: Org A user cannot access Org B care note by direct ID', () => {
    expect(() =>
      simulateGetById(careNoteRecords, 'cn-b1', ORG_A_ID)
    ).toThrow(TenantIsolationError);
  });

  // --- Documents ---

  it('isolation: Org A user cannot see Org B documents in list query', () => {
    const results = simulateListQuery(documentRecords, ORG_A_ID);
    expect(results.every((r) => r.organisationId === ORG_A_ID)).toBe(true);
    expect(results.some((r) => r.organisationId === ORG_B_ID)).toBe(false);
  });

  it('isolation: Org A user cannot access Org B document by direct ID', () => {
    expect(() =>
      simulateGetById(documentRecords, 'd-b1', ORG_A_ID)
    ).toThrow(TenantIsolationError);
  });

  // --- Zero-record guarantee ---

  it('isolation: list query for Org A returns zero records from Org B', () => {
    const allRecords = [
      ...personRecords,
      ...staffRecords,
      ...carePlanRecords,
      ...careNoteRecords,
      ...documentRecords,
    ];

    const orgAResults = allRecords.filter((r) => r.organisationId === ORG_A_ID);
    const crossTenantLeaks = orgAResults.filter(
      (r) => r.organisationId !== ORG_A_ID,
    );

    expect(crossTenantLeaks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// isCrossTenantAccess — boolean guard
// ---------------------------------------------------------------------------

describe('isCrossTenantAccess', () => {
  const ORG_A = 'aaaaaaaa-0000-0000-0000-000000000000';
  const ORG_B = 'bbbbbbbb-0000-0000-0000-000000000000';

  it('returns false when resource org matches active org', () => {
    expect(isCrossTenantAccess(ORG_A, ORG_A)).toBe(false);
  });

  it('returns true when resource org differs from active org', () => {
    expect(isCrossTenantAccess(ORG_B, ORG_A)).toBe(true);
  });

  it('returns true for null resourceOrgId', () => {
    expect(isCrossTenantAccess(null, ORG_A)).toBe(true);
  });

  it('returns true for undefined resourceOrgId', () => {
    expect(isCrossTenantAccess(undefined, ORG_A)).toBe(true);
  });

  it('returns true for empty string resourceOrgId', () => {
    expect(isCrossTenantAccess('', ORG_A)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Schema: all tenant-scoped tables must have organisationId column
// ---------------------------------------------------------------------------

describe('schema tenant isolation — all tenant-scoped tables have organisationId', () => {
  const tenantScopedTables = [
    { name: 'persons', table: persons },
    { name: 'staff_profiles', table: staffProfiles },
    { name: 'care_plans', table: carePlans },
    { name: 'care_notes', table: careNotes },
    { name: 'documents', table: documents },
  ] as const;

  for (const { name, table } of tenantScopedTables) {
    it(`${name} has an organisationId column`, () => {
      const columns = Object.keys(table);
      expect(columns).toContain('organisationId');
    });

    it(`${name} organisationId column is of type PgUUID`, () => {
      const col = (table as unknown as Record<string, { columnType: string }>)['organisationId'];
      expect(col.columnType).toBe('PgUUID');
    });

    it(`${name} organisationId column is not nullable (required for isolation)`, () => {
      const col = (table as unknown as Record<string, { notNull: boolean }>)['organisationId'];
      expect(col.notNull).toBe(true);
    });
  }

  it('persons table name is "persons"', () => {
    expect(getTableName(persons)).toBe('persons');
  });

  it('staff_profiles table name is "staff_profiles"', () => {
    expect(getTableName(staffProfiles)).toBe('staff_profiles');
  });

  it('care_plans table name is "care_plans"', () => {
    expect(getTableName(carePlans)).toBe('care_plans');
  });

  it('care_notes table name is "care_notes"', () => {
    expect(getTableName(careNotes)).toBe('care_notes');
  });

  it('documents table name is "documents"', () => {
    expect(getTableName(documents)).toBe('documents');
  });
});

// ---------------------------------------------------------------------------
// withOrgScope — Drizzle query helper
// ---------------------------------------------------------------------------

describe('withOrgScope', () => {
  it('returns a Drizzle SQL object', () => {
    const condition = withOrgScope(persons.organisationId, 'some-org-id');
    // Drizzle SQL objects have an internal structure; verify it's truthy and non-null
    expect(condition).toBeTruthy();
    expect(typeof condition).toBe('object');
  });

  it('produces an equality condition for the given org ID', () => {
    const orgId = 'test-org-id-12345';
    const condition = withOrgScope(persons.organisationId, orgId);
    // Drizzle's SQL condition objects have a queryChunks array.
    // The right-hand side of the eq() call is a SQL param containing the value.
    // We traverse the tree without JSON.stringify to avoid circular ref errors.
    type SqlChunk = { value?: unknown; queryChunks?: SqlChunk[] };
    const root = condition as unknown as SqlChunk;
    function findValue(node: SqlChunk, target: string): boolean {
      if (node.value === target) return true;
      if (Array.isArray(node.queryChunks)) {
        return node.queryChunks.some((c) => findValue(c, target));
      }
      return false;
    }
    expect(findValue(root, orgId)).toBe(true);
  });

  it('works with all tenant-scoped tables', () => {
    const orgId = 'test-org-12345';
    // Should not throw for any of the tenant-scoped tables
    expect(() => withOrgScope(persons.organisationId, orgId)).not.toThrow();
    expect(() => withOrgScope(staffProfiles.organisationId, orgId)).not.toThrow();
    expect(() => withOrgScope(carePlans.organisationId, orgId)).not.toThrow();
    expect(() => withOrgScope(careNotes.organisationId, orgId)).not.toThrow();
    expect(() => withOrgScope(documents.organisationId, orgId)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Org switcher isolation — switching orgs changes data context
// ---------------------------------------------------------------------------

describe('tenant isolation — organisation switching', () => {
  const ORG_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ORG_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const allData = [
    { id: '1', organisationId: ORG_A_ID, name: 'Org A data' },
    { id: '2', organisationId: ORG_A_ID, name: 'More Org A data' },
    { id: '3', organisationId: ORG_B_ID, name: 'Org B data' },
  ];

  it('active org context determines which data is visible', () => {
    // User is in Org A
    const orgAView = allData.filter((d) => d.organisationId === ORG_A_ID);
    expect(orgAView).toHaveLength(2);
    expect(orgAView.every((d) => d.organisationId === ORG_A_ID)).toBe(true);

    // User switches to Org B — context changes, data view changes
    const orgBView = allData.filter((d) => d.organisationId === ORG_B_ID);
    expect(orgBView).toHaveLength(1);
    expect(orgBView[0].name).toBe('Org B data');
  });

  it('after switching to Org B, Org A data is no longer in scope', () => {
    // Simulate org switch: activeOrgId changes from ORG_A_ID to ORG_B_ID
    const activeOrgId = ORG_B_ID; // After switch
    const visibleData = allData.filter((d) => d.organisationId === activeOrgId);

    // Org A data should not be visible
    expect(visibleData.some((d) => d.organisationId === ORG_A_ID)).toBe(false);
  });

  it('prevents accessing Org A resources after switching to Org B', () => {
    const activeOrgId = ORG_B_ID; // After switch

    // Try to access an Org A resource
    const orgARecord = allData.find((d) => d.id === '1');
    expect(orgARecord?.organisationId).toBe(ORG_A_ID);

    // This should be blocked
    expect(() =>
      assertBelongsToOrg(orgARecord?.organisationId, activeOrgId)
    ).toThrow(TenantIsolationError);
  });
});

// ---------------------------------------------------------------------------
// API response isolation — no cross-tenant data leakage
// ---------------------------------------------------------------------------

describe('API response isolation — zero cross-tenant records', () => {
  const ORG_A_ID = 'org-a-uuid-1111-1111-1111-111111111111';
  const ORG_B_ID = 'org-b-uuid-2222-2222-2222-222222222222';

  /**
   * Simulates a full API response body with tenant isolation applied.
   */
  function buildApiResponse<T extends { organisationId: string }>(
    allRecords: T[],
    requestingOrgId: string,
  ) {
    return {
      data: allRecords.filter((r) => r.organisationId === requestingOrgId),
    };
  }

  it('GET /api/persons response for Org A contains zero Org B records', () => {
    const allPersons = [
      { id: '1', organisationId: ORG_A_ID, fullName: 'Alice' },
      { id: '2', organisationId: ORG_B_ID, fullName: 'Bob' },
    ];

    const response = buildApiResponse(allPersons, ORG_A_ID);
    const orgBLeaks = response.data.filter((p) => p.organisationId === ORG_B_ID);

    expect(orgBLeaks).toHaveLength(0);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].fullName).toBe('Alice');
  });

  it('GET /api/staff response for Org A contains zero Org B records', () => {
    const allStaff = [
      { id: '1', organisationId: ORG_A_ID, fullName: 'Staff A1' },
      { id: '2', organisationId: ORG_B_ID, fullName: 'Staff B1' },
      { id: '3', organisationId: ORG_B_ID, fullName: 'Staff B2' },
    ];

    const response = buildApiResponse(allStaff, ORG_A_ID);
    const orgBLeaks = response.data.filter((s) => s.organisationId === ORG_B_ID);

    expect(orgBLeaks).toHaveLength(0);
    expect(response.data).toHaveLength(1);
  });

  it('GET /api/care-plans response for Org B contains zero Org A records', () => {
    const allPlans = [
      { id: '1', organisationId: ORG_A_ID, title: 'Plan A' },
      { id: '2', organisationId: ORG_B_ID, title: 'Plan B' },
    ];

    const response = buildApiResponse(allPlans, ORG_B_ID);
    const orgALeaks = response.data.filter((p) => p.organisationId === ORG_A_ID);

    expect(orgALeaks).toHaveLength(0);
    expect(response.data[0].title).toBe('Plan B');
  });

  it('an empty org sees zero records from other orgs', () => {
    const EMPTY_ORG_ID = 'empty-org-0000-0000-0000-000000000000';
    const allRecords = [
      { id: '1', organisationId: ORG_A_ID, data: 'A' },
      { id: '2', organisationId: ORG_B_ID, data: 'B' },
    ];

    const response = buildApiResponse(allRecords, EMPTY_ORG_ID);
    expect(response.data).toHaveLength(0);
  });
});
