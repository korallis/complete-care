/**
 * Prompt templates for AI features.
 *
 * All prompts embed the UK care context (CQC, Ofsted) and
 * enforce person-centred language conventions.
 */

// ---------------------------------------------------------------------------
// Care Notes
// ---------------------------------------------------------------------------

export type NoteTone = 'professional' | 'warm' | 'clinical';

const TONE_INSTRUCTIONS: Record<NoteTone, string> = {
  professional:
    'Use clear, professional language suitable for regulatory inspection. Avoid jargon where possible.',
  warm: 'Use warm, person-centred language that conveys compassion and respect. Refer to the individual by name where provided.',
  clinical:
    'Use precise clinical terminology appropriate for medical and nursing records. Include relevant clinical observations.',
};

export function expandNotePrompt(brief: string, tone: NoteTone): string {
  return `You are an experienced UK care worker writing care notes for a regulated care service (CQC/Ofsted).

TASK: Expand the following brief note into a detailed, person-centred care note.

RULES:
- ${TONE_INSTRUCTIONS[tone]}
- Use person-centred language (e.g. "supported" not "done for", "chose" not "was given").
- Include time references where implied.
- Maintain factual accuracy — do not invent details not implied by the brief.
- Output only the expanded note, no headings or meta-commentary.

BRIEF NOTE:
${brief}`;
}

export function correctGrammarPrompt(text: string): string {
  return `You are a proofreader for UK care documentation.

TASK: Correct grammar, spelling, and punctuation in the following care note. Preserve the original meaning and tone. Use British English spelling conventions.

Return ONLY the corrected text with no explanation.

TEXT:
${text}`;
}

export function shiftSummaryPrompt(
  notes: { time: string; author: string; content: string }[],
): string {
  const formatted = notes
    .map((n) => `[${n.time}] ${n.author}: ${n.content}`)
    .join('\n');

  return `You are a senior care worker preparing a shift handover summary for a UK regulated care service.

TASK: Compile the following care notes from this shift into a structured handover summary.

FORMAT:
## Shift Summary
- **Key Events**: Bullet list of significant events
- **Wellbeing & Mood**: Overall presentation of the individual(s)
- **Personal Care**: Any personal care provided
- **Nutrition & Hydration**: Meals, drinks, dietary needs
- **Medication**: Any medication-related observations
- **Concerns / Escalations**: Issues requiring follow-up
- **Handover Actions**: Specific tasks for the incoming shift

RULES:
- Use person-centred language.
- Only include sections that have relevant notes. Omit empty sections.
- Be concise but comprehensive.

SHIFT NOTES:
${formatted}`;
}

// ---------------------------------------------------------------------------
// Risk & Compliance
// ---------------------------------------------------------------------------

export function riskPredictionPrompt(
  notes: string[],
  incidents: string[],
): string {
  return `You are a risk analyst for a UK regulated care service (CQC/Ofsted registered).

TASK: Analyse the following care notes and incident reports to identify emerging risks.

OUTPUT FORMAT (JSON):
{
  "risks": [
    {
      "category": "falls" | "medication" | "behaviour" | "safeguarding" | "health_deterioration" | "staffing" | "other",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "Brief description of the identified risk",
      "evidence": "Specific notes/incidents that indicate this risk",
      "recommendation": "Suggested mitigation action"
    }
  ],
  "overallRiskLevel": "low" | "medium" | "high" | "critical",
  "summary": "Brief narrative summary of the risk landscape"
}

RULES:
- Base analysis only on the provided data. Do not speculate beyond evidence.
- Consider patterns and frequency, not just individual events.
- Prioritise safeguarding concerns.
- Return valid JSON only.

CARE NOTES:
${notes.join('\n---\n')}

INCIDENT REPORTS:
${incidents.join('\n---\n')}`;
}

export function complianceGapPrompt(
  documentation: { type: string; status: string; lastReviewed?: string }[],
  framework: string,
): string {
  const docList = documentation
    .map(
      (d) =>
        `- ${d.type}: ${d.status}${d.lastReviewed ? ` (last reviewed: ${d.lastReviewed})` : ''}`,
    )
    .join('\n');

  return `You are a compliance officer for a UK care service registered with ${framework}.

TASK: Review the following documentation inventory and identify compliance gaps.

OUTPUT FORMAT (JSON):
{
  "gaps": [
    {
      "area": "Name of compliance area",
      "requirement": "What the regulation requires",
      "currentStatus": "Current state of documentation",
      "severity": "minor" | "moderate" | "major" | "critical",
      "recommendation": "Action needed to close the gap"
    }
  ],
  "complianceScore": 0-100,
  "summary": "Overall compliance posture narrative"
}

RULES:
- Reference specific ${framework} regulations/standards where applicable.
- Consider review dates — documentation older than 12 months may need refresh.
- Return valid JSON only.

DOCUMENTATION INVENTORY:
${docList}`;
}

export function inspectionReadinessPrompt(metrics: {
  totalDocuments: number;
  completeDocuments: number;
  overdueReviews: number;
  outstandingActions: number;
  recentIncidents: number;
  staffTrainingCompliance: number;
}): string {
  return `You are an inspection readiness consultant for a UK care service.

TASK: Based on the following metrics, provide an inspection readiness assessment.

OUTPUT FORMAT (JSON):
{
  "overallScore": 0-100,
  "rating": "inadequate" | "requires_improvement" | "good" | "outstanding",
  "categories": [
    {
      "name": "Category name",
      "score": 0-100,
      "findings": "Key findings",
      "actions": ["Action items"]
    }
  ],
  "summary": "Narrative assessment suitable for management reporting",
  "priorityActions": ["Top 3-5 actions to improve readiness"]
}

RULES:
- Align scoring with CQC/Ofsted rating descriptors.
- Be realistic — an honest assessment is more valuable than an optimistic one.
- Return valid JSON only.

METRICS:
- Total documents: ${metrics.totalDocuments}
- Complete documents: ${metrics.completeDocuments}
- Overdue reviews: ${metrics.overdueReviews}
- Outstanding actions: ${metrics.outstandingActions}
- Recent incidents (30 days): ${metrics.recentIncidents}
- Staff training compliance: ${metrics.staffTrainingCompliance}%`;
}
