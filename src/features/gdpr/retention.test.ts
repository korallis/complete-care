import { describe, it, expect } from 'vitest';
import {
  calculateRetentionExpiry,
  isInWarningWindow,
  isRetentionExpired,
  calculateChildrensRecordExpiry,
  CHILDRENS_RECORD_RETENTION_DAYS,
  DEFAULT_RETENTION_PERIODS,
  retentionPolicySchema,
} from './retention';

describe('Retention policy utilities', () => {
  describe('calculateRetentionExpiry', () => {
    it('should calculate expiry based on creation date and retention days', () => {
      const created = new Date('2026-01-01');
      const expiry = calculateRetentionExpiry(created, 365);
      expect(expiry.toISOString().split('T')[0]).toBe('2027-01-01');
    });
  });

  describe('isInWarningWindow', () => {
    it('should return true when within warning period', () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10);
      expect(isInWarningWindow(expiresAt, 30)).toBe(true);
    });

    it('should return false when far from expiry', () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);
      expect(isInWarningWindow(expiresAt, 30)).toBe(false);
    });

    it('should return false when already expired', () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 5);
      expect(isInWarningWindow(expiresAt, 30)).toBe(false);
    });
  });

  describe('isRetentionExpired', () => {
    it('should return true for past dates', () => {
      expect(isRetentionExpired(new Date('2020-01-01'))).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isRetentionExpired(new Date('2099-12-31'))).toBe(false);
    });
  });

  describe('calculateChildrensRecordExpiry', () => {
    it('should calculate 75 years from date of birth', () => {
      const dob = new Date('2026-01-01');
      const expiry = calculateChildrensRecordExpiry(dob);
      expect(expiry.getFullYear()).toBe(2101);
    });
  });

  describe('constants', () => {
    it('should have 75-year retention for children records', () => {
      expect(CHILDRENS_RECORD_RETENTION_DAYS).toBe(75 * 365);
    });

    it('should have children_case_record in default periods', () => {
      expect(DEFAULT_RETENTION_PERIODS.children_case_record).toBe(
        CHILDRENS_RECORD_RETENTION_DAYS,
      );
    });
  });

  describe('retentionPolicySchema', () => {
    it('should validate correct input', () => {
      const input = {
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        dataType: 'children_case_record',
        retentionDays: CHILDRENS_RECORD_RETENTION_DAYS,
        legalBasis: 'legal_obligation',
      };
      const result = retentionPolicySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject negative retention days', () => {
      const input = {
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        dataType: 'person',
        retentionDays: -1,
        legalBasis: 'consent',
      };
      const result = retentionPolicySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
