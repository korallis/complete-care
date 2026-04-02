import { describe, it, expect } from 'vitest';
import {
  anonymiseRecord,
  calculateErasureDeadline,
  buildAnonymisationReport,
  createErasureRequestSchema,
  REDACTED,
  ERASURE_DEADLINE_DAYS,
} from './erasure';

describe('Erasure utilities', () => {
  describe('anonymiseRecord', () => {
    it('should redact PII fields', () => {
      const record = {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '07700900000',
        status: 'active',
        createdAt: '2026-01-01',
      };

      const { anonymised, redactedFields } = anonymiseRecord(record);

      expect(anonymised.name).toBe(REDACTED);
      expect(anonymised.email).toBe(REDACTED);
      expect(anonymised.phone).toBe(REDACTED);
      expect(anonymised.id).toBe('123');
      expect(anonymised.status).toBe('active');
      expect(redactedFields).toContain('name');
      expect(redactedFields).toContain('email');
      expect(redactedFields).toContain('phone');
    });

    it('should not redact fields not in PII list', () => {
      const record = { id: '123', status: 'active' };
      const { anonymised, redactedFields } = anonymiseRecord(record);

      expect(anonymised.id).toBe('123');
      expect(anonymised.status).toBe('active');
      expect(redactedFields).toHaveLength(0);
    });

    it('should handle custom fields to redact', () => {
      const record = { id: '123', customField: 'secret', name: 'Jane' };
      const { anonymised, redactedFields } = anonymiseRecord(record, ['customField']);

      expect(anonymised.customField).toBe(REDACTED);
      expect(anonymised.name).toBe('Jane'); // Not in custom list
      expect(redactedFields).toEqual(['customField']);
    });

    it('should skip null and undefined fields', () => {
      const record = { name: null, email: undefined, phone: '07700900000' };
      const { redactedFields } = anonymiseRecord(record);

      expect(redactedFields).toContain('phone');
      expect(redactedFields).not.toContain('name');
      expect(redactedFields).not.toContain('email');
    });
  });

  describe('calculateErasureDeadline', () => {
    it('should return a date 30 days after receipt', () => {
      const received = new Date('2026-01-01');
      const deadline = calculateErasureDeadline(received);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-01-31');
    });
  });

  describe('buildAnonymisationReport', () => {
    it('should build a valid report', () => {
      const report = buildAnonymisationReport('req-123', [
        { tableName: 'persons', recordCount: 1, fieldsRedacted: ['name', 'email'] },
      ]);
      expect(report.requestId).toBe('req-123');
      expect(report.tablesProcessed).toHaveLength(1);
      expect(report.processedAt).toBeTruthy();
    });
  });

  describe('createErasureRequestSchema', () => {
    it('should validate correct input', () => {
      const input = {
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        subjectName: 'Jane Doe',
        subjectEmail: 'jane@example.com',
        receivedAt: '2026-01-01',
      };
      const result = createErasureRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  it('should have a 30-day deadline constant', () => {
    expect(ERASURE_DEADLINE_DAYS).toBe(30);
  });
});
