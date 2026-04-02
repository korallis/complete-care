'use client';

/**
 * Allergy Alert Banner — critical alert that blocks medication administration.
 * VAL-EMAR-009: Allergy alert blocks administration; override requires
 * justification + authorisation; audited.
 */

import { useState } from 'react';
import type { AllergyAlert } from '../../types';

interface AllergyAlertBannerProps {
  alerts: AllergyAlert[];
  onOverrideRequest: (data: {
    allergyId: string;
    clinicalJustification: string;
    authorisedBy: string;
  }) => Promise<void>;
  seniorStaff: { id: string; name: string }[];
  currentUserId: string;
}

const severityStyles = {
  life_threatening: {
    container: 'border-red-300 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-900',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
  severe: {
    container: 'border-red-200 bg-red-50/70',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  moderate: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  mild: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
};

export function AllergyAlertBanner({
  alerts,
  onOverrideRequest,
  seniorStaff,
  currentUserId,
}: AllergyAlertBannerProps) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [justification, setJustification] = useState('');
  const [authorisedBy, setAuthorisedBy] = useState('');
  const [selectedAllergyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  // Show the most severe alert first
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { life_threatening: 0, severe: 1, moderate: 2, mild: 3 };
    return order[a.severity] - order[b.severity];
  });

  const primaryAlert = sortedAlerts[0];
  const styles = severityStyles[primaryAlert.severity];

  async function handleOverride() {
    setError(null);
    if (!justification || justification.length < 10) {
      setError('Clinical justification must be at least 10 characters');
      return;
    }
    if (!authorisedBy) {
      setError('Senior staff authorisation is required');
      return;
    }
    if (authorisedBy === currentUserId) {
      setError('Override must be authorised by a different senior staff member');
      return;
    }

    setIsSubmitting(true);
    try {
      await onOverrideRequest({
        allergyId: selectedAllergyId || primaryAlert.allergyId,
        clinicalJustification: justification,
        authorisedBy,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3" role="alert" aria-live="assertive">
      {/* Main Alert Banner */}
      <div className={`rounded-xl border-2 p-5 ${styles.container}`}>
        <div className="flex items-start gap-4">
          {/* Alert Icon */}
          <div className="flex-shrink-0 pt-0.5">
            <svg
              className={`h-6 w-6 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${styles.title}`}>
                ALLERGY ALERT — ADMINISTRATION BLOCKED
              </h3>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${styles.badge}`}
              >
                {primaryAlert.severity.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-2 space-y-1.5">
              {sortedAlerts.map((alert) => (
                <div key={alert.allergyId} className={`text-sm ${styles.text}`}>
                  <span className="font-semibold">{alert.allergen}</span>
                  {' allergy matches '}
                  <span className="font-semibold">{alert.medicationName}</span>
                  {' (matched on: '}{alert.matchedOn}{')'}
                  {alert.reaction && (
                    <span className="ml-1">
                      &mdash; Known reaction: {alert.reaction}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className={`mt-3 text-xs font-medium ${styles.text}`}>
              This medication cannot be administered without clinical override.
              Override requires documented clinical justification and senior
              staff authorisation. All overrides are permanently audited.
            </p>

            {/* Override Button */}
            {!overrideMode && (
              <button
                onClick={() => setOverrideMode(true)}
                className="mt-4 rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
              >
                Request Clinical Override
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Override Form */}
      {overrideMode && (
        <div className="rounded-xl border-2 border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <h4 className="text-sm font-bold text-red-900">
              Clinical Override — This action will be permanently audited
            </h4>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Clinical Justification *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                required
                minLength={10}
                placeholder="Provide detailed clinical reasoning for overriding this allergy alert..."
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                Minimum 10 characters. Be specific about the clinical rationale.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Senior Staff Authorisation *
              </label>
              <select
                value={authorisedBy}
                onChange={(e) => setAuthorisedBy(e.target.value)}
                required
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                <option value="">Select senior staff member...</option>
                {seniorStaff
                  .filter((s) => s.id !== currentUserId)
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Must be a different senior staff member (manager or above).
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setOverrideMode(false);
                  setJustification('');
                  setAuthorisedBy('');
                  setError(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={isSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Processing Override...'
                  : 'Confirm Override & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
