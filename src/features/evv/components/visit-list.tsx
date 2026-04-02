'use client';

import { Clock, MapPin, User2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisitStatusBadge } from './visit-status-badge';
import type { VisitStatus, VisitType } from '../constants';

interface VisitRow {
  id: string;
  clientName: string;
  carerName: string;
  clientAddress: string;
  status: VisitStatus;
  visitType: VisitType;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  actualDurationMinutes: number | null;
}

interface VisitListProps {
  visits: VisitRow[];
  className?: string;
  onSelectVisit?: (visitId: string) => void;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const visitTypeLabels: Record<VisitType, string> = {
  personal_care: 'Personal Care',
  medication: 'Medication',
  meal_prep: 'Meal Prep',
  wellness_check: 'Wellness Check',
  other: 'Other',
};

/**
 * Visit list table — tabular view of EVV visits for the dashboard.
 */
export function VisitList({ visits, className, onSelectVisit }: VisitListProps) {
  if (visits.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-8 text-center', className)}>
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">No visits found</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Carer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Scheduled
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Duration
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visits.map((visit) => {
              const scheduledDuration = Math.round(
                (visit.scheduledEnd.getTime() - visit.scheduledStart.getTime()) / 60_000,
              );

              return (
                <tr
                  key={visit.id}
                  className="group cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => onSelectVisit?.(visit.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{visit.clientName}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {visit.clientAddress}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {visit.carerName}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    <span>{formatTime(visit.scheduledStart)}</span>
                    <span className="mx-1 text-muted-foreground/40">-</span>
                    <span>{formatTime(visit.scheduledEnd)}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {visit.actualStart ? (
                      <span className="text-foreground">
                        {formatTime(visit.actualStart)}
                        {visit.actualEnd && (
                          <>
                            <span className="mx-1 text-muted-foreground/40">-</span>
                            {formatTime(visit.actualEnd)}
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">--:--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {visitTypeLabels[visit.visitType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <VisitStatusBadge status={visit.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {visit.actualDurationMinutes != null ? (
                      <span
                        className={cn(
                          'text-xs font-medium',
                          Math.abs(visit.actualDurationMinutes - scheduledDuration) > 15
                            ? 'text-amber-600'
                            : 'text-foreground',
                        )}
                      >
                        {formatDuration(visit.actualDurationMinutes)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(scheduledDuration)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
