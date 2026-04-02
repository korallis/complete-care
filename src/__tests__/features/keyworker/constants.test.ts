/**
 * Tests for keyworker engagement constants.
 *
 * Validates all exported constants, label maps, and type definitions
 * for sessions, restraints, sanctions, visitor log, and children's voice.
 */

import { describe, it, expect } from 'vitest';
import {
  RESTRAINT_TECHNIQUES,
  RESTRAINT_TECHNIQUE_LABELS,
  SANCTION_TYPES,
  SANCTION_TYPE_LABELS,
  PROHIBITED_MEASURES,
  PROHIBITED_MEASURE_LABELS,
  VISITOR_RELATIONSHIPS,
  VISITOR_RELATIONSHIP_LABELS,
  VOICE_CATEGORIES,
  VOICE_CATEGORY_LABELS,
  VOICE_METHODS,
  VOICE_METHOD_LABELS,
} from '../../../features/keyworker/constants';

// ---------------------------------------------------------------------------
// Restraint techniques
// ---------------------------------------------------------------------------

describe('RESTRAINT_TECHNIQUES', () => {
  it('is a non-empty readonly array', () => {
    expect(RESTRAINT_TECHNIQUES).toBeDefined();
    expect(RESTRAINT_TECHNIQUES.length).toBeGreaterThan(0);
  });

  it('includes key recognised techniques', () => {
    expect(RESTRAINT_TECHNIQUES).toContain('team_teach');
    expect(RESTRAINT_TECHNIQUES).toContain('price');
    expect(RESTRAINT_TECHNIQUES).toContain('mapa');
    expect(RESTRAINT_TECHNIQUES).toContain('cpi');
    expect(RESTRAINT_TECHNIQUES).toContain('other');
  });

  it('has a label for every technique', () => {
    for (const technique of RESTRAINT_TECHNIQUES) {
      expect(RESTRAINT_TECHNIQUE_LABELS[technique]).toBeDefined();
      expect(typeof RESTRAINT_TECHNIQUE_LABELS[technique]).toBe('string');
      expect(RESTRAINT_TECHNIQUE_LABELS[technique].length).toBeGreaterThan(0);
    }
  });

  it('RESTRAINT_TECHNIQUE_LABELS has no extra keys', () => {
    const techniqueSet = new Set(RESTRAINT_TECHNIQUES);
    for (const key of Object.keys(RESTRAINT_TECHNIQUE_LABELS)) {
      expect(techniqueSet.has(key as never)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Sanction types
// ---------------------------------------------------------------------------

describe('SANCTION_TYPES', () => {
  it('is a non-empty readonly array', () => {
    expect(SANCTION_TYPES).toBeDefined();
    expect(SANCTION_TYPES.length).toBeGreaterThan(0);
  });

  it('includes core sanction types', () => {
    expect(SANCTION_TYPES).toContain('verbal_warning');
    expect(SANCTION_TYPES).toContain('loss_of_privilege');
    expect(SANCTION_TYPES).toContain('other');
  });

  it('has a label for every sanction type', () => {
    for (const type of SANCTION_TYPES) {
      expect(SANCTION_TYPE_LABELS[type]).toBeDefined();
      expect(typeof SANCTION_TYPE_LABELS[type]).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Prohibited measures
// ---------------------------------------------------------------------------

describe('PROHIBITED_MEASURES', () => {
  it('is a non-empty readonly array', () => {
    expect(PROHIBITED_MEASURES).toBeDefined();
    expect(PROHIBITED_MEASURES.length).toBeGreaterThan(0);
  });

  it('includes corporal punishment as prohibited', () => {
    expect(PROHIBITED_MEASURES).toContain('corporal_punishment');
  });

  it('includes deprivation of food or drink as prohibited', () => {
    expect(PROHIBITED_MEASURES).toContain('deprivation_of_food_or_drink');
  });

  it('includes use or withholding of medication as prohibited', () => {
    expect(PROHIBITED_MEASURES).toContain('use_or_withholding_of_medication');
  });

  it('includes fines as prohibited', () => {
    expect(PROHIBITED_MEASURES).toContain('fines');
  });

  it('has a label for every prohibited measure', () => {
    for (const measure of PROHIBITED_MEASURES) {
      expect(PROHIBITED_MEASURE_LABELS[measure]).toBeDefined();
      expect(typeof PROHIBITED_MEASURE_LABELS[measure]).toBe('string');
      expect(PROHIBITED_MEASURE_LABELS[measure].length).toBeGreaterThan(0);
    }
  });

  it('has at least 8 prohibited measures (regulatory requirement)', () => {
    expect(PROHIBITED_MEASURES.length).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// Visitor relationships
// ---------------------------------------------------------------------------

describe('VISITOR_RELATIONSHIPS', () => {
  it('is a non-empty readonly array', () => {
    expect(VISITOR_RELATIONSHIPS).toBeDefined();
    expect(VISITOR_RELATIONSHIPS.length).toBeGreaterThan(0);
  });

  it('includes key relationship types', () => {
    expect(VISITOR_RELATIONSHIPS).toContain('parent');
    expect(VISITOR_RELATIONSHIPS).toContain('social_worker');
    expect(VISITOR_RELATIONSHIPS).toContain('iro');
    expect(VISITOR_RELATIONSHIPS).toContain('ofsted_inspector');
  });

  it('has a label for every relationship', () => {
    for (const rel of VISITOR_RELATIONSHIPS) {
      expect(VISITOR_RELATIONSHIP_LABELS[rel]).toBeDefined();
      expect(typeof VISITOR_RELATIONSHIP_LABELS[rel]).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Voice categories
// ---------------------------------------------------------------------------

describe('VOICE_CATEGORIES', () => {
  it('is a non-empty readonly array', () => {
    expect(VOICE_CATEGORIES).toBeDefined();
    expect(VOICE_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('includes core Ofsted-relevant categories', () => {
    expect(VOICE_CATEGORIES).toContain('daily_life');
    expect(VOICE_CATEGORIES).toContain('education');
    expect(VOICE_CATEGORIES).toContain('health');
    expect(VOICE_CATEGORIES).toContain('safety');
    expect(VOICE_CATEGORIES).toContain('wishes');
  });

  it('has a label for every category', () => {
    for (const cat of VOICE_CATEGORIES) {
      expect(VOICE_CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof VOICE_CATEGORY_LABELS[cat]).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Voice methods
// ---------------------------------------------------------------------------

describe('VOICE_METHODS', () => {
  it('is a non-empty readonly array', () => {
    expect(VOICE_METHODS).toBeDefined();
    expect(VOICE_METHODS.length).toBeGreaterThan(0);
  });

  it('includes direct conversation', () => {
    expect(VOICE_METHODS).toContain('direct_conversation');
  });

  it('includes keyworker session as a method', () => {
    expect(VOICE_METHODS).toContain('keyworker_session');
  });

  it('has a label for every method', () => {
    for (const method of VOICE_METHODS) {
      expect(VOICE_METHOD_LABELS[method]).toBeDefined();
      expect(typeof VOICE_METHOD_LABELS[method]).toBe('string');
    }
  });
});
