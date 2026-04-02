/**
 * Comprehensive tests for the Clinical Alert Evaluation Engine.
 *
 * Tests:
 * - Fluid intake evaluation (amber/red thresholds)
 * - NEWS2 evaluation (amber/red/emergency thresholds + clinical concern)
 * - Weight loss evaluation (amber/red thresholds with period checking)
 * - Constipation evaluation (3-day amber, 5-day red, no record)
 * - Diarrhoea evaluation (3+ type 6-7 in 24hrs)
 * - Pain evaluation (consecutive high scores)
 * - Custom threshold overrides
 * - Full evaluation (evaluateAllAlerts)
 * - Threshold resolution
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateFluidIntake,
  evaluateNews2,
  evaluateWeightLoss,
  evaluateConstipation,
  evaluateDiarrhoea,
  evaluatePain,
  evaluateAllAlerts,
  resolveThresholds,
} from '@/features/clinical-alerts/engine';

// ---------------------------------------------------------------------------
// resolveThresholds
// ---------------------------------------------------------------------------

describe('resolveThresholds', () => {
  it('returns defaults when no overrides provided', () => {
    const defaults = { amberMl: 1000, redMl: 800 };
    expect(resolveThresholds(defaults)).toEqual(defaults);
  });

  it('returns defaults when overrides are undefined', () => {
    const defaults = { amberMl: 1000, redMl: 800 };
    expect(resolveThresholds(defaults, undefined)).toEqual(defaults);
  });

  it('merges partial overrides with defaults', () => {
    const defaults = { amberMl: 1000, redMl: 800 };
    const overrides = { redMl: 600 };
    expect(resolveThresholds(defaults, overrides)).toEqual({
      amberMl: 1000,
      redMl: 600,
    });
  });

  it('fully overrides when all values provided', () => {
    const defaults = { amberMl: 1000, redMl: 800 };
    const overrides = { amberMl: 1200, redMl: 900 };
    expect(resolveThresholds(defaults, overrides)).toEqual(overrides);
  });
});

// ---------------------------------------------------------------------------
// evaluateFluidIntake
// ---------------------------------------------------------------------------

describe('evaluateFluidIntake', () => {
  it('returns null for adequate intake (>=1000ml)', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 1000 });
    expect(result).toBeNull();
  });

  it('returns null for intake well above threshold', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 2000 });
    expect(result).toBeNull();
  });

  it('returns amber alert for intake 800-999ml', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 950 });
    expect(result).not.toBeNull();
    expect(result!.alertType).toBe('fluid_low');
    expect(result!.severity).toBe('amber');
    expect(result!.message).toContain('950ml');
    expect(result!.message).toContain('1000ml');
  });

  it('returns red alert for intake <800ml', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 500 });
    expect(result).not.toBeNull();
    expect(result!.alertType).toBe('fluid_low');
    expect(result!.severity).toBe('red');
    expect(result!.message).toContain('500ml');
    expect(result!.message).toContain('800ml');
  });

  it('returns red alert for zero intake', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 0 });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });

  it('uses custom thresholds when provided', () => {
    // Custom: amber <1500, red <1200
    const result = evaluateFluidIntake(
      { totalIntakeMl: 1100 },
      { amberMl: 1500, redMl: 1200 },
    );
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });

  it('returns null when custom threshold is lower than intake', () => {
    const result = evaluateFluidIntake(
      { totalIntakeMl: 600 },
      { amberMl: 500, redMl: 300 },
    );
    expect(result).toBeNull();
  });

  it('boundary: exactly at amber threshold returns null', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 1000 });
    expect(result).toBeNull();
  });

  it('boundary: exactly at red threshold returns amber (not red)', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 800 });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
  });

  it('boundary: one below red threshold returns red', () => {
    const result = evaluateFluidIntake({ totalIntakeMl: 799 });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// evaluateNews2
// ---------------------------------------------------------------------------

describe('evaluateNews2', () => {
  it('returns null for score 0 with no clinical concern', () => {
    const result = evaluateNews2({
      totalScore: 0,
      hasClinicalConcern: false,
    });
    expect(result).toBeNull();
  });

  it('returns amber for score 1-4', () => {
    const result = evaluateNews2({
      totalScore: 3,
      hasClinicalConcern: false,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
    expect(result!.alertType).toBe('news2_elevated');
  });

  it('returns amber when clinical concern flag is set even at score 0', () => {
    const result = evaluateNews2({
      totalScore: 0,
      hasClinicalConcern: true,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
    expect(result!.message).toContain('clinical concern');
  });

  it('returns red for score 5-6', () => {
    const result = evaluateNews2({
      totalScore: 5,
      hasClinicalConcern: false,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });

  it('returns emergency for score >=7', () => {
    const result = evaluateNews2({
      totalScore: 7,
      hasClinicalConcern: false,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('emergency');
    expect(result!.message).toContain('emergency');
  });

  it('returns emergency for high scores', () => {
    const result = evaluateNews2({
      totalScore: 15,
      hasClinicalConcern: true,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('emergency');
  });

  it('uses custom thresholds', () => {
    // Custom: amber >= 3, red >= 8, emergency >= 12
    const result = evaluateNews2(
      { totalScore: 2, hasClinicalConcern: false },
      { amberScore: 3, redScore: 8, emergencyScore: 12 },
    );
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// evaluateWeightLoss
// ---------------------------------------------------------------------------

describe('evaluateWeightLoss', () => {
  it('returns null for no weight loss', () => {
    const result = evaluateWeightLoss({
      currentWeightKg: 70,
      previousWeightKg: 70,
      daysBetween: 14,
    });
    expect(result).toBeNull();
  });

  it('returns null for weight gain', () => {
    const result = evaluateWeightLoss({
      currentWeightKg: 72,
      previousWeightKg: 70,
      daysBetween: 14,
    });
    expect(result).toBeNull();
  });

  it('returns null when period exceeds configured days', () => {
    const result = evaluateWeightLoss({
      currentWeightKg: 60,
      previousWeightKg: 70,
      daysBetween: 60, // Default period is 30 days
    });
    expect(result).toBeNull();
  });

  it('returns amber for 5-9.9% loss in period', () => {
    // 5% of 80 = 4kg loss -> 76kg
    const result = evaluateWeightLoss({
      currentWeightKg: 76,
      previousWeightKg: 80,
      daysBetween: 20,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
    expect(result!.alertType).toBe('weight_loss');
    expect(result!.message).toContain('5.0%');
  });

  it('returns red for >=10% loss in period', () => {
    // 10% of 80 = 8kg loss -> 72kg
    const result = evaluateWeightLoss({
      currentWeightKg: 72,
      previousWeightKg: 80,
      daysBetween: 25,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });

  it('returns null for less than 5% loss', () => {
    // 3% of 80 = 2.4kg -> 77.6kg
    const result = evaluateWeightLoss({
      currentWeightKg: 77.6,
      previousWeightKg: 80,
      daysBetween: 14,
    });
    expect(result).toBeNull();
  });

  it('returns null when previous weight is 0', () => {
    const result = evaluateWeightLoss({
      currentWeightKg: 70,
      previousWeightKg: 0,
      daysBetween: 14,
    });
    expect(result).toBeNull();
  });

  it('uses custom thresholds', () => {
    // Custom: amber 3%, red 7%
    const result = evaluateWeightLoss(
      { currentWeightKg: 77, previousWeightKg: 80, daysBetween: 14 },
      { amberPercent: 3, redPercent: 7 },
    );
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
  });
});

// ---------------------------------------------------------------------------
// evaluateConstipation
// ---------------------------------------------------------------------------

describe('evaluateConstipation', () => {
  it('returns red when no BM on record', () => {
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateConstipation({
      lastBowelMovementAt: null,
      currentTime: now,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
    expect(result!.alertType).toBe('constipation');
    expect(result!.message).toContain('No bowel movement on record');
  });

  it('returns red for 5+ days without BM', () => {
    const lastBm = new Date('2026-03-25T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateConstipation({
      lastBowelMovementAt: lastBm,
      currentTime: now,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
    expect(result!.message).toContain('5 days');
  });

  it('returns amber for 3-4 days without BM', () => {
    const lastBm = new Date('2026-03-27T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateConstipation({
      lastBowelMovementAt: lastBm,
      currentTime: now,
    });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
  });

  it('returns null for recent BM (same day)', () => {
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateConstipation({
      lastBowelMovementAt: now,
      currentTime: now,
    });
    expect(result).toBeNull();
  });

  it('returns null for BM 2 days ago', () => {
    const lastBm = new Date('2026-03-28T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateConstipation({
      lastBowelMovementAt: lastBm,
      currentTime: now,
    });
    expect(result).toBeNull();
  });

  it('uses custom thresholds', () => {
    const lastBm = new Date('2026-03-28T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z');
    // Custom: amber 2 days, red 3 days
    const result = evaluateConstipation(
      { lastBowelMovementAt: lastBm, currentTime: now },
      { amberDays: 2, redDays: 3 },
    );
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('amber');
  });
});

// ---------------------------------------------------------------------------
// evaluateDiarrhoea
// ---------------------------------------------------------------------------

describe('evaluateDiarrhoea', () => {
  it('returns red for 3+ type 6-7 stools', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [6, 7, 6] });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
    expect(result!.alertType).toBe('diarrhoea');
    expect(result!.message).toContain('3 loose/liquid stools');
  });

  it('returns red for 4+ type 6-7 stools', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [6, 7, 6, 7] });
    expect(result).not.toBeNull();
    expect(result!.message).toContain('4 loose/liquid stools');
  });

  it('returns null for 2 type 6-7 stools', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [6, 7] });
    expect(result).toBeNull();
  });

  it('returns null for normal stools', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [3, 4, 4, 3] });
    expect(result).toBeNull();
  });

  it('only counts type 6-7', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [1, 2, 3, 4, 5, 6, 7] });
    expect(result).toBeNull(); // Only 2 loose stools
  });

  it('returns null for empty array', () => {
    const result = evaluateDiarrhoea({ bristolTypes: [] });
    expect(result).toBeNull();
  });

  it('uses custom thresholds', () => {
    // Custom: threshold 2
    const result = evaluateDiarrhoea(
      { bristolTypes: [6, 7] },
      { thresholdCount: 2 },
    );
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// evaluatePain
// ---------------------------------------------------------------------------

describe('evaluatePain', () => {
  it('returns null when not enough scores', () => {
    const result = evaluatePain({ recentScores: [8, 9] });
    expect(result).toBeNull(); // Default requires 3 consecutive
  });

  it('returns null when scores are below threshold', () => {
    const result = evaluatePain({ recentScores: [5, 4, 3, 2] });
    expect(result).toBeNull();
  });

  it('returns red for 3 consecutive high scores', () => {
    const result = evaluatePain({ recentScores: [8, 9, 7, 3] });
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
    expect(result!.alertType).toBe('pain_sustained');
    expect(result!.message).toContain('3 consecutive');
  });

  it('returns null when only 2 of the first 3 are high', () => {
    const result = evaluatePain({ recentScores: [8, 9, 5, 7] });
    expect(result).toBeNull();
  });

  it('uses custom thresholds', () => {
    // Custom: threshold 5, count 2
    const result = evaluatePain(
      { recentScores: [6, 5, 3] },
      { thresholdScore: 5, consecutiveCount: 2 },
    );
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('red');
  });

  it('returns null for empty scores', () => {
    const result = evaluatePain({ recentScores: [] });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// evaluateAllAlerts
// ---------------------------------------------------------------------------

describe('evaluateAllAlerts', () => {
  it('returns empty array when no data provided', () => {
    const result = evaluateAllAlerts({});
    expect(result).toEqual([]);
  });

  it('returns empty array when all data is within normal ranges', () => {
    const result = evaluateAllAlerts({
      fluidIntake: { totalIntakeMl: 1500 },
      news2: { totalScore: 0, hasClinicalConcern: false },
      constipation: {
        lastBowelMovementAt: new Date(),
        currentTime: new Date(),
      },
      diarrhoea: { bristolTypes: [4, 3] },
      pain: { recentScores: [2, 1, 0] },
    });
    expect(result).toEqual([]);
  });

  it('returns multiple alerts when multiple thresholds breached', () => {
    const now = new Date('2026-03-30T12:00:00Z');
    const result = evaluateAllAlerts({
      fluidIntake: { totalIntakeMl: 500 },
      news2: { totalScore: 8, hasClinicalConcern: true },
      constipation: {
        lastBowelMovementAt: new Date('2026-03-23T08:00:00Z'),
        currentTime: now,
      },
    });

    expect(result.length).toBe(3);
    expect(result.map((a) => a.alertType)).toContain('fluid_low');
    expect(result.map((a) => a.alertType)).toContain('news2_elevated');
    expect(result.map((a) => a.alertType)).toContain('constipation');
  });

  it('returns only alerts for provided data', () => {
    const result = evaluateAllAlerts({
      fluidIntake: { totalIntakeMl: 500 },
    });
    expect(result.length).toBe(1);
    expect(result[0].alertType).toBe('fluid_low');
  });

  it('uses custom thresholds when provided', () => {
    const result = evaluateAllAlerts(
      { fluidIntake: { totalIntakeMl: 600 } },
      { fluid_low: { amberMl: 500, redMl: 300 } },
    );
    expect(result).toEqual([]);
  });

  it('all alert candidates have required fields', () => {
    const result = evaluateAllAlerts({
      fluidIntake: { totalIntakeMl: 500 },
    });

    for (const alert of result) {
      expect(alert.alertType).toBeDefined();
      expect(alert.severity).toBeDefined();
      expect(alert.source).toBe('auto');
      expect(alert.triggerValue).toBeDefined();
      expect(alert.triggerThreshold).toBeDefined();
      expect(alert.message).toBeDefined();
      expect(alert.escalationLevel).toBeDefined();
    }
  });
});
