'use client';

/**
 * SleepCheckForm — record a night-time sleep/rest check.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  SLEEP_STATUSES,
  SLEEP_STATUS_LABELS,
  SLEEP_POSITIONS,
  SLEEP_POSITION_LABELS,
  BED_RAILS_OPTIONS,
  BED_RAILS_LABELS,
  type SleepStatus,
  type SleepPosition,
  type BedRailsStatus,
} from '@/features/bowel-sleep-pain/constants';
import type { RecordSleepCheckInput } from '@/features/bowel-sleep-pain/schema';

type SleepCheckFormProps = {
  personId: string;
  onSubmit: (
    input: RecordSleepCheckInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

const labelClass = 'block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1';
const selectClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';
const inputClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';

export function SleepCheckForm({ personId, onSubmit }: SleepCheckFormProps) {
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<SleepStatus>('asleep');
  const [position, setPosition] = useState<SleepPosition>('left');
  const [repositioned, setRepositioned] = useState(false);
  const [nightWandering, setNightWandering] = useState(false);
  const [bedRails, setBedRails] = useState<BedRailsStatus>('not_applicable');
  const [callBellChecked, setCallBellChecked] = useState(false);
  const [notes, setNotes] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const input: RecordSleepCheckInput = {
        personId,
        checkTime: new Date().toISOString(),
        status,
        position,
        repositioned,
        nightWandering,
        bedRails,
        callBellChecked,
        notes: notes || null,
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success('Sleep check recorded');
        setNotes('');
        setRepositioned(false);
        setNightWandering(false);
        setCallBellChecked(false);
      } else {
        toast.error(result.error ?? 'Failed to record sleep check');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        Record Sleep Check
      </h3>

      {/* Status */}
      <div>
        <label htmlFor="sleep-status" className={labelClass}>
          Status
        </label>
        <select
          id="sleep-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as SleepStatus)}
          className={selectClass}
        >
          {SLEEP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SLEEP_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Position */}
      <div>
        <label htmlFor="sleep-position" className={labelClass}>
          Position
        </label>
        <select
          id="sleep-position"
          value={position}
          onChange={(e) => setPosition(e.target.value as SleepPosition)}
          className={selectClass}
        >
          {SLEEP_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {SLEEP_POSITION_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id="repositioned"
            type="checkbox"
            checked={repositioned}
            onChange={(e) => setRepositioned(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="repositioned"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            Repositioned
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="night-wandering"
            type="checkbox"
            checked={nightWandering}
            onChange={(e) => setNightWandering(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="night-wandering"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            Night wandering observed
          </label>
        </div>
      </div>

      {/* Bed Rails */}
      <div>
        <label htmlFor="bed-rails" className={labelClass}>
          Bed Rails
        </label>
        <select
          id="bed-rails"
          value={bedRails}
          onChange={(e) => setBedRails(e.target.value as BedRailsStatus)}
          className={selectClass}
        >
          {BED_RAILS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {BED_RAILS_LABELS[opt]}
            </option>
          ))}
        </select>
      </div>

      {/* Call Bell */}
      <div className="flex items-center gap-2">
        <input
          id="call-bell-checked"
          type="checkbox"
          checked={callBellChecked}
          onChange={(e) => setCallBellChecked(e.target.checked)}
          className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
        />
        <label
          htmlFor="call-bell-checked"
          className="text-xs text-[oklch(0.4_0.02_160)]"
        >
          Call bell checked and within reach
        </label>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="sleep-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="sleep-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional observations..."
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : 'Record Sleep Check'}
      </button>
    </form>
  );
}
