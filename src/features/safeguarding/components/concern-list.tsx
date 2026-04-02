'use client';

/**
 * Safeguarding Concerns List
 *
 * Displays concerns in a table/card format with status badges and severity indicators.
 * Used in DSL review dashboard and child safeguarding pages.
 */

import type { SafeguardingConcern } from '@/lib/db/schema/safeguarding';
import {
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CONCERN_STATUS_LABELS,
  CONCERN_STATUS_COLORS,
} from '@/features/safeguarding/constants';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ShieldAlert, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConcernListProps {
  concerns: SafeguardingConcern[];
  onSelectConcern?: (concern: SafeguardingConcern) => void;
  showChildColumn?: boolean;
  emptyMessage?: string;
}

function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Less than 1 hour ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ConcernList({
  concerns,
  onSelectConcern,
  emptyMessage = 'No safeguarding concerns found.',
}: ConcernListProps) {
  if (concerns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {concerns.map((concern) => (
        <Card
          key={concern.id}
          className={cn(
            'transition-colors',
            onSelectConcern && 'cursor-pointer hover:bg-muted/50',
            concern.severity === 'critical' && 'border-l-4 border-l-red-500',
            concern.severity === 'high' && 'border-l-4 border-l-orange-400',
          )}
          onClick={() => onSelectConcern?.(concern)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {concern.referenceNumber}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-medium',
                    SEVERITY_COLORS[concern.severity],
                  )}
                >
                  {SEVERITY_LABELS[concern.severity]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-medium',
                    CONCERN_STATUS_COLORS[concern.status],
                  )}
                >
                  {CONCERN_STATUS_LABELS[concern.status]}
                </Badge>
                {concern.category && (
                  <Badge variant="secondary" className="text-[10px]">
                    {concern.category}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium leading-tight line-clamp-2">
                {concern.description}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(concern.observedAt)}
                </span>
                {concern.location && <span>{concern.location}</span>}
              </div>
            </div>
            {onSelectConcern && (
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
