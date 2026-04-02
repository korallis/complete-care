import { describe, it, expect } from 'vitest';
import {
  DEVELOPMENT_DOMAINS,
  DOMAIN_LABELS,
  ASSESSMENT_TOOLS,
  BEHAVIOUR_TYPES,
  BEHAVIOUR_TYPE_LABELS,
  SEVERITY_LEVELS,
  SEVERITY_COLOURS,
  POSITIVE_BEHAVIOUR_CATEGORIES,
  MAX_DOMAIN_SCORE,
} from './constants';

describe('constants', () => {
  it('has 7 development domains', () => {
    expect(DEVELOPMENT_DOMAINS).toHaveLength(7);
  });

  it('has a label for every development domain', () => {
    for (const domain of DEVELOPMENT_DOMAINS) {
      expect(DOMAIN_LABELS[domain]).toBeTruthy();
    }
  });

  it('has a label for every behaviour type', () => {
    for (const type of BEHAVIOUR_TYPES) {
      expect(BEHAVIOUR_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('has a colour for every severity level', () => {
    for (const level of SEVERITY_LEVELS) {
      expect(SEVERITY_COLOURS[level]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('has at least 3 assessment tools', () => {
    expect(ASSESSMENT_TOOLS.length).toBeGreaterThanOrEqual(3);
  });

  it('has at least 5 positive behaviour categories', () => {
    expect(POSITIVE_BEHAVIOUR_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it('max domain score is 10', () => {
    expect(MAX_DOMAIN_SCORE).toBe(10);
  });
});
