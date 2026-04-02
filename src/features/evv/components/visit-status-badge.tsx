import { cn } from '@/lib/utils';
import { VISIT_STATUS_CONFIG, type VisitStatus } from '../constants';

interface VisitStatusBadgeProps {
  status: VisitStatus;
  className?: string;
}

/**
 * Status badge for EVV visits — displays a coloured pill with a pulsing dot
 * for active states (scheduled, in_progress).
 */
export function VisitStatusBadge({ status, className }: VisitStatusBadgeProps) {
  const config = VISIT_STATUS_CONFIG[status];
  const isActive = status === 'in_progress' || status === 'scheduled';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
        config.colour,
        className,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', config.dotColour, {
          'animate-pulse': isActive,
        })}
      />
      {config.label}
    </span>
  );
}
