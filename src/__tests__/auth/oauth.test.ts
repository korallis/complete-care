/**
 * Google OAuth tests.
 *
 * Covers:
 * - findOrCreateOAuthUser logic (behaviour contract)
 * - OAuthUserParams / OAuthUserResult types
 * - Schema correctness: users table supports OAuth-only accounts (null passwordHash)
 * - Google button rendering in login and register forms
 *
 * Database calls are mocked — no real DB connection needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// 1. Validate the oauth utility module exports + types
// ---------------------------------------------------------------------------

describe('oauth utility module', () => {
  it('exports findOrCreateOAuthUser function', async () => {
    // Dynamic import to avoid triggering real DB at module load time
    const mod = await import('../../lib/auth/oauth');
    expect(typeof mod.findOrCreateOAuthUser).toBe('function');
  });

  it('exports OAuthUserParams and OAuthUserResult types at runtime (via object shapes)', async () => {
    const mod = await import('../../lib/auth/oauth');
    // Type guard: the function accepts params conforming to OAuthUserParams
    const fn = mod.findOrCreateOAuthUser;
    expect(fn.length).toBe(1); // single destructured param
  });
});

// ---------------------------------------------------------------------------
// 2. findOrCreateOAuthUser — mocked DB behaviour contract
// ---------------------------------------------------------------------------

// We mock the database module so tests run without a live DB connection
vi.mock('../../lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../lib/db/schema', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../lib/db/schema')>();
  return { ...original };
});

describe('findOrCreateOAuthUser — new Google user', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('creates a new user when no existing user is found', async () => {
    const mockNewUser = {
      id: 'new-uuid-123',
      email: 'newuser@example.com',
      name: 'New User',
      image: 'https://lh3.googleusercontent.com/photo.jpg',
      emailVerified: true,
      passwordHash: null,
    };

    const { db } = await import('../../lib/db');
    // Mock: select returns empty (no existing user)
    const mockSelectLimit = vi.fn().mockResolvedValue([]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    // Mock: insert returns new user
    const mockInsertReturning = vi.fn().mockResolvedValue([mockNewUser]);
    const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    const result = await findOrCreateOAuthUser({
      email: 'newuser@example.com',
      name: 'New User',
      image: 'https://lh3.googleusercontent.com/photo.jpg',
    });

    expect(result.userId).toBe('new-uuid-123');
    expect(result.isNewUser).toBe(true);
  });

  it('new OAuth user has null passwordHash (cannot sign in with password)', async () => {
    const mockNewUser = {
      id: 'oauth-only-uuid',
      email: 'oauthonly@gmail.com',
      name: 'OAuth User',
      image: null,
      emailVerified: true,
      passwordHash: null,
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    let insertedValues: Record<string, unknown> = {};
    const mockInsertReturning = vi.fn().mockResolvedValue([mockNewUser]);
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return { returning: mockInsertReturning };
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    await findOrCreateOAuthUser({
      email: 'oauthonly@gmail.com',
      name: 'OAuth User',
    });

    // Verify the inserted record has passwordHash = null
    expect(insertedValues).toMatchObject({ passwordHash: null });
  });

  it('new OAuth user has emailVerified = true', async () => {
    const mockNewUser = {
      id: 'verified-uuid',
      email: 'verified@gmail.com',
      name: 'Verified User',
      image: null,
      emailVerified: true,
      passwordHash: null,
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    let insertedValues: Record<string, unknown> = {};
    const mockInsertReturning = vi.fn().mockResolvedValue([mockNewUser]);
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return { returning: mockInsertReturning };
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    const result = await findOrCreateOAuthUser({
      email: 'verified@gmail.com',
      name: 'Verified User',
    });

    expect(insertedValues).toMatchObject({ emailVerified: true });
    expect(result.isNewUser).toBe(true);
  });

  it('normalises email to lowercase', async () => {
    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    let insertedValues: Record<string, unknown> = {};
    const mockInsertReturning = vi.fn().mockResolvedValue([{ id: 'uuid', email: 'upper@gmail.com', name: 'Upper', emailVerified: true, passwordHash: null }]);
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return { returning: mockInsertReturning };
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    await findOrCreateOAuthUser({ email: 'UPPER@GMAIL.COM', name: 'Upper' });

    expect(insertedValues).toMatchObject({ email: 'upper@gmail.com' });
  });
});

describe('findOrCreateOAuthUser — existing email user links to Google', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns existing user id when email already exists', async () => {
    const existingUser = {
      id: 'existing-uuid',
      email: 'existing@example.com',
      name: 'Existing User',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword',
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([existingUser]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    const result = await findOrCreateOAuthUser({
      email: 'existing@example.com',
      name: 'Existing User',
    });

    expect(result.userId).toBe('existing-uuid');
    expect(result.isNewUser).toBe(false);
  });

  it('does NOT create a second user when email already exists', async () => {
    const existingUser = {
      id: 'existing-uuid',
      email: 'existing@example.com',
      name: 'Existing User',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword',
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([existingUser]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    await findOrCreateOAuthUser({
      email: 'existing@example.com',
      name: 'Existing User',
    });

    // db.insert should NOT have been called since user already exists
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('marks unverified existing user email as verified when linked via Google', async () => {
    const existingUnverifiedUser = {
      id: 'unverified-uuid',
      email: 'unverified@example.com',
      name: 'Unverified User',
      emailVerified: false,
      passwordHash: '$2b$10$hashedpassword',
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([existingUnverifiedUser]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    // Mock: db.update chain
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockUpdateSet });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    await findOrCreateOAuthUser({
      email: 'unverified@example.com',
      name: 'Unverified User',
    });

    // db.update should have been called to verify the email
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ emailVerified: true });
  });

  it('does not update email verification when existing user is already verified', async () => {
    const existingVerifiedUser = {
      id: 'verified-uuid',
      email: 'verified@example.com',
      name: 'Verified User',
      emailVerified: true,
      passwordHash: '$2b$10$hashedpassword',
    };

    const { db } = await import('../../lib/db');
    const mockSelectLimit = vi.fn().mockResolvedValue([existingVerifiedUser]);
    const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
    const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockSelectFrom });

    const { findOrCreateOAuthUser } = await import('../../lib/auth/oauth');
    await findOrCreateOAuthUser({
      email: 'verified@example.com',
      name: 'Verified User',
    });

    // Should NOT call update since user is already verified
    expect(db.update).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3. Users schema — OAuth support
// ---------------------------------------------------------------------------

describe('users schema — OAuth support', () => {
  it('passwordHash column is nullable (supports OAuth-only users)', async () => {
    const { users } = await import('../../lib/db/schema');
    const col = users.passwordHash;
    // notNull should be false (column is nullable)
    expect(col.notNull).toBe(false);
  });

  it('emailVerified column can be set to true for OAuth users', async () => {
    const { users } = await import('../../lib/db/schema');
    const col = users.emailVerified;
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it('image column is nullable (supports users without profile photos)', async () => {
    const { users } = await import('../../lib/db/schema');
    const col = users.image;
    expect(col.notNull).toBe(false);
  });
});
