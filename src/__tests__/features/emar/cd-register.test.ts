/**
 * Controlled Drugs register business logic tests.
 * VAL-EMAR-008 / VAL-EMAR-020
 */
import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  validateCdTransaction,
  validateReconciliation,
  getNextPatchSite,
  isReconciliationOverdue,
  isPatchOverdue,
  formatTransactionType,
  formatPatchSite,
} from '@/features/emar/lib/cd-register';

// ---------------------------------------------------------------------------
// calculateBalance
// ---------------------------------------------------------------------------

describe('calculateBalance', () => {
  it('increases balance on receipt', () => {
    expect(calculateBalance(10, 'receipt', 5, 0)).toBe(15);
  });

  it('decreases balance on administration', () => {
    expect(calculateBalance(10, 'administration', 0, 1)).toBe(9);
  });

  it('decreases balance on disposal', () => {
    expect(calculateBalance(10, 'disposal', 0, 3)).toBe(7);
  });

  it('decreases balance on destruction', () => {
    expect(calculateBalance(10, 'destruction', 0, 10)).toBe(0);
  });

  it('handles adjustment (can increase or decrease)', () => {
    expect(calculateBalance(10, 'adjustment', 2, 0)).toBe(12);
    expect(calculateBalance(10, 'adjustment', 0, 3)).toBe(7);
  });

  it('decreases on return to pharmacy', () => {
    expect(calculateBalance(10, 'return_to_pharmacy', 0, 5)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// validateCdTransaction
// ---------------------------------------------------------------------------

describe('validateCdTransaction', () => {
  it('rejects same person as performer and witness', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'receipt',
      quantityIn: 5,
      quantityOut: 0,
      performedBy: 'user-1',
      witnessedBy: 'user-1',
    });
    expect(error).toContain('different staff member');
  });

  it('rejects receipt with zero quantity in', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'receipt',
      quantityIn: 0,
      quantityOut: 0,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toContain('positive quantity in');
  });

  it('rejects receipt with quantity out', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'receipt',
      quantityIn: 5,
      quantityOut: 1,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toContain('should not have a quantity out');
  });

  it('rejects administration with zero quantity out', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'administration',
      quantityIn: 0,
      quantityOut: 0,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toContain('positive quantity out');
  });

  it('rejects when balance would go negative', () => {
    const error = validateCdTransaction({
      currentBalance: 5,
      transactionType: 'administration',
      quantityIn: 0,
      quantityOut: 10,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toContain('Insufficient stock');
  });

  it('accepts valid receipt transaction', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'receipt',
      quantityIn: 28,
      quantityOut: 0,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toBeNull();
  });

  it('accepts valid administration transaction', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'administration',
      quantityIn: 0,
      quantityOut: 1,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toBeNull();
  });

  it('accepts valid disposal transaction', () => {
    const error = validateCdTransaction({
      currentBalance: 10,
      transactionType: 'disposal',
      quantityIn: 0,
      quantityOut: 5,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateReconciliation
// ---------------------------------------------------------------------------

describe('validateReconciliation', () => {
  it('rejects same performer and witness', () => {
    const result = validateReconciliation({
      expectedBalance: 10,
      actualCount: 10,
      performedBy: 'user-1',
      witnessedBy: 'user-1',
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('different staff member');
  });

  it('requires investigation notes when discrepancy exists', () => {
    const result = validateReconciliation({
      expectedBalance: 10,
      actualCount: 8,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Investigation notes are mandatory');
  });

  it('accepts reconciliation with discrepancy and notes', () => {
    const result = validateReconciliation({
      expectedBalance: 10,
      actualCount: 8,
      investigationNotes: 'Counted twice, confirmed 2 missing. Checking CCTV.',
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(result.isValid).toBe(true);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(-2);
  });

  it('accepts matching reconciliation without notes', () => {
    const result = validateReconciliation({
      expectedBalance: 10,
      actualCount: 10,
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(result.isValid).toBe(true);
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.discrepancyAmount).toBe(0);
  });

  it('calculates positive discrepancy correctly', () => {
    const result = validateReconciliation({
      expectedBalance: 10,
      actualCount: 12,
      investigationNotes: 'Found extra stock from previous delivery not recorded',
      performedBy: 'user-1',
      witnessedBy: 'user-2',
    });
    expect(result.isValid).toBe(true);
    expect(result.discrepancyAmount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getNextPatchSite
// ---------------------------------------------------------------------------

describe('getNextPatchSite', () => {
  it('returns first site when no history', () => {
    expect(getNextPatchSite(null)).toBe('left_upper_arm');
    expect(getNextPatchSite([])).toBe('left_upper_arm');
  });

  it('rotates to next site', () => {
    expect(getNextPatchSite(['left_upper_arm'])).toBe('right_upper_arm');
    expect(getNextPatchSite(['left_upper_arm', 'right_upper_arm'])).toBe(
      'left_chest',
    );
  });

  it('wraps around to first site after last', () => {
    expect(getNextPatchSite(['right_thigh'])).toBe('left_upper_arm');
  });

  it('handles unknown site in history', () => {
    expect(getNextPatchSite(['unknown_site'])).toBe('left_upper_arm');
  });
});

// ---------------------------------------------------------------------------
// isReconciliationOverdue
// ---------------------------------------------------------------------------

describe('isReconciliationOverdue', () => {
  it('returns true when no previous reconciliation', () => {
    expect(isReconciliationOverdue(null)).toBe(true);
  });

  it('returns true when more than 7 days since last', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    expect(isReconciliationOverdue(eightDaysAgo)).toBe(true);
  });

  it('returns false when within 7 days', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(isReconciliationOverdue(threeDaysAgo)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPatchOverdue
// ---------------------------------------------------------------------------

describe('isPatchOverdue', () => {
  it('returns false when already removed', () => {
    expect(isPatchOverdue(new Date('2020-01-01'), new Date())).toBe(false);
  });

  it('returns false when no scheduled removal', () => {
    expect(isPatchOverdue(null, null)).toBe(false);
  });

  it('returns true when past scheduled removal and not removed', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isPatchOverdue(yesterday, null)).toBe(true);
  });

  it('returns false when before scheduled removal', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPatchOverdue(tomorrow, null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatTransactionType
// ---------------------------------------------------------------------------

describe('formatTransactionType', () => {
  it('formats receipt', () => {
    expect(formatTransactionType('receipt')).toBe('Receipt');
  });

  it('formats return_to_pharmacy', () => {
    expect(formatTransactionType('return_to_pharmacy')).toBe(
      'Return to Pharmacy',
    );
  });
});

// ---------------------------------------------------------------------------
// formatPatchSite
// ---------------------------------------------------------------------------

describe('formatPatchSite', () => {
  it('formats left_upper_arm', () => {
    expect(formatPatchSite('left_upper_arm')).toBe('Left Upper Arm');
  });

  it('formats right_chest', () => {
    expect(formatPatchSite('right_chest')).toBe('Right Chest');
  });
});
