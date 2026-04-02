'use client';

/**
 * Medication Alert Panel — unified display for all medication safety alerts.
 * Combines allergy alerts, drug interactions, and duplicate therapeutic warnings.
 */

import type { MedicationAlert, AllergyAlert, InteractionAlert, DuplicateTherapeuticAlert } from '../../types';
import { hasBlockingAlerts, getHighestSeverity } from '../../lib/allergy-checker';
import { AllergyAlertBanner } from './allergy-alert-banner';
import { InteractionWarning } from './interaction-warning';

interface MedicationAlertPanelProps {
  alerts: MedicationAlert[];
  onAllergyOverride: (data: {
    allergyId: string;
    clinicalJustification: string;
    authorisedBy: string;
  }) => Promise<void>;
  seniorStaff: { id: string; name: string }[];
  currentUserId: string;
  onProceed: () => void;
  onCancel: () => void;
}

const severityConfig = {
  critical: { bg: 'bg-red-600', text: 'Critical' },
  high: { bg: 'bg-orange-500', text: 'High' },
  medium: { bg: 'bg-amber-500', text: 'Medium' },
  low: { bg: 'bg-yellow-500', text: 'Low' },
  none: { bg: 'bg-emerald-500', text: 'Clear' },
};

export function MedicationAlertPanel({
  alerts,
  onAllergyOverride,
  seniorStaff,
  currentUserId,
  onProceed,
  onCancel,
}: MedicationAlertPanelProps) {
  const isBlocking = hasBlockingAlerts(alerts);
  const severity = getHighestSeverity(alerts);
  const config = severityConfig[severity];

  const allergyAlerts = alerts.filter(
    (a): a is AllergyAlert => a.type === 'allergy',
  );
  const otherAlerts = alerts.filter(
    (a): a is InteractionAlert | DuplicateTherapeuticAlert =>
      a.type === 'interaction' || a.type === 'duplicate_therapeutic',
  );

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-emerald-900">
              No Medication Alerts
            </span>
            <p className="text-xs text-emerald-700">
              No allergies, interactions, or duplicate medications detected. Safe to proceed.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onProceed}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Proceed with Administration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Severity Summary Bar */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className={`h-3 w-3 rounded-full ${config.bg}`} />
        <span className="text-sm font-semibold text-slate-900">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''} Detected
        </span>
        <span className="text-xs text-slate-500">&middot;</span>
        <span className="text-xs font-medium text-slate-600">
          Overall severity: {config.text}
        </span>
        {isBlocking && (
          <span className="ml-auto rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            BLOCKING
          </span>
        )}
      </div>

      {/* Allergy Alerts */}
      {allergyAlerts.length > 0 && (
        <AllergyAlertBanner
          alerts={allergyAlerts}
          onOverrideRequest={onAllergyOverride}
          seniorStaff={seniorStaff}
          currentUserId={currentUserId}
        />
      )}

      {/* Interaction & Duplicate Warnings */}
      {otherAlerts.length > 0 && (
        <InteractionWarning alerts={otherAlerts} />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">
          {isBlocking
            ? 'Administration is blocked. Clinical override required to proceed.'
            : 'Review all alerts before proceeding with administration.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {!isBlocking && (
            <button
              onClick={onProceed}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Acknowledge &amp; Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
