/**
 * Tests for clinical monitoring utility functions.
 *
 * Validates:
 * - Fluid total calculations
 * - Fluid threshold alert levels
 * - No-intake auto-prompt logic
 * - MUST scoring
 * - Meal/nutrition summary calculations
 * - Format helpers
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFluidTotals,
  getFluidAlertLevel,
  getFluidAlertMessage,
  shouldShowIntakePrompt,
  getMustRiskCategory,
  getMustCarePathway,
  calculateMustTotal,
  scoreMust,
  getPortionPercentage,
  calculateDailyNutritionSummary,
  formatVolume,
  formatDate,
  formatTime,
} from '@/features/clinical-monitoring/utils';

// ---------------------------------------------------------------------------
// calculateFluidTotals
// ---------------------------------------------------------------------------

describe('calculateFluidTotals', () => {
  it('returns zeros for empty array', () => {
    const result = calculateFluidTotals([]);
    expect(result.totalIntake).toBe(0);
    expect(result.totalOutput).toBe(0);
    expect(result.balance).toBe(0);
  });

  it('sums intake entries correctly', () => {
    const entries = [
      { entryType: 'intake', volume: 200 },
      { entryType: 'intake', volume: 300 },
      { entryType: 'intake', volume: 150 },
    ];
    const result = calculateFluidTotals(entries);
    expect(result.totalIntake).toBe(650);
    expect(result.totalOutput).toBe(0);
    expect(result.balance).toBe(650);
  });

  it('sums output entries correctly', () => {
    const entries = [
      { entryType: 'output', volume: 400 },
      { entryType: 'output', volume: 200 },
    ];
    const result = calculateFluidTotals(entries);
    expect(result.totalIntake).toBe(0);
    expect(result.totalOutput).toBe(600);
    expect(result.balance).toBe(-600);
  });

  it('calculates balance correctly for mixed entries', () => {
    const entries = [
      { entryType: 'intake', volume: 1000 },
      { entryType: 'output', volume: 600 },
      { entryType: 'intake', volume: 500 },
      { entryType: 'output', volume: 300 },
    ];
    const result = calculateFluidTotals(entries);
    expect(result.totalIntake).toBe(1500);
    expect(result.totalOutput).toBe(900);
    expect(result.balance).toBe(600);
  });

  it('ignores unknown entry types', () => {
    const entries = [
      { entryType: 'intake', volume: 200 },
      { entryType: 'unknown', volume: 100 },
    ];
    const result = calculateFluidTotals(entries);
    expect(result.totalIntake).toBe(200);
    expect(result.totalOutput).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getFluidAlertLevel
// ---------------------------------------------------------------------------

describe('getFluidAlertLevel', () => {
  it('returns red for intake < 800ml', () => {
    expect(getFluidAlertLevel(0)).toBe('red');
    expect(getFluidAlertLevel(500)).toBe('red');
    expect(getFluidAlertLevel(799)).toBe('red');
  });

  it('returns amber for intake 800-999ml', () => {
    expect(getFluidAlertLevel(800)).toBe('amber');
    expect(getFluidAlertLevel(900)).toBe('amber');
    expect(getFluidAlertLevel(999)).toBe('amber');
  });

  it('returns none for intake >= 1000ml', () => {
    expect(getFluidAlertLevel(1000)).toBe('none');
    expect(getFluidAlertLevel(1500)).toBe('none');
    expect(getFluidAlertLevel(2000)).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// getFluidAlertMessage
// ---------------------------------------------------------------------------

describe('getFluidAlertMessage', () => {
  it('returns null for none', () => {
    expect(getFluidAlertMessage('none', 1200)).toBeNull();
  });

  it('returns message for amber', () => {
    const message = getFluidAlertMessage('amber', 900);
    expect(message).toContain('900ml');
    expect(message).toContain('1000ml');
  });

  it('returns message for red', () => {
    const message = getFluidAlertMessage('red', 500);
    expect(message).toContain('500ml');
    expect(message).toContain('800ml');
    expect(message).toContain('Critically');
  });
});

// ---------------------------------------------------------------------------
// shouldShowIntakePrompt
// ---------------------------------------------------------------------------

describe('shouldShowIntakePrompt', () => {
  it('returns false outside waking hours', () => {
    // 3am — outside waking hours
    const nightTime = new Date('2026-04-01T03:00:00');
    expect(shouldShowIntakePrompt(null, nightTime)).toBe(false);
  });

  it('returns true during waking hours with no intake ever', () => {
    // 10am — waking hours
    const morningTime = new Date('2026-04-01T10:00:00');
    expect(shouldShowIntakePrompt(null, morningTime)).toBe(true);
  });

  it('returns false if last intake was < 4 hours ago', () => {
    const now = new Date('2026-04-01T14:00:00');
    const lastIntake = new Date('2026-04-01T11:00:00'); // 3 hours ago
    expect(shouldShowIntakePrompt(lastIntake, now)).toBe(false);
  });

  it('returns true if last intake was >= 4 hours ago during waking hours', () => {
    const now = new Date('2026-04-01T14:00:00');
    const lastIntake = new Date('2026-04-01T10:00:00'); // 4 hours ago
    expect(shouldShowIntakePrompt(lastIntake, now)).toBe(true);
  });

  it('returns true if last intake was > 4 hours ago during waking hours', () => {
    const now = new Date('2026-04-01T14:00:00');
    const lastIntake = new Date('2026-04-01T08:00:00'); // 6 hours ago
    expect(shouldShowIntakePrompt(lastIntake, now)).toBe(true);
  });

  it('returns false at 22:00 (boundary of waking hours)', () => {
    const eveningTime = new Date('2026-04-01T22:00:00');
    expect(shouldShowIntakePrompt(null, eveningTime)).toBe(false);
  });

  it('returns true at 06:00 (start of waking hours)', () => {
    const earlyMorning = new Date('2026-04-01T06:00:00');
    expect(shouldShowIntakePrompt(null, earlyMorning)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MUST scoring
// ---------------------------------------------------------------------------

describe('getMustRiskCategory', () => {
  it('returns low for score 0', () => {
    expect(getMustRiskCategory(0)).toBe('low');
  });

  it('returns medium for score 1', () => {
    expect(getMustRiskCategory(1)).toBe('medium');
  });

  it('returns high for score 2+', () => {
    expect(getMustRiskCategory(2)).toBe('high');
    expect(getMustRiskCategory(3)).toBe('high');
    expect(getMustRiskCategory(6)).toBe('high');
  });
});

describe('getMustCarePathway', () => {
  it('returns routine for low risk', () => {
    expect(getMustCarePathway('low')).toBe('routine');
  });

  it('returns observe for medium risk', () => {
    expect(getMustCarePathway('medium')).toBe('observe');
  });

  it('returns treat for high risk', () => {
    expect(getMustCarePathway('high')).toBe('treat');
  });
});

describe('calculateMustTotal', () => {
  it('sums all three components', () => {
    expect(calculateMustTotal(0, 0, 0)).toBe(0);
    expect(calculateMustTotal(1, 0, 0)).toBe(1);
    expect(calculateMustTotal(2, 2, 2)).toBe(6);
    expect(calculateMustTotal(1, 1, 0)).toBe(2);
    expect(calculateMustTotal(0, 0, 2)).toBe(2);
  });
});

describe('scoreMust', () => {
  it('scores 0 as low risk, routine care', () => {
    const result = scoreMust(0, 0, 0);
    expect(result.totalScore).toBe(0);
    expect(result.riskCategory).toBe('low');
    expect(result.carePathway).toBe('routine');
  });

  it('scores 1 as medium risk, observe', () => {
    const result = scoreMust(1, 0, 0);
    expect(result.totalScore).toBe(1);
    expect(result.riskCategory).toBe('medium');
    expect(result.carePathway).toBe('observe');
  });

  it('scores 2+ as high risk, treat', () => {
    const result = scoreMust(2, 0, 0);
    expect(result.totalScore).toBe(2);
    expect(result.riskCategory).toBe('high');
    expect(result.carePathway).toBe('treat');
  });

  it('handles max score (6) correctly', () => {
    const result = scoreMust(2, 2, 2);
    expect(result.totalScore).toBe(6);
    expect(result.riskCategory).toBe('high');
    expect(result.carePathway).toBe('treat');
  });

  it('handles acute disease only (score 2)', () => {
    const result = scoreMust(0, 0, 2);
    expect(result.totalScore).toBe(2);
    expect(result.riskCategory).toBe('high');
    expect(result.carePathway).toBe('treat');
  });
});

// ---------------------------------------------------------------------------
// getPortionPercentage
// ---------------------------------------------------------------------------

describe('getPortionPercentage', () => {
  it('returns 100 for all', () => {
    expect(getPortionPercentage('all')).toBe(100);
  });

  it('returns 75 for three_quarters', () => {
    expect(getPortionPercentage('three_quarters')).toBe(75);
  });

  it('returns 50 for half', () => {
    expect(getPortionPercentage('half')).toBe(50);
  });

  it('returns 25 for quarter', () => {
    expect(getPortionPercentage('quarter')).toBe(25);
  });

  it('returns 0 for refused', () => {
    expect(getPortionPercentage('refused')).toBe(0);
  });

  it('returns 0 for unknown', () => {
    expect(getPortionPercentage('unknown')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateDailyNutritionSummary
// ---------------------------------------------------------------------------

describe('calculateDailyNutritionSummary', () => {
  it('returns zeros for empty array', () => {
    const result = calculateDailyNutritionSummary([]);
    expect(result.totalMeals).toBe(0);
    expect(result.averagePortionPercentage).toBe(0);
    expect(result.mealsRefused).toBe(0);
  });

  it('calculates summary for full meals', () => {
    const meals = [
      { mealType: 'breakfast', portionConsumed: 'all' },
      { mealType: 'lunch', portionConsumed: 'all' },
      { mealType: 'dinner', portionConsumed: 'all' },
    ];
    const result = calculateDailyNutritionSummary(meals);
    expect(result.totalMeals).toBe(3);
    expect(result.averagePortionPercentage).toBe(100);
    expect(result.mealsRefused).toBe(0);
  });

  it('calculates summary for mixed portions', () => {
    const meals = [
      { mealType: 'breakfast', portionConsumed: 'all' },      // 100%
      { mealType: 'lunch', portionConsumed: 'half' },          // 50%
      { mealType: 'dinner', portionConsumed: 'quarter' },      // 25%
    ];
    const result = calculateDailyNutritionSummary(meals);
    expect(result.totalMeals).toBe(3);
    expect(result.averagePortionPercentage).toBe(58); // (100+50+25)/3 = 58.33 rounds to 58
    expect(result.mealsRefused).toBe(0);
  });

  it('counts refused meals', () => {
    const meals = [
      { mealType: 'breakfast', portionConsumed: 'refused' },
      { mealType: 'lunch', portionConsumed: 'all' },
      { mealType: 'dinner', portionConsumed: 'refused' },
    ];
    const result = calculateDailyNutritionSummary(meals);
    expect(result.mealsRefused).toBe(2);
  });

  it('builds meal breakdown map', () => {
    const meals = [
      { mealType: 'breakfast', portionConsumed: 'all' },
      { mealType: 'lunch', portionConsumed: 'half' },
    ];
    const result = calculateDailyNutritionSummary(meals);
    expect(result.mealBreakdown.breakfast).toBe('all');
    expect(result.mealBreakdown.lunch).toBe('half');
  });
});

// ---------------------------------------------------------------------------
// formatVolume
// ---------------------------------------------------------------------------

describe('formatVolume', () => {
  it('formats ml for volumes under 1000', () => {
    expect(formatVolume(200)).toBe('200ml');
    expect(formatVolume(999)).toBe('999ml');
  });

  it('formats litres for volumes >= 1000', () => {
    expect(formatVolume(1000)).toBe('1.0L');
    expect(formatVolume(1500)).toBe('1.5L');
    expect(formatVolume(2000)).toBe('2.0L');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2026-04-01');
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });

  it('returns input for invalid date', () => {
    const result = formatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats Date object', () => {
    const d = new Date('2026-04-01T14:30:00Z');
    const result = formatTime(d);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('formats string timestamp', () => {
    const result = formatTime('2026-04-01T14:30:00.000Z');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
