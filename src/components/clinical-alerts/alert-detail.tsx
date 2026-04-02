'use client';

/**
 * AlertDetail — detailed view of a single alert with acknowledge/resolve/escalate actions.
 */

import { cn } from '@/lib/utils';
import {
  ALERT_TYPE_LABELS,
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
  ESCALATION_LEVEL_LABELS,
  ESCALATION_LEVEL_DESCRIPTIONS,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
  type EscalationLevel,
} from '@/features/clinical-alerts/constants';
import { EscalationBadge } from './escalation-badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertDetailData = {
  id: string;
  alertType: string;
  severity: string;
  source: string;
  triggerValue: string | null;
  triggerThreshold: string | null;
  message: string;
  status: string;
  acknowledgedByName: string | null;
  acknowledgedAt: Date | null;
  actionTaken: string | null;
  resolvedAt: Date | null;
  escalationLevel: string;
  createdAt: Date;
};

type AlertDetailProps = {
  alert: AlertDetailData;
  className?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(date: Date | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const SEVERITY_BG: Record<string, string> = {
  emergency: 'bg-red-100 border-red-300',
  red: 'bg-red-50 border-red-200',
  amber: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AlertDetail({ alert, className }: AlertDetailProps) {
  const typeLabel =
    ALERT_TYPE_LABELS[alert.alertType as AlertType] ?? alert.alertType;
  const severityLabel =
    ALERT_SEVERITY_LABELS[alert.severity as AlertSeverity] ?? alert.severity;
  const statusLabel =
    ALERT_STATUS_LABELS[alert.status as AlertStatus] ?? alert.status;
  const escalationLabel =
    ESCALATION_LEVEL_LABELS[alert.escalationLevel as EscalationLevel] ??
    alert.escalationLevel;
  const escalationDesc =
    ESCALATION_LEVEL_DESCRIPTIONS[alert.escalationLevel as EscalationLevel] ??
    '';
  const bgStyle = SEVERITY_BG[alert.severity] ?? SEVERITY_BG.info;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className={cn('rounded-xl border p-5', bgStyle)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {severityLabel}: {typeLabel}
            </h3>
            <p className="text-sm mt-1">{alert.message}</p>
          </div>
          <EscalationBadge level={alert.escalationLevel} />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Status" value={statusLabel} />
        <DetailRow label="Severity" value={severityLabel} />
        <DetailRow label="Alert Type" value={typeLabel} />
        <DetailRow label="Source" value={alert.source === 'auto' ? 'Automatic' : 'Manual'} />
        <DetailRow label="Escalation Level" value={escalationLabel} />
        <DetailRow label="Raised" value={formatDateTime(alert.createdAt)} />
        {alert.triggerValue && (
          <DetailRow label="Trigger Value" value={alert.triggerValue} />
        )}
        {alert.triggerThreshold && (
          <DetailRow label="Threshold" value={alert.triggerThreshold} />
        )}
      </div>

      {/* Escalation description */}
      {escalationDesc && (
        <div className="rounded-lg border bg-muted/50 p-4 text-sm">
          <p className="font-medium mb-1">Escalation Guidance</p>
          <p className="text-muted-foreground">{escalationDesc}</p>
        </div>
      )}

      {/* Acknowledgement / resolution info */}
      {alert.acknowledgedByName && (
        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p className="font-medium">Acknowledgement</p>
          <DetailRow
            label="Acknowledged By"
            value={alert.acknowledgedByName}
          />
          <DetailRow
            label="Acknowledged At"
            value={formatDateTime(alert.acknowledgedAt)}
          />
          {alert.actionTaken && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Action Taken
              </p>
              <p className="text-sm">{alert.actionTaken}</p>
            </div>
          )}
        </div>
      )}

      {alert.resolvedAt && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">Resolved</p>
          <p className="text-green-700 text-xs mt-1">
            {formatDateTime(alert.resolvedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail row helper
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
