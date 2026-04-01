/**
 * Clinical Monitoring utility functions.
 * Pure functions — no side effects, no DB calls.
 * Safe for use in both client and server environments.
 */

import {
  FLUID_INTAKE_AMBER_THRESHOLD,
  FLUID_INTAKE_RED_THRESHOLD,
  FLUID_NO_INTAKE_ALERT_HOURS,
  WAKING_HOURS_START,
  WAKING_HOURS_END,
  PORTION_PERCENTAGES,
  type MustRiskCategory,
  type MustCarePathway,
  type PortionConsumed,
} from './constants';

// ---------------------------------------------------------------------------
// Fluid total calculations
// ---------------------------------------------------------------------------

export type FluidTotals = {
  totalIntake: number;
  totalOutput: number;
  balance: number;
};

/**
 * Calculates 24hr totals from a list of fluid entries.
 */
export function calculateFluidTotals(
  entries: Array<{ entryType: string; volume: number }>,
): FluidTotals {
  let totalIntake = 0;
  let totalOutput = 0;

  for (const entry of entries) {
    if (entry.entryType === 'intake') {
      totalIntake += entry.volume;
    } else if (entry.entryType === 'output') {
      totalOutput += entry.volume;
    }
  }

  return {
    totalIntake,
    totalOutput,
    balance: totalIntake - totalOutput,
  };
}

// ---------------------------------------------------------------------------
// Fluid threshold checks
// ---------------------------------------------------------------------------

export type FluidAlertLevel = 'none' | 'amber' | 'red';

/**
 * Returns the alert level based on 24hr intake total.
 *
 * - Red: < 800ml intake
 * - Amber: < 1000ml intake
 * - None: >= 1000ml intake
 */
export function getFluidAlertLevel(totalIntake: number): FluidAlertLevel {
  if (totalIntake < FLUID_INTAKE_RED_THRESHOLD) return 'red';
  if (totalIntake < FLUID_INTAKE_AMBER_THRESHOLD) return 'amber';
  return 'none';
}

/**
 * Returns a human-readable alert message for the fluid alert level.
 */
export function getFluidAlertMessage(
  alertLevel: FluidAlertLevel,
  totalIntake: number,
): string | null {
  switch (alertLevel) {
    case 'red':
      return `Critically low fluid intake: ${totalIntake}ml in 24hrs (below ${FLUID_INTAKE_RED_THRESHOLD}ml threshold)`;
    case 'amber':
      return `Low fluid intake: ${totalIntake}ml in 24hrs (below ${FLUID_INTAKE_AMBER_THRESHOLD}ml threshold)`;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// No-intake auto-prompt check
// ---------------------------------------------------------------------------

/**
 * Checks if a no-intake prompt should be shown based on the last intake time.
 *
 * Returns true if:
 * - Current time is within waking hours (6am-10pm)
 * - No intake has been recorded for 4+ hours
 */
export function shouldShowIntakePrompt(
  lastIntakeAt: Date | null,
  currentTime: Date = new Date(),
): boolean {
  const currentHour = currentTime.getHours();

  // Only prompt during waking hours
  if (currentHour < WAKING_HOURS_START || currentHour >= WAKING_HOURS_END) {
    return false;
  }

  // No intake ever recorded — should prompt
  if (!lastIntakeAt) {
    return true;
  }

  const hoursSinceLastIntake =
    (currentTime.getTime() - lastIntakeAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastIntake >= FLUID_NO_INTAKE_ALERT_HOURS;
}

// ---------------------------------------------------------------------------
// MUST scoring
// ---------------------------------------------------------------------------

/**
 * Calculates the MUST risk category from the total score.
 *
 * - 0 = Low risk
 * - 1 = Medium risk
 * - 2+ = High risk
 */
export function getMustRiskCategory(totalScore: number): MustRiskCategory {
  if (totalScore === 0) return 'low';
  if (totalScore === 1) return 'medium';
  return 'high';
}

/**
 * Returns the care pathway based on the MUST risk category.
 *
 * - Low → Routine clinical care
 * - Medium → Observe
 * - High → Treat
 */
export function getMustCarePathway(
  riskCategory: MustRiskCategory,
): MustCarePathway {
  switch (riskCategory) {
    case 'low':
      return 'routine';
    case 'medium':
      return 'observe';
    case 'high':
      return 'treat';
  }
}

/**
 * Calculates the total MUST score from individual components.
 */
export function calculateMustTotal(
  bmiScore: number,
  weightLossScore: number,
  acuteDiseaseScore: number,
): number {
  return bmiScore + weightLossScore + acuteDiseaseScore;
}

/**
 * Full MUST scoring: given the three component scores, returns
 * total, risk category, and care pathway.
 */
export function scoreMust(
  bmiScore: number,
  weightLossScore: number,
  acuteDiseaseScore: number,
): {
  totalScore: number;
  riskCategory: MustRiskCategory;
  carePathway: MustCarePathway;
} {
  const totalScore = calculateMustTotal(
    bmiScore,
    weightLossScore,
    acuteDiseaseScore,
  );
  const riskCategory = getMustRiskCategory(totalScore);
  const carePathway = getMustCarePathway(riskCategory);

  return { totalScore, riskCategory, carePathway };
}

// ---------------------------------------------------------------------------
// Meal/nutrition helpers
// ---------------------------------------------------------------------------

/**
 * Returns the approximate percentage consumed for a portion label.
 */
export function getPortionPercentage(portion: string): number {
  return PORTION_PERCENTAGES[portion as PortionConsumed] ?? 0;
}

/**
 * Calculates a daily nutrition summary from meal entries.
 */
export function calculateDailyNutritionSummary(
  meals: Array<{ mealType: string; portionConsumed: string }>,
): {
  totalMeals: number;
  averagePortionPercentage: number;
  mealsRefused: number;
  mealBreakdown: Record<string, string | undefined>;
} {
  if (meals.length === 0) {
    return {
      totalMeals: 0,
      averagePortionPercentage: 0,
      mealsRefused: 0,
      mealBreakdown: {},
    };
  }

  const totalPercentage = meals.reduce(
    (sum, meal) => sum + getPortionPercentage(meal.portionConsumed),
    0,
  );

  const mealBreakdown: Record<string, string | undefined> = {};
  for (const meal of meals) {
    mealBreakdown[meal.mealType] = meal.portionConsumed;
  }

  return {
    totalMeals: meals.length,
    averagePortionPercentage: Math.round(totalPercentage / meals.length),
    mealsRefused: meals.filter((m) => m.portionConsumed === 'refused').length,
    mealBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

/**
 * Formats a volume in ml for display.
 */
export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
}

/**
 * Formats a date for display (e.g., "1 Apr 2026").
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a timestamp for display (e.g., "14:30").
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
