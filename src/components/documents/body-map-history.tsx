'use client';

/**
 * BodyMapHistory — timeline of body map entries showing progression.
 */

import { Calendar, MapPin, User } from 'lucide-react';
import type { BodyMapEntryListItem } from '@/features/documents/actions';
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_COLOURS,
  BODY_REGION_LABELS,
  BODY_SIDE_LABELS,
  type EntryType,
  type BodyRegion,
  type BodySide,
} from '@/features/documents/constants';
import { formatDocumentDate } from '@/features/documents/schema';

type BodyMapHistoryProps = {
  entries: BodyMapEntryListItem[];
  onEntrySelect?: (entryId: string) => void;
  selectedEntryId?: string | null;
};

export function BodyMapHistory({
  entries,
  onEntrySelect,
  selectedEntryId,
}: BodyMapHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="mx-auto h-8 w-8 text-[oklch(0.7_0_0)]" />
        <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">
          No body map entries recorded.
        </p>
        <p className="text-xs text-[oklch(0.6_0_0)] mt-1">
          Click on the body map to add an observation.
        </p>
      </div>
    );
  }

  // Group entries by date
  const grouped = new Map<string, BodyMapEntryListItem[]>();
  for (const entry of entries) {
    const date = entry.dateObserved;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(entry);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[oklch(0.25_0.02_160)]">
        History ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
      </h3>

      <div className="space-y-4" role="list" aria-label="Body map history">
        {Array.from(grouped.entries()).map(([date, dateEntries]) => (
          <div key={date} role="listitem">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-[oklch(0.5_0_0)]" />
              <span className="text-xs font-medium text-[oklch(0.4_0_0)]">
                {formatDocumentDate(date)}
              </span>
            </div>

            <div className="space-y-2 pl-5 border-l-2 border-[oklch(0.9_0.02_160)]">
              {dateEntries.map((entry) => {
                const colour =
                  ENTRY_TYPE_COLOURS[entry.entryType as EntryType] ?? '#6b7280';
                const typeLabel =
                  ENTRY_TYPE_LABELS[entry.entryType as EntryType] ?? entry.entryType;
                const regionLabel =
                  BODY_REGION_LABELS[entry.bodyRegion as BodyRegion] ??
                  entry.bodyRegion;
                const sideLabel =
                  BODY_SIDE_LABELS[entry.side as BodySide] ?? entry.side;
                const isSelected = entry.id === selectedEntryId;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onEntrySelect?.(entry.id)}
                    className={`w-full text-left rounded-md border p-3 transition-all ${
                      isSelected
                        ? 'border-[oklch(0.45_0.06_160)] bg-[oklch(0.97_0.01_160)] shadow-sm'
                        : 'border-[oklch(0.88_0.02_160)] hover:border-[oklch(0.75_0.04_160)] hover:bg-[oklch(0.98_0.005_160)]'
                    }`}
                    aria-label={`${typeLabel} on ${regionLabel} (${sideLabel})`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colour }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[oklch(0.3_0.02_160)]">
                            {typeLabel}
                          </span>
                          <span className="text-xs text-[oklch(0.55_0_0)]">
                            {regionLabel} ({sideLabel})
                          </span>
                        </div>
                        <p className="text-xs text-[oklch(0.4_0_0)] mt-1 line-clamp-2">
                          {entry.description}
                        </p>
                        {entry.createdByName && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <User className="h-3 w-3 text-[oklch(0.6_0_0)]" />
                            <span className="text-xs text-[oklch(0.55_0_0)]">
                              {entry.createdByName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
