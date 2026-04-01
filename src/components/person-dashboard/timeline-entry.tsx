import { Badge } from '@/components/ui/badge';
import type { TimelineEntry as TimelineEntryData } from '@/features/person-dashboard/types';

type TimelineEntryProps = {
  entry: TimelineEntryData;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }
> = {
  care_note: {
    label: 'Care Note',
    variant: 'secondary',
    dotColor: 'bg-[oklch(0.55_0.15_250)]',
  },
  care_plan: {
    label: 'Care Plan',
    variant: 'default',
    dotColor: 'bg-[oklch(0.45_0.12_160)]',
  },
  risk_assessment: {
    label: 'Risk Assessment',
    variant: 'outline',
    dotColor: 'bg-amber-500',
  },
  incident: {
    label: 'Incident',
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
  document: {
    label: 'Document',
    variant: 'secondary',
    dotColor: 'bg-[oklch(0.6_0.05_250)]',
  },
};

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TimelineEntryComponent({ entry }: TimelineEntryProps) {
  const config = TYPE_CONFIG[entry.type] ?? {
    label: entry.type,
    variant: 'outline' as const,
    dotColor: 'bg-gray-400',
  };

  // Extra metadata for specific types
  const extraBadge = getExtraBadge(entry);

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full ${config.dotColor} flex-shrink-0 mt-1.5`}
          aria-hidden="true"
        />
        <div className="w-px flex-1 bg-[oklch(0.9_0.005_160)]" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant={config.variant} className="text-[10px] font-medium">
            {config.label}
          </Badge>
          {extraBadge}
          <time
            className="text-xs text-[oklch(0.55_0_0)]"
            dateTime={new Date(entry.timestamp).toISOString()}
          >
            {formatTimestamp(entry.timestamp)}
          </time>
        </div>
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
          {entry.title}
        </p>
        <p className="text-sm text-[oklch(0.5_0_0)] mt-0.5 line-clamp-2">
          {entry.description}
        </p>
        {/* Author / metadata line */}
        {getMetadataLine(entry) && (
          <p className="text-xs text-[oklch(0.6_0_0)] mt-1">
            {getMetadataLine(entry)}
          </p>
        )}
      </div>
    </div>
  );
}

function getExtraBadge(entry: TimelineEntryData): React.ReactNode {
  if (entry.type === 'risk_assessment') {
    const riskLevel = entry.metadata.riskLevel as string | null;
    if (riskLevel === 'high' || riskLevel === 'critical') {
      return (
        <Badge variant="destructive" className="text-[10px]">
          {riskLevel}
        </Badge>
      );
    }
    if (riskLevel === 'medium') {
      return (
        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
          {riskLevel}
        </Badge>
      );
    }
  }

  if (entry.type === 'incident') {
    const severity = entry.metadata.severity as string | null;
    if (severity === 'serious' || severity === 'death') {
      return (
        <Badge variant="destructive" className="text-[10px]">
          {severity}
        </Badge>
      );
    }
  }

  return null;
}

function getMetadataLine(entry: TimelineEntryData): string | null {
  const meta = entry.metadata;
  if (entry.type === 'care_note' && meta.authorName) {
    const parts = [`by ${meta.authorName}`];
    if (meta.shift) parts.push(`${meta.shift} shift`);
    return parts.join(' - ');
  }
  if (entry.type === 'risk_assessment' && meta.completedByName) {
    return `Completed by ${meta.completedByName}`;
  }
  if (entry.type === 'incident' && meta.reportedByName) {
    return `Reported by ${meta.reportedByName}${meta.location ? ` at ${meta.location}` : ''}`;
  }
  if (entry.type === 'document' && meta.uploadedByName) {
    return `Uploaded by ${meta.uploadedByName}`;
  }
  return null;
}
