'use server';

import { generateText } from 'ai';
import { z } from 'zod';
import {
  getBedrockProvider,
  isAIAvailable,
  RISK_ANALYSIS_MODEL,
  riskPredictionPrompt,
  complianceGapPrompt,
  inspectionReadinessPrompt,
} from '@/lib/ai';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const riskPredictionSchema = z.object({
  notes: z.array(z.string()).min(1, 'At least one care note is required'),
  incidents: z.array(z.string()).default([]),
});

const complianceGapSchema = z.object({
  documentation: z
    .array(
      z.object({
        type: z.string(),
        status: z.string(),
        lastReviewed: z.string().optional(),
      }),
    )
    .min(1, 'At least one document is required'),
  framework: z.enum(['CQC', 'Ofsted']).default('CQC'),
});

const inspectionReadinessSchema = z.object({
  totalDocuments: z.number().min(0),
  completeDocuments: z.number().min(0),
  overdueReviews: z.number().min(0),
  outstandingActions: z.number().min(0),
  recentIncidents: z.number().min(0),
  staffTrainingCompliance: z.number().min(0).max(100),
});

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type AIResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface RiskItem {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface RiskPredictionResult {
  risks: RiskItem[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

export interface ComplianceGap {
  area: string;
  requirement: string;
  currentStatus: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  recommendation: string;
}

export interface ComplianceGapResult {
  gaps: ComplianceGap[];
  complianceScore: number;
  summary: string;
}

export interface InspectionCategory {
  name: string;
  score: number;
  findings: string;
  actions: string[];
}

export interface InspectionReadinessResult {
  overallScore: number;
  rating: 'inadequate' | 'requires_improvement' | 'good' | 'outstanding';
  categories: InspectionCategory[];
  summary: string;
  priorityActions: string[];
}

// ---------------------------------------------------------------------------
// Helper: parse JSON from AI response (handles markdown code fences)
// ---------------------------------------------------------------------------

function parseAIJson<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Analyse care notes and incidents to predict emerging risks.
 */
export async function analyseRisks(
  input: z.infer<typeof riskPredictionSchema>,
): Promise<AIResult<RiskPredictionResult>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = riskPredictionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const { text } = await generateText({
      model: bedrock(RISK_ANALYSIS_MODEL),
      prompt: riskPredictionPrompt(parsed.data.notes, parsed.data.incidents),
      maxOutputTokens: 2048,
      temperature: 0.2,
    });

    const result = parseAIJson<RiskPredictionResult>(text);
    return { success: true, data: result };
  } catch (err) {
    console.error('[AI] analyseRisks error:', err);
    return {
      success: false,
      error: 'Failed to analyse risks. Please try again.',
    };
  }
}

/**
 * Detect compliance gaps by comparing documentation against regulatory requirements.
 */
export async function detectComplianceGaps(
  input: z.infer<typeof complianceGapSchema>,
): Promise<AIResult<ComplianceGapResult>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = complianceGapSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const { text } = await generateText({
      model: bedrock(RISK_ANALYSIS_MODEL),
      prompt: complianceGapPrompt(
        parsed.data.documentation,
        parsed.data.framework,
      ),
      maxOutputTokens: 2048,
      temperature: 0.2,
    });

    const result = parseAIJson<ComplianceGapResult>(text);
    return { success: true, data: result };
  } catch (err) {
    console.error('[AI] detectComplianceGaps error:', err);
    return {
      success: false,
      error: 'Failed to detect compliance gaps. Please try again.',
    };
  }
}

/**
 * Score inspection readiness based on documentation completeness metrics.
 */
export async function scoreInspectionReadiness(
  input: z.infer<typeof inspectionReadinessSchema>,
): Promise<AIResult<InspectionReadinessResult>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = inspectionReadinessSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const { text } = await generateText({
      model: bedrock(RISK_ANALYSIS_MODEL),
      prompt: inspectionReadinessPrompt(parsed.data),
      maxOutputTokens: 2048,
      temperature: 0.2,
    });

    const result = parseAIJson<InspectionReadinessResult>(text);
    return { success: true, data: result };
  } catch (err) {
    console.error('[AI] scoreInspectionReadiness error:', err);
    return {
      success: false,
      error: 'Failed to score inspection readiness. Please try again.',
    };
  }
}
