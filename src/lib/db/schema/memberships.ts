import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organisations } from './organisations';

/**
 * Memberships — join table linking users to organisations with a role.
 * A user can belong to multiple organisations with different roles in each.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /**
     * RBAC role within the organisation.
     * Hierarchy (highest to lowest): owner > admin > manager > senior_carer > carer > viewer
     */
    role: text('role').notNull().default('carer'),
    /** Membership lifecycle state: active | pending | suspended */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // One membership per user per organisation
    unique('memberships_user_org_unique').on(t.userId, t.organisationId),
    // Fast lookup of all members of an organisation
    index('memberships_organisation_id_idx').on(t.organisationId),
    // Fast lookup of all orgs a user belongs to
    index('memberships_user_id_idx').on(t.userId),
  ],
);

// Relations are defined in ./relations.ts to avoid duplicate exports.

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
