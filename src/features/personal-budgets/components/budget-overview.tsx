'use client';

import type { BudgetSummary } from '../types';

export function BudgetOverview({ budgets }: { budgets: BudgetSummary[] }) {
  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No personal budgets allocated.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <div key={budget.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-sm font-semibold">{budget.budgetName}</h3>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                budget.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : budget.status === 'exhausted'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {budget.status}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allocated</span>
              <span className="font-medium">&pound;{budget.allocatedAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium">&pound;{budget.spentAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">&pound;{budget.remainingAmount}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  budget.percentUsed > 90
                    ? 'bg-red-500'
                    : budget.percentUsed > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {budget.percentUsed.toFixed(1)}% used
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
