/**
 * Plan configuration and entitlement tests.
 *
 * Covers:
 * - Plan definition correctness (prices, limits, features)
 * - getPlanByPriceId() mapping
 * - getPlanConfig() retrieval
 * - getPlanLimits() pure function
 * - Plan tier ordering
 */

import { describe, it, expect } from 'vitest';
import { PLANS, getPlanByPriceId, getPlanConfig } from '@/lib/stripe/plans';
import type { Plan } from '@/types';

// getPlanLimits is a pure function but lives in entitlements.ts which
// imports the DB client. We inline an equivalent here to avoid the DB dep.
function getPlanLimits(tier: Plan) {
  const config = PLANS[tier];
  return {
    maxUsers: config.maxUsers,
    features: config.entitlements,
    name: config.name,
  };
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

describe('PLANS', () => {
  it('defines exactly three tiers: free, professional, enterprise', () => {
    const tiers = Object.keys(PLANS);
    expect(tiers).toEqual(['free', 'professional', 'enterprise']);
  });

  it('free tier has zero price and 5 max users', () => {
    expect(PLANS.free.priceMonthly).toBe(0);
    expect(PLANS.free.maxUsers).toBe(5);
    expect(PLANS.free.stripePriceId).toBeNull();
  });

  it('professional tier is £49/mo with 25 max users', () => {
    expect(PLANS.professional.priceMonthly).toBe(4900);
    expect(PLANS.professional.maxUsers).toBe(25);
    expect(PLANS.professional.priceDisplay).toBe('\u00a349/mo');
  });

  it('enterprise tier is £149/mo with unlimited users', () => {
    expect(PLANS.enterprise.priceMonthly).toBe(14900);
    expect(PLANS.enterprise.maxUsers).toBe(Infinity);
    expect(PLANS.enterprise.priceDisplay).toBe('\u00a3149/mo');
  });

  it('each tier has a non-empty features list', () => {
    for (const [, config] of Object.entries(PLANS)) {
      expect(config.features.length).toBeGreaterThan(0);
    }
  });

  it('each tier has a non-empty entitlements list', () => {
    for (const [, config] of Object.entries(PLANS)) {
      expect(config.entitlements.length).toBeGreaterThan(0);
    }
  });

  it('professional entitlements are a superset of free entitlements', () => {
    for (const entitlement of PLANS.free.entitlements) {
      expect(PLANS.professional.entitlements).toContain(entitlement);
    }
  });

  it('enterprise entitlements are a superset of professional entitlements', () => {
    for (const entitlement of PLANS.professional.entitlements) {
      expect(PLANS.enterprise.entitlements).toContain(entitlement);
    }
  });
});

// ---------------------------------------------------------------------------
// getPlanByPriceId
// ---------------------------------------------------------------------------

describe('getPlanByPriceId', () => {
  it('returns "free" for an unknown price ID', () => {
    expect(getPlanByPriceId('price_unknown')).toBe('free');
  });

  it('returns "free" for an empty string', () => {
    expect(getPlanByPriceId('')).toBe('free');
  });

  // Note: actual price ID matching depends on env vars being set
  // In test, STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID are typically empty
});

// ---------------------------------------------------------------------------
// getPlanConfig
// ---------------------------------------------------------------------------

describe('getPlanConfig', () => {
  it.each<Plan>(['free', 'professional', 'enterprise'])(
    'returns config for %s tier',
    (tier) => {
      const config = getPlanConfig(tier);
      expect(config).toBeDefined();
      expect(config.tier).toBe(tier);
      expect(config.name).toBeTruthy();
    },
  );
});

// ---------------------------------------------------------------------------
// getPlanLimits (pure function)
// ---------------------------------------------------------------------------

describe('getPlanLimits', () => {
  it('returns correct limits for free tier', () => {
    const limits = getPlanLimits('free');
    expect(limits.maxUsers).toBe(5);
    expect(limits.name).toBe('Free');
    expect(limits.features).toContain('care_plans');
  });

  it('returns correct limits for professional tier', () => {
    const limits = getPlanLimits('professional');
    expect(limits.maxUsers).toBe(25);
    expect(limits.name).toBe('Professional');
    expect(limits.features).toContain('risk_assessments');
  });

  it('returns unlimited users for enterprise tier', () => {
    const limits = getPlanLimits('enterprise');
    expect(limits.maxUsers).toBe(Infinity);
    expect(limits.name).toBe('Enterprise');
    expect(limits.features).toContain('api_access');
  });

  it('enterprise has more features than professional', () => {
    const pro = getPlanLimits('professional');
    const ent = getPlanLimits('enterprise');
    expect(ent.features.length).toBeGreaterThan(pro.features.length);
  });

  it('professional has more features than free', () => {
    const free = getPlanLimits('free');
    const pro = getPlanLimits('professional');
    expect(pro.features.length).toBeGreaterThan(free.features.length);
  });
});
