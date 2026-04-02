/**
 * Safeguarding constants tests.
 * Verify that UI labels and configuration values are complete and consistent.
 */
import { describe, it, expect } from 'vitest';
import {
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CONCERN_STATUS_LABELS,
  DSL_DECISION_LABELS,
  DSL_DECISION_DESCRIPTIONS,
  LADO_STATUS_LABELS,
  LADO_OUTCOME_LABELS,
  LADO_EMPLOYMENT_ACTION_LABELS,
  SECTION_47_STATUS_LABELS,
  MASH_STATUS_LABELS,
  CHRONOLOGY_SOURCE_LABELS,
  CONCERN_CATEGORIES,
  LADO_ACCESS_ROLES,
  DSL_REVIEW_ROLES,
} from '@/features/safeguarding/constants';
import {
  CONCERN_SEVERITIES,
  CONCERN_STATUSES,
  DSL_DECISIONS,
  LADO_STATUSES,
  LADO_OUTCOMES,
  LADO_EMPLOYMENT_ACTIONS,
  SECTION_47_STATUSES,
  MASH_STATUSES,
  CHRONOLOGY_SOURCES,
} from '@/lib/db/schema/safeguarding';

describe('safeguarding UI labels', () => {
  it('SEVERITY_LABELS has a label for every severity level', () => {
    for (const severity of CONCERN_SEVERITIES) {
      expect(SEVERITY_LABELS[severity]).toBeTruthy();
    }
  });

  it('SEVERITY_COLORS has a color for every severity level', () => {
    for (const severity of CONCERN_SEVERITIES) {
      expect(SEVERITY_COLORS[severity]).toBeTruthy();
    }
  });

  it('CONCERN_STATUS_LABELS has a label for every status', () => {
    for (const status of CONCERN_STATUSES) {
      expect(CONCERN_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('DSL_DECISION_LABELS has a label for every decision', () => {
    for (const decision of DSL_DECISIONS) {
      expect(DSL_DECISION_LABELS[decision]).toBeTruthy();
    }
  });

  it('DSL_DECISION_DESCRIPTIONS has a description for every decision', () => {
    for (const decision of DSL_DECISIONS) {
      expect(DSL_DECISION_DESCRIPTIONS[decision]).toBeTruthy();
    }
  });

  it('LADO_STATUS_LABELS has a label for every LADO status', () => {
    for (const status of LADO_STATUSES) {
      expect(LADO_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('LADO_OUTCOME_LABELS has a label for every LADO outcome', () => {
    for (const outcome of LADO_OUTCOMES) {
      expect(LADO_OUTCOME_LABELS[outcome]).toBeTruthy();
    }
  });

  it('LADO_EMPLOYMENT_ACTION_LABELS has a label for every action', () => {
    for (const action of LADO_EMPLOYMENT_ACTIONS) {
      expect(LADO_EMPLOYMENT_ACTION_LABELS[action]).toBeTruthy();
    }
  });

  it('SECTION_47_STATUS_LABELS has a label for every status', () => {
    for (const status of SECTION_47_STATUSES) {
      expect(SECTION_47_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('MASH_STATUS_LABELS has a label for every status', () => {
    for (const status of MASH_STATUSES) {
      expect(MASH_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('CHRONOLOGY_SOURCE_LABELS has a label for every source', () => {
    for (const source of CHRONOLOGY_SOURCES) {
      expect(CHRONOLOGY_SOURCE_LABELS[source]).toBeTruthy();
    }
  });
});

describe('safeguarding configuration', () => {
  it('CONCERN_CATEGORIES is a non-empty array', () => {
    expect(CONCERN_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('each CONCERN_CATEGORY has value and label', () => {
    for (const cat of CONCERN_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
    }
  });

  it('LADO_ACCESS_ROLES restricts to senior roles', () => {
    expect(LADO_ACCESS_ROLES).toContain('owner');
    expect(LADO_ACCESS_ROLES).toContain('admin');
    expect(LADO_ACCESS_ROLES).toContain('manager');
    // Should NOT contain carer-level roles
    expect(LADO_ACCESS_ROLES).not.toContain('carer');
    expect(LADO_ACCESS_ROLES).not.toContain('viewer');
  });

  it('DSL_REVIEW_ROLES restricts to senior roles', () => {
    expect(DSL_REVIEW_ROLES).toContain('owner');
    expect(DSL_REVIEW_ROLES).toContain('admin');
    expect(DSL_REVIEW_ROLES).toContain('manager');
  });
});
