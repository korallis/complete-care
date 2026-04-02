'use client';

import { useState } from 'react';
import type { QueryResult, SuggestedQuery } from '../types';

export function NlQueryInput({
  suggestedQueries,
  onExecute,
}: {
  suggestedQueries: SuggestedQuery[];
  onExecute: (query: string) => Promise<{ result?: QueryResult; error?: string }>;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(queryText: string) {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await onExecute(queryText);
    if (response.error) {
      setError(response.error);
    } else if (response.result) {
      setResult(response.result);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Query input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit(query);
          }}
          placeholder="Ask a question about your data..."
          className="flex-1 rounded-md border px-4 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => handleSubmit(query)}
          disabled={loading || !query.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Querying...' : 'Ask'}
        </button>
      </div>

      {/* Suggested queries */}
      {!result && !error && (
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((sq) => (
            <button
              key={sq.label}
              type="button"
              onClick={() => {
                setQuery(sq.queryText);
                handleSubmit(sq.queryText);
              }}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            >
              {sq.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Results table */}
      {result && (
        <div className="overflow-x-auto rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            {result.totalCount} result{result.totalCount !== 1 ? 's' : ''}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {result.columns.map((col) => (
                  <th key={col} className="px-4 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  {result.columns.map((col) => (
                    <td key={col} className="px-4 py-2">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
