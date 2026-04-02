import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  missed: number;
  cancelled: number;
}

interface AlertStatsData {
  activeAlerts: number;
  escalatedAlerts: number;
}

interface StatsCardsProps {
  visits: StatsData;
  alerts: AlertStatsData;
}

const cards = [
  {
    key: 'total' as const,
    label: 'Total Today',
    icon: Calendar,
    accent: 'text-foreground',
    bg: 'bg-card',
    border: 'border-border',
  },
  {
    key: 'inProgress' as const,
    label: 'In Progress',
    icon: Activity,
    accent: 'text-blue-600',
    bg: 'bg-blue-50/50',
    border: 'border-blue-200/60',
  },
  {
    key: 'completed' as const,
    label: 'Completed',
    icon: CheckCircle2,
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-200/60',
  },
  {
    key: 'scheduled' as const,
    label: 'Scheduled',
    icon: Clock,
    accent: 'text-slate-500',
    bg: 'bg-card',
    border: 'border-border',
  },
  {
    key: 'missed' as const,
    label: 'Missed',
    icon: XCircle,
    accent: 'text-red-600',
    bg: 'bg-red-50/50',
    border: 'border-red-200/60',
  },
] as const;

/**
 * Dashboard stats cards — overview of today's EVV visit counts.
 */
export function StatsCards({ visits, alerts }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={cn(
              'rounded-lg border p-4 transition-shadow hover:shadow-sm',
              card.bg,
              card.border,
            )}
          >
            <div className="flex items-center justify-between">
              <Icon className={cn('h-4 w-4', card.accent)} />
              <span
                className={cn('text-2xl font-semibold tabular-nums', card.accent)}
              >
                {visits[card.key]}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
          </div>
        );
      })}

      {/* Alerts card */}
      <div
        className={cn(
          'rounded-lg border p-4 transition-shadow hover:shadow-sm',
          alerts.activeAlerts > 0
            ? 'border-amber-300/60 bg-amber-50/50'
            : 'border-border bg-card',
        )}
      >
        <div className="flex items-center justify-between">
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              alerts.activeAlerts > 0 ? 'text-amber-600' : 'text-muted-foreground',
            )}
          />
          <span
            className={cn(
              'text-2xl font-semibold tabular-nums',
              alerts.activeAlerts > 0 ? 'text-amber-600' : 'text-foreground',
            )}
          >
            {alerts.activeAlerts}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Active Alerts</p>
      </div>
    </div>
  );
}
