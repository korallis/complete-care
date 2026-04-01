'use client';

/**
 * CareNoteCard — renders a single care note in the timeline.
 * Shows structured data (mood, personal care, nutrition) and narrative.
 */

import { Badge } from '@/components/ui/badge';
import type { CareNoteListItem } from '@/features/care-notes/actions';
import {
  MOOD_LABELS,
  SHIFT_LABELS,
  PORTION_LABELS,
  NOTE_TYPE_LABELS,
  getMoodVariant,
  formatNoteDate,
  formatNoteTime,
} from '@/features/care-notes/schema';
import type { PersonalCareItem, NutritionData } from '@/lib/db/schema/care-notes';

// ---------------------------------------------------------------------------
// Sub-components for structured data
// ---------------------------------------------------------------------------

function PersonalCareDisplay({ data }: { data: PersonalCareItem }) {
  const items = [
    { label: 'Washed', done: data.washed },
    { label: 'Dressed', done: data.dressed },
    { label: 'Oral care', done: data.oralCare },
  ];

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
        Personal Care
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              item.done
                ? 'bg-[oklch(0.94_0.04_160)] text-[oklch(0.3_0.08_160)]'
                : 'bg-[oklch(0.96_0_0)] text-[oklch(0.5_0_0)]'
            }`}
          >
            <span aria-hidden="true">{item.done ? '\u2713' : '\u2013'}</span>
            {item.label}
          </span>
        ))}
      </div>
      {data.notes && (
        <p className="text-xs text-[oklch(0.5_0_0)] mt-1">{data.notes}</p>
      )}
    </div>
  );
}

function NutritionDisplay({ data }: { data: NutritionData }) {
  const meals = [
    { label: 'Breakfast', meal: data.breakfast },
    { label: 'Lunch', meal: data.lunch },
    { label: 'Dinner', meal: data.dinner },
  ].filter((m) => m.meal?.offered);

  if (meals.length === 0 && !data.fluidsNote) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
        Nutrition
      </h4>
      {meals.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {meals.map(({ label, meal }) => (
            <div key={label} className="text-xs">
              <span className="font-medium text-[oklch(0.35_0_0)]">
                {label}:
              </span>{' '}
              <span className="text-[oklch(0.5_0_0)]">
                {PORTION_LABELS[meal!.portionConsumed] ?? meal!.portionConsumed}
              </span>
              {meal!.notes && (
                <span className="text-[oklch(0.6_0_0)]">
                  {' '}
                  - {meal!.notes}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {data.fluidsNote && (
        <p className="text-xs text-[oklch(0.5_0_0)]">
          Fluids: {data.fluidsNote}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

type CareNoteCardProps = {
  note: CareNoteListItem;
};

export function CareNoteCard({ note }: CareNoteCardProps) {
  return (
    <article
      className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 space-y-3"
      aria-label={`Care note by ${note.authorName ?? 'Unknown'} on ${formatNoteDate(note.createdAt)}`}
    >
      {/* Header: author, time, badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[oklch(0.22_0.04_160)]">
              {note.authorName ?? 'Unknown author'}
            </span>
            <span className="text-xs text-[oklch(0.55_0_0)]">
              {formatNoteDate(note.createdAt)} at{' '}
              {formatNoteTime(note.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {note.shift && (
            <Badge variant="outline" className="text-[10px]">
              {SHIFT_LABELS[note.shift] ?? note.shift}
            </Badge>
          )}
          {note.noteType && note.noteType !== 'daily' && (
            <Badge variant="secondary" className="text-[10px]">
              {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
            </Badge>
          )}
          {note.mood && (
            <Badge variant={getMoodVariant(note.mood)} className="text-[10px]">
              {MOOD_LABELS[note.mood] ?? note.mood}
            </Badge>
          )}
        </div>
      </div>

      {/* Narrative content */}
      <p className="text-sm text-[oklch(0.35_0_0)] whitespace-pre-wrap leading-relaxed">
        {note.content}
      </p>

      {/* Structured observation fields */}
      <div className="space-y-2 pt-1">
        {note.personalCare && (
          <PersonalCareDisplay data={note.personalCare as PersonalCareItem} />
        )}
        {note.nutrition && (
          <NutritionDisplay data={note.nutrition as NutritionData} />
        )}
        {note.mobility && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Mobility
            </h4>
            <p className="text-xs text-[oklch(0.5_0_0)]">{note.mobility}</p>
          </div>
        )}
        {note.health && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Health Observations
            </h4>
            <p className="text-xs text-[oklch(0.5_0_0)]">{note.health}</p>
          </div>
        )}
        {note.handover && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Handover Points
            </h4>
            <p className="text-xs text-[oklch(0.5_0_0)]">{note.handover}</p>
          </div>
        )}
      </div>
    </article>
  );
}
