'use client';

import {
  ArrowLeft,
  MapPin,
  User2,
  CheckCircle2,
  Navigation,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VisitStatusBadge } from '@/features/evv/components/visit-status-badge';
import type { VisitStatus, VerificationMethod } from '@/features/evv/constants';

interface VisitDetailProps {
  orgSlug: string;
  visitId: string;
}

// Demo data for the detail view — replaced by server data in production
const DEMO_VISIT = {
  id: '1',
  clientName: 'Margaret Thompson',
  carerName: 'Sarah Williams',
  clientAddress: '14 Elm Close, Bristol BS1 4DJ',
  status: 'in_progress' as VisitStatus,
  visitType: 'personal_care',
  scheduledStart: new Date(new Date().setHours(9, 0, 0, 0)),
  scheduledEnd: new Date(new Date().setHours(10, 0, 0, 0)),
  actualStart: new Date(new Date().setHours(9, 5, 0, 0)),
  actualEnd: null as Date | null,
  actualDurationMinutes: null as number | null,
  expectedLatitude: 51.455,
  expectedLongitude: -2.597,
  notes: null as string | null,
};

const DEMO_CHECK_EVENTS = [
  {
    id: 'ce1',
    eventType: 'check_in',
    latitude: 51.4551,
    longitude: -2.5972,
    distanceFromExpectedMetres: 12.5,
    withinGeofence: true,
    verificationMethod: 'gps' as VerificationMethod,
    timestamp: new Date(new Date().setHours(9, 5, 0, 0)),
  },
];

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Visit detail view — shows visit info, check events timeline,
 * and verification data.
 */
export function VisitDetail({ orgSlug, visitId: _visitId }: VisitDetailProps) {
  // In production, fetch visit and check events using server actions
  const visit = DEMO_VISIT;
  const checkEvents = DEMO_CHECK_EVENTS;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back nav */}
      <Link
        href={`/${orgSlug}/visits`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to visits
      </Link>

      {/* Visit header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {visit.clientName}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {visit.clientAddress}
            </span>
            <span className="flex items-center gap-1">
              <User2 className="h-3 w-3" />
              {visit.carerName}
            </span>
          </div>
        </div>
        <VisitStatusBadge status={visit.status} />
      </div>

      {/* Time comparison */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Scheduled
          </h3>
          <p className="mt-2 text-sm font-medium tabular-nums text-foreground">
            {formatTime(visit.scheduledStart)} - {formatTime(visit.scheduledEnd)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {Math.round(
              (visit.scheduledEnd.getTime() - visit.scheduledStart.getTime()) / 60_000,
            )}{' '}
            min planned
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Actual
          </h3>
          {visit.actualStart ? (
            <>
              <p className="mt-2 text-sm font-medium tabular-nums text-foreground">
                {formatTime(visit.actualStart)}
                {visit.actualEnd ? ` - ${formatTime(visit.actualEnd)}` : ' - ongoing'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {visit.actualDurationMinutes != null
                  ? `${visit.actualDurationMinutes} min actual`
                  : 'In progress'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Not started</p>
          )}
        </div>
      </div>

      {/* Verification timeline */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-foreground">
          Verification Events
        </h2>
        <div className="mt-3 space-y-0">
          {checkEvents.map((event, i) => (
            <div key={event.id} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full',
                    event.withinGeofence
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-600',
                  )}
                >
                  {event.eventType === 'check_in' ? (
                    <Navigation className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </div>
                {i < checkEvents.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>

              {/* Event details */}
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {event.eventType === 'check_in' ? 'Check-In' : 'Check-Out'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                <div className="mt-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Location:</span>{' '}
                      <span className="tabular-nums text-foreground">
                        {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distance:</span>{' '}
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          event.withinGeofence
                            ? 'text-emerald-600'
                            : 'text-red-600',
                        )}
                      >
                        {event.distanceFromExpectedMetres}m
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Geofence:</span>{' '}
                      <span
                        className={cn(
                          'font-medium',
                          event.withinGeofence
                            ? 'text-emerald-600'
                            : 'text-red-600',
                        )}
                      >
                        {event.withinGeofence ? 'Within range' : 'Outside range'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Method:</span>{' '}
                      <span className="flex items-center gap-1 text-foreground">
                        <Shield className="h-2.5 w-2.5" />
                        {event.verificationMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {checkEvents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No verification events recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
