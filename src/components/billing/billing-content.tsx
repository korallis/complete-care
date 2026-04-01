import { CreditCard } from 'lucide-react';
import { BillingSettings } from './billing-settings';
import { PricingCards } from './pricing-cards';
import type { Plan } from '@/types';

interface BillingContentProps {
  orgId: string;
  plan: Plan;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  maxUsers: number;
  currentUserCount: number;
  stripeCustomerId: string | null;
}

export function BillingContent({
  orgId,
  plan,
  subscriptionStatus,
  currentPeriodEnd,
  maxUsers,
  currentUserCount,
  stripeCustomerId,
}: BillingContentProps) {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_160)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Page header */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CreditCard className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
              Billing & Subscription
            </h1>
            <p className="text-sm text-[oklch(0.48_0_0)] mt-0.5">
              Manage your plan, payment details, and invoices.
            </p>
          </div>
        </div>

        {/* Current plan + usage */}
        <BillingSettings
          orgId={orgId}
          plan={plan}
          subscriptionStatus={subscriptionStatus}
          currentPeriodEnd={currentPeriodEnd}
          maxUsers={maxUsers}
          currentUserCount={currentUserCount}
          stripeCustomerId={stripeCustomerId}
        />

        {/* Pricing cards */}
        <div>
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-4">
            {plan === 'free' ? 'Upgrade your plan' : 'Available plans'}
          </h2>
          <PricingCards orgId={orgId} currentPlan={plan} />
        </div>
      </div>
    </div>
  );
}
