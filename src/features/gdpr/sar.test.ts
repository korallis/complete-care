import { describe, it, expect } from 'vitest';
import {
  calculateSarDeadline,
  isSarOverdue,
  sarDaysRemaining,
  buildSarExportPackage,
  createSarSchema,
  SAR_DEADLINE_DAYS,
} from './sar';

describe('SAR utilities', () => {
  describe('calculateSarDeadline', () => {
    it('should return a date 30 days after the received date', () => {
      const received = new Date('2026-01-01');
      const deadline = calculateSarDeadline(received);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-01-31');
    });

    it('should handle month boundaries', () => {
      const received = new Date('2026-02-15');
      const deadline = calculateSarDeadline(received);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-03-17');
    });
  });

  describe('isSarOverdue', () => {
    it('should return true for past deadlines', () => {
      const pastDeadline = new Date('2020-01-01');
      expect(isSarOverdue(pastDeadline)).toBe(true);
    });

    it('should return false for future deadlines', () => {
      const futureDeadline = new Date('2099-12-31');
      expect(isSarOverdue(futureDeadline)).toBe(false);
    });
  });

  describe('sarDaysRemaining', () => {
    it('should return positive for future deadlines', () => {
      const futureDeadline = new Date();
      futureDeadline.setDate(futureDeadline.getDate() + 10);
      expect(sarDaysRemaining(futureDeadline)).toBeGreaterThan(0);
    });

    it('should return negative for past deadlines', () => {
      const pastDeadline = new Date();
      pastDeadline.setDate(pastDeadline.getDate() - 5);
      expect(sarDaysRemaining(pastDeadline)).toBeLessThan(0);
    });
  });

  describe('buildSarExportPackage', () => {
    it('should build a valid export package', () => {
      const pkg = buildSarExportPackage('Jane Doe', 'jane@example.com', {
        persons: [{ id: '1', name: 'Jane Doe' }],
      });
      expect(pkg.dataSubject.name).toBe('Jane Doe');
      expect(pkg.dataSubject.email).toBe('jane@example.com');
      expect(pkg.data.persons).toBeDefined();
      expect(pkg.exportDate).toBeTruthy();
    });
  });

  describe('createSarSchema', () => {
    it('should validate a correct SAR input', () => {
      const input = {
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        subjectName: 'Jane Doe',
        subjectEmail: 'jane@example.com',
        receivedAt: '2026-01-01',
      };
      const result = createSarSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        organisationId: '550e8400-e29b-41d4-a716-446655440000',
        subjectName: 'Jane Doe',
        subjectEmail: 'not-an-email',
        receivedAt: '2026-01-01',
      };
      const result = createSarSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  it('should have a 30-day deadline constant', () => {
    expect(SAR_DEADLINE_DAYS).toBe(30);
  });
});
