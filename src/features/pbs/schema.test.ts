import { describe, it, expect } from 'vitest';
import {
  createPbsPlanSchema,
  updatePbsPlanSchema,
  createAbcIncidentSchema,
  createRestrictivePracticeSchema,
  editRestrictivePracticeSchema,
  ANTECEDENT_CATEGORIES,
  RESTRICTIVE_PRACTICE_TYPES,
  PBS_PLAN_STATUSES,
  ANTECEDENT_CATEGORY_LABELS,
  RESTRICTIVE_PRACTICE_TYPE_LABELS,
  INTENSITY_LABELS,
  PERIOD_OPTIONS,
} from './schema';

// ---------------------------------------------------------------------------
// PBS Plan Schema
// ---------------------------------------------------------------------------

describe('createPbsPlanSchema', () => {
  const validPlan = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    functionalAssessmentSummary: 'Assessment summary with enough detail here',
    identifiedBehaviours: 'Self-injurious behaviour during transitions',
    hypothesisedFunction: 'Escape from demand / sensory overload situations',
    primaryStrategies: 'Visual schedules, transition warnings, sensory breaks',
    secondaryStrategies: 'Offer choices, redirect, reduce demands temporarily',
    reactiveStrategies: 'Safe space protocol, low arousal approach, minimal language',
    postIncidentSupport: 'Debrief with person, staff debrief within 24h, review triggers',
  };

  it('accepts a valid PBS plan', () => {
    const result = createPbsPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('accepts optional reductionPlan field', () => {
    const result = createPbsPlanSchema.safeParse({
      ...validPlan,
      reductionPlan: 'Reduce physical interventions by 50% in Q2',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional mdiContributions array', () => {
    const result = createPbsPlanSchema.safeParse({
      ...validPlan,
      mdiContributions: [
        { name: 'Dr Smith', role: 'Psychologist', date: '2026-01-15', notes: 'Reviewed FBA data' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when personId is not a valid UUID', () => {
    const result = createPbsPlanSchema.safeParse({
      ...validPlan,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when required text fields are too short', () => {
    const result = createPbsPlanSchema.safeParse({
      ...validPlan,
      functionalAssessmentSummary: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when required fields are missing', () => {
    const result = createPbsPlanSchema.safeParse({
      personId: validPlan.personId,
    });
    expect(result.success).toBe(false);
  });
});

describe('updatePbsPlanSchema', () => {
  it('requires planId in addition to create fields', () => {
    const result = updatePbsPlanSchema.safeParse({
      planId: '550e8400-e29b-41d4-a716-446655440001',
      personId: '550e8400-e29b-41d4-a716-446655440000',
      functionalAssessmentSummary: 'Updated assessment summary with detail',
      identifiedBehaviours: 'Updated identified behaviours text here',
      hypothesisedFunction: 'Updated hypothesised function of behaviour',
      primaryStrategies: 'Updated primary strategies for the person',
      secondaryStrategies: 'Updated secondary strategies for the person',
      reactiveStrategies: 'Updated reactive strategies for the person',
      postIncidentSupport: 'Updated post-incident support protocol',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when planId is missing', () => {
    const result = updatePbsPlanSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      functionalAssessmentSummary: 'Assessment summary with enough detail here',
      identifiedBehaviours: 'Self-injurious behaviour during transitions',
      hypothesisedFunction: 'Escape from demand / sensory overload situations',
      primaryStrategies: 'Visual schedules, transition warnings, sensory breaks',
      secondaryStrategies: 'Offer choices, redirect, reduce demands temporarily',
      reactiveStrategies: 'Safe space protocol, low arousal approach, minimal language',
      postIncidentSupport: 'Debrief with person, staff debrief within 24h',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ABC Incident Schema
// ---------------------------------------------------------------------------

describe('createAbcIncidentSchema', () => {
  const validIncident = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    occurredAt: '2026-03-15T14:30:00',
    antecedentCategory: 'demand' as const,
    antecedentDescription: 'Asked to tidy bedroom before lunch',
    behaviourTopography: 'Threw items from desk, shouted loudly',
    behaviourIntensity: 3,
    consequenceStaffResponse: 'Staff used low arousal approach, removed demands',
  };

  it('accepts a valid ABC incident', () => {
    const result = createAbcIncidentSchema.safeParse(validIncident);
    expect(result.success).toBe(true);
  });

  it('accepts optional setting condition fields', () => {
    const result = createAbcIncidentSchema.safeParse({
      ...validIncident,
      settingEnvironment: 'Bedroom',
      settingPeoplePresent: '1 staff member',
      settingActivity: 'Tidying up',
      settingSensoryFactors: 'Music playing from next room',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional behaviourDuration', () => {
    const result = createAbcIncidentSchema.safeParse({
      ...validIncident,
      behaviourDuration: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.behaviourDuration).toBe(15);
    }
  });

  it('accepts optional pbsPlanId', () => {
    const result = createAbcIncidentSchema.safeParse({
      ...validIncident,
      pbsPlanId: '550e8400-e29b-41d4-a716-446655440002',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid antecedent category', () => {
    const result = createAbcIncidentSchema.safeParse({
      ...validIncident,
      antecedentCategory: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('rejects intensity outside 1-5 range', () => {
    const tooLow = createAbcIncidentSchema.safeParse({
      ...validIncident,
      behaviourIntensity: 0,
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = createAbcIncidentSchema.safeParse({
      ...validIncident,
      behaviourIntensity: 6,
    });
    expect(tooHigh.success).toBe(false);
  });

  it('coerces string intensity to number', () => {
    const result = createAbcIncidentSchema.safeParse({
      ...validIncident,
      behaviourIntensity: '4',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.behaviourIntensity).toBe(4);
    }
  });

  it('validates all antecedent categories are accepted', () => {
    for (const cat of ANTECEDENT_CATEGORIES) {
      const result = createAbcIncidentSchema.safeParse({
        ...validIncident,
        antecedentCategory: cat,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Restrictive Practice Schema
// ---------------------------------------------------------------------------

describe('createRestrictivePracticeSchema', () => {
  const validPractice = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'physical' as const,
    justification: 'Person was at immediate risk of self-harm requiring intervention',
    authorisedBy: 'Sarah Jones (Manager)',
    durationMinutes: 5,
    personResponse: 'Initially resistive then calmed within 2 minutes',
    occurredAt: '2026-03-15T14:45:00',
  };

  it('accepts a valid restrictive practice entry', () => {
    const result = createRestrictivePracticeSchema.safeParse(validPractice);
    expect(result.success).toBe(true);
  });

  it('accepts all restrictive practice types', () => {
    for (const type of RESTRICTIVE_PRACTICE_TYPES) {
      const result = createRestrictivePracticeSchema.safeParse({
        ...validPractice,
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional mcaLink', () => {
    const result = createRestrictivePracticeSchema.safeParse({
      ...validPractice,
      mcaLink: 'MCA-2026-0042',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = createRestrictivePracticeSchema.safeParse({
      ...validPractice,
      type: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration less than 1 minute', () => {
    const result = createRestrictivePracticeSchema.safeParse({
      ...validPractice,
      durationMinutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects short justification', () => {
    const result = createRestrictivePracticeSchema.safeParse({
      ...validPractice,
      justification: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('editRestrictivePracticeSchema', () => {
  it('requires originalId in addition to create fields', () => {
    const result = editRestrictivePracticeSchema.safeParse({
      originalId: '550e8400-e29b-41d4-a716-446655440003',
      personId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'physical',
      justification: 'Updated justification with sufficient detail here',
      authorisedBy: 'Sarah Jones (Manager)',
      durationMinutes: 5,
      personResponse: 'Calmed within 2 minutes after intervention',
      occurredAt: '2026-03-15T14:45:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when originalId is missing', () => {
    const result = editRestrictivePracticeSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'physical',
      justification: 'Justification text that is long enough here',
      authorisedBy: 'Sarah Jones',
      durationMinutes: 5,
      personResponse: 'Calmed within 2 minutes',
      occurredAt: '2026-03-15T14:45:00',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants / Enums
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('has all PBS plan statuses', () => {
    expect(PBS_PLAN_STATUSES).toEqual([
      'draft',
      'active',
      'superseded',
      'archived',
    ]);
  });

  it('has all antecedent categories with labels', () => {
    for (const cat of ANTECEDENT_CATEGORIES) {
      expect(ANTECEDENT_CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof ANTECEDENT_CATEGORY_LABELS[cat]).toBe('string');
    }
  });

  it('has all restrictive practice types with labels', () => {
    for (const t of RESTRICTIVE_PRACTICE_TYPES) {
      expect(RESTRICTIVE_PRACTICE_TYPE_LABELS[t]).toBeDefined();
    }
  });

  it('has intensity labels for levels 1-5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(INTENSITY_LABELS[i]).toBeDefined();
    }
  });

  it('has period options', () => {
    expect(PERIOD_OPTIONS).toEqual(['weekly', 'monthly', 'quarterly']);
  });
});
