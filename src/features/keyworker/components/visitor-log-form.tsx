'use client';

/**
 * VisitorLogForm — record a new visitor entry.
 * Supports both org-level (all visitors) and person-level (child's visitors) use.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createVisitorSchema } from '../schema';

type FormValues = {
  visitorName: string;
  relationship: 'other' | 'professional' | 'sibling' | 'social_worker' | 'parent' | 'guardian' | 'family_member' | 'iro' | 'advocate' | 'therapist' | 'solicitor' | 'ofsted_inspector' | 'friend';
  personVisitedId?: string;
  visitDate: string;
  arrivalTime: string;
  departureTime?: string;
  idChecked: boolean;
  dbsChecked: boolean;
  notes?: string;
};
import { VISITOR_RELATIONSHIPS, VISITOR_RELATIONSHIP_LABELS } from '../constants';
import type { createVisitorLogEntry } from '../actions';

type VisitorLogFormProps = {
  personId?: string;
  redirectTo: string;
  onCreate: typeof createVisitorLogEntry;
};

export function VisitorLogForm({
  personId,
  redirectTo,
  onCreate,
}: VisitorLogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0]!;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createVisitorSchema) as never,
    defaultValues: {
      visitorName: '',
      relationship: 'parent',
      personVisitedId: personId ?? undefined,
      visitDate: today,
      arrivalTime: currentTime,
      departureTime: '',
      idChecked: false,
      dbsChecked: false,
      notes: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await onCreate({
        ...data,
        departureTime: data.departureTime || undefined,
        notes: data.notes || undefined,
      } as Parameters<typeof onCreate>[0]);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to record visitor');
        return;
      }
      toast.success('Visitor recorded');
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Visitor name */}
      <div>
        <label
          htmlFor="visitorName"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Visitor&apos;s full name <span className="text-red-500">*</span>
        </label>
        <input
          id="visitorName"
          type="text"
          {...register('visitorName')}
          placeholder="Enter full name"
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        />
        {errors.visitorName && (
          <p className="mt-1 text-xs text-red-600">{errors.visitorName.message}</p>
        )}
      </div>

      {/* Relationship */}
      <div>
        <label
          htmlFor="relationship"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Relationship / Purpose <span className="text-red-500">*</span>
        </label>
        <select
          id="relationship"
          {...register('relationship')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        >
          {VISITOR_RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {VISITOR_RELATIONSHIP_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Date + arrival */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="visitDate"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Visit date <span className="text-red-500">*</span>
          </label>
          <input
            id="visitDate"
            type="date"
            {...register('visitDate')}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          />
          {errors.visitDate && (
            <p className="mt-1 text-xs text-red-600">{errors.visitDate.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="arrivalTime"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Arrival time <span className="text-red-500">*</span>
          </label>
          <input
            id="arrivalTime"
            type="time"
            {...register('arrivalTime')}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          />
          {errors.arrivalTime && (
            <p className="mt-1 text-xs text-red-600">{errors.arrivalTime.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="departureTime"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Departure time
          </label>
          <input
            id="departureTime"
            type="time"
            {...register('departureTime')}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          />
          <p className="mt-1 text-xs text-[oklch(0.65_0_0)]">Leave blank if still in</p>
        </div>
      </div>

      {/* ID / DBS checks */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-5">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-3">
          Verification checks
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="idChecked"
              type="checkbox"
              {...register('idChecked')}
              className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.07_160)]"
            />
            <label htmlFor="idChecked" className="text-sm text-[oklch(0.35_0.04_160)]">
              Photo ID checked
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="dbsChecked"
              type="checkbox"
              {...register('dbsChecked')}
              className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.07_160)]"
            />
            <label htmlFor="dbsChecked" className="text-sm text-[oklch(0.35_0.04_160)]">
              DBS check verified (for professionals/workers)
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          placeholder="Purpose of visit, items brought, any concerns..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[oklch(0.91_0.005_160)]">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Record visitor'
          )}
        </button>
      </div>
    </form>
  );
}
