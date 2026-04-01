/**
 * Schema definition tests — verify structure, types, and column properties.
 * These tests operate on the schema objects in memory and do NOT require a
 * database connection.
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  organisations,
  users,
  memberships,
  auditLogs,
  organisationsRelations,
  usersRelations,
  membershipsRelations,
  auditLogsRelations,
} from '../../../lib/db/schema';
import type {
  Organisation,
  NewOrganisation,
  User,
  NewUser,
  Membership,
  NewMembership,
  AuditLog,
  NewAuditLog,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// organisations
// ---------------------------------------------------------------------------

describe('organisations schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(organisations)).toBe('organisations');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(organisations);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'name', 'slug', 'plan', 'orgType', 'domains', 'stripeCustomerId', 'createdAt', 'updatedAt']),
    );
  });

  it('id column is uuid primary key with default random', () => {
    const col = organisations.id;
    expect(col.columnType).toBe('PgUUID');
    expect(col.primary).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it('slug column is unique', () => {
    const col = organisations.slug;
    expect(col.isUnique).toBe(true);
  });

  it('plan column defaults to "free"', () => {
    const col = organisations.plan;
    expect(col.default).toBe('free');
  });

  it('domains column is a text array (PgArray)', () => {
    const col = organisations.domains;
    expect(col.columnType).toBe('PgArray');
  });

  it('createdAt column has defaultNow', () => {
    const col = organisations.createdAt;
    expect(col.hasDefault).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it('updatedAt column has defaultNow', () => {
    const col = organisations.updatedAt;
    expect(col.hasDefault).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it('exports Organisation and NewOrganisation types (compile-time check)', () => {
    // This verifies the inferred types are exported and usable
    const org: Organisation = {
      id: 'uuid',
      name: 'Test Org',
      slug: 'test-org',
      plan: 'free',
      orgType: null,
      domains: [],
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      subscriptionStatus: 'free',
      currentPeriodEnd: null,
      maxUsers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(org.name).toBe('Test Org');

    const newOrg: NewOrganisation = {
      name: 'New Org',
      slug: 'new-org',
    };
    expect(newOrg.name).toBe('New Org');
  });
});

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

describe('users schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(users)).toBe('users');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(users);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'email', 'name', 'passwordHash', 'emailVerified', 'image', 'createdAt']),
    );
  });

  it('id column is uuid primary key', () => {
    const col = users.id;
    expect(col.columnType).toBe('PgUUID');
    expect(col.primary).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it('email column is unique and not null', () => {
    const col = users.email;
    expect(col.isUnique).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it('passwordHash column is nullable (null for OAuth-only users)', () => {
    const col = users.passwordHash;
    expect(col.notNull).toBeFalsy();
  });

  it('emailVerified defaults to false', () => {
    const col = users.emailVerified;
    expect(col.default).toBe(false);
    expect(col.notNull).toBe(true);
  });

  it('image column is nullable', () => {
    const col = users.image;
    expect(col.notNull).toBeFalsy();
  });

  it('exports User and NewUser types (compile-time check)', () => {
    const user: User = {
      id: 'uuid',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: null,
      emailVerified: false,
      image: null,
      createdAt: new Date(),
    };
    expect(user.email).toBe('test@example.com');

    const newUser: NewUser = {
      email: 'new@example.com',
      name: 'New User',
    };
    expect(newUser.email).toBe('new@example.com');
  });
});

// ---------------------------------------------------------------------------
// memberships
// ---------------------------------------------------------------------------

describe('memberships schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(memberships)).toBe('memberships');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(memberships);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'userId', 'organisationId', 'role', 'status', 'createdAt']),
    );
  });

  it('role column defaults to "carer"', () => {
    const col = memberships.role;
    expect(col.default).toBe('carer');
    expect(col.notNull).toBe(true);
  });

  it('status column defaults to "active"', () => {
    const col = memberships.status;
    expect(col.default).toBe('active');
    expect(col.notNull).toBe(true);
  });

  it('userId and organisationId are not null', () => {
    expect(memberships.userId.notNull).toBe(true);
    expect(memberships.organisationId.notNull).toBe(true);
  });

  it('exports Membership and NewMembership types (compile-time check)', () => {
    const membership: Membership = {
      id: 'uuid',
      userId: 'user-uuid',
      organisationId: 'org-uuid',
      role: 'carer',
      status: 'active',
      createdAt: new Date(),
    };
    expect(membership.role).toBe('carer');

    const newMembership: NewMembership = {
      userId: 'user-uuid',
      organisationId: 'org-uuid',
    };
    expect(newMembership.userId).toBe('user-uuid');
  });
});

// ---------------------------------------------------------------------------
// audit_logs
// ---------------------------------------------------------------------------

describe('auditLogs schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(auditLogs)).toBe('audit_logs');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(auditLogs);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id', 'userId', 'organisationId', 'action', 'entityType', 'entityId', 'changes', 'createdAt',
      ]),
    );
  });

  it('action, entityType, entityId are not null', () => {
    expect(auditLogs.action.notNull).toBe(true);
    expect(auditLogs.entityType.notNull).toBe(true);
    expect(auditLogs.entityId.notNull).toBe(true);
  });

  it('userId is nullable (system events have no user)', () => {
    expect(auditLogs.userId.notNull).toBeFalsy();
  });

  it('organisationId is nullable (platform-level events)', () => {
    expect(auditLogs.organisationId.notNull).toBeFalsy();
  });

  it('changes column is jsonb (nullable)', () => {
    const col = auditLogs.changes;
    expect(col.columnType).toBe('PgJsonb');
    expect(col.notNull).toBeFalsy();
  });

  it('exports AuditLog and NewAuditLog types (compile-time check)', () => {
    const log: AuditLog = {
      id: 'uuid',
      userId: null,
      organisationId: 'org-uuid',
      action: 'create',
      entityType: 'person',
      entityId: 'person-uuid',
      changes: { before: null, after: { name: 'Alice' } },
      ipAddress: null,
      createdAt: new Date(),
    };
    expect(log.action).toBe('create');

    const newLog: NewAuditLog = {
      action: 'update',
      entityType: 'care_plan',
      entityId: 'plan-uuid',
    };
    expect(newLog.action).toBe('update');
  });
});

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

describe('relations', () => {
  it('organisationsRelations is defined', () => {
    expect(organisationsRelations).toBeDefined();
  });

  it('usersRelations is defined', () => {
    expect(usersRelations).toBeDefined();
  });

  it('membershipsRelations is defined', () => {
    expect(membershipsRelations).toBeDefined();
  });

  it('auditLogsRelations is defined', () => {
    expect(auditLogsRelations).toBeDefined();
  });
});
