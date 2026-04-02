import type { CustomReport, NewCustomReport } from '@/lib/db/schema';

export type { CustomReport, NewCustomReport };

export type DataSource =
  | 'persons'
  | 'care_plans'
  | 'visits'
  | 'budgets'
  | 'incidents'
  | 'staff'
  | 'custom';

export type ExportFormat = 'csv' | 'pdf' | 'both';

export interface ColumnDefinition {
  field: string;
  label: string;
  visible: boolean;
}

export interface FilterDefinition {
  field: string;
  operator: string;
  value: string;
}

export interface SortDefinition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataSourceSchema {
  name: DataSource;
  label: string;
  availableColumns: ColumnDefinition[];
}
