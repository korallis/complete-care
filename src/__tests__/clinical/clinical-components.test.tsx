/**
 * Tests for clinical monitoring UI components.
 *
 * Validates:
 * - MustScoreBadge renders correct risk categories
 * - FluidAlertBanner shows correct alerts
 * - Component rendering does not crash
 */

import { describe, it, expect } from 'vitest';

// Since these are pure display components, we test the supporting logic
// that drives their rendering (utils/constants). Integration testing of
// the React components would require a DOM environment (jsdom) and is
// better suited for a separate E2E test suite.

import {
  getFluidAlertLevel,
  getFluidAlertMessage,
  shouldShowIntakePrompt,
  scoreMust,
} from '@/features/clinical-monitoring/utils';

import {
  MUST_RISK_LABELS,
  MUST_CARE_PATHWAY_LABELS,
  INTAKE_FLUID_TYPE_LABELS,
  OUTPUT_FLUID_TYPE_LABELS,
  PORTION_LABELS,
  IDDSI_LEVEL_LABELS,
} from '@/features/clinical-monitoring/constants';

// ---------------------------------------------------------------------------
// Label coverage tests (ensures all enums have labels)
// ---------------------------------------------------------------------------

describe('constants label coverage', () => {
  it('all intake fluid types have labels', () => {
    const types = ['water', 'tea', 'coffee', 'juice', 'milk', 'soup', 'squash', 'thickened', 'other'];
    for (const type of types) {
      expect(INTAKE_FLUID_TYPE_LABELS[type as keyof typeof INTAKE_FLUID_TYPE_LABELS]).toBeDefined();
    }
  });

  it('all output fluid types have labels', () => {
    const types = ['urine', 'vomit', 'drain', 'other'];
    for (const type of types) {
      expect(OUTPUT_FLUID_TYPE_LABELS[type as keyof typeof OUTPUT_FLUID_TYPE_LABELS]).toBeDefined();
    }
  });

  it('all portion options have labels', () => {
    const portions = ['all', 'three_quarters', 'half', 'quarter', 'refused'];
    for (const portion of portions) {
      expect(PORTION_LABELS[portion as keyof typeof PORTION_LABELS]).toBeDefined();
    }
  });

  it('all IDDSI levels have labels', () => {
    for (let i = 0; i <= 4; i++) {
      expect(IDDSI_LEVEL_LABELS[i as keyof typeof IDDSI_LEVEL_LABELS]).toBeDefined();
    }
  });

  it('all MUST risk categories have labels', () => {
    const categories = ['low', 'medium', 'high'];
    for (const cat of categories) {
      expect(MUST_RISK_LABELS[cat as keyof typeof MUST_RISK_LABELS]).toBeDefined();
    }
  });

  it('all MUST care pathways have labels', () => {
    const pathways = ['routine', 'observe', 'treat'];
    for (const pathway of pathways) {
      expect(MUST_CARE_PATHWAY_LABELS[pathway as keyof typeof MUST_CARE_PATHWAY_LABELS]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// FluidAlertBanner logic tests
// ---------------------------------------------------------------------------

describe('FluidAlertBanner logic', () => {
  it('shows no alert when intake is adequate', () => {
    expect(getFluidAlertLevel(1200)).toBe('none');
    expect(getFluidAlertMessage('none', 1200)).toBeNull();
  });

  it('shows amber alert for low intake', () => {
    expect(getFluidAlertLevel(900)).toBe('amber');
    const message = getFluidAlertMessage('amber', 900);
    expect(message).toBeTruthy();
    expect(message).toContain('Low fluid intake');
  });

  it('shows red alert for critically low intake', () => {
    expect(getFluidAlertLevel(600)).toBe('red');
    const message = getFluidAlertMessage('red', 600);
    expect(message).toBeTruthy();
    expect(message).toContain('Critically low');
  });

  it('shows prompt during waking hours with no recent intake', () => {
    const noon = new Date('2026-04-01T12:00:00');
    expect(shouldShowIntakePrompt(null, noon)).toBe(true);
  });

  it('does not show prompt during sleep hours', () => {
    const midnight = new Date('2026-04-01T02:00:00');
    expect(shouldShowIntakePrompt(null, midnight)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MustScoreBadge logic tests
// ---------------------------------------------------------------------------

describe('MustScoreBadge logic', () => {
  it('low risk MUST produces correct badge data', () => {
    const result = scoreMust(0, 0, 0);
    expect(result.riskCategory).toBe('low');
    expect(MUST_RISK_LABELS[result.riskCategory]).toBe('Low Risk');
    expect(MUST_CARE_PATHWAY_LABELS[result.carePathway]).toBe('Routine Clinical Care');
  });

  it('medium risk MUST produces correct badge data', () => {
    const result = scoreMust(1, 0, 0);
    expect(result.riskCategory).toBe('medium');
    expect(MUST_RISK_LABELS[result.riskCategory]).toBe('Medium Risk');
    expect(MUST_CARE_PATHWAY_LABELS[result.carePathway]).toBe('Observe');
  });

  it('high risk MUST produces correct badge data', () => {
    const result = scoreMust(2, 1, 2);
    expect(result.riskCategory).toBe('high');
    expect(MUST_RISK_LABELS[result.riskCategory]).toBe('High Risk');
    expect(MUST_CARE_PATHWAY_LABELS[result.carePathway]).toBe('Treat');
  });
});
