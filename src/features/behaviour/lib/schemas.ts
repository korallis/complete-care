import { z } from 'zod';
import {
  DEVELOPMENT_DOMAINS,
  ASSESSMENT_TOOLS,
  POSITIVE_BEHAVIOUR_CATEGORIES,
  BEHAVIOUR_TYPES,
  SEVERITY_LEVELS,
  SOP_STATUSES,
  MAX_DOMAIN_SCORE,
} from './constants';

/** Schema for domain scores (object keyed by domain, value 1-10) */
const domainScoresSchema = z.record(
  z.enum(DEVELOPMENT_DOMAINS),
  z.number().int().min(1).max(MAX_DOMAIN_SCORE),
);

/** Create / edit a baseline assessment */
export const baselineAssessmentSchema = z.object({
  personId: z.string().uuid(),
  assessmentTool: z.enum(ASSESSMENT_TOOLS),
  assessmentDate: z.string().date(),
  domainScores: domainScoresSchema,
  notes: z.string().optional(),
});

export type BaselineAssessmentInput = z.infer<typeof baselineAssessmentSchema>;

/** Record progress against an assessment domain */
export const progressRecordSchema = z.object({
  personId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  domain: z.enum(DEVELOPMENT_DOMAINS),
  score: z.number().int().min(1).max(MAX_DOMAIN_SCORE),
  narrative: z.string().optional(),
});

export type ProgressRecordInput = z.infer<typeof progressRecordSchema>;

/** Record a positive behaviour */
export const positiveBehaviourSchema = z.object({
  personId: z.string().uuid(),
  description: z.string().min(1),
  category: z.enum(POSITIVE_BEHAVIOUR_CATEGORIES),
  points: z.number().int().min(0).default(0),
  occurredAt: z.string().datetime(),
});

export type PositiveBehaviourInput = z.infer<typeof positiveBehaviourSchema>;

/** Record a behaviour incident (ABC model) */
export const behaviourIncidentSchema = z.object({
  personId: z.string().uuid(),
  antecedent: z.string().min(1),
  behaviour: z.string().min(1),
  consequence: z.string().min(1),
  severity: z.enum(SEVERITY_LEVELS),
  behaviourType: z.enum(BEHAVIOUR_TYPES),
  location: z.string().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  deescalationUsed: z.string().optional(),
  physicalIntervention: z.boolean().default(false),
  staffInvolved: z.array(z.string()).optional(),
  occurredAt: z.string().datetime(),
});

export type BehaviourIncidentInput = z.infer<typeof behaviourIncidentSchema>;

/** Create / edit a Statement of Purpose */
export const statementOfPurposeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(SOP_STATUSES).default('draft'),
  nextReviewDate: z.string().date().optional(),
});

export type StatementOfPurposeInput = z.infer<
  typeof statementOfPurposeSchema
>;
