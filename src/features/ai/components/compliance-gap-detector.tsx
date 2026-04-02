'use client';

import { useState, useCallback } from 'react';
import {
  detectComplianceGaps,
  type ComplianceGapResult,
} from '@/features/ai/actions/risk-compliance';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentItem {
  type: string;
  status: string;
  lastReviewed?: string;
}

interface ComplianceGapDetectorProps {
  /** Pre-populated documentation inventory. */
  documentation?: DocumentItem[];
  /** Regulatory framework to check against. */
  framework?: 'CQC' | 'Ofsted';
  /** Optional CSS class name for the root container. */
  className?: string;
}

const GAP_SEVERITY_COLOURS: Record<string, string> = {
  minor: 'bg-blue-100 text-blue-800 border-blue-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  major: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI Compliance Gap Detector — analyses documentation inventory against
 * regulatory requirements and highlights gaps.
 */
export function ComplianceGapDetector({
  documentation: initialDocs = [],
  framework: initialFramework = 'CQC',
  className,
}: ComplianceGapDetectorProps) {
  const [docs, setDocs] = useState<DocumentItem[]>(initialDocs);
  const [framework, setFramework] = useState<'CQC' | 'Ofsted'>(
    initialFramework,
  );
  const [result, setResult] = useState<ComplianceGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New doc form
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newReviewed, setNewReviewed] = useState('');

  const addDoc = useCallback(() => {
    if (!newType.trim() || !newStatus.trim()) return;
    setDocs((prev) => [
      ...prev,
      {
        type: newType,
        status: newStatus,
        lastReviewed: newReviewed || undefined,
      },
    ]);
    setNewType('');
    setNewStatus('');
    setNewReviewed('');
  }, [newType, newStatus, newReviewed]);

  const handleDetect = useCallback(async () => {
    if (docs.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await detectComplianceGaps({ documentation: docs, framework });
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
  }, [docs, framework]);

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Compliance Gap Detection</h3>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as 'CQC' | 'Ofsted')}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          aria-label="Regulatory framework"
        >
          <option value="CQC">CQC</option>
          <option value="Ofsted">Ofsted</option>
        </select>
      </div>

      {/* Documentation list */}
      {docs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Documentation Inventory ({docs.length})
          </h4>
          {docs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm"
            >
              <span className="flex-1">
                <strong>{doc.type}</strong> — {doc.status}
                {doc.lastReviewed && (
                  <span className="text-muted-foreground">
                    {' '}
                    (reviewed: {doc.lastReviewed})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDocs((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove document ${i + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add document form */}
      <div className="space-y-2 rounded-md border p-4">
        <h4 className="text-sm font-medium">Add Document</h4>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Document type"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Status"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={newReviewed}
            onChange={(e) => setNewReviewed(e.target.value)}
            placeholder="Last reviewed (optional)"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addDoc}
          disabled={!newType.trim() || !newStatus.trim()}
          className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          Add Document
        </button>
      </div>

      {/* Detect button */}
      <button
        type="button"
        onClick={handleDetect}
        disabled={loading || docs.length === 0}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Detecting Gaps...' : 'Detect Compliance Gaps'}
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
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{result.complianceScore}</div>
              <div className="text-xs text-muted-foreground">
                Compliance Score
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {result.gaps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Gaps Identified ({result.gaps.length})
              </h4>
              {result.gaps.map((gap, i) => (
                <div key={i} className="rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${GAP_SEVERITY_COLOURS[gap.severity]}`}
                    >
                      {gap.severity}
                    </span>
                    <span className="text-sm font-medium">{gap.area}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>Requirement:</strong> {gap.requirement}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>Current:</strong> {gap.currentStatus}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>Action:</strong> {gap.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
