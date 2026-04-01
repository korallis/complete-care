/**
 * Auth type extensions for Next.js session.
 * Extends Auth.js default session types with custom fields.
 */

import 'next-auth';
import type { Role } from '@/lib/rbac/permissions';

/** A single org membership entry stored in the JWT for the org switcher */
export type SessionMembership = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: Role;
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
      /** The currently active organisation ID (org-switcher context) */
      activeOrgId?: string;
      /** The user's role in the active organisation (cached from JWT; DB is authoritative) */
      role?: Role;
      /** All organisations the user belongs to — used to render the org switcher */
      memberships?: SessionMembership[];
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    emailVerified?: boolean;
    image?: string | null;
  }
}


