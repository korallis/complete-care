'use client';

/**
 * BodyMap — Full interactive body map component.
 *
 * Combines the SVG body map, entry form, and history timeline.
 * Supports front/back toggle, click-to-mark, and entry selection.
 */

import { useState, useTransition } from 'react';
import { BodyMapSVG } from './body-map-svg';
import { BodyMapEntryForm } from './body-map-entry-form';
import { BodyMapHistory } from './body-map-history';
import type { BodyMapEntryListResult } from '@/features/documents/actions';
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_COLOURS,
  type BodySide,
  detectBodyRegion,
} from '@/features/documents/constants';

type BodyMapProps = {
  initialData: BodyMapEntryListResult;
  personId: string;
  orgSlug: string;
  canCreate: boolean;
  onFilter: (filters: {
    personId?: string;
    entryType?: string;
    side?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<BodyMapEntryListResult>;
};

export function BodyMap({
  initialData,
  personId,
  canCreate,
  onFilter,
}: BodyMapProps) {
  const [data, setData] = useState(initialData);
  const [side, setSide] = useState<BodySide>('front');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [pendingMark, setPendingMark] = useState<{
    xPercent: number;
    yPercent: number;
  } | null>(null);
  const [filterType, setFilterType] = useState('');
  const [isPending, startTransition] = useTransition();

  function refreshData(typeFilter?: string) {
    startTransition(async () => {
      const result = await onFilter({
        personId,
        entryType: typeFilter || undefined,
        page: 1,
        pageSize: 50,
      });
      setData(result);
    });
  }

  function handleSVGClick(xPercent: number, yPercent: number) {
    if (!canCreate) return;
    setSelectedEntryId(null);
    setPendingMark({ xPercent, yPercent });
  }

  function handleEntrySuccess() {
    setPendingMark(null);
    refreshData(filterType);
  }

  function handleEntryCancel() {
    setPendingMark(null);
  }

  function handleEntrySelect(entryId: string) {
    setSelectedEntryId(entryId === selectedEntryId ? null : entryId);
    setPendingMark(null);

    // Switch to the correct side if needed
    const entry = data.entries.find((e) => e.id === entryId);
    if (entry && entry.side !== side) {
      setSide(entry.side as BodySide);
    }
  }

  function handleFilterType(value: string) {
    setFilterType(value);
    refreshData(value);
  }

  const bodyRegion = pendingMark
    ? detectBodyRegion(pendingMark.xPercent, pendingMark.yPercent, side)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[oklch(0.25_0.02_160)]">
          Body Map
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {data.totalCount} {data.totalCount === 1 ? 'entry' : 'entries'} recorded
          {canCreate && ' — click on the body to add a new observation'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG + controls column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Side toggle + type filter */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md border border-input" role="radiogroup" aria-label="Body view">
              <button
                type="button"
                role="radio"
                aria-checked={side === 'front'}
                onClick={() => setSide('front')}
                className={`px-4 py-1.5 text-sm font-medium rounded-l-md transition-colors ${
                  side === 'front'
                    ? 'bg-[oklch(0.35_0.06_160)] text-white'
                    : 'hover:bg-[oklch(0.95_0.02_160)]'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={side === 'back'}
                onClick={() => setSide('back')}
                className={`px-4 py-1.5 text-sm font-medium rounded-r-md transition-colors ${
                  side === 'back'
                    ? 'bg-[oklch(0.35_0.06_160)] text-white'
                    : 'hover:bg-[oklch(0.95_0.02_160)]'
                }`}
              >
                Back
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="filter-entry-type" className="text-xs text-[oklch(0.5_0_0)]">
                Filter:
              </label>
              <select
                id="filter-entry-type"
                value={filterType}
                onChange={(e) => handleFilterType(e.target.value)}
                disabled={isPending}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">All types</option>
                {ENTRY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ENTRY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3" aria-label="Entry type legend">
            {ENTRY_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ENTRY_TYPE_COLOURS[type] }}
                  aria-hidden="true"
                />
                <span className="text-xs text-[oklch(0.5_0_0)]">
                  {ENTRY_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>

          {/* Body Map SVG */}
          <div className="rounded-lg border border-[oklch(0.88_0.02_160)] bg-white p-4">
            <BodyMapSVG
              side={side}
              entries={data.entries}
              onClick={canCreate ? handleSVGClick : undefined}
              selectedEntryId={selectedEntryId}
              interactive={canCreate}
            />
          </div>

          {/* Entry form (shown when a click position is pending) */}
          {pendingMark && bodyRegion && canCreate && (
            <BodyMapEntryForm
              personId={personId}
              xPercent={pendingMark.xPercent}
              yPercent={pendingMark.yPercent}
              side={side}
              bodyRegion={bodyRegion}
              onSuccess={handleEntrySuccess}
              onCancel={handleEntryCancel}
            />
          )}
        </div>

        {/* History column */}
        <div className="lg:col-span-1">
          <BodyMapHistory
            entries={data.entries}
            onEntrySelect={handleEntrySelect}
            selectedEntryId={selectedEntryId}
          />
        </div>
      </div>
    </div>
  );
}
