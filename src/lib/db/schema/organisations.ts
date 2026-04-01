import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

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
  /**
   * Organisation type — describes the provider structure.
   * Values: independent_provider | care_group | nhs_statutory | local_authority | charity_nfp | other
   */
  orgType: text('org_type'),
  /** Which care domains are active for this org (domiciliary_care | supported_living | childrens_homes) */
  domains: text('domains').array().notNull().default([]),

  // --- Stripe billing fields ---
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  /** Stripe subscription status: active | past_due | canceled | trialing | incomplete */
  subscriptionStatus: text('subscription_status').notNull().default('free'),
  /** End of current billing period (null for free tier) */
  currentPeriodEnd: timestamp('current_period_end'),
  /** Maximum number of users allowed on the current plan */
  maxUsers: integer('max_users').notNull().default(5),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
