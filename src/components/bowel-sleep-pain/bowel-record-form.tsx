'use client';

/**
 * BowelRecordForm — record a bowel movement with Bristol type, colour, and flags.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  STOOL_COLOURS,
  STOOL_COLOUR_LABELS,
  ALERT_COLOURS,
  ALERT_COLOUR_MESSAGES,
  type BristolType,
  type StoolColour,
} from '@/features/bowel-sleep-pain/constants';
import type { RecordBowelEntryInput } from '@/features/bowel-sleep-pain/schema';
import { BristolStoolChart } from './bristol-stool-chart';

type BowelRecordFormProps = {
  personId: string;
  onSubmit: (
    input: RecordBowelEntryInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

const inputClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';
const labelClass = 'block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1';
const selectClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';

export function BowelRecordForm({ personId, onSubmit }: BowelRecordFormProps) {
  const [isPending, startTransition] = useTransition();

  const [bristolType, setBristolType] = useState<BristolType | null>(null);
  const [colour, setColour] = useState<StoolColour>('brown');
  const [bloodPresent, setBloodPresent] = useState(false);
  const [mucusPresent, setMucusPresent] = useState(false);
  const [laxativeGiven, setLaxativeGiven] = useState(false);
  const [laxativeName, setLaxativeName] = useState('');
  const [notes, setNotes] = useState('');

  // Colour alert
  const colourAlert = (ALERT_COLOURS as readonly string[]).includes(colour)
    ? ALERT_COLOUR_MESSAGES[colour]
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bristolType) {
      toast.error('Please select a Bristol Stool type');
      return;
    }

    startTransition(async () => {
      const input: RecordBowelEntryInput = {
        personId,
        bristolType,
        colour,
        bloodPresent,
        mucusPresent,
        laxativeGiven,
        laxativeName: laxativeGiven ? laxativeName || null : null,
        notes: notes || null,
        recordedAt: new Date().toISOString(),
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success('Bowel movement recorded');
        setBristolType(null);
        setColour('brown');
        setBloodPresent(false);
        setMucusPresent(false);
        setLaxativeGiven(false);
        setLaxativeName('');
        setNotes('');
      } else {
        toast.error(result.error ?? 'Failed to record bowel entry');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        Record Bowel Movement
      </h3>

      {/* Bristol Stool Scale */}
      <BristolStoolChart value={bristolType} onChange={setBristolType} />

      {/* Colour */}
      <div>
        <label htmlFor="stool-colour" className={labelClass}>
          Colour
        </label>
        <select
          id="stool-colour"
          value={colour}
          onChange={(e) => setColour(e.target.value as StoolColour)}
          className={selectClass}
        >
          {STOOL_COLOURS.map((c) => (
            <option key={c} value={c}>
              {STOOL_COLOUR_LABELS[c]}
            </option>
          ))}
        </select>
        {colourAlert && (
          <div
            role="alert"
            className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800"
          >
            {colourAlert}
          </div>
        )}
      </div>

      {/* Blood / Mucus flags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id="blood-present"
            type="checkbox"
            checked={bloodPresent}
            onChange={(e) => setBloodPresent(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="blood-present"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            Blood present
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="mucus-present"
            type="checkbox"
            checked={mucusPresent}
            onChange={(e) => setMucusPresent(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="mucus-present"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            Mucus present
          </label>
        </div>
      </div>

      {/* Laxative */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="laxative-given"
            type="checkbox"
            checked={laxativeGiven}
            onChange={(e) => setLaxativeGiven(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="laxative-given"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            Laxative given
          </label>
        </div>
        {laxativeGiven && (
          <div>
            <label htmlFor="laxative-name" className={labelClass}>
              Laxative Name
            </label>
            <input
              id="laxative-name"
              type="text"
              value={laxativeName}
              onChange={(e) => setLaxativeName(e.target.value)}
              placeholder="e.g. Lactulose 15ml"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="bowel-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="bowel-notes"
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
        disabled={isPending || !bristolType}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : 'Record Bowel Movement'}
      </button>
    </form>
  );
}
