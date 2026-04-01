'use client';

/**
 * PainAssessmentForm — NRS / Abbey / PAINAD tabbed pain assessment form.
 */

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import {
  PAIN_TOOLS,
  PAIN_TOOL_LABELS,
  PAIN_TYPES,
  PAIN_TYPE_LABELS,
  ABBEY_CATEGORIES,
  ABBEY_CATEGORY_LABELS,
  ABBEY_SCORE_LABELS,
  ABBEY_MAX_PER_DOMAIN,
  PAINAD_CATEGORIES,
  PAINAD_CATEGORY_LABELS,
  PAINAD_SCORE_DESCRIPTIONS,
  PAINAD_MAX_PER_DOMAIN,
  type PainTool,
  type PainType,
} from '@/features/bowel-sleep-pain/constants';
import {
  scoreAbbey,
  scorePainad,
  getNrsSeverityLabel,
  type AbbeyScores,
  type PainadScores,
} from '@/features/bowel-sleep-pain/scoring';
import type { CreatePainAssessmentInput } from '@/features/bowel-sleep-pain/schema';

type PainAssessmentFormProps = {
  personId: string;
  onSubmit: (
    input: CreatePainAssessmentInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

const labelClass = 'block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1';
const selectClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';
const inputClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';

const defaultAbbeyScores: AbbeyScores = {
  vocalisation: 0,
  facial_expression: 0,
  body_language: 0,
  behaviour_change: 0,
  physiological_change: 0,
  physical_change: 0,
};

const defaultPainadScores: PainadScores = {
  breathing: 0,
  vocalisation: 0,
  facial_expression: 0,
  body_language: 0,
  consolability: 0,
};

function SeverityBadge({
  severity,
  label,
}: {
  severity: string;
  label: string;
}) {
  const colours: Record<string, string> = {
    none: 'bg-emerald-100 text-emerald-800',
    mild: 'bg-yellow-100 text-yellow-800',
    moderate: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[severity] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {label}
    </span>
  );
}

export function PainAssessmentForm({
  personId,
  onSubmit,
}: PainAssessmentFormProps) {
  const [isPending, startTransition] = useTransition();

  const [toolUsed, setToolUsed] = useState<PainTool>('nrs');
  const [nrsScore, setNrsScore] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [painType, setPainType] = useState<PainType | ''>('');
  const [abbeyScores, setAbbeyScores] =
    useState<AbbeyScores>(defaultAbbeyScores);
  const [painadScores, setPainadScores] =
    useState<PainadScores>(defaultPainadScores);
  const [notes, setNotes] = useState('');

  // Score previews
  const abbeyResult = useMemo(() => scoreAbbey(abbeyScores), [abbeyScores]);
  const painadResult = useMemo(
    () => scorePainad(painadScores),
    [painadScores],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const input: CreatePainAssessmentInput = {
        personId,
        toolUsed,
        nrsScore: toolUsed === 'nrs' ? nrsScore : null,
        location: location || null,
        painType: painType || null,
        abbeyScores: toolUsed === 'abbey' ? abbeyScores : null,
        painadScores: toolUsed === 'painad' ? painadScores : null,
        notes: notes || null,
        recordedAt: new Date().toISOString(),
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success('Pain assessment recorded');
        setNrsScore(0);
        setLocation('');
        setPainType('');
        setAbbeyScores(defaultAbbeyScores);
        setPainadScores(defaultPainadScores);
        setNotes('');
      } else {
        toast.error(result.error ?? 'Failed to record pain assessment');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        Pain Assessment
      </h3>

      {/* Tool selector (tabs) */}
      <div className="flex rounded-lg border border-[oklch(0.88_0.005_160)] overflow-hidden">
        {PAIN_TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => setToolUsed(tool)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              toolUsed === tool
                ? 'bg-[oklch(0.3_0.08_160)] text-white'
                : 'bg-white text-[oklch(0.4_0.02_160)] hover:bg-[oklch(0.97_0.003_160)]'
            }`}
            aria-pressed={toolUsed === tool}
          >
            {PAIN_TOOL_LABELS[tool]}
          </button>
        ))}
      </div>

      {/* Location + Pain Type (common to all tools) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="pain-location" className={labelClass}>
            Location
          </label>
          <input
            id="pain-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lower back"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pain-type" className={labelClass}>
            Pain Type
          </label>
          <select
            id="pain-type"
            value={painType}
            onChange={(e) => setPainType(e.target.value as PainType | '')}
            className={selectClass}
          >
            <option value="">--</option>
            {PAIN_TYPES.map((t) => (
              <option key={t} value={t}>
                {PAIN_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NRS Panel */}
      {toolUsed === 'nrs' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="nrs-score" className={labelClass}>
              Pain Score (0-10)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="nrs-score"
                type="range"
                min={0}
                max={10}
                value={nrsScore}
                onChange={(e) => setNrsScore(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-[oklch(0.22_0.04_160)] w-8 text-center">
                {nrsScore}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[oklch(0.55_0_0)] mt-1">
              <span>No pain</span>
              <span>Worst pain</span>
            </div>
          </div>
          <SeverityBadge
            severity={getNrsSeverityLabel(nrsScore).toLowerCase().replace(' pain', '')}
            label={getNrsSeverityLabel(nrsScore)}
          />
        </div>
      )}

      {/* Abbey Panel */}
      {toolUsed === 'abbey' && (
        <div className="space-y-3">
          <p className="text-xs text-[oklch(0.55_0_0)]">
            Score each domain 0 (absent) to {ABBEY_MAX_PER_DOMAIN} (severe)
          </p>
          {ABBEY_CATEGORIES.map((category) => (
            <div key={category}>
              <label className={labelClass}>
                {ABBEY_CATEGORY_LABELS[category]}
              </label>
              <div className="flex gap-1">
                {Array.from({ length: ABBEY_MAX_PER_DOMAIN + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setAbbeyScores((prev) => ({
                        ...prev,
                        [category]: i,
                      }))
                    }
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      abbeyScores[category] === i
                        ? 'bg-[oklch(0.3_0.08_160)] text-white border-[oklch(0.3_0.08_160)]'
                        : 'bg-white text-[oklch(0.4_0.02_160)] border-[oklch(0.88_0.005_160)] hover:bg-[oklch(0.97_0.003_160)]'
                    }`}
                    aria-label={`${ABBEY_CATEGORY_LABELS[category]}: ${ABBEY_SCORE_LABELS[i]}`}
                    aria-pressed={abbeyScores[category] === i}
                  >
                    {i} - {ABBEY_SCORE_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-bold text-[oklch(0.22_0.04_160)]">
              Total: {abbeyResult.totalScore}/18
            </span>
            <SeverityBadge
              severity={abbeyResult.severity}
              label={abbeyResult.severityLabel}
            />
          </div>
        </div>
      )}

      {/* PAINAD Panel */}
      {toolUsed === 'painad' && (
        <div className="space-y-3">
          <p className="text-xs text-[oklch(0.55_0_0)]">
            Score each domain 0 to {PAINAD_MAX_PER_DOMAIN}
          </p>
          {PAINAD_CATEGORIES.map((category) => (
            <div key={category}>
              <label className={labelClass}>
                {PAINAD_CATEGORY_LABELS[category]}
              </label>
              <div className="flex gap-1">
                {Array.from(
                  { length: PAINAD_MAX_PER_DOMAIN + 1 },
                  (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setPainadScores((prev) => ({
                          ...prev,
                          [category]: i,
                        }))
                      }
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                        painadScores[category] === i
                          ? 'bg-[oklch(0.3_0.08_160)] text-white border-[oklch(0.3_0.08_160)]'
                          : 'bg-white text-[oklch(0.4_0.02_160)] border-[oklch(0.88_0.005_160)] hover:bg-[oklch(0.97_0.003_160)]'
                      }`}
                      aria-label={`${PAINAD_CATEGORY_LABELS[category]}: score ${i}`}
                      aria-pressed={painadScores[category] === i}
                    >
                      <span className="font-medium">{i}</span>
                      <span className="block text-[10px] leading-tight mt-0.5">
                        {PAINAD_SCORE_DESCRIPTIONS[category]?.[i] ?? ''}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-bold text-[oklch(0.22_0.04_160)]">
              Total: {painadResult.totalScore}/10
            </span>
            <SeverityBadge
              severity={painadResult.severity}
              label={painadResult.severityLabel}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="pain-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="pain-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional observations..."
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : 'Record Pain Assessment'}
      </button>
    </form>
  );
}
