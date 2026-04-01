/**
 * Comprehensive tests for NEWS2 calculation engine.
 *
 * Tests:
 * - Individual parameter scoring (all 7 parameters)
 * - Escalation level determination
 * - Full NEWS2 calculation with Scale 1 (standard)
 * - Full NEWS2 calculation with Scale 2 (COPD)
 * - Clinical concern flag (single param = 3)
 * - Edge cases and boundary conditions
 * - Known scoring examples from NHS documentation
 */

import { describe, it, expect } from 'vitest';
import {
  scoreRespiratoryRate,
  scoreSpo2,
  scoreSupplementalOxygen,
  scoreSystolicBp,
  scorePulseRate,
  scoreConsciousness,
  scoreTemperature,
  getEscalation,
  calculateNews2,
} from '@/features/vital-signs/news2';

// ---------------------------------------------------------------------------
// scoreRespiratoryRate
// ---------------------------------------------------------------------------

describe('scoreRespiratoryRate', () => {
  it('scores 3 for rate <= 8', () => {
    expect(scoreRespiratoryRate(5)).toBe(3);
    expect(scoreRespiratoryRate(8)).toBe(3);
  });

  it('scores 1 for rate 9-11', () => {
    expect(scoreRespiratoryRate(9)).toBe(1);
    expect(scoreRespiratoryRate(10)).toBe(1);
    expect(scoreRespiratoryRate(11)).toBe(1);
  });

  it('scores 0 for rate 12-20 (normal)', () => {
    expect(scoreRespiratoryRate(12)).toBe(0);
    expect(scoreRespiratoryRate(16)).toBe(0);
    expect(scoreRespiratoryRate(20)).toBe(0);
  });

  it('scores 2 for rate 21-24', () => {
    expect(scoreRespiratoryRate(21)).toBe(2);
    expect(scoreRespiratoryRate(24)).toBe(2);
  });

  it('scores 3 for rate >= 25', () => {
    expect(scoreRespiratoryRate(25)).toBe(3);
    expect(scoreRespiratoryRate(30)).toBe(3);
    expect(scoreRespiratoryRate(40)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scoreSpo2 — Scale 1 (standard)
// ---------------------------------------------------------------------------

describe('scoreSpo2 — Scale 1', () => {
  const isCopd = false;
  const onAir = false;

  it('scores 3 for SpO2 <= 91', () => {
    expect(scoreSpo2(88, isCopd, onAir)).toBe(3);
    expect(scoreSpo2(91, isCopd, onAir)).toBe(3);
  });

  it('scores 2 for SpO2 92-93', () => {
    expect(scoreSpo2(92, isCopd, onAir)).toBe(2);
    expect(scoreSpo2(93, isCopd, onAir)).toBe(2);
  });

  it('scores 1 for SpO2 94-95', () => {
    expect(scoreSpo2(94, isCopd, onAir)).toBe(1);
    expect(scoreSpo2(95, isCopd, onAir)).toBe(1);
  });

  it('scores 0 for SpO2 >= 96', () => {
    expect(scoreSpo2(96, isCopd, onAir)).toBe(0);
    expect(scoreSpo2(98, isCopd, onAir)).toBe(0);
    expect(scoreSpo2(100, isCopd, onAir)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// scoreSpo2 — Scale 2 (COPD on air)
// ---------------------------------------------------------------------------

describe('scoreSpo2 — Scale 2, on air', () => {
  const isCopd = true;
  const onAir = false; // not on supplemental oxygen

  it('scores 3 for SpO2 <= 83', () => {
    expect(scoreSpo2(80, isCopd, onAir)).toBe(3);
    expect(scoreSpo2(83, isCopd, onAir)).toBe(3);
  });

  it('scores 2 for SpO2 84-85', () => {
    expect(scoreSpo2(84, isCopd, onAir)).toBe(2);
    expect(scoreSpo2(85, isCopd, onAir)).toBe(2);
  });

  it('scores 1 for SpO2 86-87', () => {
    expect(scoreSpo2(86, isCopd, onAir)).toBe(1);
    expect(scoreSpo2(87, isCopd, onAir)).toBe(1);
  });

  it('scores 0 for SpO2 88-92 (target range)', () => {
    expect(scoreSpo2(88, isCopd, onAir)).toBe(0);
    expect(scoreSpo2(90, isCopd, onAir)).toBe(0);
    expect(scoreSpo2(92, isCopd, onAir)).toBe(0);
  });

  it('scores 3 for SpO2 >= 93 on air (paradoxically high for COPD)', () => {
    expect(scoreSpo2(93, isCopd, onAir)).toBe(3);
    expect(scoreSpo2(96, isCopd, onAir)).toBe(3);
    expect(scoreSpo2(100, isCopd, onAir)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scoreSpo2 — Scale 2 (COPD on oxygen)
// ---------------------------------------------------------------------------

describe('scoreSpo2 — Scale 2, on oxygen', () => {
  const isCopd = true;
  const onO2 = true;

  it('scores 3 for SpO2 <= 83', () => {
    expect(scoreSpo2(80, isCopd, onO2)).toBe(3);
    expect(scoreSpo2(83, isCopd, onO2)).toBe(3);
  });

  it('scores 2 for SpO2 84-85', () => {
    expect(scoreSpo2(84, isCopd, onO2)).toBe(2);
    expect(scoreSpo2(85, isCopd, onO2)).toBe(2);
  });

  it('scores 1 for SpO2 86-87', () => {
    expect(scoreSpo2(86, isCopd, onO2)).toBe(1);
    expect(scoreSpo2(87, isCopd, onO2)).toBe(1);
  });

  it('scores 0 for SpO2 88-92 (target range)', () => {
    expect(scoreSpo2(88, isCopd, onO2)).toBe(0);
    expect(scoreSpo2(90, isCopd, onO2)).toBe(0);
    expect(scoreSpo2(92, isCopd, onO2)).toBe(0);
  });

  it('scores 1 for SpO2 93-94 on O2', () => {
    expect(scoreSpo2(93, isCopd, onO2)).toBe(1);
    expect(scoreSpo2(94, isCopd, onO2)).toBe(1);
  });

  it('scores 2 for SpO2 95-96 on O2', () => {
    expect(scoreSpo2(95, isCopd, onO2)).toBe(2);
    expect(scoreSpo2(96, isCopd, onO2)).toBe(2);
  });

  it('scores 3 for SpO2 >= 97 on O2', () => {
    expect(scoreSpo2(97, isCopd, onO2)).toBe(3);
    expect(scoreSpo2(100, isCopd, onO2)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scoreSupplementalOxygen
// ---------------------------------------------------------------------------

describe('scoreSupplementalOxygen', () => {
  it('scores 2 when on oxygen (Scale 1)', () => {
    expect(scoreSupplementalOxygen(true, false)).toBe(2);
  });

  it('scores 0 when on air (Scale 1)', () => {
    expect(scoreSupplementalOxygen(false, false)).toBe(0);
  });

  it('scores 0 for COPD patients regardless (Scale 2 incorporates O2 into SpO2)', () => {
    expect(scoreSupplementalOxygen(true, true)).toBe(0);
    expect(scoreSupplementalOxygen(false, true)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// scoreSystolicBp
// ---------------------------------------------------------------------------

describe('scoreSystolicBp', () => {
  it('scores 3 for systolic <= 90', () => {
    expect(scoreSystolicBp(70)).toBe(3);
    expect(scoreSystolicBp(90)).toBe(3);
  });

  it('scores 2 for systolic 91-100', () => {
    expect(scoreSystolicBp(91)).toBe(2);
    expect(scoreSystolicBp(100)).toBe(2);
  });

  it('scores 1 for systolic 101-110', () => {
    expect(scoreSystolicBp(101)).toBe(1);
    expect(scoreSystolicBp(110)).toBe(1);
  });

  it('scores 0 for systolic 111-219 (normal)', () => {
    expect(scoreSystolicBp(111)).toBe(0);
    expect(scoreSystolicBp(120)).toBe(0);
    expect(scoreSystolicBp(219)).toBe(0);
  });

  it('scores 3 for systolic >= 220', () => {
    expect(scoreSystolicBp(220)).toBe(3);
    expect(scoreSystolicBp(250)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scorePulseRate
// ---------------------------------------------------------------------------

describe('scorePulseRate', () => {
  it('scores 3 for pulse <= 40', () => {
    expect(scorePulseRate(30)).toBe(3);
    expect(scorePulseRate(40)).toBe(3);
  });

  it('scores 1 for pulse 41-50', () => {
    expect(scorePulseRate(41)).toBe(1);
    expect(scorePulseRate(50)).toBe(1);
  });

  it('scores 0 for pulse 51-90 (normal)', () => {
    expect(scorePulseRate(51)).toBe(0);
    expect(scorePulseRate(72)).toBe(0);
    expect(scorePulseRate(90)).toBe(0);
  });

  it('scores 1 for pulse 91-110', () => {
    expect(scorePulseRate(91)).toBe(1);
    expect(scorePulseRate(110)).toBe(1);
  });

  it('scores 2 for pulse 111-130', () => {
    expect(scorePulseRate(111)).toBe(2);
    expect(scorePulseRate(130)).toBe(2);
  });

  it('scores 3 for pulse >= 131', () => {
    expect(scorePulseRate(131)).toBe(3);
    expect(scorePulseRate(160)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scoreConsciousness
// ---------------------------------------------------------------------------

describe('scoreConsciousness', () => {
  it('scores 0 for alert', () => {
    expect(scoreConsciousness('alert')).toBe(0);
  });

  it('scores 3 for voice', () => {
    expect(scoreConsciousness('voice')).toBe(3);
  });

  it('scores 3 for pain', () => {
    expect(scoreConsciousness('pain')).toBe(3);
  });

  it('scores 3 for unresponsive', () => {
    expect(scoreConsciousness('unresponsive')).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// scoreTemperature
// ---------------------------------------------------------------------------

describe('scoreTemperature', () => {
  it('scores 3 for temp <= 35.0', () => {
    expect(scoreTemperature(33.0)).toBe(3);
    expect(scoreTemperature(35.0)).toBe(3);
  });

  it('scores 1 for temp 35.1-36.0', () => {
    expect(scoreTemperature(35.1)).toBe(1);
    expect(scoreTemperature(36.0)).toBe(1);
  });

  it('scores 0 for temp 36.1-38.0 (normal)', () => {
    expect(scoreTemperature(36.1)).toBe(0);
    expect(scoreTemperature(37.0)).toBe(0);
    expect(scoreTemperature(38.0)).toBe(0);
  });

  it('scores 1 for temp 38.1-39.0', () => {
    expect(scoreTemperature(38.1)).toBe(1);
    expect(scoreTemperature(39.0)).toBe(1);
  });

  it('scores 2 for temp >= 39.1', () => {
    expect(scoreTemperature(39.1)).toBe(2);
    expect(scoreTemperature(40.0)).toBe(2);
    expect(scoreTemperature(42.0)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getEscalation
// ---------------------------------------------------------------------------

describe('getEscalation', () => {
  it('returns routine for score 0 with no clinical concern', () => {
    expect(getEscalation(0, false)).toBe('routine');
  });

  it('returns ward_assessment for score 1-4', () => {
    expect(getEscalation(1, false)).toBe('ward_assessment');
    expect(getEscalation(2, false)).toBe('ward_assessment');
    expect(getEscalation(4, false)).toBe('ward_assessment');
  });

  it('returns ward_assessment for score 0 with clinical concern (single param = 3)', () => {
    // This can happen if a single param scores 3 but others score 0
    // In practice unlikely for total = 0 but the rule holds
    expect(getEscalation(0, true)).toBe('ward_assessment');
  });

  it('returns urgent for score 5-6', () => {
    expect(getEscalation(5, false)).toBe('urgent');
    expect(getEscalation(6, false)).toBe('urgent');
  });

  it('returns emergency for score >= 7', () => {
    expect(getEscalation(7, false)).toBe('emergency');
    expect(getEscalation(10, false)).toBe('emergency');
    expect(getEscalation(15, false)).toBe('emergency');
    expect(getEscalation(20, false)).toBe('emergency');
  });
});

// ---------------------------------------------------------------------------
// calculateNews2 — full calculation, Scale 1 (standard)
// ---------------------------------------------------------------------------

describe('calculateNews2 — Scale 1', () => {
  it('returns score 0 for completely normal vitals', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 98,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
    });

    expect(result.totalScore).toBe(0);
    expect(result.scaleUsed).toBe(1);
    expect(result.escalation).toBe('routine');
    expect(result.hasClinicalConcern).toBe(false);
    expect(result.parameterScores.respiratoryRate).toBe(0);
    expect(result.parameterScores.spo2).toBe(0);
    expect(result.parameterScores.supplementalOxygen).toBe(0);
    expect(result.parameterScores.systolicBp).toBe(0);
    expect(result.parameterScores.pulseRate).toBe(0);
    expect(result.parameterScores.consciousness).toBe(0);
    expect(result.parameterScores.temperature).toBe(0);
  });

  it('scores patient on supplemental oxygen (adds 2)', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 98,
      supplementalOxygen: true,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
    });

    expect(result.parameterScores.supplementalOxygen).toBe(2);
    expect(result.totalScore).toBe(2);
    expect(result.escalation).toBe('ward_assessment');
  });

  it('handles mildly abnormal vitals (low total, ward assessment)', () => {
    // RR=22 (score 2), SpO2=95 (score 1), rest normal
    const result = calculateNews2({
      respiratoryRate: 22,
      spo2: 95,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
    });

    expect(result.parameterScores.respiratoryRate).toBe(2);
    expect(result.parameterScores.spo2).toBe(1);
    expect(result.totalScore).toBe(3);
    expect(result.escalation).toBe('ward_assessment');
    expect(result.hasClinicalConcern).toBe(false);
  });

  it('flags clinical concern when any single parameter scores 3', () => {
    // Only consciousness is abnormal (score 3), rest normal
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 98,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'voice',
      temperature: 37.0,
    });

    expect(result.parameterScores.consciousness).toBe(3);
    expect(result.totalScore).toBe(3);
    expect(result.hasClinicalConcern).toBe(true);
    expect(result.escalation).toBe('ward_assessment');
  });

  it('calculates urgent escalation (score 5-6)', () => {
    // RR=7 (score 3) + SpO2=92 (score 2) = total 5
    const result = calculateNews2({
      respiratoryRate: 7,
      spo2: 92,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
    });

    expect(result.totalScore).toBe(5);
    expect(result.escalation).toBe('urgent');
    expect(result.hasClinicalConcern).toBe(true); // RR scored 3
  });

  it('calculates emergency escalation (score 7+)', () => {
    // Very unwell: low BP, fast pulse, reduced consciousness
    const result = calculateNews2({
      respiratoryRate: 25,     // score 3
      spo2: 91,                // score 3
      supplementalOxygen: true, // score 2
      systolicBp: 85,          // score 3
      pulseRate: 135,          // score 3
      consciousness: 'pain',   // score 3
      temperature: 39.5,       // score 2
    });

    expect(result.totalScore).toBe(19);
    expect(result.escalation).toBe('emergency');
    expect(result.hasClinicalConcern).toBe(true);
  });

  it('known example: moderately unwell patient', () => {
    // Temp=38.5 (1), RR=22 (2), SpO2=94 on air (1), BP=105 (1), HR=100 (1), Alert (0)
    const result = calculateNews2({
      respiratoryRate: 22,
      spo2: 94,
      supplementalOxygen: false,
      systolicBp: 105,
      pulseRate: 100,
      consciousness: 'alert',
      temperature: 38.5,
    });

    expect(result.parameterScores.respiratoryRate).toBe(2);
    expect(result.parameterScores.spo2).toBe(1);
    expect(result.parameterScores.supplementalOxygen).toBe(0);
    expect(result.parameterScores.systolicBp).toBe(1);
    expect(result.parameterScores.pulseRate).toBe(1);
    expect(result.parameterScores.consciousness).toBe(0);
    expect(result.parameterScores.temperature).toBe(1);
    expect(result.totalScore).toBe(6);
    expect(result.escalation).toBe('urgent');
  });

  it('known example: hypotensive tachycardic patient', () => {
    // Temp=36.5 (0), RR=18 (0), SpO2=96 (0), BP=88 (3), HR=115 (2), Alert (0)
    const result = calculateNews2({
      respiratoryRate: 18,
      spo2: 96,
      supplementalOxygen: false,
      systolicBp: 88,
      pulseRate: 115,
      consciousness: 'alert',
      temperature: 36.5,
    });

    expect(result.parameterScores.systolicBp).toBe(3);
    expect(result.parameterScores.pulseRate).toBe(2);
    expect(result.totalScore).toBe(5);
    expect(result.hasClinicalConcern).toBe(true); // BP scored 3
    expect(result.escalation).toBe('urgent');
  });
});

// ---------------------------------------------------------------------------
// calculateNews2 — Scale 2 (COPD)
// ---------------------------------------------------------------------------

describe('calculateNews2 — Scale 2 (COPD)', () => {
  it('uses Scale 2 when isCopd is true', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 90,  // In COPD target range (88-92)
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(result.scaleUsed).toBe(2);
    expect(result.parameterScores.spo2).toBe(0); // 88-92 is normal for COPD
    expect(result.parameterScores.supplementalOxygen).toBe(0); // Always 0 for Scale 2
    expect(result.totalScore).toBe(0);
  });

  it('scores 3 for SpO2 >= 93 on air (COPD - too high without O2)', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 96,  // Paradoxically high for COPD on air
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(result.parameterScores.spo2).toBe(3);
    expect(result.hasClinicalConcern).toBe(true);
  });

  it('does NOT add supplemental oxygen score on Scale 2', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 90,
      supplementalOxygen: true,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(result.parameterScores.supplementalOxygen).toBe(0);
  });

  it('scores SpO2 93-94 on oxygen as 1 (COPD Scale 2)', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 93,
      supplementalOxygen: true,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(result.parameterScores.spo2).toBe(1);
    expect(result.totalScore).toBe(1);
  });

  it('scores SpO2 97+ on oxygen as 3 (COPD Scale 2)', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 99,
      supplementalOxygen: true,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(result.parameterScores.spo2).toBe(3);
    expect(result.hasClinicalConcern).toBe(true);
  });

  it('defaults to Scale 1 when isCopd is not provided', () => {
    const result = calculateNews2({
      respiratoryRate: 16,
      spo2: 98,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
    });

    expect(result.scaleUsed).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('calculateNews2 — edge cases', () => {
  it('handles boundary values at threshold edges', () => {
    // All values at the boundary between score 0 and score 1/2
    const result = calculateNews2({
      respiratoryRate: 20,  // Upper boundary of 0
      spo2: 96,             // Lower boundary of 0
      supplementalOxygen: false,
      systolicBp: 111,      // Lower boundary of 0
      pulseRate: 90,        // Upper boundary of 0
      consciousness: 'alert',
      temperature: 38.0,    // Upper boundary of 0
    });

    expect(result.totalScore).toBe(0);
    expect(result.escalation).toBe('routine');
  });

  it('handles maximum possible score', () => {
    // All parameters at worst possible values
    const result = calculateNews2({
      respiratoryRate: 5,      // score 3
      spo2: 85,                // score 3
      supplementalOxygen: true, // score 2
      systolicBp: 80,          // score 3
      pulseRate: 35,           // score 3
      consciousness: 'unresponsive', // score 3
      temperature: 34.0,       // score 3
    });

    expect(result.totalScore).toBe(20);
    expect(result.escalation).toBe('emergency');
    expect(result.hasClinicalConcern).toBe(true);
  });

  it('handles exact threshold boundaries for RR', () => {
    // RR=8 is score 3, RR=9 is score 1
    expect(scoreRespiratoryRate(8)).toBe(3);
    expect(scoreRespiratoryRate(9)).toBe(1);

    // RR=11 is score 1, RR=12 is score 0
    expect(scoreRespiratoryRate(11)).toBe(1);
    expect(scoreRespiratoryRate(12)).toBe(0);

    // RR=20 is score 0, RR=21 is score 2
    expect(scoreRespiratoryRate(20)).toBe(0);
    expect(scoreRespiratoryRate(21)).toBe(2);

    // RR=24 is score 2, RR=25 is score 3
    expect(scoreRespiratoryRate(24)).toBe(2);
    expect(scoreRespiratoryRate(25)).toBe(3);
  });

  it('correctly reports scaleUsed in result', () => {
    const scale1 = calculateNews2({
      respiratoryRate: 16,
      spo2: 98,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: false,
    });

    const scale2 = calculateNews2({
      respiratoryRate: 16,
      spo2: 90,
      supplementalOxygen: false,
      systolicBp: 120,
      pulseRate: 72,
      consciousness: 'alert',
      temperature: 37.0,
      isCopd: true,
    });

    expect(scale1.scaleUsed).toBe(1);
    expect(scale2.scaleUsed).toBe(2);
  });
});
