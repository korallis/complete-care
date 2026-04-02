/**
 * Data export/import utilities.
 *
 * - Export person data as JSON or CSV.
 * - Import data from other systems with CSV column mapping.
 */

import { z } from 'zod';

/** Validation schema for initiating a data export. */
export const createExportSchema = z.object({
  organisationId: z.string().uuid(),
  exportType: z.enum(['sar', 'person_data', 'bulk']),
  format: z.enum(['json', 'csv', 'pdf']),
  personId: z.string().uuid().optional(),
  sarId: z.string().uuid().optional(),
  initiatedByUserId: z.string().uuid(),
});

export type CreateExportInput = z.infer<typeof createExportSchema>;

/** Validation schema for initiating a data import. */
export const createImportSchema = z.object({
  organisationId: z.string().uuid(),
  sourceSystem: z.string().min(1, 'Source system name is required'),
  format: z.enum(['csv', 'json']),
  filePath: z.string().min(1, 'File path is required'),
  initiatedByUserId: z.string().uuid(),
});

export type CreateImportInput = z.infer<typeof createImportSchema>;

/** Column mapping entry for CSV imports. */
export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'none' | 'date' | 'uppercase' | 'lowercase' | 'trim';
  required: boolean;
}

/** Validation schema for column mapping. */
export const columnMappingSchema = z.object({
  sourceColumn: z.string().min(1),
  targetField: z.string().min(1),
  transform: z.enum(['none', 'date', 'uppercase', 'lowercase', 'trim']).default('none'),
  required: z.boolean().default(false),
});

/** Available target fields for person data import. */
export const IMPORTABLE_PERSON_FIELDS = [
  { field: 'name', label: 'Full Name', required: true },
  { field: 'firstName', label: 'First Name', required: false },
  { field: 'lastName', label: 'Last Name', required: false },
  { field: 'email', label: 'Email', required: false },
  { field: 'phone', label: 'Phone', required: false },
  { field: 'dateOfBirth', label: 'Date of Birth', required: false },
  { field: 'nhsNumber', label: 'NHS Number', required: false },
  { field: 'address', label: 'Address', required: false },
  { field: 'postcode', label: 'Postcode', required: false },
] as const;

/** Export status labels. */
export const EXPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  generating: 'Generating',
  completed: 'Completed',
  failed: 'Failed',
};

/** Import status labels. */
export const IMPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  mapping: 'Column Mapping',
  validating: 'Validating',
  importing: 'Importing',
  completed: 'Completed',
  failed: 'Failed',
};

/**
 * Convert records to CSV string.
 */
export function recordsToCsv<T extends Record<string, unknown>>(
  records: T[],
  columns?: string[],
): string {
  if (records.length === 0) return '';

  const cols = columns ?? Object.keys(records[0]);
  const header = cols.map(escapeCsvField).join(',');

  const rows = records.map((record) =>
    cols.map((col) => escapeCsvField(String(record[col] ?? ''))).join(','),
  );

  return [header, ...rows].join('\n');
}

/**
 * Parse a CSV string into records.
 */
export function csvToRecords(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Apply column mapping to transform imported records.
 */
export function applyColumnMapping(
  records: Record<string, string>[],
  mapping: ColumnMapping[],
): { mapped: Record<string, string>[]; errors: Array<{ row: number; error: string }> } {
  const mapped: Record<string, string>[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  records.forEach((record, index) => {
    const mappedRecord: Record<string, string> = {};
    let hasError = false;

    for (const m of mapping) {
      const value = record[m.sourceColumn];

      if (m.required && (!value || value.trim() === '')) {
        errors.push({
          row: index + 1,
          error: `Required field "${m.targetField}" (from column "${m.sourceColumn}") is empty`,
        });
        hasError = true;
        continue;
      }

      if (value !== undefined) {
        mappedRecord[m.targetField] = applyTransform(value, m.transform ?? 'none');
      }
    }

    if (!hasError) {
      mapped.push(mappedRecord);
    }
  });

  return { mapped, errors };
}

/** Escape a CSV field value. */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Parse a single CSV line into fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current);
  return fields;
}

/** Apply a transform to a string value. */
function applyTransform(value: string, transform: string): string {
  switch (transform) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'trim':
      return value.trim();
    case 'date': {
      // Attempt to parse and normalise date to ISO format
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? value : parsed.toISOString().split('T')[0];
    }
    default:
      return value;
  }
}
