'use client';

/**
 * BodyMapEntryForm — annotation form for placing body map markers.
 *
 * Captures entry type, description, date observed, and optional incident link.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MapPin, X } from 'lucide-react';
import { createBodyMapEntry } from '@/features/documents/actions';
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  BODY_REGION_LABELS,
  type EntryType,
  type BodyRegion,
} from '@/features/documents/constants';
import type { BodySide } from '@/features/documents/constants';

type BodyMapEntryFormProps = {
  personId: string;
  xPercent: number;
  yPercent: number;
  side: BodySide;
  bodyRegion: BodyRegion;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function BodyMapEntryForm({
  personId,
  xPercent,
  yPercent,
  side,
  bodyRegion,
  onSuccess,
  onCancel,
}: BodyMapEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [entryType, setEntryType] = useState<EntryType>('mark');
  const [description, setDescription] = useState('');
  const [dateObserved, setDateObserved] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    startTransition(async () => {
      const result = await createBodyMapEntry({
        personId,
        bodyRegion,
        side,
        xPercent,
        yPercent,
        entryType,
        description: description.trim(),
        dateObserved,
      });

      if (result.success) {
        toast.success('Body map entry recorded');
        setDescription('');
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(result.error);
        setError(result.error);
      }
    });
  }

  const regionLabel = BODY_REGION_LABELS[bodyRegion] ?? bodyRegion;

  return (
    <div className="rounded-lg border border-[oklch(0.85_0.02_160)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[oklch(0.25_0.02_160)] flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[oklch(0.45_0.06_160)]" />
          New Entry — {regionLabel}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 hover:bg-[oklch(0.95_0.02_160)] transition-colors"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-[oklch(0.55_0_0)] mb-3">
        Position: {xPercent.toFixed(1)}%, {yPercent.toFixed(1)}% ({side} view)
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Entry type */}
        <div className="space-y-1">
          <label
            htmlFor="entry-type"
            className="text-xs font-medium text-[oklch(0.45_0_0)]"
          >
            Type
          </label>
          <select
            id="entry-type"
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as EntryType)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {ENTRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {ENTRY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label
            htmlFor="entry-description"
            className="text-xs font-medium text-[oklch(0.45_0_0)]"
          >
            Description
          </label>
          <textarea
            id="entry-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the observation..."
            rows={3}
            maxLength={2000}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        {/* Date observed */}
        <div className="space-y-1">
          <label
            htmlFor="entry-date"
            className="text-xs font-medium text-[oklch(0.45_0_0)]"
          >
            Date Observed
          </label>
          <input
            id="entry-date"
            type="date"
            value={dateObserved}
            onChange={(e) => setDateObserved(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !description.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.35_0.06_160)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[oklch(0.3_0.06_160)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Entry'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="inline-flex items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-[oklch(0.95_0.02_160)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
