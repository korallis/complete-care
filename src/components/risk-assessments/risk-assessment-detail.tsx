'use client';

/**
 * RiskAssessmentDetail — displays a completed risk assessment with
 * scored questions, risk level, and clinical notes.
 */

import Link from 'next/link';
import { RiskLevelBadge, AssessmentStatusBadge } from './risk-level-badge';
import {
  TEMPLATE_LABELS,
  getTemplate,
} from '@/features/risk-assessments/templates';
import type { RiskAssessmentTemplateId } from '@/features/risk-assessments/templates';
import { RISK_LEVEL_LABELS, getMaxScore } from '@/features/risk-assessments/scoring';
import type { RiskAssessment, RiskLevel, RiskAssessmentScores } from '@/lib/db/schema/risk-assessments';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type RiskAssessmentDetailProps = {
  assessment: RiskAssessment;
  orgSlug: string;
  personId: string;
  personName: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskAssessmentDetail({
  assessment,
  orgSlug,
  personId,
  personName,
}: RiskAssessmentDetailProps) {
  const template = getTemplate(assessment.templateId);
  const templateLabel =
    TEMPLATE_LABELS[assessment.templateId as RiskAssessmentTemplateId] ??
    assessment.templateId;
  const scores = (assessment.scores ?? {}) as RiskAssessmentScores;
  const maxScore = template ? getMaxScore(template) : 0;

  const riskLevelStyles: Record<string, string> = {
    low: 'border-[oklch(0.85_0.05_160)] bg-[oklch(0.97_0.02_160)]',
    medium: 'border-[oklch(0.88_0.04_75)] bg-[oklch(0.98_0.005_75)]',
    high: 'border-[oklch(0.85_0.06_25)] bg-[oklch(0.97_0.02_25)]',
    critical: 'border-red-200 bg-red-50',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
              {templateLabel}
            </h1>
            <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
              Version {assessment.version} — {personName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AssessmentStatusBadge status={assessment.status} />
            {assessment.status === 'completed' && (
              <RiskLevelBadge riskLevel={assessment.riskLevel} />
            )}
          </div>
        </div>

        {/* Score summary */}
        {assessment.status === 'completed' && (
          <div
            className={cn(
              'rounded-lg border p-4 mb-4',
              riskLevelStyles[assessment.riskLevel] ?? riskLevelStyles.low,
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-0.5">
                  Risk Level
                </p>
                <p className="text-2xl font-bold">
                  {RISK_LEVEL_LABELS[assessment.riskLevel as RiskLevel] ??
                    assessment.riskLevel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-0.5">
                  Total Score
                </p>
                <p className="text-2xl font-bold">
                  {assessment.totalScore}
                  <span className="text-sm font-normal opacity-60">
                    {' '}
                    / {maxScore}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-[oklch(0.55_0_0)]">
          {assessment.completedByName && (
            <span>Completed by: {assessment.completedByName}</span>
          )}
          {assessment.completedAt && (
            <span>
              Completed:{' '}
              {new Date(assessment.completedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          {assessment.reviewDate && (
            <span
              className={cn(
                assessment.reviewDate <
                  new Date().toISOString().slice(0, 10)
                  ? 'text-red-600 font-medium'
                  : '',
              )}
            >
              Next review: {assessment.reviewDate}
            </span>
          )}
        </div>
      </div>

      {/* Questions and responses */}
      {template && assessment.status === 'completed' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
            Assessment responses
          </h2>
          {template.questions.map((question, idx) => {
            const score = scores[question.id];
            const selectedOption = question.options.find(
              (o) => o.value === score,
            );

            return (
              <div
                key={question.id}
                className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.92_0.01_160)] text-[oklch(0.35_0.06_160)] text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                      {question.text}
                    </p>
                    {selectedOption && (
                      <p className="text-sm text-[oklch(0.45_0.05_160)] mt-1">
                        {selectedOption.label}
                        <span className="ml-2 text-xs font-mono text-[oklch(0.65_0_0)]">
                          ({selectedOption.value})
                        </span>
                      </p>
                    )}
                    {score === undefined && (
                      <p className="text-xs text-[oklch(0.65_0_0)] italic mt-1">
                        Not answered
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clinical notes */}
      {assessment.notes && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
            Clinical notes
          </h2>
          <p className="text-sm text-[oklch(0.35_0.02_160)] whitespace-pre-wrap">
            {assessment.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/persons/${personId}/risk-assessments`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Back to assessments
        </Link>
        {assessment.status === 'draft' && (
          <Link
            href={`/${orgSlug}/persons/${personId}/risk-assessments/${assessment.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            Complete assessment
          </Link>
        )}
      </div>
    </div>
  );
}
