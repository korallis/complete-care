/**
 * Care Plan Templates
 *
 * Predefined section sets for creating care plans.
 * Based on UK care standards covering the key domains of care.
 *
 * Each section type maps to a specific area of care as per CQC / Ofsted
 * quality standards for personalised care planning.
 */

import type { CarePlanSection, CarePlanSectionType } from '@/lib/db/schema/care-plans';

// ---------------------------------------------------------------------------
// Section defaults
// ---------------------------------------------------------------------------

/**
 * Default title and guidance text for each section type.
 */
export const SECTION_DEFAULTS: Record<
  CarePlanSectionType,
  { title: string; guidance: string }
> = {
  personal_details: {
    title: 'Personal Details & Preferences',
    guidance:
      'Record important personal information including preferred name, background, interests, likes and dislikes, cultural and spiritual needs, and anything that is important to the person.',
  },
  health: {
    title: 'Health & Medical Information',
    guidance:
      'Document current health conditions, medical history, GP and healthcare professionals involved, monitoring requirements, and health-related care needs.',
  },
  mobility: {
    title: 'Mobility & Moving',
    guidance:
      'Describe mobility level, equipment used (walking aids, wheelchair, hoist), transfers, manual handling requirements, and fall prevention strategies.',
  },
  nutrition: {
    title: 'Nutrition & Hydration',
    guidance:
      'Record dietary requirements, food and drink preferences, allergies and intolerances, MUST score, fluid intake targets, and support needed at mealtimes.',
  },
  continence: {
    title: 'Continence & Toileting',
    guidance:
      'Document continence needs, any continence aids or equipment used, support required, frequency monitoring, and skin integrity considerations.',
  },
  personal_care: {
    title: 'Personal Care & Daily Living',
    guidance:
      'Describe support needed for washing, bathing, showering, dressing, oral hygiene, hair care, nail care, and maintaining personal appearance and dignity.',
  },
  communication: {
    title: 'Communication',
    guidance:
      'Record how the person communicates (verbal, non-verbal, AAC devices), preferred language, literacy, cognitive understanding, and how best to engage and support decision-making.',
  },
  social: {
    title: 'Social Activities & Relationships',
    guidance:
      'Document social interests, hobbies, activities the person enjoys, important relationships, community involvement, and goals for social engagement.',
  },
  end_of_life: {
    title: 'End of Life Wishes',
    guidance:
      'Record advance care planning wishes, DNACPR decisions (if applicable), place of care preferences, religious or cultural requirements, and any other end of life documentation.',
  },
  custom: {
    title: 'Additional Information',
    guidance: 'Use this section to record any additional care needs or information.',
  },
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export type CarePlanTemplateId =
  | 'comprehensive'
  | 'personal_care'
  | 'health_mobility'
  | 'social_wellbeing'
  | 'blank';

export type CarePlanTemplate = {
  id: CarePlanTemplateId;
  name: string;
  description: string;
  sectionTypes: CarePlanSectionType[];
  icon: string;
};

export const CARE_PLAN_TEMPLATES: Record<CarePlanTemplateId, CarePlanTemplate> = {
  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive Care Plan',
    description: 'Full care plan covering all care domains. Suitable for new admissions.',
    sectionTypes: [
      'personal_details',
      'health',
      'mobility',
      'nutrition',
      'continence',
      'personal_care',
      'communication',
      'social',
      'end_of_life',
    ],
    icon: '📋',
  },
  personal_care: {
    id: 'personal_care',
    name: 'Personal Care Focus',
    description: 'Focused on daily personal care, continence, and communication needs.',
    sectionTypes: ['personal_details', 'personal_care', 'continence', 'communication'],
    icon: '🧼',
  },
  health_mobility: {
    id: 'health_mobility',
    name: 'Health & Mobility',
    description: 'Covers health management, mobility support, and nutritional needs.',
    sectionTypes: ['personal_details', 'health', 'mobility', 'nutrition'],
    icon: '🏥',
  },
  social_wellbeing: {
    id: 'social_wellbeing',
    name: 'Social & Wellbeing',
    description: 'Focuses on social engagement, activities, communication, and advance wishes.',
    sectionTypes: ['personal_details', 'social', 'communication', 'end_of_life'],
    icon: '🌟',
  },
  blank: {
    id: 'blank',
    name: 'Blank Plan',
    description: 'Start from scratch and add only the sections you need.',
    sectionTypes: [],
    icon: '📝',
  },
};

export const TEMPLATE_LIST = Object.values(CARE_PLAN_TEMPLATES);

// ---------------------------------------------------------------------------
// Section factory
// ---------------------------------------------------------------------------

/**
 * Creates a new CarePlanSection from a section type.
 * Generates a stable random ID and uses the default title.
 */
export function createSection(
  type: CarePlanSectionType,
  order: number,
): CarePlanSection {
  const defaults = SECTION_DEFAULTS[type];
  return {
    id: crypto.randomUUID(),
    type,
    title: defaults.title,
    content: '',
    order,
  };
}

/**
 * Creates an array of sections from a template.
 */
export function createSectionsFromTemplate(
  templateId: CarePlanTemplateId,
): CarePlanSection[] {
  const template = CARE_PLAN_TEMPLATES[templateId];
  if (!template || template.sectionTypes.length === 0) return [];
  return template.sectionTypes.map((type, idx) => createSection(type, idx));
}
