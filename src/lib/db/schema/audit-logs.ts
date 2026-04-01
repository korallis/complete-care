import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organisations } from './organisations';

/**
 * Audit logs — immutable record of every data mutation in the platform.
 * Required for CQC/Ofsted regulatory compliance.
 *
 * IMMUTABILITY CONTRACT: This table must NEVER be updated or deleted from.
 * Only INSERT operations are permitted. Enforce at the application layer and
 * (optionally) via a Postgres trigger that blocks UPDATE/DELETE.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** The user who performed the action. Null for system-generated events. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    /** The organisation context. Null for platform-level events. */
    organisationId: uuid('organisation_id').references(() => organisations.id, {
      onDelete: 'set null',
    }),
    /** The operation performed: create | update | delete | login | logout | invite | etc. */
    action: text('action').notNull(),
    /** The type of entity affected: person | care_plan | staff | membership | organisation | etc. */
    entityType: text('entity_type').notNull(),
    /** The ID of the affected entity. */
    entityId: text('entity_id').notNull(),
    /** Before/after snapshot of changed fields. Structure: { before: {...}, after: {...} } */
    changes: jsonb('changes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // Efficient queries by organisation (e.g. org-level audit log page)
    index('audit_logs_organisation_id_idx').on(t.organisationId),
    // Efficient queries by user (e.g. "what did this user do?")
    index('audit_logs_user_id_idx').on(t.userId),
    // Efficient queries by entity (e.g. entity-level history tab)
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    // Chronological queries
    index('audit_logs_created_at_idx').on(t.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
