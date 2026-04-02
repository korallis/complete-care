import type {
  PersonalBudget,
  NewPersonalBudget,
  BudgetSpendItem,
  NewBudgetSpendItem,
  SupportHourLog,
  NewSupportHourLog,
} from '@/lib/db/schema';

export type {
  PersonalBudget,
  NewPersonalBudget,
  BudgetSpendItem,
  NewBudgetSpendItem,
  SupportHourLog,
  NewSupportHourLog,
};

export type CommissionerType = 'local_authority' | 'nhs' | 'private' | 'mixed';

export type SpendCategory =
  | 'personal_care'
  | 'domestic'
  | 'transport'
  | 'social'
  | 'equipment'
  | 'other';

export type BudgetStatus = 'active' | 'exhausted' | 'closed';

export interface BudgetSummary {
  id: string;
  budgetName: string;
  allocatedAmount: string;
  spentAmount: string;
  remainingAmount: string;
  percentUsed: number;
  status: BudgetStatus;
}

export interface VarianceReport {
  personId: string;
  personName: string;
  weekNumber: number;
  year: number;
  plannedHours: string;
  actualHours: string;
  varianceHours: string;
  variancePercent: number;
}
