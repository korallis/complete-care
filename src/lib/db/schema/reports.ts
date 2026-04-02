import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Natural language queries — stores user queries and generated results.
 * Acts as an audit trail and enables query replay/sharing.
 */
export const nlQueries = pgTable(
  'nl_queries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The natural language question entered by the user */
    queryText: text('query_text').notNull(),
    /** The generated structured query (SQL-like representation) */
    generatedQuery: text('generated_query'),
    /** The result set returned (stored as JSON for replay) */
    resultData: jsonb('result_data'),
    /** Number of rows returned */
    resultCount: text('result_count'),
    /** Status: pending | completed | error */
    status: text('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('nl_queries_organisation_id_idx').on(t.organisationId),
    index('nl_queries_created_by_idx').on(t.createdBy),
  ],
);

export type NlQuery = typeof nlQueries.$inferSelect;
export type NewNlQuery = typeof nlQueries.$inferInsert;

/**
 * Custom report definitions — saved report configurations.
 */
export const customReports = pgTable(
  'custom_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** User-given report name */
    name: text('name').notNull(),
    /** Description of the report */
    description: text('description'),
    /** Data source: persons | care_plans | visits | budgets | incidents | staff | custom */
    dataSource: text('data_source').notNull(),
    /** Column definitions: which fields to include */
    columns: jsonb('columns').$type<
      Array<{
        field: string;
        label: string;
        visible: boolean;
      }>
    >(),
    /** Filter definitions */
    filters: jsonb('filters').$type<
      Array<{
        field: string;
        operator: string;
        value: string;
      }>
    >(),
    /** Grouping fields */
    groupBy: jsonb('group_by').$type<string[]>(),
    /** Sort order */
    sortBy: jsonb('sort_by').$type<
      Array<{
        field: string;
        direction: 'asc' | 'desc';
      }>
    >(),
    /** Export format preference: csv | pdf | both */
    exportFormat: text('export_format').notNull().default('csv'),
    /** Is this a shared/org-wide report or personal? */
    isShared: text('is_shared').notNull().default('personal'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('custom_reports_organisation_id_idx').on(t.organisationId),
    index('custom_reports_created_by_idx').on(t.createdBy),
    index('custom_reports_data_source_idx').on(t.dataSource),
  ],
);

export type CustomReport = typeof customReports.$inferSelect;
export type NewCustomReport = typeof customReports.$inferInsert;
