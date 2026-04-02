'use client';

import { useState, useCallback } from 'react';
import {
  scoreInspectionReadiness,
  type InspectionReadinessResult,
} from '@/features/ai/actions/risk-compliance';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectionReadinessScorerProps {
  /** Pre-populated metrics. */
  initialMetrics?: MetricsInput;
  /** Optional CSS class name for the root container. */
  className?: string;
}

interface MetricsInput {
  totalDocuments: number;
  completeDocuments: number;
  overdueReviews: number;
  outstandingActions: number;
  recentIncidents: number;
  staffTrainingCompliance: number;
}

const DEFAULT_METRICS: MetricsInput = {
  totalDocuments: 0,
  completeDocuments: 0,
  overdueReviews: 0,
  outstandingActions: 0,
  recentIncidents: 0,
  staffTrainingCompliance: 0,
};

const RATING_COLOURS: Record<string, string> = {
  outstanding: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  requires_improvement: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inadequate: 'bg-red-100 text-red-800 border-red-200',
};

const RATING_LABELS: Record<string, string> = {
  outstanding: 'Outstanding',
  good: 'Good',
  requires_improvement: 'Requires Improvement',
  inadequate: 'Inadequate',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI Inspection Readiness Scorer — assesses inspection readiness based on
 * documentation completeness and operational metrics.
 */
export function InspectionReadinessScorer({
  initialMetrics,
  className,
}: InspectionReadinessScorerProps) {
  const [metrics, setMetrics] = useState<MetricsInput>(
    initialMetrics ?? DEFAULT_METRICS,
  );
  const [result, setResult] = useState<InspectionReadinessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMetric = useCallback(
    (key: keyof MetricsInput, value: number) => {
      setMetrics((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await scoreInspectionReadiness(metrics);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <h3 className="text-lg font-semibold">Inspection Readiness Score</h3>

      {/* Metrics form */}
      <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
        <MetricField
          label="Total Documents"
          value={metrics.totalDocuments}
          onChange={(v) => updateMetric('totalDocuments', v)}
        />
        <MetricField
          label="Complete Documents"
          value={metrics.completeDocuments}
          onChange={(v) => updateMetric('completeDocuments', v)}
        />
        <MetricField
          label="Overdue Reviews"
          value={metrics.overdueReviews}
          onChange={(v) => updateMetric('overdueReviews', v)}
        />
        <MetricField
          label="Outstanding Actions"
          value={metrics.outstandingActions}
          onChange={(v) => updateMetric('outstandingActions', v)}
        />
        <MetricField
          label="Recent Incidents (30 days)"
          value={metrics.recentIncidents}
          onChange={(v) => updateMetric('recentIncidents', v)}
        />
        <MetricField
          label="Staff Training Compliance (%)"
          value={metrics.staffTrainingCompliance}
          onChange={(v) => updateMetric('staffTrainingCompliance', v)}
          max={100}
        />
      </div>

      {/* Score button */}
      <button
        type="button"
        onClick={handleScore}
        disabled={loading}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Scoring...' : 'Calculate Readiness Score'}
      </button>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{result.overallScore}</div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
            </div>
            <span
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${RATING_COLOURS[result.rating]}`}
            >
              {RATING_LABELS[result.rating] ?? result.rating}
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {/* Categories */}
          {result.categories.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Assessment Categories</h4>
              {result.categories.map((cat, i) => (
                <div key={i} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-lg font-bold">{cat.score}/100</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cat.findings}
                  </p>
                  {cat.actions.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      {cat.actions.map((action, j) => (
                        <li key={j}>{action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Priority actions */}
          {result.priorityActions.length > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
              <h4 className="text-sm font-medium text-orange-900">
                Priority Actions
              </h4>
              <ol className="mt-2 list-inside list-decimal text-sm text-orange-800">
                {result.priorityActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        max={max}
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      />
    </div>
  );
}
