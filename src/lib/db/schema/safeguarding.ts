import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Safeguarding Concerns -- records concerns raised by any staff member about
 * a child's welfare. Each concern captures verbatim details, the child's
 * presentation, and optional body map links.
 *
 * Workflow: raised -> under_review -> monitoring | referred | nfa | closed
 *
 * DSL (Designated Safeguarding Lead) reviews and makes decisions on next steps.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

export type ConcernStatus =
  | 'raised'
  | 'under_review'
  | 'monitoring'
  | 'referred'
  | 'nfa'
  | 'closed';

export type DslDecision = 'monitor' | 'refer' | 'nfa';

export const safeguardingConcerns = pgTable(
  'safeguarding_concerns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this concern relates to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Staff member who raised the concern */
    raisedById: uuid('raised_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised name of the person who raised the concern */
    raisedByName: text('raised_by_name'),
    /** Date and time of the concern / observation */
    dateTime: timestamp('date_time').notNull(),
    /** Exact verbatim account of what was observed or disclosed */
    verbatimAccount: text('verbatim_account').notNull(),
    /** Description of the child's presentation at the time */
    childPresentation: text('child_presentation'),
    /** IDs of linked body map entries (from documents module) */
    linkedBodyMapEntryIds: jsonb('linked_body_map_entry_ids')
      .$type<string[]>()
      .default([]),
    /** Workflow status: raised | under_review | monitoring | referred | nfa | closed */
    status: text('status').notNull().default('raised'),
    /** DSL who reviewed the concern */
    dslReviewById: uuid('dsl_review_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** When the DSL reviewed this concern */
    dslReviewDate: timestamp('dsl_review_date'),
    /** DSL decision: monitor | refer | nfa */
    dslDecision: text('dsl_decision'),
    /** DSL review notes / rationale */
    dslNotes: text('dsl_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('safeguarding_concerns_organisation_id_idx').on(t.organisationId),
    /** Concerns for a specific child */
    index('safeguarding_concerns_org_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by status within an org */
    index('safeguarding_concerns_org_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Chronological ordering within an org */
    index('safeguarding_concerns_org_date_idx').on(
      t.organisationId,
      t.dateTime,
    ),
  ],
);

export type SafeguardingConcern = typeof safeguardingConcerns.$inferSelect;
export type NewSafeguardingConcern = typeof safeguardingConcerns.$inferInsert;

/**
 * Safeguarding Referrals -- tracks external referrals made as a result
 * of safeguarding concerns. Covers LADO, MASH, police, and Section 47.
 *
 * Each referral is linked to a concern and records reference numbers,
 * outcomes, and the staff member who made the referral.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

export type ReferralType = 'lado' | 'mash' | 'police' | 'section47';

export const safeguardingReferrals = pgTable(
  'safeguarding_referrals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The concern that triggered this referral */
    concernId: uuid('concern_id')
      .notNull()
      .references(() => safeguardingConcerns.id, { onDelete: 'cascade' }),
    /** Type of referral: lado | mash | police | section47 */
    referralType: text('referral_type').notNull(),
    /** Date the referral was made (ISO YYYY-MM-DD) */
    referralDate: text('referral_date').notNull(),
    /** External reference number from the receiving body */
    referenceNumber: text('reference_number'),
    /** Outcome of the referral */
    outcome: text('outcome'),
    /** Date the outcome was received (ISO YYYY-MM-DD) */
    outcomeDate: text('outcome_date'),
    /** Additional notes about the referral */
    notes: text('notes'),
    /** Staff member who made the referral */
    madeById: uuid('made_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('safeguarding_referrals_organisation_id_idx').on(t.organisationId),
    /** Referrals for a specific concern */
    index('safeguarding_referrals_org_concern_idx').on(
      t.organisationId,
      t.concernId,
    ),
    /** Filter by referral type */
    index('safeguarding_referrals_org_type_idx').on(
      t.organisationId,
      t.referralType,
    ),
  ],
);

export type SafeguardingReferral = typeof safeguardingReferrals.$inferSelect;
export type NewSafeguardingReferral = typeof safeguardingReferrals.$inferInsert;
