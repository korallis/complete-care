/**
 * Tests for PRN constants and utility functions.
 *
 * Validates:
 * - Pain score severity classification
 * - Pain severity color mapping
 * - Effect outcome color mapping
 * - Route helpers
 */

import { describe, it, expect } from 'vitest';
import {
  getPainSeverity,
  getPainSeverityColor,
  getEffectColor,
  prnBasePath,
  prnProtocolPath,
  prnAdministerPath,
  PAIN_SCORES,
  PAIN_SCORE_LABELS,
  EFFECT_OUTCOMES,
  EFFECT_OUTCOME_LABELS,
  FOLLOW_UP_INTERVALS,
  MIN_INTERVAL_OPTIONS,
} from '@/features/prn/constants';

// ---------------------------------------------------------------------------
// getPainSeverity
// ---------------------------------------------------------------------------

describe('getPainSeverity', () => {
  it('returns "none" for score 0', () => {
    expect(getPainSeverity(0)).toBe('none');
  });

  it('returns "mild" for scores 1-3', () => {
    expect(getPainSeverity(1)).toBe('mild');
    expect(getPainSeverity(2)).toBe('mild');
    expect(getPainSeverity(3)).toBe('mild');
  });

  it('returns "moderate" for scores 4-6', () => {
    expect(getPainSeverity(4)).toBe('moderate');
    expect(getPainSeverity(5)).toBe('moderate');
    expect(getPainSeverity(6)).toBe('moderate');
  });

  it('returns "severe" for scores 7-10', () => {
    expect(getPainSeverity(7)).toBe('severe');
    expect(getPainSeverity(8)).toBe('severe');
    expect(getPainSeverity(9)).toBe('severe');
    expect(getPainSeverity(10)).toBe('severe');
  });
});

// ---------------------------------------------------------------------------
// getPainSeverityColor
// ---------------------------------------------------------------------------

describe('getPainSeverityColor', () => {
  it('returns emerald colors for "none"', () => {
    const color = getPainSeverityColor('none');
    expect(color.bg).toContain('emerald');
  });

  it('returns yellow colors for "mild"', () => {
    const color = getPainSeverityColor('mild');
    expect(color.bg).toContain('yellow');
  });

  it('returns orange colors for "moderate"', () => {
    const color = getPainSeverityColor('moderate');
    expect(color.bg).toContain('orange');
  });

  it('returns red colors for "severe"', () => {
    const color = getPainSeverityColor('severe');
    expect(color.bg).toContain('red');
  });

  it('returns gray colors for unknown severity', () => {
    const color = getPainSeverityColor('unknown');
    expect(color.bg).toContain('gray');
  });
});

// ---------------------------------------------------------------------------
// getEffectColor
// ---------------------------------------------------------------------------

describe('getEffectColor', () => {
  it('returns emerald for "yes"', () => {
    const color = getEffectColor('yes');
    expect(color.bg).toContain('emerald');
  });

  it('returns amber for "partial"', () => {
    const color = getEffectColor('partial');
    expect(color.bg).toContain('amber');
  });

  it('returns red for "no"', () => {
    const color = getEffectColor('no');
    expect(color.bg).toContain('red');
  });

  it('returns gray for unknown', () => {
    const color = getEffectColor('unknown');
    expect(color.bg).toContain('gray');
  });
});

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

describe('route helpers', () => {
  it('prnBasePath builds correct path', () => {
    expect(prnBasePath('acme', 'person-123')).toBe(
      '/acme/persons/person-123/emar/prn',
    );
  });

  it('prnProtocolPath builds correct path', () => {
    expect(prnProtocolPath('acme', 'person-123', 'protocol-456')).toBe(
      '/acme/persons/person-123/emar/prn/protocol-456',
    );
  });

  it('prnAdministerPath builds correct path', () => {
    expect(prnAdministerPath('acme', 'person-123')).toBe(
      '/acme/persons/person-123/emar/prn/administer',
    );
  });
});

// ---------------------------------------------------------------------------
// Constants completeness
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('PAIN_SCORES has 11 values (0-10)', () => {
    expect(PAIN_SCORES).toHaveLength(11);
    expect(PAIN_SCORES[0]).toBe(0);
    expect(PAIN_SCORES[10]).toBe(10);
  });

  it('PAIN_SCORE_LABELS has entry for each score', () => {
    for (const score of PAIN_SCORES) {
      expect(PAIN_SCORE_LABELS[score]).toBeDefined();
      expect(typeof PAIN_SCORE_LABELS[score]).toBe('string');
    }
  });

  it('EFFECT_OUTCOMES has 3 values', () => {
    expect(EFFECT_OUTCOMES).toHaveLength(3);
    expect(EFFECT_OUTCOMES).toContain('yes');
    expect(EFFECT_OUTCOMES).toContain('partial');
    expect(EFFECT_OUTCOMES).toContain('no');
  });

  it('EFFECT_OUTCOME_LABELS has entry for each outcome', () => {
    for (const outcome of EFFECT_OUTCOMES) {
      expect(EFFECT_OUTCOME_LABELS[outcome]).toBeDefined();
    }
  });

  it('FOLLOW_UP_INTERVALS includes common values', () => {
    const values = FOLLOW_UP_INTERVALS.map((i) => i.value);
    expect(values).toContain(30);
    expect(values).toContain(60);
  });

  it('MIN_INTERVAL_OPTIONS includes common values', () => {
    const values = MIN_INTERVAL_OPTIONS.map((i) => i.value);
    expect(values).toContain(60);
    expect(values).toContain(240);
  });
});
