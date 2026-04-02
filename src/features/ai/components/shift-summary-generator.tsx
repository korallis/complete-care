'use client';

import { useState, useCallback } from 'react';
import { generateShiftSummary } from '@/features/ai/actions/care-notes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftNote {
  time: string;
  author: string;
  content: string;
}

interface ShiftSummaryGeneratorProps {
  /** Pre-populated shift notes (e.g. from the current shift). */
  notes?: ShiftNote[];
  /** Optional CSS class name for the root container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI Shift Summary Generator — compiles care notes from a shift into
 * a structured handover summary.
 */
export function ShiftSummaryGenerator({
  notes: initialNotes = [],
  className,
}: ShiftSummaryGeneratorProps) {
  const [notes, setNotes] = useState<ShiftNote[]>(initialNotes);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New note form state
  const [newTime, setNewTime] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newContent, setNewContent] = useState('');

  const addNote = useCallback(() => {
    if (!newTime.trim() || !newAuthor.trim() || !newContent.trim()) return;
    setNotes((prev) => [
      ...prev,
      { time: newTime, author: newAuthor, content: newContent },
    ]);
    setNewTime('');
    setNewAuthor('');
    setNewContent('');
  }, [newTime, newAuthor, newContent]);

  const removeNote = useCallback((index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (notes.length === 0) return;

    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const res = await generateShiftSummary({ notes });
      if (res.success) {
        setSummary(res.data.summary);
      } else {
        setError(res.error);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [notes]);

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <h3 className="text-lg font-semibold">Shift Summary Generator</h3>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Shift Notes ({notes.length})
          </h4>
          <div className="space-y-2">
            {notes.map((note, i) => (
              <div
                key={`${note.time}-${i}`}
                className="flex items-start gap-2 rounded-md border bg-muted/30 p-3"
              >
                <div className="flex-1 text-sm">
                  <span className="font-medium">
                    [{note.time}] {note.author}:
                  </span>{' '}
                  {note.content}
                </div>
                <button
                  type="button"
                  onClick={() => removeNote(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove note ${i + 1}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add note form */}
      <div className="space-y-2 rounded-md border p-4">
        <h4 className="text-sm font-medium">Add Note</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="Time (e.g. 08:30)"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author name"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Note content..."
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={!newTime.trim() || !newAuthor.trim() || !newContent.trim()}
          className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          Add Note
        </button>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || notes.length === 0}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Generating Summary...
          </>
        ) : (
          'Generate Shift Summary'
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

      {/* Summary output */}
      {summary && (
        <div className="rounded-md border bg-muted/50 p-4">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {summary}
          </div>
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
