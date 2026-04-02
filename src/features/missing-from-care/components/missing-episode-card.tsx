'use client';

import { isEscalationDue } from '../schema';
import type { MissingEpisode } from '@/lib/db/schema';

const RISK_LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-800' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800' },
  low: { bg: 'bg-green-100', text: 'text-green-800' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-red-600', text: 'text-white' },
  returned: { bg: 'bg-amber-500', text: 'text-white' },
  closed: { bg: 'bg-gray-400', text: 'text-white' },
};

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Summary card for a missing episode, showing status, risk level,
 * elapsed time, and escalation status.
 */
export function MissingEpisodeCard({
  episode,
  childName,
}: {
  episode: MissingEpisode;
  childName: string;
}) {
  const isOpen = episode.status === 'open';
  const elapsedMs = isOpen
    ? Date.now() - episode.absenceNoticedAt.getTime()
    : episode.returnedAt
      ? episode.returnedAt.getTime() - episode.absenceNoticedAt.getTime()
      : 0;

  const escalationDue =
    isOpen &&
    isEscalationDue(episode.absenceNoticedAt, episode.escalationThresholdMinutes);

  const riskStyle = RISK_LEVEL_STYLES[episode.riskLevel] ?? RISK_LEVEL_STYLES.low;
  const statusStyle = STATUS_STYLES[episode.status] ?? STATUS_STYLES.closed;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        isOpen ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{childName}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Absence noticed:{' '}
            {episode.absenceNoticedAt.toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${riskStyle.bg} ${riskStyle.text}`}
          >
            {episode.riskLevel} risk
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${statusStyle.bg} ${statusStyle.text}`}
          >
            {episode.status}
          </span>
        </div>
      </div>

      {/* Elapsed time and escalation */}
      {isOpen && (
        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Elapsed</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">
              {formatDuration(elapsedMs)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Escalation threshold
            </p>
            <p className="text-sm text-gray-700">
              {episode.escalationThresholdMinutes} minutes
            </p>
          </div>

          {escalationDue && !episode.policeNotified && (
            <div className="ml-auto rounded border border-red-300 bg-red-100 px-3 py-1.5">
              <p className="text-xs font-bold text-red-800 uppercase">
                Escalation overdue
              </p>
              <p className="text-[10px] text-red-600">
                Notify police and placing authority
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notification checklist */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <NotificationBadge
          label="Police"
          notified={episode.policeNotified}
          reference={episode.policeReference}
        />
        <NotificationBadge
          label="Placing Authority"
          notified={episode.placingAuthorityNotified}
        />
        <NotificationBadge
          label="Responsible Individual"
          notified={episode.responsibleIndividualNotified}
        />
      </div>

      {/* Return info */}
      {episode.returnedAt && (
        <div className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-xs text-green-800">
            <span className="font-medium">Returned:</span>{' '}
            {episode.returnedAt.toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            {episode.returnMethod && (
              <>
                via{' '}
                <span className="font-medium">
                  {episode.returnMethod.replace(/_/g, ' ')}
                </span>
              </>
            )}
          </p>
          {episode.wellbeingCheckCompleted && (
            <p className="mt-0.5 text-xs text-green-700">
              Wellbeing check completed
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationBadge({
  label,
  notified,
  reference,
}: {
  label: string;
  notified: boolean;
  reference?: string | null;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
        notified
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span>{notified ? '\u2713' : '\u2717'}</span>
      <span>{label}</span>
      {reference && <span className="text-[10px]">({reference})</span>}
    </span>
  );
}
