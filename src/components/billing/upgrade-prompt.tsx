'use client';

import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Plan } from '@/types';

interface UpgradePromptProps {
  orgSlug: string;
  currentPlan: Plan;
  /** What limit was hit (e.g., "user", "feature") */
  limitType: 'user' | 'feature';
  /** Name of the feature that requires upgrade */
  featureName?: string;
  /** Maximum users on current plan */
  maxUsers?: number;
}

/**
 * Inline prompt shown when a user hits a plan limit.
 */
export function UpgradePrompt({
  orgSlug,
  currentPlan,
  limitType,
  featureName,
  maxUsers,
}: UpgradePromptProps) {
  const nextPlan = currentPlan === 'free' ? 'Professional' : 'Enterprise';

  const message =
    limitType === 'user'
      ? `Your ${currentPlan === 'free' ? 'Free' : 'Professional'} plan supports up to ${maxUsers ?? 5} users. Upgrade to ${nextPlan} for more.`
      : `${featureName ?? 'This feature'} requires the ${nextPlan} plan.`;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Plan limit reached
          </p>
          <p className="text-sm text-amber-700 mt-1">{message}</p>
          <Link
            href={`/${orgSlug}/settings/billing`}
            className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-amber-800 hover:text-amber-900 transition-colors"
          >
            View plans
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
