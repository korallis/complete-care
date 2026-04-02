'use client';

import { useState } from 'react';
import {
  RESTRICTIVE_PRACTICE_TYPES,
  RESTRICTIVE_PRACTICE_TYPE_LABELS,
  type CreateRestrictivePracticeInput,
} from '../schema';
import type { RestrictivePractice } from '@/lib/db/schema/pbs';

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

interface FiltersState {
  personId: string;
  type: string;
  from: string;
  to: string;
}

interface RestrictivePracticesRegisterProps {
  entries: RestrictivePractice[];
  /** If provided, the register is scoped to one person */
  personId?: string;
  onFilter: (filters: FiltersState) => void;
  onAdd: (data: CreateRestrictivePracticeInput) => Promise<void>;
  onEdit: (originalId: string) => void;
}

export function RestrictivePracticesRegister({
  entries,
  personId,
  onFilter,
  onAdd,
  onEdit,
}: RestrictivePracticesRegisterProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    personId: personId ?? '',
    type: '',
    from: '',
    to: '',
  });

  function handleFilterChange(key: keyof FiltersState, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data: CreateRestrictivePracticeInput = {
      personId: personId ?? (fd.get('personId') as string),
      type: fd.get('type') as CreateRestrictivePracticeInput['type'],
      justification: fd.get('justification') as string,
      mcaLink: (fd.get('mcaLink') as string) || undefined,
      authorisedBy: fd.get('authorisedBy') as string,
      durationMinutes: Number(fd.get('durationMinutes')),
      personResponse: fd.get('personResponse') as string,
      occurredAt: fd.get('occurredAt') as string,
    };

    try {
      await onAdd(data);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors';
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1';

  const typeBadgeColour: Record<string, string> = {
    physical: 'bg-red-100 text-red-800',
    environmental: 'bg-amber-100 text-amber-800',
    chemical: 'bg-purple-100 text-purple-800',
    mechanical: 'bg-slate-200 text-slate-800',
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {!personId && (
            <div>
              <label className={labelClass}>Person ID</label>
              <input
                className={inputClass}
                placeholder="Filter by person..."
                value={filters.personId}
                onChange={(e) =>
                  handleFilterChange('personId', e.target.value)
                }
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Type</label>
            <select
              className={inputClass}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All types</option>
              {RESTRICTIVE_PRACTICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RESTRICTIVE_PRACTICE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>From</label>
            <input
              type="date"
              className={inputClass}
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input
              type="date"
              className={inputClass}
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Record Practice'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Type</label>
              <select name="type" className={inputClass} required>
                <option value="">Select type...</option>
                {RESTRICTIVE_PRACTICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RESTRICTIVE_PRACTICE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date &amp; Time</label>
              <input
                name="occurredAt"
                type="datetime-local"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Authorised By</label>
              <input
                name="authorisedBy"
                className={inputClass}
                placeholder="Name of authorising person"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Duration (minutes)</label>
              <input
                name="durationMinutes"
                type="number"
                min="1"
                className={inputClass}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Justification</label>
            <textarea
              name="justification"
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Why was this practice necessary..."
              required
            />
          </div>
          <div>
            <label className={labelClass}>MCA Link (optional)</label>
            <input
              name="mcaLink"
              className={inputClass}
              placeholder="Reference to Mental Capacity Assessment"
            />
          </div>
          <div>
            <label className={labelClass}>Person&apos;s Response</label>
            <textarea
              name="personResponse"
              className={`${inputClass} min-h-[60px] resize-y`}
              placeholder="How the person responded..."
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Justification
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Authorised By
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Duration
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Response
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ver.
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No restrictive practice entries found.
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                    {new Date(entry.occurredAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeColour[entry.type] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {RESTRICTIVE_PRACTICE_TYPE_LABELS[
                        entry.type as keyof typeof RESTRICTIVE_PRACTICE_TYPE_LABELS
                      ] ?? entry.type}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                    {entry.justification}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {entry.authorisedBy}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {entry.durationMinutes} min
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-700">
                    {entry.personResponse}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-500">
                    v{entry.versionNumber}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEdit(entry.id)}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                    >
                      Edit (new version)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
