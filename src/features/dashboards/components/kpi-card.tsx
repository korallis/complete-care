import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KpiMetric } from '../types';

interface KpiCardProps {
  metric: KpiMetric;
  icon?: React.ReactNode;
}

export function KpiCard({ metric, icon }: KpiCardProps) {
  const trendColor =
    metric.trendSentiment === 'positive'
      ? 'text-emerald-600'
      : metric.trendSentiment === 'negative'
        ? 'text-red-600'
        : 'text-muted-foreground';

  const trendArrow =
    metric.trend === 'up' ? '\u2191' : metric.trend === 'down' ? '\u2193' : '\u2192';

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="text-2xl font-bold tracking-tight">{metric.formatted}</p>
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <span>{trendArrow}</span>
            <span>
              {Math.abs(metric.changePercent)}% vs prev. period
            </span>
          </div>
        </div>
        {icon && (
          <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
        )}
      </CardContent>
    </Card>
  );
}
