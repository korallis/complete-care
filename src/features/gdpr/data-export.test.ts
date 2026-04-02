import { describe, it, expect } from 'vitest';
import {
  recordsToCsv,
  csvToRecords,
  applyColumnMapping,
  createExportSchema,
  createImportSchema,
  type ColumnMapping,
} from './data-export';

describe('Data export/import utilities', () => {
  describe('recordsToCsv', () => {
    it('should convert records to CSV', () => {
      const records = [
        { name: 'Jane Doe', email: 'jane@example.com' },
        { name: 'John Smith', email: 'john@example.com' },
      ];
      const csv = recordsToCsv(records);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('name,email');
      expect(lines[1]).toBe('Jane Doe,jane@example.com');
      expect(lines[2]).toBe('John Smith,john@example.com');
    });

    it('should escape fields with commas', () => {
      const records = [{ name: 'Doe, Jane', email: 'jane@example.com' }];
      const csv = recordsToCsv(records);
      expect(csv).toContain('"Doe, Jane"');
    });

    it('should return empty string for empty array', () => {
      expect(recordsToCsv([])).toBe('');
    });

    it('should use specified columns', () => {
      const records = [{ name: 'Jane', email: 'jane@ex.com', phone: '123' }];
      const csv = recordsToCsv(records, ['name', 'email']);
      expect(csv.split('\n')[0]).toBe('name,email');
    });
  });

  describe('csvToRecords', () => {
    it('should parse CSV into records', () => {
      const csv = 'name,email\nJane Doe,jane@example.com\nJohn Smith,john@example.com';
      const records = csvToRecords(csv);
      expect(records).toHaveLength(2);
      expect(records[0].name).toBe('Jane Doe');
      expect(records[1].email).toBe('john@example.com');
    });

    it('should handle quoted fields', () => {
      const csv = 'name,email\n"Doe, Jane",jane@example.com';
      const records = csvToRecords(csv);
      expect(records[0].name).toBe('Doe, Jane');
    });

    it('should return empty array for header-only CSV', () => {
      expect(csvToRecords('name,email')).toHaveLength(0);
    });
  });

  describe('applyColumnMapping', () => {
    it('should map columns correctly', () => {
      const records = [{ 'Full Name': 'Jane Doe', 'Email Address': 'jane@ex.com' }];
      const mapping: ColumnMapping[] = [
        { sourceColumn: 'Full Name', targetField: 'name', required: true },
        { sourceColumn: 'Email Address', targetField: 'email', required: false },
      ];

      const { mapped, errors } = applyColumnMapping(records, mapping);
      expect(mapped).toHaveLength(1);
      expect(mapped[0].name).toBe('Jane Doe');
      expect(mapped[0].email).toBe('jane@ex.com');
      expect(errors).toHaveLength(0);
    });

    it('should report errors for missing required fields', () => {
      const records = [{ 'Full Name': '', 'Email Address': 'jane@ex.com' }];
      const mapping: ColumnMapping[] = [
        { sourceColumn: 'Full Name', targetField: 'name', required: true },
      ];

      const { mapped, errors } = applyColumnMapping(records, mapping);
      expect(mapped).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].row).toBe(1);
    });

    it('should apply transforms', () => {
      const records = [{ name: '  jane doe  ' }];
      const mapping: ColumnMapping[] = [
        { sourceColumn: 'name', targetField: 'name', required: false, transform: 'trim' },
      ];

      const { mapped } = applyColumnMapping(records, mapping);
      expect(mapped[0].name).toBe('jane doe');
    });
  });

  describe('createExportSchema', () => {
    it('should validate correct input', () => {
      const result = createExportSchema.safeParse({
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        exportType: 'person_data',
        format: 'json',
        initiatedByUserId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createImportSchema', () => {
    it('should validate correct input', () => {
      const result = createImportSchema.safeParse({
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        sourceSystem: 'OldCMS',
        format: 'csv',
        filePath: '/uploads/import.csv',
        initiatedByUserId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });
});
