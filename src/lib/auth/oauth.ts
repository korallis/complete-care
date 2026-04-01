/**
 * OAuth utility functions for handling provider-based sign-ins.
 *
 * These handle the "get or create" pattern for OAuth users:
 * - If the email already exists, link the OAuth identity to the existing account
 * - If the email doesn't exist, create a new user with emailVerified = true
 *   (OAuth providers verify email addresses themselves)
 *
 * Google-only users have `passwordHash = null`, which prevents credential login.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export type OAuthUserParams = {
  email: string;
  name: string;
  image?: string | null;
};

export type OAuthUserResult = {
  userId: string;
  isNewUser: boolean;
};

/**
 * Finds an existing user by email or creates a new OAuth user.
 *
 * Edge cases handled:
 * - Existing email+password user signs in with Google → links accounts by email,
 *   also marks their email as verified since the OAuth provider has confirmed it.
 * - New Google user → creates account with emailVerified=true, passwordHash=null.
 * - Existing OAuth user returns → looks up by email, returns their DB id.
 */
export async function findOrCreateOAuthUser({
  email,
  name,
  image,
}: OAuthUserParams): Promise<OAuthUserResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    // If the user registered with email/password but hasn't verified their email,
    // mark it as verified — the OAuth provider has confirmed ownership.
    if (!existingUser.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, existingUser.id));
    }
    return { userId: existingUser.id, isNewUser: false };
  }

  // No existing user — create a new OAuth-only account.
  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name.trim() || 'Unknown',
      image: image ?? null,
      emailVerified: true, // OAuth providers verify email ownership
      passwordHash: null, // OAuth-only users cannot sign in with a password
    })
    .returning();

  return { userId: newUser.id, isNewUser: true };
}
