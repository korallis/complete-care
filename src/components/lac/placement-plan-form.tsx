'use client';

/**
 * PlacementPlanForm — create and edit placement plans.
 *
 * Captures structured plan content with due date tracking.
 * Placement plans are required within 5 working days of admission.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { PlacementPlan } from '@/lib/db/schema/lac';
import type {
  CreatePlacementPlanInput,
  UpdatePlacementPlanInput,
} from '@/features/lac/schema';
import {
  PLACEMENT_PLAN_STATUSES,
  PLACEMENT_PLAN_STATUS_LABELS,
  type PlacementPlanStatus,
} from '@/features/lac/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateMode = {
  mode: 'create';
  personId: string;
  lacRecordId: string;
  dueDate: string;
  onSubmit: (
    data: CreatePlacementPlanInput,
  ) => Promise<{ success: boolean; error?: string; data?: PlacementPlan }>;
};

type EditMode = {
  mode: 'edit';
  plan: PlacementPlan;
  onSubmit: (
    data: UpdatePlacementPlanInput,
  ) => Promise<{ success: boolean; error?: string; data?: PlacementPlan }>;
};

type PlacementPlanFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

type FormValues = {
  objectives: string;
  arrangements: string;
  educationPlan: string;
  healthPlan: string;
  contactArrangements: string;
  notes: string;
  status: PlacementPlanStatus;
  reviewDate: string;
};

export function PlacementPlanForm(props: PlacementPlanFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const existingContent =
    props.mode === 'edit'
      ? (props.plan.content as Record<string, string | undefined>)
      : {};

  const form = useForm<FormValues>({
    defaultValues:
      props.mode === 'edit'
        ? {
            objectives: existingContent.objectives ?? '',
            arrangements: existingContent.arrangements ?? '',
            educationPlan: existingContent.educationPlan ?? '',
            healthPlan: existingContent.healthPlan ?? '',
            contactArrangements: existingContent.contactArrangements ?? '',
            notes: existingContent.notes ?? '',
            status: props.plan.status as PlacementPlanStatus,
            reviewDate: props.plan.reviewDate ?? '',
          }
        : {
            objectives: '',
            arrangements: '',
            educationPlan: '',
            healthPlan: '',
            contactArrangements: '',
            notes: '',
            status: 'draft',
            reviewDate: '',
          },
  });

  const inputCls =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

  const textareaCls = `${inputCls} resize-y`;

  function handleSubmit(formData: FormValues) {
    setServerError(null);

    startTransition(async () => {
      let result: {
        success: boolean;
        error?: string;
        data?: PlacementPlan;
      };

      const content = {
        objectives: formData.objectives || undefined,
        arrangements: formData.arrangements || undefined,
        educationPlan: formData.educationPlan || undefined,
        healthPlan: formData.healthPlan || undefined,
        contactArrangements: formData.contactArrangements || undefined,
        notes: formData.notes || undefined,
      };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          personId: props.personId,
          lacRecordId: props.lacRecordId,
          dueDate: props.dueDate,
          content,
          status: formData.status,
          reviewDate: formData.reviewDate || null,
        });
      } else {
        result = await props.onSubmit({
          content,
          status: formData.status,
          completedDate:
            formData.status === 'completed'
              ? new Date().toISOString().slice(0, 10)
              : null,
          reviewDate: formData.reviewDate || null,
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create'
            ? 'Placement plan created'
            : 'Placement plan updated',
        );
        router.push(
          `/${props.orgSlug}/persons/${props.personId}/lac/placement-plans`,
        );
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save placement plan');
      }
    });
  }

  const sections = [
    {
      id: 'objectives',
      label: 'Objectives',
      placeholder: 'What are the key objectives of this placement?',
    },
    {
      id: 'arrangements',
      label: 'Placement arrangements',
      placeholder: 'Describe the living and daily arrangements...',
    },
    {
      id: 'educationPlan',
      label: 'Education plan',
      placeholder: 'Education arrangements and support...',
    },
    {
      id: 'healthPlan',
      label: 'Health plan',
      placeholder: 'Health needs and provision arrangements...',
    },
    {
      id: 'contactArrangements',
      label: 'Contact arrangements',
      placeholder: 'Family contact schedule and arrangements...',
    },
    {
      id: 'notes',
      label: 'Additional notes',
      placeholder: 'Any additional information...',
    },
  ] as const;

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      aria-label="Placement plan form"
    >
      {/* Server error */}
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Due date info */}
      {props.mode === 'create' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This placement plan is due by{' '}
          <span className="font-semibold">{props.dueDate}</span> (5 working
          days from admission).
        </div>
      )}

      {/* Plan status & review */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Plan details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="pp-status"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Status
            </label>
            <select
              id="pp-status"
              {...form.register('status')}
              className={inputCls}
            >
              {PLACEMENT_PLAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PLACEMENT_PLAN_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="pp-review-date"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Review date
            </label>
            <input
              id="pp-review-date"
              type="date"
              {...form.register('reviewDate')}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Content sections */}
      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5"
        >
          <label
            htmlFor={`pp-${section.id}`}
            className="block text-sm font-semibold text-[oklch(0.35_0.04_160)] mb-3"
          >
            {section.label}
          </label>
          <textarea
            id={`pp-${section.id}`}
            {...form.register(section.id)}
            rows={4}
            placeholder={section.placeholder}
            className={textareaCls}
          />
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : props.mode === 'create' ? (
            'Create placement plan'
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
