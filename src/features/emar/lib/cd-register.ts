/**
 * Controlled Drugs register business logic.
 * VAL-EMAR-008: CD stock reconciliation with dual-auth, discrepancy investigation, CDAO flag.
 * VAL-EMAR-020: CD dual-witness, running balance, transdermal patches.
 */

import type { CdTransactionType } from '../types';

/**
 * Calculate the new running balance after a transaction.
 * Receipt and positive adjustments increase balance.
 * Administration, disposal, destruction, return decrease balance.
 */
export function calculateBalance(
  currentBalance: number,
  transactionType: CdTransactionType,
  quantityIn: number,
  quantityOut: number,
): number {
  return currentBalance + quantityIn - quantityOut;
}

/**
 * Validate that a CD transaction is valid.
 * Returns an error message if invalid, null if valid.
 */
export function validateCdTransaction(params: {
  currentBalance: number;
  transactionType: CdTransactionType;
  quantityIn: number;
  quantityOut: number;
  performedBy: string;
  witnessedBy: string;
}): string | null {
  // Dual witness is mandatory
  if (params.performedBy === params.witnessedBy) {
    return 'Witness must be a different staff member from the person performing the operation';
  }

  // Validate quantity direction matches transaction type
  if (params.transactionType === 'receipt') {
    if (params.quantityIn <= 0) {
      return 'Receipt must have a positive quantity in';
    }
    if (params.quantityOut !== 0) {
      return 'Receipt should not have a quantity out';
    }
  }

  if (
    ['administration', 'disposal', 'destruction', 'return_to_pharmacy'].includes(
      params.transactionType,
    )
  ) {
    if (params.quantityOut <= 0) {
      return `${params.transactionType} must have a positive quantity out`;
    }
    if (params.quantityIn !== 0) {
      return `${params.transactionType} should not have a quantity in`;
    }
  }

  // Cannot go below zero
  const newBalance = calculateBalance(
    params.currentBalance,
    params.transactionType,
    params.quantityIn,
    params.quantityOut,
  );
  if (newBalance < 0) {
    return `Insufficient stock: current balance is ${params.currentBalance}, cannot remove ${params.quantityOut}`;
  }

  return null;
}

/**
 * Validate a stock reconciliation.
 * When a discrepancy exists, investigation notes are mandatory.
 */
export function validateReconciliation(params: {
  expectedBalance: number;
  actualCount: number;
  investigationNotes?: string;
  performedBy: string;
  witnessedBy: string;
}): { isValid: boolean; error: string | null; hasDiscrepancy: boolean; discrepancyAmount: number } {
  // Dual witness
  if (params.performedBy === params.witnessedBy) {
    return {
      isValid: false,
      error: 'Witness must be a different staff member',
      hasDiscrepancy: false,
      discrepancyAmount: 0,
    };
  }

  const discrepancyAmount = params.actualCount - params.expectedBalance;
  const hasDiscrepancy = discrepancyAmount !== 0;

  if (hasDiscrepancy && (!params.investigationNotes || params.investigationNotes.trim().length === 0)) {
    return {
      isValid: false,
      error: 'Investigation notes are mandatory when a discrepancy is detected',
      hasDiscrepancy,
      discrepancyAmount,
    };
  }

  return {
    isValid: true,
    error: null,
    hasDiscrepancy,
    discrepancyAmount,
  };
}

/**
 * Determine the recommended next patch application site.
 * Rotates through standard sites to avoid skin irritation.
 */
export function getNextPatchSite(
  rotationHistory: string[] | null,
): string {
  const standardSites = [
    'left_upper_arm',
    'right_upper_arm',
    'left_chest',
    'right_chest',
    'left_back',
    'right_back',
    'left_thigh',
    'right_thigh',
  ];

  if (!rotationHistory || rotationHistory.length === 0) {
    return standardSites[0];
  }

  const lastSite = rotationHistory[rotationHistory.length - 1];
  const lastIndex = standardSites.indexOf(lastSite);

  if (lastIndex === -1 || lastIndex === standardSites.length - 1) {
    return standardSites[0];
  }

  return standardSites[lastIndex + 1];
}

/**
 * Check if a stock reconciliation is overdue.
 * Reconciliation should happen at least weekly.
 */
export function isReconciliationOverdue(
  lastReconciliationDate: Date | null,
  now: Date = new Date(),
): boolean {
  if (!lastReconciliationDate) return true;

  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  return now.getTime() - lastReconciliationDate.getTime() > weekInMs;
}

/**
 * Check if a transdermal patch is overdue for removal.
 */
export function isPatchOverdue(
  scheduledRemovalAt: Date | null,
  removedAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (removedAt) return false; // Already removed
  if (!scheduledRemovalAt) return false; // No scheduled removal
  return now.getTime() > scheduledRemovalAt.getTime();
}

/**
 * Format a transaction type for display.
 */
export function formatTransactionType(type: CdTransactionType): string {
  const labels: Record<CdTransactionType, string> = {
    receipt: 'Receipt',
    administration: 'Administration',
    disposal: 'Disposal',
    destruction: 'Destruction',
    adjustment: 'Adjustment',
    return_to_pharmacy: 'Return to Pharmacy',
  };
  return labels[type];
}

/**
 * Format a patch site for display.
 */
export function formatPatchSite(site: string): string {
  return site
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
