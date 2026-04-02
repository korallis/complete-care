'use client';

import { useState, useCallback } from 'react';
import type { NoteTone } from '@/lib/ai';
import {
  expandCareNote,
  correctCareNoteGrammar,
} from '@/features/ai/actions/care-notes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CareNoteAssistantProps {
  /** Initial note text to populate the input. */
  initialText?: string;
  /** Callback fired when the user accepts an AI-generated result. */
  onAccept?: (text: string) => void;
  /** Optional CSS class name for the root container. */
  className?: string;
}

type AssistantMode = 'expand' | 'grammar';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI Care Note Assistant — expands brief notes into detailed person-centred
 * language and corrects grammar/spelling.
 *
 * Gracefully degrades to a plain text area when AI is unavailable.
 */
export function CareNoteAssistant({
  initialText = '',
  onAccept,
  className,
}: CareNoteAssistantProps) {
  const [input, setInput] = useState(initialText);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AssistantMode>('expand');
  const [tone, setTone] = useState<NoteTone>('professional');

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult('');

    try {
      if (mode === 'expand') {
        const res = await expandCareNote({ brief: input, tone });
        if (res.success) {
          setResult(res.data.expanded);
        } else {
          setError(res.error);
        }
      } else {
        const res = await correctCareNoteGrammar({ text: input });
        if (res.success) {
          setResult(res.data.corrected);
        } else {
          setError(res.error);
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [input, mode, tone]);

  const handleAccept = useCallback(() => {
    if (result && onAccept) {
      onAccept(result);
    }
  }, [result, onAccept]);

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('expand')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'expand'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Expand Note
        </button>
        <button
          type="button"
          onClick={() => setMode('grammar')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'grammar'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Fix Grammar
        </button>
      </div>

      {/* Tone selector (only for expand mode) */}
      {mode === 'expand' && (
        <div className="flex items-center gap-2">
          <label htmlFor="tone-select" className="text-sm font-medium">
            Tone:
          </label>
          <select
            id="tone-select"
            value={tone}
            onChange={(e) => setTone(e.target.value as NoteTone)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="professional">Professional</option>
            <option value="warm">Warm</option>
            <option value="clinical">Clinical</option>
          </select>
        </div>
      )}

      {/* Input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          mode === 'expand'
            ? 'Enter brief care note to expand...'
            : 'Paste care note to check grammar...'
        }
        rows={4}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !input.trim()}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : mode === 'expand' ? (
          'Expand Note'
        ) : (
          'Fix Grammar'
        )}
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

      {/* Result */}
      {result && (
        <div className="space-y-2">
          <div className="rounded-md border bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm">{result}</p>
          </div>
          {onAccept && (
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Accept & Use
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility components
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <svg
      className="mr-2 h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
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
  );
}
