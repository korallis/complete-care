'use client';

/**
 * AlertThresholdSettings — displays per-person threshold overrides.
 *
 * Shows a read-only view of all configured threshold overrides for a person,
 * with the alert type, custom values, clinical reason, and who set them.
 */

import { cn } from '@/lib/utils';
import {
  ALERT_TYPE_LABELS,
  DEFAULT_THRESHOLDS,
  type AlertType,
} from '@/features/clinical-alerts/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThresholdItem = {
  id: string;
  alertType: string;
  customThreshold: unknown;
  reason: string | null;
  setByName: string | null;
  updatedAt: Date;
};

type AlertThresholdSettingsProps = {
  thresholds: ThresholdItem[];
  className?: string;
};

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatThresholdValue(alertType: string, threshold: unknown): string {
  if (!threshold || typeof threshold !== 'object') return 'Unknown';

  const t = threshold as Record<string, unknown>;

  switch (alertType) {
    case 'fluid_low':
      return `Amber: <${t.amberMl ?? DEFAULT_THRESHOLDS.fluid_low.amberMl}ml, Red: <${t.redMl ?? DEFAULT_THRESHOLDS.fluid_low.redMl}ml`;
    case 'news2_elevated':
      return `Amber: >=${t.amberScore ?? DEFAULT_THRESHOLDS.news2_elevated.amberScore}, Red: >=${t.redScore ?? DEFAULT_THRESHOLDS.news2_elevated.redScore}, Emergency: >=${t.emergencyScore ?? DEFAULT_THRESHOLDS.news2_elevated.emergencyScore}`;
    case 'weight_loss':
      return `Amber: >=${t.amberPercent ?? DEFAULT_THRESHOLDS.weight_loss.amberPercent}%, Red: >=${t.redPercent ?? DEFAULT_THRESHOLDS.weight_loss.redPercent}% in ${t.periodDays ?? DEFAULT_THRESHOLDS.weight_loss.periodDays} days`;
    case 'constipation':
      return `Amber: >=${t.amberDays ?? DEFAULT_THRESHOLDS.constipation.amberDays} days, Red: >=${t.redDays ?? DEFAULT_THRESHOLDS.constipation.redDays} days`;
    case 'diarrhoea':
      return `>=${t.thresholdCount ?? DEFAULT_THRESHOLDS.diarrhoea.thresholdCount} loose stools in 24hrs`;
    case 'pain_sustained':
      return `>=${t.consecutiveCount ?? DEFAULT_THRESHOLDS.pain_sustained.consecutiveCount} assessments at score >=${t.thresholdScore ?? DEFAULT_THRESHOLDS.pain_sustained.thresholdScore}`;
    default:
      return JSON.stringify(threshold);
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AlertThresholdSettings({
  thresholds,
  className,
}: AlertThresholdSettingsProps) {
  if (thresholds.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        No custom thresholds configured. Default thresholds are in use.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {thresholds.map((threshold) => {
        const typeLabel =
          ALERT_TYPE_LABELS[threshold.alertType as AlertType] ??
          threshold.alertType;

        return (
          <div
            key={threshold.id}
            className="rounded-xl border px-5 py-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{typeLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {formatThresholdValue(
                    threshold.alertType,
                    threshold.customThreshold,
                  )}
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(threshold.updatedAt)}
              </p>
            </div>
            {threshold.reason && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Reason:</span> {threshold.reason}
              </p>
            )}
            {threshold.setByName && (
              <p className="text-xs text-muted-foreground">
                Set by {threshold.setByName}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
