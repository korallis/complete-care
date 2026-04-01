/**
 * Tenant Isolation — Pure Utility Functions (Edge-safe)
 *
 * Enforces strict multi-tenant data separation throughout the application.
 * This module contains pure functions with NO runtime dependencies — safe for
 * use in both Edge runtime (middleware) and Node.js (server actions, tests).
 *
 * Key invariants:
 * - Every tenant-scoped query MUST filter by organisationId
 * - Cross-tenant access returns 404 (not 403) to prevent org ID enumeration
 * - The application layer provides the first isolation barrier
 * - Postgres RLS policies provide defense-in-depth (second barrier)
 *
 * Auth-dependent utilities (getTenantContext) live in ./server.ts.
 *
 * Usage pattern for Server Actions / API routes:
 * ```typescript
 * import { getTenantContext } from '@/lib/tenant/server';
 * import { assertBelongsToOrg } from '@/lib/tenant';
 *
 * const { userId, orgId } = await getTenantContext();
 * // ... query with .where(eq(table.organisationId, orgId))
 * // For by-ID lookups:
 * assertBelongsToOrg(record.organisationId, orgId);
 * ```
 */

import { eq, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// TenantIsolationError
// ---------------------------------------------------------------------------

/**
 * Thrown when a resource doesn't belong to the active organisation.
 * Returns a 404 (not 403) to prevent cross-tenant org ID enumeration:
 * an attacker who tries to access Org B's resource while logged in as
 * Org A receives "Not Found" — indistinguishable from a non-existent resource.
 */
export class TenantIsolationError extends Error {
  /** HTTP status — always 404 to prevent enumeration */
  readonly status = 404 as const;

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

// ---------------------------------------------------------------------------
// assertBelongsToOrg
// ---------------------------------------------------------------------------

/**
 * Asserts that a resource's organisationId matches the active org.
 *
 * Use this for by-ID resource lookups to prevent cross-tenant access:
 * ```typescript
 * const [record] = await db.select().from(persons).where(eq(persons.id, id));
 * if (!record) notFound();
 * assertBelongsToOrg(record.organisationId, activeOrgId);
 * ```
 *
 * Throws TenantIsolationError (404) rather than an access-denied error
 * to prevent Org A from enumerating valid Org B resource IDs.
 *
 * @param resourceOrgId - The organisationId stored on the resource
 * @param activeOrgId  - The current user's active organisation ID
 * @throws {TenantIsolationError} if the IDs don't match or resourceOrgId is falsy
 */
export function assertBelongsToOrg(
  resourceOrgId: string | null | undefined,
  activeOrgId: string,
): void {
  if (!resourceOrgId || resourceOrgId !== activeOrgId) {
    throw new TenantIsolationError();
  }
}

// ---------------------------------------------------------------------------
// withOrgScope
// ---------------------------------------------------------------------------

/**
 * Creates a Drizzle WHERE condition that filters by organisationId.
 *
 * This is a typed helper that ensures the column passed is a PgColumn
 * and returns a Drizzle SQL condition for use in `.where()`:
 *
 * ```typescript
 * const records = await db
 *   .select()
 *   .from(persons)
 *   .where(withOrgScope(persons.organisationId, orgId));
 * ```
 *
 * For queries with multiple conditions, use `and()`:
 * ```typescript
 * .where(and(withOrgScope(persons.organisationId, orgId), eq(persons.status, 'active')))
 * ```
 *
 * @param column - The organisationId column of the table being queried
 * @param orgId  - The active organisation's ID (from session)
 * @returns Drizzle SQL WHERE condition
 */
export function withOrgScope(column: PgColumn, orgId: string): SQL {
  return eq(column, orgId);
}

// ---------------------------------------------------------------------------
// isCrossTenantAccess
// ---------------------------------------------------------------------------

/**
 * Returns true if a resource's org ID does NOT match the active org.
 * Use when you need a boolean check rather than a thrown error.
 *
 * ```typescript
 * if (isCrossTenantAccess(record.organisationId, activeOrgId)) {
 *   return NextResponse.json({ error: 'Not found' }, { status: 404 });
 * }
 * ```
 */
export function isCrossTenantAccess(
  resourceOrgId: string | null | undefined,
  activeOrgId: string,
): boolean {
  return !resourceOrgId || resourceOrgId !== activeOrgId;
}
