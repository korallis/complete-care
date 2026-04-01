/**
 * Tests for training feature constants.
 *
 * Validates:
 * - Default care sector courses structure and content
 * - RAG cell styles structure
 * - Status styling objects
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
  DEFAULT_CARE_SECTOR_COURSES,
  TRAINING_STATUS_STYLES,
  QUALIFICATION_STATUS_STYLES,
  RAG_CELL_STYLES,
  TRAINING_CATEGORY_STYLES,
  TRAINING_AMBER_ALERT_DAYS,
} from '@/features/training/constants';

import { TRAINING_CATEGORIES, TRAINING_STATUSES, QUALIFICATION_STATUSES } from '@/features/training/schema';

// ---------------------------------------------------------------------------
// Default care sector courses
// ---------------------------------------------------------------------------

describe('DEFAULT_CARE_SECTOR_COURSES', () => {
  it('contains at least 10 default courses', () => {
    expect(DEFAULT_CARE_SECTOR_COURSES.length).toBeGreaterThanOrEqual(10);
  });

  it('all courses have required fields', () => {
    for (const course of DEFAULT_CARE_SECTOR_COURSES) {
      expect(course.name).toBeTruthy();
      expect(course.category).toBeTruthy();
      expect(Array.isArray(course.requiredForRoles)).toBe(true);
      expect(course.requiredForRoles.length).toBeGreaterThan(0);
      expect(typeof course.validityMonths).toBe('number');
      expect(course.validityMonths).toBeGreaterThan(0);
    }
  });

  it('includes mandatory Moving and Handling course', () => {
    const course = DEFAULT_CARE_SECTOR_COURSES.find(
      (c) => c.name === 'Moving and Handling',
    );
    expect(course).toBeTruthy();
    expect(course?.category).toBe('mandatory');
    expect(course?.validityMonths).toBe(12);
  });

  it('includes mandatory Fire Safety course', () => {
    const course = DEFAULT_CARE_SECTOR_COURSES.find(
      (c) => c.name === 'Fire Safety',
    );
    expect(course).toBeTruthy();
    expect(course?.category).toBe('mandatory');
  });

  it('includes clinical Medication Administration course', () => {
    const course = DEFAULT_CARE_SECTOR_COURSES.find(
      (c) => c.name === 'Medication Administration',
    );
    expect(course).toBeTruthy();
    expect(course?.category).toBe('clinical');
  });

  it('all course categories are valid', () => {
    for (const course of DEFAULT_CARE_SECTOR_COURSES) {
      expect(TRAINING_CATEGORIES).toContain(course.category);
    }
  });
});

// ---------------------------------------------------------------------------
// Status styles
// ---------------------------------------------------------------------------

describe('TRAINING_STATUS_STYLES', () => {
  it('has styles for all training statuses', () => {
    for (const status of TRAINING_STATUSES) {
      const style = TRAINING_STATUS_STYLES[status];
      expect(style).toBeTruthy();
      expect(style.bg).toBeTruthy();
      expect(style.text).toBeTruthy();
      expect(style.dot).toBeTruthy();
    }
  });
});

describe('QUALIFICATION_STATUS_STYLES', () => {
  it('has styles for all qualification statuses', () => {
    for (const status of QUALIFICATION_STATUSES) {
      const style = QUALIFICATION_STATUS_STYLES[status];
      expect(style).toBeTruthy();
      expect(style.bg).toBeTruthy();
      expect(style.text).toBeTruthy();
      expect(style.dot).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// RAG cell styles
// ---------------------------------------------------------------------------

describe('RAG_CELL_STYLES', () => {
  it('has all four RAG colours', () => {
    expect(RAG_CELL_STYLES.green).toBeTruthy();
    expect(RAG_CELL_STYLES.amber).toBeTruthy();
    expect(RAG_CELL_STYLES.red).toBeTruthy();
    expect(RAG_CELL_STYLES.grey).toBeTruthy();
  });

  it('each colour has bg, text, border, and label', () => {
    for (const colour of ['green', 'amber', 'red', 'grey'] as const) {
      const style = RAG_CELL_STYLES[colour];
      expect(style.bg).toBeTruthy();
      expect(style.text).toBeTruthy();
      expect(style.border).toBeTruthy();
      expect(style.label).toBeTruthy();
    }
  });

  it('green label is "Current"', () => {
    expect(RAG_CELL_STYLES.green.label).toBe('Current');
  });

  it('amber label is "Expiring Soon"', () => {
    expect(RAG_CELL_STYLES.amber.label).toBe('Expiring Soon');
  });

  it('red label is "Expired / Missing"', () => {
    expect(RAG_CELL_STYLES.red.label).toBe('Expired / Missing');
  });
});

// ---------------------------------------------------------------------------
// Category styles
// ---------------------------------------------------------------------------

describe('TRAINING_CATEGORY_STYLES', () => {
  it('has styles for all categories', () => {
    for (const cat of TRAINING_CATEGORIES) {
      const style = TRAINING_CATEGORY_STYLES[cat];
      expect(style).toBeTruthy();
      expect(style.bg).toBeTruthy();
      expect(style.text).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

describe('Alert thresholds', () => {
  it('amber alert threshold is 30 days', () => {
    expect(TRAINING_AMBER_ALERT_DAYS).toBe(30);
  });
});
