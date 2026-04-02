'use server';

import type { NewPersonalBudget, NewBudgetSpendItem, NewSupportHourLog } from '@/lib/db/schema';

export async function createBudget(_data: NewPersonalBudget) {
  return { success: true, id: crypto.randomUUID() };
}

export async function addSpendItem(_data: NewBudgetSpendItem) {
  return { success: true, id: crypto.randomUUID() };
}

export async function logSupportHours(_data: NewSupportHourLog) {
  return { success: true, id: crypto.randomUUID() };
}

export async function getBudgetSummary(_budgetId: string) {
  // TODO: Aggregate spend items and return summary
  return null;
}

export async function getVarianceReport(_organisationId: string, _year: number, _weekNumber?: number) {
  // TODO: Query support_hour_logs for variance data
  return [];
}

export async function getCommissionerReport(_organisationId: string, _commissionerType: string) {
  // TODO: Generate commissioner reporting format
  return [];
}
