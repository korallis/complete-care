'use client';

/**
 * CareNoteForm — structured daily care note creation form.
 *
 * Sections: mood, personal care, nutrition, mobility, health, handover, narrative.
 * Uses react-hook-form + zod for validation.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  buildChildrenHomeHandoverSummary,
  createCareNoteSchema,
} from '@/features/care-notes/schema';
import type { CreateCareNoteInput } from '@/features/care-notes/schema';
import {
  MOOD_OPTIONS,
  MOOD_LABELS,
  SHIFT_OPTIONS,
  SHIFT_LABELS,
  PORTION_OPTIONS,
  PORTION_LABELS,
  NOTE_TYPE_OPTIONS,
  NOTE_TYPE_LABELS,
} from '@/features/care-notes/schema';
import type { CareNote, ChildrenHomeDetails } from '@/lib/db/schema/care-notes';

/** Input type for the form (before Zod defaults are applied) */
type FormInput = z.input<typeof createCareNoteSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CareNoteFormProps = {
  personId: string;
  orgSlug: string;
  onSubmit: (
    data: CreateCareNoteInput,
  ) => Promise<{ success: boolean; error?: string; data?: CareNote }>;
};

// ---------------------------------------------------------------------------
// Meal input sub-component
// ---------------------------------------------------------------------------

type MealInputProps = {
  label: string;
  mealKey: 'breakfast' | 'lunch' | 'dinner';
  offered: boolean;
  portionConsumed: string;
  notes: string;
  onOfferedChange: (v: boolean) => void;
  onPortionChange: (v: string) => void;
  onNotesChange: (v: string) => void;
};

function MealInput({
  label,
  offered,
  portionConsumed,
  notes,
  onOfferedChange,
  onPortionChange,
  onNotesChange,
}: MealInputProps) {
  return (
    <div className="space-y-2 rounded-lg border border-[oklch(0.93_0_0)] p-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={offered}
            onChange={(e) => onOfferedChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm font-medium text-[oklch(0.3_0_0)]">
            {label}
          </span>
        </label>
      </div>
      {offered && (
        <div className="space-y-2 pl-6">
          <div className="space-y-1">
            <label className="text-xs text-[oklch(0.5_0_0)]">
              Portion consumed
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PORTION_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPortionChange(p)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    portionConsumed === p
                      ? 'bg-[oklch(0.45_0.1_160)] text-white border-[oklch(0.45_0.1_160)]'
                      : 'border-input hover:bg-[oklch(0.97_0_0)]'
                  }`}
                >
                  {PORTION_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notes (e.g. ate well, needed encouragement)"
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export function CareNoteForm({ personId, orgSlug, onSubmit }: CareNoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Nutrition state (managed separately for easier UI)
  const [breakfastOffered, setBreakfastOffered] = useState(false);
  const [breakfastPortion, setBreakfastPortion] = useState('none');
  const [breakfastNotes, setBreakfastNotes] = useState('');
  const [lunchOffered, setLunchOffered] = useState(false);
  const [lunchPortion, setLunchPortion] = useState('none');
  const [lunchNotes, setLunchNotes] = useState('');
  const [dinnerOffered, setDinnerOffered] = useState(false);
  const [dinnerPortion, setDinnerPortion] = useState('none');
  const [dinnerNotes, setDinnerNotes] = useState('');
  const [fluidsNote, setFluidsNote] = useState('');

  // Personal care state
  const [washed, setWashed] = useState(false);
  const [dressed, setDressed] = useState(false);
  const [oralCare, setOralCare] = useState(false);
  const [personalCareNotes, setPersonalCareNotes] = useState('');
  const [activities, setActivities] = useState('');
  const [incidentSummary, setIncidentSummary] = useState('');
  const [visitorSummary, setVisitorSummary] = useState('');
  const [contactSummary, setContactSummary] = useState('');
  const [educationAttendance, setEducationAttendance] = useState('');
  const [bedtime, setBedtime] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createCareNoteSchema),
    defaultValues: {
      personId,
      noteType: 'daily',
      content: '',
    },
  });

  const watchedShift = watch('shift');
  const watchedMood = watch('mood');
  const watchedHealth = watch('health');
  const watchedMobility = watch('mobility');
  const watchedHandover = watch('handover');

  function doSubmit(formData: FormInput) {
    setServerError(null);

    // Merge nutrition state
    const hasNutrition =
      breakfastOffered || lunchOffered || dinnerOffered || fluidsNote;

    type PortionType = 'none' | 'quarter' | 'half' | 'three_quarters' | 'all';

    const nutrition = hasNutrition
      ? {
          breakfast: breakfastOffered
            ? {
                offered: true as const,
                portionConsumed: breakfastPortion as PortionType,
                notes: breakfastNotes || undefined,
              }
            : undefined,
          lunch: lunchOffered
            ? {
                offered: true as const,
                portionConsumed: lunchPortion as PortionType,
                notes: lunchNotes || undefined,
              }
            : undefined,
          dinner: dinnerOffered
            ? {
                offered: true as const,
                portionConsumed: dinnerPortion as PortionType,
                notes: dinnerNotes || undefined,
              }
            : undefined,
          fluidsNote: fluidsNote || undefined,
        }
      : undefined;

    // Merge personal care state
    const hasPersonalCare = washed || dressed || oralCare || personalCareNotes;
    const personalCare = hasPersonalCare
      ? {
          washed,
          dressed,
          oralCare,
          notes: personalCareNotes || undefined,
        }
      : undefined;

    const hasChildrenHomeDetails =
      activities ||
      incidentSummary ||
      visitorSummary ||
      contactSummary ||
      educationAttendance ||
      bedtime;

    const childrenHomeDetails: ChildrenHomeDetails | undefined = hasChildrenHomeDetails
      ? {
          activities: activities || undefined,
          incidents: incidentSummary || undefined,
          visitors: visitorSummary || undefined,
          contacts: contactSummary || undefined,
          educationAttendance: educationAttendance || undefined,
          bedtime: bedtime || undefined,
        }
      : undefined;

    const input = {
      ...formData,
      personalCare,
      nutrition,
      childrenHomeDetails,
    } as CreateCareNoteInput;

    startTransition(async () => {
      const result = await onSubmit(input);
      if (result.success) {
        toast.success('Care note created');
        router.push(`/${orgSlug}/persons/${personId}/care-notes`);
      } else {
        setServerError(result.error ?? 'Failed to create care note');
        toast.error(result.error ?? 'Failed to create care note');
      }
    });
  }

  const handoverPreview = buildChildrenHomeHandoverSummary({
    shift: watchedShift,
    mood: watchedMood,
    health: watchedHealth,
    mobility: watchedMobility,
    handover: watchedHandover,
    childrenHomeDetails: {
      activities: activities || undefined,
      incidents: incidentSummary || undefined,
      visitors: visitorSummary || undefined,
      contacts: contactSummary || undefined,
      educationAttendance: educationAttendance || undefined,
      bedtime: bedtime || undefined,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(doSubmit)}
      className="space-y-8"
      noValidate
    >
      {serverError && (
        <div
          className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* Hidden personId */}
      <input type="hidden" {...register('personId')} />

      {/* Note type + Shift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="noteType"
            className="text-sm font-medium text-[oklch(0.3_0_0)]"
          >
            Note Type
          </label>
          <select
            id="noteType"
            {...register('noteType')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {NOTE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {NOTE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="shift"
            className="text-sm font-medium text-[oklch(0.3_0_0)]"
          >
            Shift
          </label>
          <select
            id="shift"
            {...register('shift')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select shift...</option>
            {SHIFT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SHIFT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mood */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[oklch(0.3_0_0)]">
          Mood
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <label
              key={m}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                value={m}
                {...register('mood')}
                className="h-4 w-4"
              />
              <span className="text-sm">{MOOD_LABELS[m]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Personal Care */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[oklch(0.3_0_0)]">
          Personal Care
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={washed}
              onChange={(e) => setWashed(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Washed</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dressed}
              onChange={(e) => setDressed(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Dressed</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={oralCare}
              onChange={(e) => setOralCare(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Oral Care</span>
          </label>
        </div>
        <input
          type="text"
          value={personalCareNotes}
          onChange={(e) => setPersonalCareNotes(e.target.value)}
          placeholder="Additional personal care notes..."
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </fieldset>

      {/* Nutrition */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[oklch(0.3_0_0)]">
          Nutrition
        </legend>
        <MealInput
          label="Breakfast"
          mealKey="breakfast"
          offered={breakfastOffered}
          portionConsumed={breakfastPortion}
          notes={breakfastNotes}
          onOfferedChange={setBreakfastOffered}
          onPortionChange={setBreakfastPortion}
          onNotesChange={setBreakfastNotes}
        />
        <MealInput
          label="Lunch"
          mealKey="lunch"
          offered={lunchOffered}
          portionConsumed={lunchPortion}
          notes={lunchNotes}
          onOfferedChange={setLunchOffered}
          onPortionChange={setLunchPortion}
          onNotesChange={setLunchNotes}
        />
        <MealInput
          label="Dinner"
          mealKey="dinner"
          offered={dinnerOffered}
          portionConsumed={dinnerPortion}
          notes={dinnerNotes}
          onOfferedChange={setDinnerOffered}
          onPortionChange={setDinnerPortion}
          onNotesChange={setDinnerNotes}
        />
        <div className="space-y-1">
          <label
            htmlFor="fluidsNote"
            className="text-xs text-[oklch(0.5_0_0)]"
          >
            Fluids
          </label>
          <input
            id="fluidsNote"
            type="text"
            value={fluidsNote}
            onChange={(e) => setFluidsNote(e.target.value)}
            placeholder="Fluid intake notes..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </fieldset>

      {/* Mobility */}
      <div className="space-y-2">
        <label
          htmlFor="mobility"
          className="text-sm font-medium text-[oklch(0.3_0_0)]"
        >
          Mobility Observations
        </label>
        <textarea
          id="mobility"
          {...register('mobility')}
          rows={2}
          placeholder="Note any mobility observations..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[60px]"
        />
      </div>

      {/* Health */}
      <div className="space-y-2">
        <label
          htmlFor="health"
          className="text-sm font-medium text-[oklch(0.3_0_0)]"
        >
          Health Observations
        </label>
        <textarea
          id="health"
          {...register('health')}
          rows={2}
          placeholder="Note any health observations..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[60px]"
        />
      </div>

      {/* Children's home running record */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[oklch(0.3_0_0)]">
          Children&apos;s home running record
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            rows={2}
            placeholder="Activities and engagement..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
          <textarea
            value={incidentSummary}
            onChange={(e) => setIncidentSummary(e.target.value)}
            rows={2}
            placeholder="Incidents or concerns..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
          <textarea
            value={visitorSummary}
            onChange={(e) => setVisitorSummary(e.target.value)}
            rows={2}
            placeholder="Visitors to the home..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
          <textarea
            value={contactSummary}
            onChange={(e) => setContactSummary(e.target.value)}
            rows={2}
            placeholder="Family contact or calls..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
          <textarea
            value={educationAttendance}
            onChange={(e) => setEducationAttendance(e.target.value)}
            rows={2}
            placeholder="Education attendance or progress..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
          <textarea
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            rows={2}
            placeholder="Bedtime and evening routine..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[72px]"
          />
        </div>
      </fieldset>

      {/* Handover */}
      <div className="space-y-2">
        <label
          htmlFor="handover"
          className="text-sm font-medium text-[oklch(0.3_0_0)]"
        >
          Additional handover note
        </label>
        <textarea
          id="handover"
          {...register('handover')}
          rows={2}
          placeholder="Anything the auto-generated summary should emphasise..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[60px]"
        />
        {handoverPreview && (
          <div className="rounded-md border border-[oklch(0.9_0.01_160)] bg-[oklch(0.985_0.003_160)] p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[oklch(0.45_0_0)]">
              Auto-generated handover summary
            </p>
            <p className="text-sm text-[oklch(0.35_0_0)]">{handoverPreview}</p>
          </div>
        )}
      </div>

      {/* Narrative */}
      <div className="space-y-2">
        <label
          htmlFor="content"
          className="text-sm font-medium text-[oklch(0.3_0_0)]"
        >
          Narrative <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          {...register('content')}
          rows={5}
          placeholder="Describe the person's day, activities, and your observations..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[120px]"
        />
        {errors.content && (
          <p className="text-xs text-red-600" role="alert">
            {errors.content.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[oklch(0.45_0.1_160)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.4_0.1_160)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          {isPending ? 'Saving...' : 'Save Care Note'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-[oklch(0.97_0_0)] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
