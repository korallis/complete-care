'use client';

/**
 * Drug Interaction Warning — displays known drug interactions with severity.
 * Includes duplicate therapeutic class flagging.
 */

import type {
  InteractionAlert,
  DuplicateTherapeuticAlert,
} from '../../types';

interface InteractionWarningProps {
  alerts: (InteractionAlert | DuplicateTherapeuticAlert)[];
}

const interactionSeverityStyles = {
  contraindicated: {
    container: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-800 border-red-300',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
  major: {
    container: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    text: 'text-orange-800',
    icon: 'text-orange-500',
  },
  moderate: {
    container: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
  minor: {
    container: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
  },
};

export function InteractionWarning({ alerts }: InteractionWarningProps) {
  if (alerts.length === 0) return null;

  const interactions = alerts.filter(
    (a): a is InteractionAlert => a.type === 'interaction',
  );
  const duplicates = alerts.filter(
    (a): a is DuplicateTherapeuticAlert => a.type === 'duplicate_therapeutic',
  );

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {/* Interaction Alerts */}
      {interactions.map((alert) => {
        const styles = interactionSeverityStyles[alert.severity];
        return (
          <div
            key={alert.interactionId}
            className={`rounded-xl border p-4 ${styles.container}`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Z"
                />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${styles.text}`}>
                    Drug Interaction
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${styles.badge}`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${styles.text}`}>
                  <span className="font-medium">{alert.drugA}</span> interacts
                  with{' '}
                  <span className="font-medium">{alert.drugB}</span>
                </p>
                <p className={`mt-1 text-xs ${styles.text} opacity-80`}>
                  {alert.description}
                </p>
                {alert.recommendation && (
                  <p className={`mt-1.5 text-xs font-medium ${styles.text}`}>
                    Recommendation: {alert.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Duplicate Therapeutic Class Alerts */}
      {duplicates.map((alert, idx) => (
        <div
          key={`dup-${idx}`}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"
        >
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
              />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-900">
                  Duplicate Therapeutic Class
                </span>
                <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {alert.therapeuticClass}
                </span>
              </div>
              <p className="mt-1 text-sm text-indigo-800">
                <span className="font-medium">{alert.newMedication}</span> is
                in the same therapeutic class as existing medication{' '}
                <span className="font-medium">{alert.existingMedication}</span>
              </p>
              <p className="mt-1 text-xs text-indigo-700">
                Review with prescriber to confirm both medications are intended
                to be given concurrently.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
