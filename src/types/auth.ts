/**
 * Auth type extensions for Next.js session.
 * Extends Auth.js default session types with custom fields.
 */

import 'next-auth';
import type { Role } from '@/lib/rbac/permissions';

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


