'use client';

import { useState, useCallback } from 'react';
import {
  analyseRisks,
  type RiskPredictionResult,
} from '@/features/ai/actions/risk-compliance';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiskAnalysisPanelProps {
  /** Pre-populated care notes for analysis. */
  careNotes?: string[];
  /** Pre-populated incident reports for analysis. */
  incidents?: string[];
  /** Optional CSS class name for the root container. */
  className?: string;
}

const SEVERITY_COLOURS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI Risk Analysis Panel — analyses care notes and incidents to
 * identify emerging risks with severity ratings and recommendations.
 */
export function RiskAnalysisPanel({
  careNotes: initialNotes = [],
  incidents: initialIncidents = [],
  className,
}: RiskAnalysisPanelProps) {
  const [notes, setNotes] = useState<string[]>(initialNotes);
  const [incidents, setIncidents] = useState<string[]>(initialIncidents);
  const [newNote, setNewNote] = useState('');
  const [newIncident, setNewIncident] = useState('');
  const [result, setResult] = useState<RiskPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyse = useCallback(async () => {
    if (notes.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyseRisks({ notes, incidents });
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
  }, [notes, incidents]);

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <h3 className="text-lg font-semibold">Risk Analysis</h3>

      {/* Care Notes input */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Care Notes ({notes.length})</h4>
        {notes.map((note, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md border bg-muted/30 p-2 text-sm"
          >
            <span className="flex-1">{note}</span>
            <button
              type="button"
              onClick={() => setNotes((prev) => prev.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove note ${i + 1}`}
            >
              &times;
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add care note text..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newNote.trim()) {
                setNotes((prev) => [...prev, newNote.trim()]);
                setNewNote('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newNote.trim()) {
                setNotes((prev) => [...prev, newNote.trim()]);
                setNewNote('');
              }
            }}
            disabled={!newNote.trim()}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Incidents input */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          Incident Reports ({incidents.length})
        </h4>
        {incidents.map((incident, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md border bg-muted/30 p-2 text-sm"
          >
            <span className="flex-1">{incident}</span>
            <button
              type="button"
              onClick={() =>
                setIncidents((prev) => prev.filter((_, j) => j !== i))
              }
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove incident ${i + 1}`}
            >
              &times;
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newIncident}
            onChange={(e) => setNewIncident(e.target.value)}
            placeholder="Add incident report text..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newIncident.trim()) {
                setIncidents((prev) => [...prev, newIncident.trim()]);
                setNewIncident('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newIncident.trim()) {
                setIncidents((prev) => [...prev, newIncident.trim()]);
                setNewIncident('');
              }
            }}
            disabled={!newIncident.trim()}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Analyse button */}
      <button
        type="button"
        onClick={handleAnalyse}
        disabled={loading || notes.length === 0}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Analysing Risks...' : 'Analyse Risks'}
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
          {/* Overall risk */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Overall Risk Level:</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${SEVERITY_COLOURS[result.overallRiskLevel]}`}
            >
              {result.overallRiskLevel}
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {/* Risk items */}
          <div className="space-y-3">
            {result.risks.map((risk, i) => (
              <div key={i} className="rounded-md border p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${SEVERITY_COLOURS[risk.severity]}`}
                  >
                    {risk.severity}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {risk.category}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{risk.description}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Evidence:</strong> {risk.evidence}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Recommendation:</strong> {risk.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
