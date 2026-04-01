/**
 * Auth type extensions for Next.js session.
 * Extends Auth.js default session types with custom fields.
 */

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
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
