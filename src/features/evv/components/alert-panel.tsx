'use client';

import {
  AlertTriangle,
  Bell,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALERT_SEVERITY_CONFIG, type AlertSeverity, type AlertType } from '../constants';

interface AlertItem {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  status: string;
  minutesOverdue: number | null;
  escalated: boolean;
  createdAt: Date;
}

interface AlertPanelProps {
  alerts: AlertItem[];
  className?: string;
  onResolve?: (alertId: string) => void;
  onEscalate?: (alertId: string) => void;
}

const alertTypeIcons: Record<AlertType, typeof AlertTriangle> = {
  late_start: Clock,
  missed: XCircle,
  late_checkout: Clock,
  geofence_breach: AlertTriangle,
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

/**
 * Alert panel — displays active EVV alerts with severity indicators,
 * escalation status, and resolve/escalate actions.
 */
export function AlertPanel({
  alerts,
  className,
  onResolve,
  onEscalate,
}: AlertPanelProps) {
  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'escalated');

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Alerts</h3>
          {activeAlerts.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {activeAlerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
            <p className="mt-2 text-xs text-muted-foreground">
              No active alerts
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activeAlerts.map((alert) => {
              const Icon = alertTypeIcons[alert.alertType];
              const severityConfig = ALERT_SEVERITY_CONFIG[alert.severity];

              return (
                <li key={alert.id} className="group px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-600'
                          : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-600'
                            : alert.severity === 'medium'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                            severityConfig.colour,
                          )}
                        >
                          {severityConfig.label}
                        </span>
                        {alert.escalated && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600">
                            <ChevronUp className="h-2.5 w-2.5" />
                            Escalated
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-foreground leading-relaxed">
                        {alert.message}
                      </p>

                      {alert.minutesOverdue != null && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {alert.minutesOverdue} min overdue
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {onResolve && (
                          <button
                            type="button"
                            onClick={() => onResolve(alert.id)}
                            className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Resolve
                          </button>
                        )}
                        {onEscalate && !alert.escalated && (
                          <button
                            type="button"
                            onClick={() => onEscalate(alert.id)}
                            className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 transition-colors hover:bg-red-100"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
