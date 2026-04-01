import type { Plan } from '@/types';

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

export type PlanConfig = {
  name: string;
  tier: Plan;
  /** Monthly price in GBP pence (0 for free) */
  priceMonthly: number;
  /** Display price string */
  priceDisplay: string;
  /** Maximum number of users (Infinity for unlimited) */
  maxUsers: number;
  /** Stripe Price ID from env (null for free) */
  stripePriceId: string | null;
  features: string[];
  /** Features used for entitlement gating */
  entitlements: string[];
};

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    name: 'Free',
    tier: 'free',
    priceMonthly: 0,
    priceDisplay: 'Free',
    maxUsers: 5,
    stripePriceId: null,
    features: [
      'Up to 5 users',
      'Core care planning',
      'Basic care notes',
      'Basic audit trail',
      'Email support',
    ],
    entitlements: [
      'care_plans',
      'care_notes',
      'persons',
      'basic_audit',
    ],
  },
  professional: {
    name: 'Professional',
    tier: 'professional',
    priceMonthly: 4900,
    priceDisplay: '\u00a349/mo',
    maxUsers: 25,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    features: [
      'Up to 25 users',
      'All care management features',
      'Advanced care plans',
      'Full audit trail & compliance tools',
      'Risk assessments',
      'Incident reporting',
      'Document management',
      'Priority support',
    ],
    entitlements: [
      'care_plans',
      'care_notes',
      'persons',
      'basic_audit',
      'advanced_care_plans',
      'full_audit',
      'risk_assessments',
      'incidents',
      'documents',
      'priority_support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    tier: 'enterprise',
    priceMonthly: 14900,
    priceDisplay: '\u00a3149/mo',
    maxUsers: Infinity,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
    features: [
      'Unlimited users',
      'Everything in Professional',
      'API access',
      'Custom integrations',
      'Priority support & SLA',
      'Dedicated account manager',
      'Custom data retention',
    ],
    entitlements: [
      'care_plans',
      'care_notes',
      'persons',
      'basic_audit',
      'advanced_care_plans',
      'full_audit',
      'risk_assessments',
      'incidents',
      'documents',
      'priority_support',
      'api_access',
      'custom_integrations',
      'sla',
    ],
  },
};

/**
 * Resolve a Stripe price ID to its plan tier.
 * Returns 'free' if the price ID doesn't match any plan.
 */
export function getPlanByPriceId(priceId: string): Plan {
  for (const [tier, config] of Object.entries(PLANS)) {
    if (config.stripePriceId === priceId) {
      return tier as Plan;
    }
  }
  return 'free';
}

/**
 * Get the plan config for a given tier.
 */
export function getPlanConfig(tier: Plan): PlanConfig {
  return PLANS[tier];
}
