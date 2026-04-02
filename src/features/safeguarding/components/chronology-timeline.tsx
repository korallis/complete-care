'use client';

/**
 * Safeguarding Chronology Timeline (VAL-CHILD-025)
 *
 * Auto-generated per child from all concerns, referrals, incidents, missing episodes.
 * Read-only with manual entry support. Exportable as PDF.
 * Restricted entries are filtered based on user role.
 */

import type { SafeguardingChronologyEntry } from '@/lib/db/schema/safeguarding';
import { CHRONOLOGY_SOURCE_LABELS } from '@/features/safeguarding/constants';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ShieldAlert,
  FileText,
  Building2,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Lock,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChronologyTimelineProps {
  childName: string;
  entries: SafeguardingChronologyEntry[];
  canAddManualEntry?: boolean;
  onAddManualEntry?: () => void;
  onExportPdf?: () => void;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  concern: ShieldAlert,
  dsl_review: Eye,
  mash_referral: Building2,
  lado_referral: Lock,
  section_47: AlertTriangle,
  incident: AlertTriangle,
  missing_episode: Clock,
  manual: FileText,
};

const SOURCE_COLORS: Record<string, string> = {
  concern: 'bg-red-100 text-red-700 border-red-200',
  dsl_review: 'bg-purple-100 text-purple-700 border-purple-200',
  mash_referral: 'bg-amber-100 text-amber-700 border-amber-200',
  lado_referral: 'bg-orange-100 text-orange-700 border-orange-200',
  section_47: 'bg-rose-100 text-rose-700 border-rose-200',
  incident: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  missing_episode: 'bg-sky-100 text-sky-700 border-sky-200',
  manual: 'bg-slate-100 text-slate-700 border-slate-200',
};

const SIGNIFICANCE_STYLES: Record<string, string> = {
  standard: '',
  significant: 'border-l-amber-400',
  critical: 'border-l-red-500',
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Group entries by month-year for the timeline display */
function groupByMonth(
  entries: SafeguardingChronologyEntry[],
): Map<string, SafeguardingChronologyEntry[]> {
  const grouped = new Map<string, SafeguardingChronologyEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.eventDate).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
    const existing = grouped.get(key) ?? [];
    existing.push(entry);
    grouped.set(key, existing);
  }
  return grouped;
}

export function ChronologyTimeline({
  childName,
  entries,
  canAddManualEntry = false,
  onAddManualEntry,
  onExportPdf,
}: ChronologyTimelineProps) {
  const groupedEntries = groupByMonth(entries);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Safeguarding Chronology
          </h2>
          <p className="text-sm text-muted-foreground">
            {childName} &mdash; {entries.length} event
            {entries.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAddManualEntry && onAddManualEntry && (
            <Button variant="outline" size="sm" onClick={onAddManualEntry}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Entry
            </Button>
          )}
          {onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No chronology entries yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Entries will appear here automatically as safeguarding records are
              created.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {Array.from(groupedEntries.entries()).map(([month, monthEntries]) => (
        <div key={month}>
          <div className="sticky top-0 z-10 mb-3 bg-background/95 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
              {month}
            </h3>
            <Separator className="mt-1" />
          </div>
          <div className="relative ml-4 space-y-0 border-l-2 border-border pl-6">
            {monthEntries.map((entry) => {
              const Icon = SOURCE_ICONS[entry.source] ?? FileText;
              return (
                <div key={entry.id} className="relative pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-background',
                      entry.significance === 'critical'
                        ? 'bg-red-500'
                        : entry.significance === 'significant'
                          ? 'bg-amber-400'
                          : 'bg-muted-foreground/30',
                    )}
                  >
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>

                  {/* Entry card */}
                  <Card
                    className={cn(
                      'border-l-4 transition-colors',
                      SIGNIFICANCE_STYLES[entry.significance],
                      entry.isRestricted && 'bg-muted/30',
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 text-[10px] font-medium',
                                SOURCE_COLORS[entry.source],
                              )}
                            >
                              <Icon className="mr-1 h-3 w-3" />
                              {CHRONOLOGY_SOURCE_LABELS[entry.source] ?? entry.source}
                            </Badge>
                            {entry.isRestricted && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px] border-red-200 bg-red-50 text-red-700"
                              >
                                <Lock className="mr-1 h-3 w-3" />
                                Restricted
                              </Badge>
                            )}
                            {entry.isManual && (
                              <Badge
                                variant="outline"
                                className="shrink-0 text-[10px]"
                              >
                                Manual
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium leading-tight">
                            {entry.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                            {entry.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium tabular-nums">
                            {formatDate(entry.eventDate)}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {formatTime(entry.eventDate)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
