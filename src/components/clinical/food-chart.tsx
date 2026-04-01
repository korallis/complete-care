'use client';

/**
 * FoodChart — daily meal summary with portion indicators.
 */

import type { MealEntryListItem } from '@/features/clinical-monitoring/actions';
import {
  MEAL_TYPE_LABELS,
  PORTION_LABELS,
  type MealType,
  type PortionConsumed,
} from '@/features/clinical-monitoring/constants';
import {
  formatTime,
  getPortionPercentage,
  calculateDailyNutritionSummary,
} from '@/features/clinical-monitoring/utils';

type FoodChartProps = {
  entries: MealEntryListItem[];
};

function getPortionColor(portion: string): string {
  switch (portion) {
    case 'all':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'three_quarters':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'half':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'quarter':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'refused':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function PortionBar({ portion }: { portion: string }) {
  const percentage = getPortionPercentage(portion);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-[oklch(0.93_0.003_160)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 75
              ? 'bg-emerald-500'
              : percentage >= 50
                ? 'bg-amber-500'
                : percentage > 0
                  ? 'bg-orange-500'
                  : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-[oklch(0.55_0_0)]">{percentage}%</span>
    </div>
  );
}

export function FoodChart({ entries }: FoodChartProps) {
  const summary = calculateDailyNutritionSummary(entries);

  return (
    <div className="space-y-4">
      {/* Daily summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
            Meals Recorded
          </p>
          <p className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
            {summary.totalMeals}
          </p>
        </div>

        <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
            Avg. Portion
          </p>
          <p
            className={`text-xl font-bold ${
              summary.averagePortionPercentage >= 75
                ? 'text-emerald-700'
                : summary.averagePortionPercentage >= 50
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {summary.totalMeals > 0
              ? `${summary.averagePortionPercentage}%`
              : '-'}
          </p>
        </div>

        <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">Refused</p>
          <p
            className={`text-xl font-bold ${
              summary.mealsRefused > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {summary.mealsRefused}
          </p>
        </div>
      </div>

      {/* Meal entries table */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <div className="bg-[oklch(0.97_0.003_160)] px-4 py-2 border-b border-[oklch(0.91_0.005_160)]">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Meals
          </h4>
        </div>
        {entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center text-[oklch(0.55_0_0)]">
            No meals recorded for this date
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[oklch(0.91_0.005_160)]">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Meal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Portion
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[oklch(0.95_0.003_160)] last:border-0"
                  >
                    <td className="px-4 py-2 text-[oklch(0.35_0.04_160)]">
                      {formatTime(entry.recordedAt)}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.22_0.04_160)] font-medium">
                      {MEAL_TYPE_LABELS[entry.mealType as MealType] ??
                        entry.mealType}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.35_0.04_160)] max-w-[200px] truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getPortionColor(
                            entry.portionConsumed,
                          )}`}
                        >
                          {PORTION_LABELS[
                            entry.portionConsumed as PortionConsumed
                          ] ?? entry.portionConsumed}
                        </span>
                        <PortionBar portion={entry.portionConsumed} />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                      {entry.recordedByName ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
