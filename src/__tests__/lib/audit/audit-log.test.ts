/**
 * Audit Trail Tests
 *
 * Covers:
 * - auditLog() utility function behaviour
 * - Immutability contract: only INSERT, never UPDATE/DELETE
 * - Schema correctness (ipAddress column, all required fields)
 * - Error suppression (audit failures don't throw)
 * - auditLogs schema exports
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Mock db module — no live DB connection required
// ---------------------------------------------------------------------------

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db/schema')>();
  return { ...original };
});

// ---------------------------------------------------------------------------
// 1. auditLogs schema
// ---------------------------------------------------------------------------

describe('auditLogs schema', () => {
  it('has the correct table name', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(getTableName(auditLogs)).toBe('audit_logs');
  });

  it('includes the ipAddress column (feature requirement)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    const cols = getTableColumns(auditLogs);
    expect(Object.keys(cols)).toContain('ipAddress');
  });

  it('ipAddress column is nullable (system events have no IP)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    const cols = getTableColumns(auditLogs);
    expect(cols.ipAddress.notNull).toBeFalsy();
  });

  it('defines all required columns per the feature spec', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    const cols = Object.keys(auditLogs);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'userId',
        'organisationId',
        'action',
        'entityType',
        'entityId',
        'changes',
        'ipAddress',
        'createdAt',
      ]),
    );
  });

  it('action, entityType, entityId are NOT NULL (required fields)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.action.notNull).toBe(true);
    expect(auditLogs.entityType.notNull).toBe(true);
    expect(auditLogs.entityId.notNull).toBe(true);
  });

  it('userId is nullable (null for system-generated events)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.userId.notNull).toBeFalsy();
  });

  it('organisationId is nullable (null for platform-level events)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.organisationId.notNull).toBeFalsy();
  });

  it('changes is a JSONB column (nullable)', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.changes.columnType).toBe('PgJsonb');
    expect(auditLogs.changes.notNull).toBeFalsy();
  });

  it('id is a UUID primary key with defaultRandom', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.id.columnType).toBe('PgUUID');
    expect(auditLogs.id.primary).toBe(true);
    expect(auditLogs.id.hasDefault).toBe(true);
  });

  it('createdAt has defaultNow and is NOT NULL', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs.createdAt.hasDefault).toBe(true);
    expect(auditLogs.createdAt.notNull).toBe(true);
  });

  it('AuditLog type includes ipAddress', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs).toBeDefined();
    type AuditLogType = typeof auditLogs.$inferSelect;
    const log: AuditLogType = {
      id: 'uuid',
      userId: null,
      organisationId: 'org-uuid',
      action: 'create',
      entityType: 'person',
      entityId: 'person-uuid',
      changes: { before: null, after: { name: 'Alice' } },
      ipAddress: '192.168.1.1',
      createdAt: new Date(),
    };
    expect(log.ipAddress).toBe('192.168.1.1');
  });

  it('NewAuditLog type works with minimum required fields', async () => {
    const { auditLogs } = await import('@/lib/db/schema');
    expect(auditLogs).toBeDefined();
    type NewAuditLogType = typeof auditLogs.$inferInsert;
    const newLog: NewAuditLogType = {
      action: 'create',
      entityType: 'person',
      entityId: 'person-uuid',
    };
    expect(newLog.action).toBe('create');
  });
});

// ---------------------------------------------------------------------------
// 2. auditLog() utility function
// ---------------------------------------------------------------------------

describe('auditLog() utility function', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inserts an audit log entry into the database', async () => {
    const { db } = await import('@/lib/db');
    const mockInsertValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('create', 'person', 'person-123');

    expect(db.insert).toHaveBeenCalledOnce();
    expect(mockInsertValues).toHaveBeenCalledOnce();
  });

  it('inserts the correct action, entityType, entityId', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('update', 'care_plan', 'plan-abc');

    expect(insertedValues).toMatchObject({
      action: 'update',
      entityType: 'care_plan',
      entityId: 'plan-abc',
    });
  });

  it('includes before/after changes in the insert', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('update', 'person', 'person-123', {
      before: { name: 'Alice', status: 'active' },
      after: { name: 'Alice Smith', status: 'active' },
    });

    expect(insertedValues).toMatchObject({
      changes: {
        before: { name: 'Alice', status: 'active' },
        after: { name: 'Alice Smith', status: 'active' },
      },
    });
  });

  it('includes userId, organisationId, and ipAddress from options', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('delete', 'document', 'doc-xyz', undefined, {
      userId: 'user-id-123',
      organisationId: 'org-id-456',
      ipAddress: '10.0.0.1',
    });

    expect(insertedValues).toMatchObject({
      userId: 'user-id-123',
      organisationId: 'org-id-456',
      ipAddress: '10.0.0.1',
    });
  });

  it('sets userId to null when not provided (system event)', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('create', 'organisation', 'org-123');

    expect(insertedValues).toMatchObject({ userId: null });
  });

  it('sets changes to null when not provided', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('delete', 'staff', 'staff-789');

    expect(insertedValues).toMatchObject({ changes: null });
  });

  it('does NOT throw when the database insert fails (silent suppression)', async () => {
    const { db } = await import('@/lib/db');
    const mockInsertValues = vi.fn().mockRejectedValue(new Error('DB connection failed'));
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');

    // Should NOT throw — audit failures are silently suppressed
    await expect(auditLog('create', 'person', 'p-1')).resolves.toBeUndefined();
  });

  it('does NOT update or delete existing entries (immutability)', async () => {
    const { db } = await import('@/lib/db');
    const mockInsertValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('update', 'person', 'p-1');

    // db.update and db.delete must NEVER be called
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('supports custom action strings (not just create/update/delete)', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('login', 'user', 'user-123');

    expect(insertedValues).toMatchObject({ action: 'login' });
  });

  it('create action has null before (nothing existed before)', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('create', 'person', 'p-1', {
      before: null,
      after: { name: 'New Person', status: 'active' },
    });

    const changes = insertedValues.changes as { before: unknown; after: unknown };
    expect(changes.before).toBeNull();
    expect(changes.after).toMatchObject({ name: 'New Person' });
  });

  it('delete action has null after (entity no longer exists)', async () => {
    const { db } = await import('@/lib/db');
    let insertedValues: Record<string, unknown> = {};
    const mockInsertValues = vi.fn().mockImplementation((vals) => {
      insertedValues = vals;
      return Promise.resolve(undefined);
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockInsertValues });

    const { auditLog } = await import('@/lib/audit');
    await auditLog('delete', 'document', 'doc-1', {
      before: { name: 'Old Doc', category: 'medical' },
      after: null,
    });

    const changes = insertedValues.changes as { before: unknown; after: unknown };
    expect(changes.after).toBeNull();
    expect(changes.before).toMatchObject({ name: 'Old Doc' });
  });
});
