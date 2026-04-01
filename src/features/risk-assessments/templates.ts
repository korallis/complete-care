/**
 * Risk Assessment Templates
 *
 * Seven configurable assessment templates aligned to UK care standards.
 * Each template defines scored questions and risk-level thresholds.
 *
 * Templates:
 * 1. Falls Risk Assessment
 * 2. Waterlow Pressure Ulcer Assessment
 * 3. MUST (Malnutrition Universal Screening Tool)
 * 4. Moving & Handling Assessment
 * 5. Fire PEEP (Personal Emergency Evacuation Plan)
 * 6. Medication Risk Assessment
 * 7. Choking Risk Assessment
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskAssessmentTemplateId =
  | 'falls'
  | 'waterlow'
  | 'must'
  | 'moving_handling'
  | 'fire_peep'
  | 'medication'
  | 'choking';

export type QuestionOption = {
  label: string;
  value: number;
};

export type TemplateQuestion = {
  id: string;
  text: string;
  category: string;
  options: QuestionOption[];
};

export type RiskThresholds = {
  low: { min: number; max: number };
  medium: { min: number; max: number };
  high: { min: number; max: number };
  critical: { min: number; max: number };
};

export type RiskAssessmentTemplate = {
  id: RiskAssessmentTemplateId;
  name: string;
  description: string;
  questions: TemplateQuestion[];
  thresholds: RiskThresholds;
  /** Default review frequency for this assessment type */
  defaultReviewFrequency: 'weekly' | 'monthly' | 'quarterly';
};

// ---------------------------------------------------------------------------
// 1. Falls Risk Assessment
// ---------------------------------------------------------------------------

const FALLS_TEMPLATE: RiskAssessmentTemplate = {
  id: 'falls',
  name: 'Falls Risk Assessment',
  description:
    'Assesses fall risk factors including history, mobility, medication, and environment.',
  defaultReviewFrequency: 'monthly',
  questions: [
    {
      id: 'falls_history',
      text: 'History of falls in the last 12 months',
      category: 'History',
      options: [
        { label: 'No falls', value: 0 },
        { label: '1 fall', value: 1 },
        { label: '2-3 falls', value: 2 },
        { label: '4 or more falls', value: 3 },
      ],
    },
    {
      id: 'falls_mobility',
      text: 'Mobility level',
      category: 'Mobility',
      options: [
        { label: 'Fully independent', value: 0 },
        { label: 'Uses walking aid', value: 1 },
        { label: 'Requires assistance from one person', value: 2 },
        { label: 'Unable to mobilise / bed-bound', value: 3 },
      ],
    },
    {
      id: 'falls_medication',
      text: 'Medications affecting balance (sedatives, anti-hypertensives, etc.)',
      category: 'Medication',
      options: [
        { label: 'None', value: 0 },
        { label: '1 medication', value: 1 },
        { label: '2-3 medications', value: 2 },
        { label: '4 or more medications', value: 3 },
      ],
    },
    {
      id: 'falls_cognition',
      text: 'Cognitive impairment',
      category: 'Cognition',
      options: [
        { label: 'No impairment', value: 0 },
        { label: 'Mild impairment', value: 1 },
        { label: 'Moderate impairment', value: 2 },
        { label: 'Severe impairment', value: 3 },
      ],
    },
    {
      id: 'falls_vision',
      text: 'Visual impairment',
      category: 'Sensory',
      options: [
        { label: 'No impairment', value: 0 },
        { label: 'Wears corrective lenses', value: 1 },
        { label: 'Significant impairment', value: 2 },
        { label: 'Registered blind / severely impaired', value: 3 },
      ],
    },
    {
      id: 'falls_continence',
      text: 'Continence (urgency/frequency affecting mobility)',
      category: 'Continence',
      options: [
        { label: 'Continent', value: 0 },
        { label: 'Occasional urgency', value: 1 },
        { label: 'Frequent urgency / uses continence aids', value: 2 },
        { label: 'Incontinent requiring immediate assistance', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 3 },
    medium: { min: 4, max: 8 },
    high: { min: 9, max: 14 },
    critical: { min: 15, max: 18 },
  },
};

// ---------------------------------------------------------------------------
// 2. Waterlow Pressure Ulcer Assessment
// ---------------------------------------------------------------------------

const WATERLOW_TEMPLATE: RiskAssessmentTemplate = {
  id: 'waterlow',
  name: 'Waterlow Pressure Ulcer Assessment',
  description:
    'Assesses risk of developing pressure ulcers based on the Waterlow scoring system.',
  defaultReviewFrequency: 'weekly',
  questions: [
    {
      id: 'waterlow_bmi',
      text: 'Build / weight for height',
      category: 'Build',
      options: [
        { label: 'Average (BMI 20-24.9)', value: 0 },
        { label: 'Above average (BMI 25-29.9)', value: 1 },
        { label: 'Obese (BMI 30+)', value: 2 },
        { label: 'Below average (BMI <20)', value: 3 },
      ],
    },
    {
      id: 'waterlow_skin',
      text: 'Skin type / visual risk areas',
      category: 'Skin',
      options: [
        { label: 'Healthy', value: 0 },
        { label: 'Tissue paper / dry', value: 1 },
        { label: 'Oedematous', value: 2 },
        { label: 'Clammy / discoloured / broken', value: 3 },
      ],
    },
    {
      id: 'waterlow_age',
      text: 'Age',
      category: 'Age',
      options: [
        { label: 'Under 50', value: 0 },
        { label: '50-64', value: 1 },
        { label: '65-74', value: 2 },
        { label: '75-80', value: 3 },
        { label: '81+', value: 4 },
      ],
    },
    {
      id: 'waterlow_continence',
      text: 'Continence',
      category: 'Continence',
      options: [
        { label: 'Complete / catheterised', value: 0 },
        { label: 'Occasional incontinence', value: 1 },
        { label: 'Catheter / incontinent of faeces', value: 2 },
        { label: 'Doubly incontinent', value: 3 },
      ],
    },
    {
      id: 'waterlow_mobility',
      text: 'Mobility',
      category: 'Mobility',
      options: [
        { label: 'Fully mobile', value: 0 },
        { label: 'Restless / fidgety', value: 1 },
        { label: 'Apathetic', value: 2 },
        { label: 'Restricted / chair-bound', value: 3 },
        { label: 'Bed-bound / traction', value: 4 },
      ],
    },
    {
      id: 'waterlow_appetite',
      text: 'Appetite / nutrition',
      category: 'Nutrition',
      options: [
        { label: 'Average', value: 0 },
        { label: 'Poor', value: 1 },
        { label: 'NG tube / fluids only', value: 2 },
        { label: 'NBM / anorexic', value: 3 },
      ],
    },
    {
      id: 'waterlow_tissue',
      text: 'Tissue malnutrition',
      category: 'Special risks',
      options: [
        { label: 'None', value: 0 },
        { label: 'Smoking', value: 1 },
        { label: 'Anaemia', value: 2 },
        { label: 'Terminal cachexia / multiple organ failure', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 9 },
    medium: { min: 10, max: 14 },
    high: { min: 15, max: 19 },
    critical: { min: 20, max: 28 },
  },
};

// ---------------------------------------------------------------------------
// 3. MUST (Malnutrition Universal Screening Tool)
// ---------------------------------------------------------------------------

const MUST_TEMPLATE: RiskAssessmentTemplate = {
  id: 'must',
  name: 'MUST Nutritional Assessment',
  description:
    'Malnutrition Universal Screening Tool (MUST) for identifying adults at risk of malnutrition.',
  defaultReviewFrequency: 'monthly',
  questions: [
    {
      id: 'must_bmi',
      text: 'BMI score',
      category: 'BMI',
      options: [
        { label: 'BMI >20 (Obese = >30)', value: 0 },
        { label: 'BMI 18.5-20', value: 1 },
        { label: 'BMI <18.5', value: 2 },
      ],
    },
    {
      id: 'must_weight_loss',
      text: 'Unplanned weight loss in past 3-6 months',
      category: 'Weight Loss',
      options: [
        { label: '<5% weight loss', value: 0 },
        { label: '5-10% weight loss', value: 1 },
        { label: '>10% weight loss', value: 2 },
      ],
    },
    {
      id: 'must_acute_disease',
      text: 'Acute disease effect',
      category: 'Acute Disease',
      options: [
        { label: 'Not acutely ill and adequate nutritional intake', value: 0 },
        { label: 'Acutely ill with no nutritional intake for >5 days', value: 2 },
      ],
    },
    {
      id: 'must_fluid_intake',
      text: 'Fluid intake',
      category: 'Hydration',
      options: [
        { label: 'Adequate fluid intake (1.5L+ per day)', value: 0 },
        { label: 'Reduced fluid intake', value: 1 },
        { label: 'Minimal fluid intake / IV fluids only', value: 2 },
      ],
    },
    {
      id: 'must_eating_difficulty',
      text: 'Difficulty eating / swallowing',
      category: 'Functional',
      options: [
        { label: 'No difficulty', value: 0 },
        { label: 'Some difficulty — needs modified diet', value: 1 },
        { label: 'Significant difficulty — requires assistance', value: 2 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 0 },
    medium: { min: 1, max: 1 },
    high: { min: 2, max: 5 },
    critical: { min: 6, max: 10 },
  },
};

// ---------------------------------------------------------------------------
// 4. Moving & Handling Assessment
// ---------------------------------------------------------------------------

const MOVING_HANDLING_TEMPLATE: RiskAssessmentTemplate = {
  id: 'moving_handling',
  name: 'Moving & Handling Assessment',
  description:
    'Assesses manual handling risks for safe transfers, mobility support, and equipment needs.',
  defaultReviewFrequency: 'monthly',
  questions: [
    {
      id: 'mh_weight',
      text: 'Weight / size of person',
      category: 'Physical',
      options: [
        { label: 'Lightweight (<60kg)', value: 0 },
        { label: 'Average (60-90kg)', value: 1 },
        { label: 'Heavy (90-120kg)', value: 2 },
        { label: 'Very heavy (>120kg) — bariatric', value: 3 },
      ],
    },
    {
      id: 'mh_cooperation',
      text: 'Level of cooperation / understanding',
      category: 'Cooperation',
      options: [
        { label: 'Fully cooperative and predictable', value: 0 },
        { label: 'Generally cooperative, occasional confusion', value: 1 },
        { label: 'Unpredictable or resistive behaviour', value: 2 },
        { label: 'Uncooperative / aggressive', value: 3 },
      ],
    },
    {
      id: 'mh_mobility',
      text: 'Mobility / weight-bearing ability',
      category: 'Mobility',
      options: [
        { label: 'Fully weight-bearing', value: 0 },
        { label: 'Partial weight-bearing', value: 1 },
        { label: 'Minimal weight-bearing', value: 2 },
        { label: 'Non weight-bearing', value: 3 },
      ],
    },
    {
      id: 'mh_balance',
      text: 'Balance and stability',
      category: 'Stability',
      options: [
        { label: 'Good balance', value: 0 },
        { label: 'Slightly unsteady', value: 1 },
        { label: 'Unsteady — requires support', value: 2 },
        { label: 'Unable to maintain seated / standing balance', value: 3 },
      ],
    },
    {
      id: 'mh_pain',
      text: 'Pain during movement',
      category: 'Pain',
      options: [
        { label: 'No pain', value: 0 },
        { label: 'Mild pain — manageable', value: 1 },
        { label: 'Moderate pain — limits movement', value: 2 },
        { label: 'Severe pain — movement distressing', value: 3 },
      ],
    },
    {
      id: 'mh_skin',
      text: 'Skin integrity / attachments',
      category: 'Skin',
      options: [
        { label: 'Intact skin, no attachments', value: 0 },
        { label: 'Fragile skin', value: 1 },
        { label: 'Wound / pressure area present', value: 2 },
        { label: 'Multiple wounds / medical attachments', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 3 },
    medium: { min: 4, max: 8 },
    high: { min: 9, max: 14 },
    critical: { min: 15, max: 18 },
  },
};

// ---------------------------------------------------------------------------
// 5. Fire PEEP (Personal Emergency Evacuation Plan)
// ---------------------------------------------------------------------------

const FIRE_PEEP_TEMPLATE: RiskAssessmentTemplate = {
  id: 'fire_peep',
  name: 'Fire PEEP Assessment',
  description:
    'Personal Emergency Evacuation Plan — assesses evacuation capability in a fire emergency.',
  defaultReviewFrequency: 'quarterly',
  questions: [
    {
      id: 'peep_mobility',
      text: 'Ability to self-evacuate',
      category: 'Mobility',
      options: [
        { label: 'Can self-evacuate unaided', value: 0 },
        { label: 'Can self-evacuate with walking aid', value: 1 },
        { label: 'Requires physical assistance of 1 person', value: 2 },
        { label: 'Requires 2+ people or evacuation equipment', value: 3 },
      ],
    },
    {
      id: 'peep_cognition',
      text: 'Understanding of fire alarm and evacuation',
      category: 'Cognition',
      options: [
        { label: 'Fully understands and can respond independently', value: 0 },
        { label: 'Understands but needs prompting', value: 1 },
        { label: 'Limited understanding — needs guidance', value: 2 },
        { label: 'No understanding — fully reliant on staff', value: 3 },
      ],
    },
    {
      id: 'peep_location',
      text: 'Location within the building',
      category: 'Location',
      options: [
        { label: 'Ground floor near fire exit', value: 0 },
        { label: 'Ground floor — further from exit', value: 1 },
        { label: 'First floor with lift access', value: 2 },
        { label: 'Upper floor / no lift access', value: 3 },
      ],
    },
    {
      id: 'peep_sensory',
      text: 'Sensory awareness (hearing/vision)',
      category: 'Sensory',
      options: [
        { label: 'No sensory impairment', value: 0 },
        { label: 'Mild hearing or vision loss', value: 1 },
        { label: 'Significant hearing or vision loss', value: 2 },
        { label: 'Deaf-blind or severely impaired', value: 3 },
      ],
    },
    {
      id: 'peep_behaviour',
      text: 'Likely response under stress',
      category: 'Behaviour',
      options: [
        { label: 'Calm and compliant', value: 0 },
        { label: 'May become anxious but manageable', value: 1 },
        { label: 'Likely to panic or freeze', value: 2 },
        { label: 'May resist evacuation or become aggressive', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 3 },
    medium: { min: 4, max: 7 },
    high: { min: 8, max: 11 },
    critical: { min: 12, max: 15 },
  },
};

// ---------------------------------------------------------------------------
// 6. Medication Risk Assessment
// ---------------------------------------------------------------------------

const MEDICATION_TEMPLATE: RiskAssessmentTemplate = {
  id: 'medication',
  name: 'Medication Risk Assessment',
  description:
    'Assesses risks related to medication management, administration, and compliance.',
  defaultReviewFrequency: 'monthly',
  questions: [
    {
      id: 'med_polypharmacy',
      text: 'Number of prescribed medications',
      category: 'Polypharmacy',
      options: [
        { label: '1-3 medications', value: 0 },
        { label: '4-6 medications', value: 1 },
        { label: '7-9 medications', value: 2 },
        { label: '10+ medications', value: 3 },
      ],
    },
    {
      id: 'med_high_risk',
      text: 'High-risk medications (anticoagulants, insulin, opioids, etc.)',
      category: 'High-risk drugs',
      options: [
        { label: 'None', value: 0 },
        { label: '1 high-risk medication', value: 1 },
        { label: '2 high-risk medications', value: 2 },
        { label: '3+ high-risk medications', value: 3 },
      ],
    },
    {
      id: 'med_self_admin',
      text: 'Self-administration ability',
      category: 'Administration',
      options: [
        { label: 'Fully self-administers', value: 0 },
        { label: 'Self-administers with prompting', value: 1 },
        { label: 'Requires administration by staff', value: 2 },
        { label: 'Covert / PEG administration required', value: 3 },
      ],
    },
    {
      id: 'med_compliance',
      text: 'Compliance / refusal history',
      category: 'Compliance',
      options: [
        { label: 'Fully compliant', value: 0 },
        { label: 'Occasionally refuses / forgets', value: 1 },
        { label: 'Frequently refuses or spits out medication', value: 2 },
        { label: 'Regular non-compliance requiring clinical review', value: 3 },
      ],
    },
    {
      id: 'med_swallowing',
      text: 'Swallowing ability',
      category: 'Swallowing',
      options: [
        { label: 'No difficulty', value: 0 },
        { label: 'Occasional difficulty — needs fluids', value: 1 },
        { label: 'Requires modified forms (liquid / crushed)', value: 2 },
        { label: 'Severe dysphagia — PEG / alternative route', value: 3 },
      ],
    },
    {
      id: 'med_adverse',
      text: 'History of adverse drug reactions',
      category: 'Adverse reactions',
      options: [
        { label: 'No known adverse reactions', value: 0 },
        { label: 'Minor reaction — documented allergy', value: 1 },
        { label: 'Significant reaction requiring hospitalisation', value: 2 },
        { label: 'Anaphylaxis history', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 3 },
    medium: { min: 4, max: 8 },
    high: { min: 9, max: 14 },
    critical: { min: 15, max: 18 },
  },
};

// ---------------------------------------------------------------------------
// 7. Choking Risk Assessment
// ---------------------------------------------------------------------------

const CHOKING_TEMPLATE: RiskAssessmentTemplate = {
  id: 'choking',
  name: 'Choking Risk Assessment',
  description:
    'Assesses choking risk factors including swallowing ability, eating behaviour, and medical conditions.',
  defaultReviewFrequency: 'monthly',
  questions: [
    {
      id: 'choke_swallowing',
      text: 'Swallowing ability',
      category: 'Swallowing',
      options: [
        { label: 'Normal swallow', value: 0 },
        { label: 'Occasional coughing when eating/drinking', value: 1 },
        { label: 'Known dysphagia — modified diet', value: 2 },
        { label: 'Severe dysphagia — thickened fluids / pureed diet', value: 3 },
      ],
    },
    {
      id: 'choke_eating_speed',
      text: 'Eating behaviour',
      category: 'Eating behaviour',
      options: [
        { label: 'Eats at normal pace, chews well', value: 0 },
        { label: 'Eats quickly, occasional food bolting', value: 1 },
        { label: 'Bolts food regularly', value: 2 },
        { label: 'Pica behaviour or eats non-food items', value: 3 },
      ],
    },
    {
      id: 'choke_cognition',
      text: 'Cognitive awareness during meals',
      category: 'Cognition',
      options: [
        { label: 'Fully aware, understands safety advice', value: 0 },
        { label: 'May need reminding to eat slowly', value: 1 },
        { label: 'Limited awareness — requires supervision', value: 2 },
        { label: 'No awareness — constant supervision required', value: 3 },
      ],
    },
    {
      id: 'choke_medical',
      text: 'Medical conditions affecting swallowing',
      category: 'Medical',
      options: [
        { label: 'No relevant conditions', value: 0 },
        { label: 'GORD / mild neurological condition', value: 1 },
        { label: 'Stroke / Parkinsons / MND / MS', value: 2 },
        { label: 'Advanced neurological disease affecting swallow', value: 3 },
      ],
    },
    {
      id: 'choke_dental',
      text: 'Dental / oral status',
      category: 'Dental',
      options: [
        { label: 'Good dentition or well-fitting dentures', value: 0 },
        { label: 'Some missing teeth / ill-fitting dentures', value: 1 },
        { label: 'Significant dental problems', value: 2 },
        { label: 'Edentulous without dentures / severe oral problems', value: 3 },
      ],
    },
    {
      id: 'choke_choking_history',
      text: 'History of choking episodes',
      category: 'History',
      options: [
        { label: 'No history of choking', value: 0 },
        { label: '1 episode (mild)', value: 1 },
        { label: '2+ episodes or 1 significant episode', value: 2 },
        { label: 'Frequent choking episodes requiring intervention', value: 3 },
      ],
    },
  ],
  thresholds: {
    low: { min: 0, max: 3 },
    medium: { min: 4, max: 8 },
    high: { min: 9, max: 14 },
    critical: { min: 15, max: 18 },
  },
};

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

export const RISK_ASSESSMENT_TEMPLATES: Record<
  RiskAssessmentTemplateId,
  RiskAssessmentTemplate
> = {
  falls: FALLS_TEMPLATE,
  waterlow: WATERLOW_TEMPLATE,
  must: MUST_TEMPLATE,
  moving_handling: MOVING_HANDLING_TEMPLATE,
  fire_peep: FIRE_PEEP_TEMPLATE,
  medication: MEDICATION_TEMPLATE,
  choking: CHOKING_TEMPLATE,
};

export const TEMPLATE_LIST = Object.values(RISK_ASSESSMENT_TEMPLATES);

/**
 * Returns a template by its ID, or undefined if not found.
 */
export function getTemplate(
  id: string,
): RiskAssessmentTemplate | undefined {
  return RISK_ASSESSMENT_TEMPLATES[id as RiskAssessmentTemplateId];
}

/**
 * Human-readable labels for each template ID.
 */
export const TEMPLATE_LABELS: Record<RiskAssessmentTemplateId, string> = {
  falls: 'Falls',
  waterlow: 'Waterlow (Pressure Ulcer)',
  must: 'MUST (Nutrition)',
  moving_handling: 'Moving & Handling',
  fire_peep: 'Fire PEEP',
  medication: 'Medication',
  choking: 'Choking',
};
