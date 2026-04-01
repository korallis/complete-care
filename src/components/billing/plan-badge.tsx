import { Crown, Zap, Sparkles } from 'lucide-react';
import type { Plan } from '@/types';

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

const BADGE_CONFIG: Record<
  Plan,
  {
    label: string;
    icon: typeof Crown;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  free: {
    label: 'Free',
    icon: Sparkles,
    bgClass: 'bg-[oklch(0.96_0.01_160)]',
    textClass: 'text-[oklch(0.35_0.06_160)]',
    borderClass: 'border-[oklch(0.88_0.02_160)]',
  },
  professional: {
    label: 'Pro',
    icon: Zap,
    bgClass: 'bg-[oklch(0.25_0.08_260)]',
    textClass: 'text-white',
    borderClass: 'border-[oklch(0.35_0.08_260)]',
  },
  enterprise: {
    label: 'Enterprise',
    icon: Crown,
    bgClass: 'bg-[oklch(0.30_0.07_50)]',
    textClass: 'text-white',
    borderClass: 'border-[oklch(0.40_0.07_50)]',
  },
};

/**
 * Small plan indicator badge for sidebar and header.
 */
export function PlanBadge({ plan, className = '' }: PlanBadgeProps) {
  const config = BADGE_CONFIG[plan];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border px-2 py-0.5
        text-[10px] font-semibold leading-tight select-none
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        ${className}
      `}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
