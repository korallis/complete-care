/**
 * Tenant Isolation — Server-Side Utilities (Node.js only)
 *
 * This file imports from @/auth (Auth.js) which requires Node.js runtime.
 * MUST NOT be imported in Edge runtime (middleware).
 *
 * For Edge-safe tenant utilities, use @/lib/tenant (the index module).
 */

import { auth } from '@/auth';
import { UnauthorizedError } from '@/lib/rbac';

// ---------------------------------------------------------------------------
// getTenantContext
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's ID and active organisation ID from session.
 *
 * Call this at the start of any server action or route handler that
 * needs to scope data to the current tenant.
 *
 * NOTE: requirePermission() from @/lib/rbac also returns { userId, orgId }
 * and combines auth + permission check in one call. Prefer that for server
 * actions that also need to check RBAC. Use getTenantContext() when you need
 * the org context without a specific permission check.
 *
 * @throws {UnauthorizedError} if not authenticated or no active org
 */
export async function getTenantContext(): Promise<{
  userId: string;
  orgId: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError('Not authenticated');
  }

  const orgId = session.user.activeOrgId;
  if (!orgId) {
    throw new UnauthorizedError('No organisation context');
  }

  return { userId: session.user.id, orgId };
}
