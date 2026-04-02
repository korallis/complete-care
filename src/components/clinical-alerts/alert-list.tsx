'use client';

/**
 * AlertList — filterable alert history table.
 *
 * Displays clinical alerts with status, severity, type, escalation level,
 * and timestamps. Supports filtering by status, type, and severity.
 */

import { cn } from '@/lib/utils';
import {
  ALERT_TYPE_LABELS,
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
  ALERT_TYPES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
} from '@/features/clinical-alerts/constants';
import { EscalationBadge } from './escalation-badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertListItem = {
  id: string;
  alertType: string;
  severity: string;
  source: string;
  message: string;
  status: string;
  acknowledgedByName: string | null;
  acknowledgedAt: Date | null;
  actionTaken: string | null;
  resolvedAt: Date | null;
  escalationLevel: string;
  createdAt: Date;
};

type AlertListProps = {
  alerts: AlertListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  onSelectAlert?: (alertId: string) => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-red-50 text-red-700 border-red-200',
  acknowledged: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  escalated: 'bg-orange-50 text-orange-700 border-orange-200',
};

function StatusBadge({ status }: { status: string }) {
  const label = ALERT_STATUS_LABELS[status as AlertStatus] ?? status;
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.active;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Severity indicator
// ---------------------------------------------------------------------------

const SEVERITY_DOT_STYLES: Record<string, string> = {
  emergency: 'bg-red-500',
  red: 'bg-red-400',
  amber: 'bg-amber-400',
  info: 'bg-blue-400',
};

function SeverityDot({ severity }: { severity: string }) {
  const dotStyle = SEVERITY_DOT_STYLES[severity] ?? SEVERITY_DOT_STYLES.info;
  const label = ALERT_SEVERITY_LABELS[severity as AlertSeverity] ?? severity;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn('inline-block h-2 w-2 rounded-full', dotStyle)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Alert list
// ---------------------------------------------------------------------------

export function AlertList({
  alerts,
  totalCount,
  page,
  totalPages,
  onSelectAlert,
  className,
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn('rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground', className)}>
        No clinical alerts found.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {alerts.length} of {totalCount} alert{totalCount !== 1 ? 's' : ''}
        {totalPages > 1 ? ` (page ${page} of ${totalPages})` : ''}
      </p>

      {/* Alert rows */}
      <div className="divide-y rounded-xl border">
        {alerts.map((alert) => {
          const typeLabel =
            ALERT_TYPE_LABELS[alert.alertType as AlertType] ??
            alert.alertType;

          return (
            <button
              key={alert.id}
              type="button"
              className="w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelectAlert?.(alert.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityDot severity={alert.severity} />
                    <span className="font-medium text-sm">{typeLabel}</span>
                    <StatusBadge status={alert.status} />
                    <EscalationBadge level={alert.escalationLevel} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {alert.message}
                  </p>
                  {alert.acknowledgedByName && (
                    <p className="text-xs text-muted-foreground">
                      Acknowledged by {alert.acknowledgedByName}
                      {alert.acknowledgedAt &&
                        ` at ${formatDateTime(alert.acknowledgedAt)}`}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(alert.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {alert.source}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
