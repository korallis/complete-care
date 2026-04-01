/**
 * Tests for the Ofsted Quality Standards templates and scoring utilities.
 *
 * Validates:
 * - QUALITY_STANDARDS registry completeness
 * - getTotalSubRequirements
 * - getStandardByRegulation
 * - computeComplianceScore
 * - scoreToRag
 * - scoreToLabel
 * - DEFAULT_SOP_SECTIONS
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  QUALITY_STANDARDS,
  getTotalSubRequirements,
  getStandardByRegulation,
  EVIDENCE_TYPE_LABELS,
} from '@/features/ofsted/standards';

import {
  computeComplianceScore,
  scoreToRag,
  scoreToLabel,
  DEFAULT_SOP_SECTIONS,
} from '@/features/ofsted/constants';

// ---------------------------------------------------------------------------
// QUALITY_STANDARDS registry
// ---------------------------------------------------------------------------

describe('QUALITY_STANDARDS', () => {
  it('contains exactly 9 standards', () => {
    expect(QUALITY_STANDARDS).toHaveLength(9);
  });

  it('covers regulations 6 through 14', () => {
    const regulations = QUALITY_STANDARDS.map((s) => s.regulationNumber);
    expect(regulations).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('each standard has a non-empty name', () => {
    for (const s of QUALITY_STANDARDS) {
      expect(s.standardName).toBeTruthy();
      expect(s.standardName.length).toBeGreaterThan(0);
    }
  });

  it('each standard has a non-empty description', () => {
    for (const s of QUALITY_STANDARDS) {
      expect(s.description).toBeTruthy();
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('each standard has at least 3 sub-requirements', () => {
    for (const s of QUALITY_STANDARDS) {
      expect(s.subRequirements.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all sub-requirement IDs are unique', () => {
    const allIds = QUALITY_STANDARDS.flatMap((s) =>
      s.subRequirements.map((sr) => sr.id),
    );
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('each sub-requirement has non-empty text', () => {
    for (const s of QUALITY_STANDARDS) {
      for (const sr of s.subRequirements) {
        expect(sr.text).toBeTruthy();
        expect(sr.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('each sub-requirement has at least one suggested evidence type', () => {
    for (const s of QUALITY_STANDARDS) {
      for (const sr of s.subRequirements) {
        expect(sr.suggestedEvidenceTypes.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('sub-requirement IDs follow the naming convention (regN_M)', () => {
    for (const s of QUALITY_STANDARDS) {
      for (const sr of s.subRequirements) {
        expect(sr.id).toMatch(/^reg\d+_\d+$/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getTotalSubRequirements
// ---------------------------------------------------------------------------

describe('getTotalSubRequirements', () => {
  it('returns a positive number', () => {
    const total = getTotalSubRequirements();
    expect(total).toBeGreaterThan(0);
  });

  it('equals the sum of all sub-requirements across standards', () => {
    const manual = QUALITY_STANDARDS.reduce(
      (sum, s) => sum + s.subRequirements.length,
      0,
    );
    expect(getTotalSubRequirements()).toBe(manual);
  });
});

// ---------------------------------------------------------------------------
// getStandardByRegulation
// ---------------------------------------------------------------------------

describe('getStandardByRegulation', () => {
  it('returns the correct standard for each regulation', () => {
    for (let reg = 6; reg <= 14; reg++) {
      const standard = getStandardByRegulation(reg);
      expect(standard).toBeDefined();
      expect(standard!.regulationNumber).toBe(reg);
    }
  });

  it('returns undefined for a non-existent regulation', () => {
    expect(getStandardByRegulation(5)).toBeUndefined();
    expect(getStandardByRegulation(15)).toBeUndefined();
    expect(getStandardByRegulation(0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// computeComplianceScore
// ---------------------------------------------------------------------------

describe('computeComplianceScore', () => {
  it('returns 100 when all are evidenced', () => {
    expect(
      computeComplianceScore({ evidenced: 10, partial: 0, missing: 0 }),
    ).toBe(100);
  });

  it('returns 0 when all are missing', () => {
    expect(
      computeComplianceScore({ evidenced: 0, partial: 0, missing: 10 }),
    ).toBe(0);
  });

  it('returns 50 when all are partial', () => {
    expect(
      computeComplianceScore({ evidenced: 0, partial: 10, missing: 0 }),
    ).toBe(50);
  });

  it('returns 0 when all counts are zero', () => {
    expect(
      computeComplianceScore({ evidenced: 0, partial: 0, missing: 0 }),
    ).toBe(0);
  });

  it('computes a mixed score correctly', () => {
    // 5 evidenced + 4 partial (= 2 points) = 7 out of 10
    const score = computeComplianceScore({
      evidenced: 5,
      partial: 4,
      missing: 1,
    });
    expect(score).toBe(70);
  });

  it('rounds to the nearest integer', () => {
    // 1 evidenced + 1 partial (=0.5) = 1.5 out of 3 = 50%
    const score = computeComplianceScore({
      evidenced: 1,
      partial: 1,
      missing: 1,
    });
    expect(score).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// scoreToRag
// ---------------------------------------------------------------------------

describe('scoreToRag', () => {
  it('returns green for scores >= 80', () => {
    expect(scoreToRag(80)).toBe('green');
    expect(scoreToRag(100)).toBe('green');
    expect(scoreToRag(95)).toBe('green');
  });

  it('returns amber for scores 50-79', () => {
    expect(scoreToRag(50)).toBe('amber');
    expect(scoreToRag(79)).toBe('amber');
    expect(scoreToRag(65)).toBe('amber');
  });

  it('returns red for scores < 50', () => {
    expect(scoreToRag(0)).toBe('red');
    expect(scoreToRag(49)).toBe('red');
    expect(scoreToRag(25)).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// scoreToLabel
// ---------------------------------------------------------------------------

describe('scoreToLabel', () => {
  it('returns "Good" for scores >= 80', () => {
    expect(scoreToLabel(80)).toBe('Good');
    expect(scoreToLabel(100)).toBe('Good');
  });

  it('returns "Requires Improvement" for scores 50-79', () => {
    expect(scoreToLabel(50)).toBe('Requires Improvement');
    expect(scoreToLabel(79)).toBe('Requires Improvement');
  });

  it('returns "Inadequate" for scores < 50', () => {
    expect(scoreToLabel(0)).toBe('Inadequate');
    expect(scoreToLabel(49)).toBe('Inadequate');
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_SOP_SECTIONS
// ---------------------------------------------------------------------------

describe('DEFAULT_SOP_SECTIONS', () => {
  it('has at least 10 sections', () => {
    expect(DEFAULT_SOP_SECTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('all sections have unique IDs', () => {
    const ids = DEFAULT_SOP_SECTIONS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all sections have non-empty titles', () => {
    for (const section of DEFAULT_SOP_SECTIONS) {
      expect(section.title).toBeTruthy();
      expect(section.title.length).toBeGreaterThan(0);
    }
  });

  it('sections are ordered sequentially', () => {
    const orders = DEFAULT_SOP_SECTIONS.map((s) => s.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// EVIDENCE_TYPE_LABELS
// ---------------------------------------------------------------------------

describe('EVIDENCE_TYPE_LABELS', () => {
  it('has labels for all expected evidence types', () => {
    const expectedTypes = [
      'care_plan',
      'note',
      'incident',
      'training',
      'document',
      'manual',
    ];
    for (const type of expectedTypes) {
      expect(
        EVIDENCE_TYPE_LABELS[type as keyof typeof EVIDENCE_TYPE_LABELS],
      ).toBeTruthy();
    }
  });
});
