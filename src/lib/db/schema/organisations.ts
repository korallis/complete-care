import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Organisations (tenants) — root of the multi-tenant data model.
 * Every tenant-scoped table references this via organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  /** URL-safe identifier used in org-scoped routing: /[orgSlug]/persons */
  slug: text('slug').notNull().unique(),
  /** Subscription tier: free | professional | enterprise */
  plan: text('plan').notNull().default('free'),
  /** Which care domains are active for this org (domiciliary_care | supported_living | childrens_homes) */
  domains: text('domains').array().notNull().default([]),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
