'use client';

import { useState, useTransition } from 'react';
import { ExternalLink, Loader2, Users, Calendar, CreditCard } from 'lucide-react';
import { createPortalSession } from '@/features/billing/actions';
import { PlanBadge } from './plan-badge';
import type { Plan } from '@/types';

interface BillingSettingsProps {
  orgId: string;
  plan: Plan;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  maxUsers: number;
  currentUserCount: number;
  stripeCustomerId: string | null;
}

/**
 * Subscription management panel showing current plan, usage, and portal link.
 */
export function BillingSettings({
  orgId,
  plan,
  subscriptionStatus,
  currentPeriodEnd,
  maxUsers,
  currentUserCount,
  stripeCustomerId,
}: BillingSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleManageBilling() {
    setError(null);
    startTransition(async () => {
      const result = await createPortalSession({ orgId });
      if (result.success) {
        window.location.href = result.data.url;
      } else {
        setError(result.error);
      }
    });
  }

  const isPaid = plan !== 'free';
  const usagePercentage = maxUsers > 0 ? Math.min((currentUserCount / maxUsers) * 100, 100) : 0;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[oklch(0.93_0.005_160)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
              Current plan
            </h2>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
              {isPaid
                ? `Your subscription is ${subscriptionStatus}.`
                : 'You are on the free plan.'}
            </p>
          </div>
          <PlanBadge plan={plan} />
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Usage stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Users */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.98_0.003_160)]">
              <div className="h-8 w-8 rounded-md bg-[oklch(0.92_0.01_160)] flex items-center justify-center">
                <Users className="h-4 w-4 text-[oklch(0.35_0.06_160)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-[oklch(0.55_0_0)]">Users</p>
                <p className="text-sm font-semibold text-[oklch(0.18_0.03_160)]">
                  {currentUserCount} / {maxUsers >= 999999 ? '\u221e' : maxUsers}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.98_0.003_160)]">
              <div className="h-8 w-8 rounded-md bg-[oklch(0.92_0.01_160)] flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-[oklch(0.35_0.06_160)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-[oklch(0.55_0_0)]">Status</p>
                <p className="text-sm font-semibold text-[oklch(0.18_0.03_160)] capitalize">
                  {subscriptionStatus === 'past_due' ? 'Past due' : subscriptionStatus}
                </p>
              </div>
            </div>

            {/* Renewal */}
            {currentPeriodEnd && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.98_0.003_160)]">
                <div className="h-8 w-8 rounded-md bg-[oklch(0.92_0.01_160)] flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[oklch(0.35_0.06_160)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-[oklch(0.55_0_0)]">Renews</p>
                  <p className="text-sm font-semibold text-[oklch(0.18_0.03_160)]">
                    {new Date(currentPeriodEnd).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User usage bar */}
          {maxUsers < 999999 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[oklch(0.55_0_0)]">User seats</p>
                <p className={`text-xs font-medium ${isNearLimit ? 'text-amber-600' : 'text-[oklch(0.45_0_0)]'}`}>
                  {usagePercentage.toFixed(0)}% used
                </p>
              </div>
              <div className="h-2 rounded-full bg-[oklch(0.93_0.005_160)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isNearLimit ? 'bg-amber-500' : 'bg-[oklch(0.35_0.06_160)]'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manage billing */}
      {isPaid && stripeCustomerId && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-2">
            Payment & invoices
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
            Manage your payment methods, view invoices, and update subscription details in the Stripe Customer Portal.
          </p>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleManageBilling}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Manage billing
              </>
            )}
          </button>
        </div>
      )}

      {/* Free plan CTA */}
      {!isPaid && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-2">
            Payment & invoices
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Full payment management, invoice history, and subscription controls will be available once you upgrade to a paid plan.
            Contact{' '}
            <a
              href="mailto:billing@completecare.co.uk"
              className="text-[oklch(0.35_0.06_160)] hover:underline font-medium"
            >
              billing@completecare.co.uk
            </a>{' '}
            for billing enquiries.
          </p>
        </div>
      )}
    </div>
  );
}
