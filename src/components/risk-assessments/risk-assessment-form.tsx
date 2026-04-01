'use client';

/**
 * RiskAssessmentForm — template-driven scored questionnaire.
 *
 * Step 1 (new): Template picker
 * Step 2: Answer all scored questions
 * Step 3: Review auto-calculated risk level + submit
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  RISK_ASSESSMENT_TEMPLATES,
  TEMPLATE_LIST,
} from '@/features/risk-assessments/templates';
import type {
  RiskAssessmentTemplate,
  RiskAssessmentTemplateId,
  TemplateQuestion,
} from '@/features/risk-assessments/templates';
import {
  calculateTotalScore,
  calculateRiskLevel,
  RISK_LEVEL_LABELS,
  getMaxScore,
} from '@/features/risk-assessments/scoring';
import type { RiskLevel, RiskAssessmentScores } from '@/lib/db/schema/risk-assessments';
import type { RiskAssessment } from '@/lib/db/schema/risk-assessments';
import type { CreateRiskAssessmentInput, CompleteRiskAssessmentInput } from '@/features/risk-assessments/schema';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskAssessmentFormProps = {
  mode: 'new' | 'complete';
  personId: string;
  orgSlug: string;
  /** Existing assessment (for complete mode) */
  assessment?: RiskAssessment;
  /** Template pre-selected (for complete mode) */
  template?: RiskAssessmentTemplate;
  onCreate: (data: CreateRiskAssessmentInput) => Promise<{
    success: boolean;
    error?: string;
    data?: RiskAssessment;
  }>;
  onComplete: (
    assessmentId: string,
    data: CompleteRiskAssessmentInput,
  ) => Promise<{
    success: boolean;
    error?: string;
    data?: RiskAssessment;
  }>;
};

// ---------------------------------------------------------------------------
// Template picker
// ---------------------------------------------------------------------------

type TemplateSelectorProps = {
  onSelect: (templateId: RiskAssessmentTemplateId) => void;
};

function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          Choose an assessment type
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Select the type of risk assessment to complete.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="list"
        aria-label="Assessment templates"
      >
        {TEMPLATE_LIST.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            role="listitem"
            className="group text-left rounded-xl border-2 border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.5_0.1_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <h3 className="font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
              {template.description}
            </p>
            <span className="text-xs text-[oklch(0.65_0_0)]">
              {template.questions.length} questions
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question renderer
// ---------------------------------------------------------------------------

type QuestionProps = {
  question: TemplateQuestion;
  value: number | undefined;
  onChange: (value: number) => void;
  index: number;
};

function Question({ question, value, onChange, index }: QuestionProps) {
  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.3_0.08_160)] text-white text-xs font-bold">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
            {question.text}
          </p>
          <p className="text-xs text-[oklch(0.65_0_0)] mt-0.5">
            {question.category}
          </p>
        </div>
      </div>

      <fieldset aria-label={question.text}>
        <div className="space-y-2 ml-9">
          {question.options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition-all',
                value === option.value
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.005_160)] ring-1 ring-[oklch(0.5_0.1_160)/0.3]'
                  : 'border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.8_0.03_160)] hover:bg-[oklch(0.99_0.001_160)]',
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 border-[oklch(0.7_0_0)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
              />
              <span className="text-sm text-[oklch(0.22_0.04_160)] flex-1">
                {option.label}
              </span>
              <span className="text-xs text-[oklch(0.65_0_0)] font-mono flex-shrink-0">
                {option.value}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score summary
// ---------------------------------------------------------------------------

type ScoreSummaryProps = {
  totalScore: number;
  maxScore: number;
  riskLevel: RiskLevel;
};

function ScoreSummary({ totalScore, maxScore, riskLevel }: ScoreSummaryProps) {
  const riskLevelStyles: Record<string, string> = {
    low: 'text-[oklch(0.3_0.08_160)] bg-[oklch(0.95_0.03_160)] border-[oklch(0.85_0.05_160)]',
    medium: 'text-[oklch(0.45_0.1_75)] bg-[oklch(0.97_0.01_75)] border-[oklch(0.88_0.04_75)]',
    high: 'text-[oklch(0.4_0.12_25)] bg-[oklch(0.95_0.03_25)] border-[oklch(0.85_0.06_25)]',
    critical: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-6 text-center',
        riskLevelStyles[riskLevel] ?? riskLevelStyles.low,
      )}
      role="region"
      aria-label="Assessment result"
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-2 opacity-70">
        Risk Level
      </p>
      <p className="text-3xl font-bold mb-1">
        {RISK_LEVEL_LABELS[riskLevel]}
      </p>
      <p className="text-sm opacity-80">
        Score: {totalScore} / {maxScore}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function RiskAssessmentForm(props: RiskAssessmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Template selection (new mode)
  const [selectedTemplate, setSelectedTemplate] = useState<RiskAssessmentTemplate | null>(
    props.template ?? null,
  );

  // Scores state
  const [scores, setScores] = useState<RiskAssessmentScores>(
    () => (props.assessment?.scores as RiskAssessmentScores) ?? {},
  );

  // Notes
  const [notes, setNotes] = useState(props.assessment?.notes ?? '');

  // Review date
  const [reviewDate, setReviewDate] = useState(
    props.assessment?.reviewDate ?? '',
  );

  // Handle template selection (new mode)
  function handleTemplateSelect(templateId: RiskAssessmentTemplateId) {
    const template = RISK_ASSESSMENT_TEMPLATES[templateId];
    setSelectedTemplate(template);

    // In new mode, create the assessment immediately then switch to complete mode
    startTransition(async () => {
      setServerError(null);
      const result = await props.onCreate({
        personId: props.personId,
        templateId,
        reviewFrequency: template.defaultReviewFrequency,
      });

      if (result.success && result.data) {
        // Redirect to the complete page
        router.push(
          `/${props.orgSlug}/persons/${props.personId}/risk-assessments/${result.data.id}`,
        );
      } else {
        setServerError(result.error ?? 'Failed to create assessment');
        toast.error(result.error ?? 'Failed to create assessment');
        setSelectedTemplate(null);
      }
    });
  }

  function handleScoreChange(questionId: string, value: number) {
    setScores((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    if (!props.assessment || !selectedTemplate) return;

    // Check all questions are answered
    const unanswered = selectedTemplate.questions.filter(
      (q) => !(q.id in scores),
    );
    if (unanswered.length > 0) {
      setServerError(
        `Please answer all questions. ${unanswered.length} remaining.`,
      );
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await props.onComplete(props.assessment!.id, {
        scores,
        notes: notes || null,
        reviewDate: reviewDate || null,
      });

      if (result.success) {
        toast.success('Assessment completed');
        router.push(
          `/${props.orgSlug}/persons/${props.personId}/risk-assessments`,
        );
      } else {
        setServerError(result.error ?? 'Failed to complete assessment');
        toast.error(result.error ?? 'Failed to complete assessment');
      }
    });
  }

  // New mode: show template picker
  if (props.mode === 'new' && !selectedTemplate) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  // Loading state after template selection in new mode
  if (props.mode === 'new' && selectedTemplate && isPending) {
    return (
      <div className="text-center py-12">
        <svg
          className="h-8 w-8 animate-spin mx-auto text-[oklch(0.5_0.1_160)]"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="mt-3 text-sm text-[oklch(0.55_0_0)]">
          Creating assessment...
        </p>
      </div>
    );
  }

  // Complete mode: show scored questions
  if (!selectedTemplate || !props.assessment) return null;

  const totalScore = calculateTotalScore(scores);
  const riskLevel = calculateRiskLevel(totalScore, selectedTemplate.thresholds);
  const maxScore = getMaxScore(selectedTemplate);
  const answeredCount = Object.keys(scores).length;
  const totalQuestions = selectedTemplate.questions.length;
  const allAnswered = answeredCount === totalQuestions;

  // Group questions by category
  const categories = [...new Set(selectedTemplate.questions.map((q) => q.category))];

  return (
    <div className="space-y-6" aria-label="Risk assessment form">
      {/* Server error */}
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Assessment header */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          {selectedTemplate.name}
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {selectedTemplate.description}
        </p>
        <p className="text-xs text-[oklch(0.65_0_0)] mt-2">
          {answeredCount} / {totalQuestions} questions answered
        </p>
      </div>

      {/* Score summary (visible when some questions answered) */}
      {answeredCount > 0 && (
        <ScoreSummary
          totalScore={totalScore}
          maxScore={maxScore}
          riskLevel={riskLevel}
        />
      )}

      {/* Questions grouped by category */}
      {categories.map((category) => {
        const categoryQuestions = selectedTemplate.questions.filter(
          (q) => q.category === category,
        );
        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
              {category}
            </h3>
            {categoryQuestions.map((question) => (
              <Question
                key={question.id}
                question={question}
                value={scores[question.id]}
                onChange={(value) => handleScoreChange(question.id, value)}
                index={selectedTemplate.questions.indexOf(question)}
              />
            ))}
          </div>
        );
      })}

      {/* Notes */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <label
          htmlFor="ra-notes"
          className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
        >
          Clinical notes (optional)
        </label>
        <textarea
          id="ra-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Record any additional observations or clinical notes..."
          className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
        />
      </div>

      {/* Review date */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <label
          htmlFor="ra-review-date"
          className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
        >
          Next review date (optional — auto-calculated if left blank)
        </label>
        <input
          id="ra-review-date"
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !allAnswered}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            'Complete assessment'
          )}
        </button>
      </div>
    </div>
  );
}
