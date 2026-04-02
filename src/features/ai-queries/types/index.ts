import type { NlQuery, NewNlQuery } from '@/lib/db/schema';

export type { NlQuery, NewNlQuery };

export type QueryStatus = 'pending' | 'completed' | 'error';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
}

export interface SuggestedQuery {
  label: string;
  queryText: string;
}
