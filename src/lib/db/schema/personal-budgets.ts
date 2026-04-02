import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Personal budgets — allocation per person with spend tracking.
 */
export const personalBudgets = pgTable(
  'personal_budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The service user this budget belongs to */
    personId: uuid('person_id').notNull(),
    /** Budget label, e.g. "2025/26 Direct Payment" */
    budgetName: text('budget_name').notNull(),
    /** Total allocated amount in GBP (stored as numeric for precision) */
    allocatedAmount: numeric('allocated_amount', { precision: 12, scale: 2 }).notNull(),
    /** Budget period */
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    /** Commissioner: local_authority | nhs | private | mixed */
    commissionerType: text('commissioner_type').notNull().default('local_authority'),
    commissionerName: text('commissioner_name'),
    /** Status: active | exhausted | closed */
    status: text('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('personal_budgets_organisation_id_idx').on(t.organisationId),
    index('personal_budgets_person_id_idx').on(t.personId),
  ],
);

export type PersonalBudget = typeof personalBudgets.$inferSelect;
export type NewPersonalBudget = typeof personalBudgets.$inferInsert;

/**
 * Budget spend items — individual spend records within a personal budget.
 */
export const budgetSpendItems = pgTable(
  'budget_spend_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    budgetId: uuid('budget_id')
      .notNull()
      .references(() => personalBudgets.id, { onDelete: 'cascade' }),
    /** Spend category: personal_care | domestic | transport | social | equipment | other */
    category: text('category').notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    spendDate: timestamp('spend_date').notNull(),
    /** Optional reference/receipt number */
    reference: text('reference'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('budget_spend_items_budget_id_idx').on(t.budgetId),
    index('budget_spend_items_organisation_id_idx').on(t.organisationId),
    index('budget_spend_items_category_idx').on(t.category),
  ],
);

export type BudgetSpendItem = typeof budgetSpendItems.$inferSelect;
export type NewBudgetSpendItem = typeof budgetSpendItems.$inferInsert;

/**
 * Support hour logs — planned vs actual hours for variance reporting.
 */
export const supportHourLogs = pgTable(
  'support_hour_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    budgetId: uuid('budget_id').references(() => personalBudgets.id, { onDelete: 'set null' }),
    /** ISO week number for aggregation */
    weekNumber: integer('week_number').notNull(),
    /** Year for the week */
    year: integer('year').notNull(),
    /** Planned hours for the week */
    plannedHours: numeric('planned_hours', { precision: 8, scale: 2 }).notNull(),
    /** Actual hours delivered */
    actualHours: numeric('actual_hours', { precision: 8, scale: 2 }).notNull().default('0'),
    /** Variance = actual - planned (can be negative) */
    varianceHours: numeric('variance_hours', { precision: 8, scale: 2 }).notNull().default('0'),
    /** Reason for any significant variance */
    varianceReason: text('variance_reason'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('support_hour_logs_organisation_id_idx').on(t.organisationId),
    index('support_hour_logs_person_id_idx').on(t.personId),
    index('support_hour_logs_period_idx').on(t.year, t.weekNumber),
  ],
);

export type SupportHourLog = typeof supportHourLogs.$inferSelect;
export type NewSupportHourLog = typeof supportHourLogs.$inferInsert;
