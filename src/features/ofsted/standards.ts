/**
 * Ofsted 9 Quality Standards — Children's Homes (England) Regulations 2015
 *
 * Regulations 6-14 define the quality standards that children's homes must meet.
 * Each standard has sub-requirements that can be evidenced against system records.
 *
 * This module is a pure data/template file — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubRequirement = {
  id: string;
  text: string;
  /** Suggested evidence types for this sub-requirement */
  suggestedEvidenceTypes: EvidenceType[];
};

export type EvidenceType =
  | 'care_plan'
  | 'note'
  | 'incident'
  | 'training'
  | 'document'
  | 'manual';

export type QualityStandardTemplate = {
  regulationNumber: number;
  standardName: string;
  description: string;
  subRequirements: SubRequirement[];
};

// ---------------------------------------------------------------------------
// The 9 Quality Standards (Regulations 6-14)
// ---------------------------------------------------------------------------

/**
 * Regulation 6 — The quality and purpose of care standard
 */
const REGULATION_6: QualityStandardTemplate = {
  regulationNumber: 6,
  standardName: 'The quality and purpose of care standard',
  description:
    'The quality and purpose of care standard is that children receive care from staff who understand the home\'s overall aims, the outcomes the home seeks to achieve, and the home\'s approach to achieving them.',
  subRequirements: [
    {
      id: 'reg6_1',
      text: 'Children\'s needs are understood and met by the home',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg6_2',
      text: 'Staff understand and apply the home\'s statement of purpose',
      suggestedEvidenceTypes: ['document', 'training'],
    },
    {
      id: 'reg6_3',
      text: 'The ethos of the home is child-centred',
      suggestedEvidenceTypes: ['care_plan', 'note', 'document'],
    },
    {
      id: 'reg6_4',
      text: 'Positive relationships are promoted between children and staff',
      suggestedEvidenceTypes: ['note', 'care_plan'],
    },
    {
      id: 'reg6_5',
      text: 'Children are helped to develop socially and emotionally',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
  ],
};

/**
 * Regulation 7 — The children's views, wishes and feelings standard
 */
const REGULATION_7: QualityStandardTemplate = {
  regulationNumber: 7,
  standardName: 'The children\'s views, wishes and feelings standard',
  description:
    'The children\'s views, wishes and feelings standard is that children receive care from staff who take their views, wishes and feelings into account in relation to matters affecting the child\'s care and welfare.',
  subRequirements: [
    {
      id: 'reg7_1',
      text: 'Children are enabled and supported to make their views known',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg7_2',
      text: 'Staff take children\'s views, wishes and feelings into account in decision-making',
      suggestedEvidenceTypes: ['care_plan', 'note', 'manual'],
    },
    {
      id: 'reg7_3',
      text: 'Children are helped to understand how an advocate could help',
      suggestedEvidenceTypes: ['document', 'note'],
    },
    {
      id: 'reg7_4',
      text: 'Complaints and representations process is accessible to children',
      suggestedEvidenceTypes: ['document', 'manual'],
    },
  ],
};

/**
 * Regulation 8 — The education standard
 */
const REGULATION_8: QualityStandardTemplate = {
  regulationNumber: 8,
  standardName: 'The education standard',
  description:
    'The education standard is that children make measurable progress towards their educational targets and are helped to achieve their potential.',
  subRequirements: [
    {
      id: 'reg8_1',
      text: 'Children have access to appropriate education on a full-time basis',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg8_2',
      text: 'Personal education plans (PEPs) are in place and regularly reviewed',
      suggestedEvidenceTypes: ['document', 'care_plan'],
    },
    {
      id: 'reg8_3',
      text: 'Achievement and attendance are monitored and support is provided',
      suggestedEvidenceTypes: ['note', 'document'],
    },
    {
      id: 'reg8_4',
      text: 'Barriers to achievement are identified and addressed',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
  ],
};

/**
 * Regulation 9 — The enjoyment and achievement standard
 */
const REGULATION_9: QualityStandardTemplate = {
  regulationNumber: 9,
  standardName: 'The enjoyment and achievement standard',
  description:
    'The enjoyment and achievement standard is that children take part in and benefit from activities, hobbies and leisure pursuits appropriate to their age and abilities.',
  subRequirements: [
    {
      id: 'reg9_1',
      text: 'Children have access to a range of activities, hobbies and leisure pursuits',
      suggestedEvidenceTypes: ['note', 'care_plan'],
    },
    {
      id: 'reg9_2',
      text: 'Activities promote health, emotional and social development',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg9_3',
      text: 'Children are supported to sustain hobbies and interests',
      suggestedEvidenceTypes: ['note', 'manual'],
    },
  ],
};

/**
 * Regulation 10 — The health and well-being standard
 */
const REGULATION_10: QualityStandardTemplate = {
  regulationNumber: 10,
  standardName: 'The health and well-being standard',
  description:
    'The health and well-being standard is that the health and well-being needs of children are met.',
  subRequirements: [
    {
      id: 'reg10_1',
      text: 'Children have access to appropriate health services',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg10_2',
      text: 'Health plans are in place and regularly reviewed',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg10_3',
      text: 'Children\'s emotional and mental health is supported',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg10_4',
      text: 'Medication is managed safely and in accordance with guidance',
      suggestedEvidenceTypes: ['document', 'training'],
    },
    {
      id: 'reg10_5',
      text: 'Children are provided with nutritious and balanced meals',
      suggestedEvidenceTypes: ['note', 'manual'],
    },
  ],
};

/**
 * Regulation 11 — The positive relationships standard
 */
const REGULATION_11: QualityStandardTemplate = {
  regulationNumber: 11,
  standardName: 'The positive relationships standard',
  description:
    'The positive relationships standard is that children are helped to develop and maintain positive relationships.',
  subRequirements: [
    {
      id: 'reg11_1',
      text: 'Staff promote positive contact with family and friends where appropriate',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg11_2',
      text: 'Staff help children build healthy peer relationships',
      suggestedEvidenceTypes: ['note', 'care_plan'],
    },
    {
      id: 'reg11_3',
      text: 'Contact arrangements are managed in the best interests of the child',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
  ],
};

/**
 * Regulation 12 — The protection of children standard
 */
const REGULATION_12: QualityStandardTemplate = {
  regulationNumber: 12,
  standardName: 'The protection of children standard',
  description:
    'The protection of children standard is that children are protected from harm and enabled to keep themselves safe.',
  subRequirements: [
    {
      id: 'reg12_1',
      text: 'Risk assessments are in place and regularly reviewed',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg12_2',
      text: 'Safeguarding policies and procedures are understood and followed',
      suggestedEvidenceTypes: ['document', 'training'],
    },
    {
      id: 'reg12_3',
      text: 'Children are helped to understand how to keep themselves safe',
      suggestedEvidenceTypes: ['note', 'care_plan'],
    },
    {
      id: 'reg12_4',
      text: 'Missing child procedures are in place and followed',
      suggestedEvidenceTypes: ['document', 'incident'],
    },
    {
      id: 'reg12_5',
      text: 'Incidents, accidents and restraints are recorded and reviewed',
      suggestedEvidenceTypes: ['incident', 'document'],
    },
    {
      id: 'reg12_6',
      text: 'Bullying is prevented and addressed effectively',
      suggestedEvidenceTypes: ['note', 'incident'],
    },
  ],
};

/**
 * Regulation 13 — The leadership and management standard
 */
const REGULATION_13: QualityStandardTemplate = {
  regulationNumber: 13,
  standardName: 'The leadership and management standard',
  description:
    'The leadership and management standard is that the registered person enables, inspires and leads a culture of ambition for children.',
  subRequirements: [
    {
      id: 'reg13_1',
      text: 'The registered person has the skills, knowledge and experience to lead effectively',
      suggestedEvidenceTypes: ['document', 'training'],
    },
    {
      id: 'reg13_2',
      text: 'Staff receive appropriate supervision and appraisal',
      suggestedEvidenceTypes: ['training', 'document'],
    },
    {
      id: 'reg13_3',
      text: 'The home has sufficient staff with appropriate skills and experience',
      suggestedEvidenceTypes: ['document', 'training'],
    },
    {
      id: 'reg13_4',
      text: 'Development plans and monitoring systems are in place',
      suggestedEvidenceTypes: ['document', 'manual'],
    },
    {
      id: 'reg13_5',
      text: 'Independent person monitors the home at least monthly (Regulation 44 visits)',
      suggestedEvidenceTypes: ['document', 'manual'],
    },
  ],
};

/**
 * Regulation 14 — The care planning standard
 */
const REGULATION_14: QualityStandardTemplate = {
  regulationNumber: 14,
  standardName: 'The care planning standard',
  description:
    'The care planning standard is that children receive the care set out in their relevant plans, are aware of the contents of their plans, and are involved in developing them.',
  subRequirements: [
    {
      id: 'reg14_1',
      text: 'Each child has an up-to-date placement plan',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg14_2',
      text: 'Placement plans reflect the child\'s care plan from the placing authority',
      suggestedEvidenceTypes: ['care_plan', 'document'],
    },
    {
      id: 'reg14_3',
      text: 'Children are involved in the development of their placement plans',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
    {
      id: 'reg14_4',
      text: 'Plans are reviewed and updated as the child\'s needs change',
      suggestedEvidenceTypes: ['care_plan', 'note'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

export const QUALITY_STANDARDS: QualityStandardTemplate[] = [
  REGULATION_6,
  REGULATION_7,
  REGULATION_8,
  REGULATION_9,
  REGULATION_10,
  REGULATION_11,
  REGULATION_12,
  REGULATION_13,
  REGULATION_14,
];

/**
 * Get the total number of sub-requirements across all standards.
 */
export function getTotalSubRequirements(): number {
  return QUALITY_STANDARDS.reduce(
    (sum, s) => sum + s.subRequirements.length,
    0,
  );
}

/**
 * Get a standard template by regulation number.
 */
export function getStandardByRegulation(
  regulationNumber: number,
): QualityStandardTemplate | undefined {
  return QUALITY_STANDARDS.find(
    (s) => s.regulationNumber === regulationNumber,
  );
}

/**
 * Human-readable labels for evidence types.
 */
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  care_plan: 'Care Plan',
  note: 'Care Note',
  incident: 'Incident Report',
  training: 'Training Record',
  document: 'Document',
  manual: 'Manual Entry',
};
