'use client';

/**
 * CareNoteTimeline — chronological feed of care notes with filters.
 *
 * Renders a filterable, paginated list of CareNoteCards.
 * Filters: author, shift, category (noteType), date range.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CareNoteCard } from './care-note-card';
import type { CareNoteListResult } from '@/features/care-notes/actions';
import {
  SHIFT_OPTIONS,
  SHIFT_LABELS,
  NOTE_TYPE_OPTIONS,
  NOTE_TYPE_LABELS,
} from '@/features/care-notes/schema';

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

type FilterState = {
  shift: string;
  noteType: string;
  dateFrom: string;
  dateTo: string;
};

type FilterBarProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  disabled?: boolean;
};

function FilterBar({ filters, onChange, disabled }: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap gap-3 items-end"
      role="search"
      aria-label="Filter care notes"
    >
      {/* Shift filter */}
      <div className="space-y-1">
        <label
          htmlFor="filter-shift"
          className="text-xs font-medium text-[oklch(0.45_0_0)]"
        >
          Shift
        </label>
        <select
          id="filter-shift"
          value={filters.shift}
          onChange={(e) => onChange({ ...filters, shift: e.target.value })}
          disabled={disabled}
          className="flex h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All shifts</option>
          {SHIFT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SHIFT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div className="space-y-1">
        <label
          htmlFor="filter-type"
          className="text-xs font-medium text-[oklch(0.45_0_0)]"
        >
          Category
        </label>
        <select
          id="filter-type"
          value={filters.noteType}
          onChange={(e) => onChange({ ...filters, noteType: e.target.value })}
          disabled={disabled}
          className="flex h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All types</option>
          {NOTE_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {NOTE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="space-y-1">
        <label
          htmlFor="filter-date-from"
          className="text-xs font-medium text-[oklch(0.45_0_0)]"
        >
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          disabled={disabled}
          className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Date to */}
      <div className="space-y-1">
        <label
          htmlFor="filter-date-to"
          className="text-xs font-medium text-[oklch(0.45_0_0)]"
        >
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          disabled={disabled}
          className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Clear filters */}
      {(filters.shift || filters.noteType || filters.dateFrom || filters.dateTo) && (
        <button
          type="button"
          onClick={() =>
            onChange({ shift: '', noteType: '', dateFrom: '', dateTo: '' })
          }
          disabled={disabled}
          className="h-9 px-3 text-xs text-[oklch(0.5_0_0)] hover:text-[oklch(0.3_0.06_160)] transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function Pagination({ page, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 pt-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-[oklch(0.97_0_0)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>
      <span className="text-sm text-[oklch(0.5_0_0)]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-[oklch(0.97_0_0)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

type TimelineFilterInput = {
  personId?: string;
  shift?: string;
  noteType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

type CareNoteTimelineProps = {
  initialData: CareNoteListResult;
  personId: string;
  orgSlug: string;
  canCreate: boolean;
  onFilter: (filters: TimelineFilterInput) => Promise<CareNoteListResult>;
};

export function CareNoteTimeline({
  initialData,
  personId,
  orgSlug,
  canCreate,
  onFilter,
}: CareNoteTimelineProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<FilterState>({
    shift: '',
    noteType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [isPending, startTransition] = useTransition();

  function applyFilters(newFilters: FilterState, page = 1) {
    setFilters(newFilters);
    startTransition(async () => {
      const result = await onFilter({
        personId,
        shift: newFilters.shift || undefined,
        noteType: newFilters.noteType || undefined,
        dateFrom: newFilters.dateFrom || undefined,
        dateTo: newFilters.dateTo || undefined,
        page,
        pageSize: 25,
      });
      setData(result);
    });
  }

  function handlePageChange(newPage: number) {
    startTransition(async () => {
      const result = await onFilter({
        personId,
        shift: filters.shift || undefined,
        noteType: filters.noteType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: newPage,
        pageSize: 25,
      });
      setData(result);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Care Notes
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            {data.totalCount} note{data.totalCount !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/care-notes/new`}
            className="inline-flex items-center justify-center rounded-md bg-[oklch(0.45_0.1_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.4_0.1_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            Add Note
          </Link>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={(f) => applyFilters(f)}
        disabled={isPending}
      />

      {/* Timeline */}
      {isPending && (
        <div className="text-sm text-[oklch(0.55_0_0)] py-4 text-center">
          Loading...
        </div>
      )}

      {data.notes.length === 0 && !isPending ? (
        <div className="text-center py-12 text-[oklch(0.55_0_0)]">
          <p className="text-sm">No care notes found.</p>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/care-notes/new`}
              className="text-sm text-[oklch(0.45_0.1_160)] hover:underline mt-2 inline-block"
            >
              Create the first note
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4" role="feed" aria-label="Care notes timeline">
          {data.notes.map((note) => (
            <CareNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
        disabled={isPending}
      />
    </div>
  );
}
