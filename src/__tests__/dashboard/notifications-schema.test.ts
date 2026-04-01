/**
 * Notifications Schema Tests
 *
 * Covers:
 * - Schema structure and column types
 * - Default values
 * - Inferred TypeScript types
 * - Index definitions
 */

import { describe, it, expect } from 'vitest';
import { notifications } from '@/lib/db/schema/notifications';
import { getTableColumns } from 'drizzle-orm';

describe('notifications schema', () => {
  describe('table structure', () => {
    it('has correct columns', () => {
      const columns = getTableColumns(notifications);
      const columnNames = Object.keys(columns);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('organisationId');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('body');
      expect(columnNames).toContain('entityType');
      expect(columnNames).toContain('entityId');
      expect(columnNames).toContain('actionUrl');
      expect(columnNames).toContain('readAt');
      expect(columnNames).toContain('createdAt');
    });

    it('has 11 columns total', () => {
      const columns = getTableColumns(notifications);
      expect(Object.keys(columns)).toHaveLength(11);
    });
  });

  describe('column properties', () => {
    it('id column is a UUID primary key', () => {
      const columns = getTableColumns(notifications);
      expect(columns.id.dataType).toBe('string');
      expect(columns.id.primary).toBe(true);
    });

    it('userId is not null', () => {
      const columns = getTableColumns(notifications);
      expect(columns.userId.notNull).toBe(true);
    });

    it('organisationId is not null', () => {
      const columns = getTableColumns(notifications);
      expect(columns.organisationId.notNull).toBe(true);
    });

    it('type defaults to general', () => {
      const columns = getTableColumns(notifications);
      expect(columns.type.default).toBe('general');
    });

    it('title is not null', () => {
      const columns = getTableColumns(notifications);
      expect(columns.title.notNull).toBe(true);
    });

    it('body can be null (optional message body)', () => {
      const columns = getTableColumns(notifications);
      expect(columns.body.notNull).toBeFalsy();
    });

    it('readAt can be null (null = unread)', () => {
      const columns = getTableColumns(notifications);
      expect(columns.readAt.notNull).toBeFalsy();
    });

    it('createdAt is not null and has default', () => {
      const columns = getTableColumns(notifications);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
    });
  });

  describe('TypeScript inference', () => {
    it('infers select type with correct optional fields', () => {
      // Type-level test — if this compiles, the types are correct
      type NotificationType = typeof notifications.$inferSelect;

      // Verify the type has the expected shape at runtime via type narrowing
      const mockNotification: NotificationType = {
        id: 'test-id',
        userId: 'user-id',
        organisationId: 'org-id',
        type: 'general',
        title: 'Test title',
        body: null,
        entityType: null,
        entityId: null,
        actionUrl: null,
        readAt: null,
        createdAt: new Date(),
      };

      expect(mockNotification.id).toBe('test-id');
      expect(mockNotification.readAt).toBeNull();
      expect(mockNotification.type).toBe('general');
    });

    it('insert type allows optional fields to be omitted', () => {
      type InsertType = typeof notifications.$inferInsert;

      // Minimum required fields
      const minimalInsert: InsertType = {
        userId: 'user-id',
        organisationId: 'org-id',
        title: 'Test notification',
      };

      expect(minimalInsert.title).toBe('Test notification');
    });
  });
});
