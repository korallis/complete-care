'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Zap, Building2, Sparkles, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/features/billing/actions';
import type { Plan } from '@/types';

interface PricingCardsProps {
  orgId: string;
  currentPlan: Plan;
}

const PLAN_DATA = [
  {
    tier: 'free' as const,
    name: 'Free',
    price: '\u00a30',
    period: '/mo',
    icon: Sparkles,
    highlighted: false,
    features: [
      'Up to 5 users',
      'Core care planning',
      'Basic care notes',
      'Basic audit trail',
      'Email support',
    ],
  },
  {
    tier: 'professional' as const,
    name: 'Professional',
    price: '\u00a349',
    period: '/mo',
    icon: Zap,
    highlighted: true,
    features: [
      'Up to 25 users',
      'All care management features',
      'Advanced care plans',
      'Full audit trail & compliance',
      'Risk assessments & incidents',
      'Document management',
      'Priority support',
    ],
  },
  {
    tier: 'enterprise' as const,
    name: 'Enterprise',
    price: '\u00a3149',
    period: '/mo',
    icon: Building2,
    highlighted: false,
    features: [
      'Unlimited users',
      'Everything in Professional',
      'API access',
      'Custom integrations',
      'Priority support & SLA',
      'Dedicated account manager',
    ],
  },
];

export function PricingCards({ orgId, currentPlan }: PricingCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUpgrade(plan: 'professional' | 'enterprise') {
    setError(null);
    setLoadingPlan(plan);
    startTransition(async () => {
      const result = await createCheckoutSession({ orgId, plan });
      if (result.success) {
        window.location.href = result.data.url;
      } else {
        setError(result.error);
        setLoadingPlan(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLAN_DATA.map((plan) => {
          const isCurrent = currentPlan === plan.tier;
          const isUpgrade =
            plan.tier !== 'free' &&
            !isCurrent &&
            (currentPlan === 'free' ||
              (currentPlan === 'professional' && plan.tier === 'enterprise'));
          const isLoading = loadingPlan === plan.tier && isPending;

          return (
            <div
              key={plan.tier}
              className={`
                rounded-xl overflow-hidden shadow-sm
                ${plan.highlighted
                  ? 'border-2 border-[oklch(0.35_0.06_160)] ring-1 ring-[oklch(0.35_0.06_160)]/10'
                  : 'border border-[oklch(0.91_0.005_160)]'}
                ${isCurrent ? 'bg-[oklch(0.98_0.005_160)]' : 'bg-white'}
              `}
            >
              {/* Header */}
              <div
                className={`
                  px-5 py-4 flex items-center gap-2
                  ${plan.highlighted
                    ? 'bg-[oklch(0.22_0.04_160)]'
                    : 'bg-[oklch(0.97_0.005_160)]'}
                `}
              >
                <plan.icon
                  className={`h-4 w-4 ${plan.highlighted ? 'text-white' : 'text-[oklch(0.35_0.06_160)]'}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-sm font-semibold ${plan.highlighted ? 'text-white' : 'text-[oklch(0.22_0.02_160)]'}`}
                >
                  {plan.name}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                    Current
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[oklch(0.18_0.03_160)]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[oklch(0.55_0_0)]">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="px-5 pb-4">
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-[oklch(0.35_0.02_160)]"
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center rounded-lg border border-[oklch(0.88_0.005_160)] text-[oklch(0.55_0_0)] text-sm font-medium py-2.5">
                    Current plan
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.tier as 'professional' | 'enterprise')}
                    disabled={isPending}
                    className="block w-full text-center rounded-lg bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] disabled:opacity-50 text-white text-sm font-semibold py-2.5 transition-colors"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : (
                  <div className="w-full text-center rounded-lg border border-[oklch(0.88_0.005_160)] text-[oklch(0.45_0_0)] text-sm font-medium py-2.5 opacity-50">
                    {plan.tier === 'free' ? 'Free tier' : 'Included'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
