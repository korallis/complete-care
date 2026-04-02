import type { Metadata } from 'next';
import Link from 'next/link';
import { BudgetOverview } from '@/features/personal-budgets';

export const metadata: Metadata = {
  title: 'Personal Budgets',
};

export default function BudgetsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personal Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Budget allocation, spend tracking, and support hour variance reporting.
          </p>
        </div>
        <Link
          href="/budgets/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Budget
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Active Budgets</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Allocated</p>
          <p className="mt-1 text-2xl font-bold">&pound;0.00</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-2xl font-bold">&pound;0.00</p>
        </div>
      </div>

      <BudgetOverview budgets={[]} />
    </div>
  );
}
