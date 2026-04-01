/**
 * RBAC Server-Side Guards
 *
 * This file imports from @/lib/db (Drizzle ORM) and @/auth (Auth.js).
 * It MUST NOT be imported in Edge runtime (middleware) — use hasPermission()
 * from ./permissions instead for Edge-safe checks.
 *
 * Node.js / Server Components / Server Actions only.
 */

import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { memberships } from '@/lib/db/schema';
import { hasPermission, type Action, type Resource, type Role } from './permissions';

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

/**
 * Thrown by requirePermission() when the authenticated user lacks the
 * required permission for an action on a resource.
 */
export class UnauthorizedError extends Error {
  readonly action?: Action;
  readonly resource?: Resource;

  constructor(
    message: string = 'Insufficient permissions',
    action?: Action,
    resource?: Resource,
  ) {
    super(message);
    this.name = 'UnauthorizedError';
    this.action = action;
    this.resource = resource;
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/**
 * Fetches the user's current role in a given organisation from the database.
 *
 * Always queries the DB — not the JWT. This guarantees mid-session role changes
 * (e.g., admin promotes carer → manager) take effect on the very next request.
 *
 * @param userId - The authenticated user's ID
 * @param organisationId - The target organisation's ID
 * @returns The user's current role, or null if they are not an active member
 */
export async function getCurrentRole(
  userId: string,
  organisationId: string,
): Promise<Role | null> {
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, organisationId),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  if (!membership) return null;
  return membership.role as Role;
}

// ---------------------------------------------------------------------------
// Server-side permission guard
// ---------------------------------------------------------------------------

/**
 * Server-side permission guard for Server Actions and Route Handlers.
 *
 * Call this at the top of any server action or API handler that requires
 * a specific permission. Throws UnauthorizedError on failure.
 *
 * Mid-session role changes take effect immediately — this always fetches
 * the current role from DB, bypassing any stale JWT.
 *
 * Usage in a Server Action:
 * ```typescript
 * 'use server';
 * import { requirePermission } from '@/lib/rbac';
 *
 * export async function updatePerson(id: string, data: PersonInput) {
 *   const { userId, orgId, role } = await requirePermission('update', 'persons');
 *   // ... proceed with mutation
 * }
 * ```
 *
 * @param action - The action being attempted (e.g., 'update')
 * @param resource - The resource being accessed (e.g., 'persons')
 * @returns { userId, orgId, role } if authorized
 * @throws {UnauthorizedError} if not authenticated, no org context, not a member,
 *   or insufficient permissions
 */
export async function requirePermission(
  action: Action,
  resource: Resource,
): Promise<{ userId: string; orgId: string; role: Role }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError('Not authenticated');
  }

  const { id: userId } = session.user;

  // activeOrgId is injected by the auth.ts JWT/session callbacks.
  // It may be absent for new users who haven't created an org yet.
  const activeOrgId = (session.user as { activeOrgId?: string }).activeOrgId;

  if (!activeOrgId) {
    throw new UnauthorizedError('No organisation context');
  }

  // Always query DB for the live role — never trust the JWT alone.
  // This ensures mid-session role changes take effect on next request.
  const role = await getCurrentRole(userId, activeOrgId);

  if (!role) {
    throw new UnauthorizedError('Not a member of this organisation');
  }

  if (!hasPermission(role, action, resource)) {
    throw new UnauthorizedError(
      `Insufficient permissions: role '${role}' cannot '${action}' on '${resource}'`,
      action,
      resource,
    );
  }

  return { userId, orgId: activeOrgId, role };
}
