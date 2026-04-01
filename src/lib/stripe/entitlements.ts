import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organisations, memberships } from '@/lib/db/schema';
import { PLANS, getPlanConfig } from './plans';
import type { Plan } from '@/types';

// ---------------------------------------------------------------------------
// Entitlement checking
// ---------------------------------------------------------------------------

/**
 * Check whether an organisation has access to a specific feature entitlement.
 */
export async function checkEntitlement(
  orgId: string,
  feature: string,
): Promise<boolean> {
  const [org] = await db
    .select({ plan: organisations.plan })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) return false;

  const plan = org.plan as Plan;
  const config = getPlanConfig(plan);
  return config.entitlements.includes(feature);
}

/**
 * Check whether an organisation can add another user given their plan limits.
 */
export async function canAddUser(orgId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxUsers: number;
  plan: Plan;
}> {
  const [org] = await db
    .select({
      plan: organisations.plan,
      maxUsers: organisations.maxUsers,
    })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) {
    return { allowed: false, currentCount: 0, maxUsers: 0, plan: 'free' };
  }

  const plan = org.plan as Plan;

  // Count active members
  const members = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.organisationId, orgId));

  const currentCount = members.length;
  const maxUsers = org.maxUsers;

  return {
    allowed: currentCount < maxUsers,
    currentCount,
    maxUsers,
    plan,
  };
}

/**
 * Get the plan limits for a given tier. Pure function, no DB calls.
 */
export function getPlanLimits(tier: Plan) {
  const config = PLANS[tier];
  return {
    maxUsers: config.maxUsers,
    features: config.entitlements,
    name: config.name,
  };
}

/**
 * Check if an org's subscription is active (paid or free).
 * Returns false for past_due, canceled, incomplete statuses.
 */
export async function isSubscriptionActive(orgId: string): Promise<boolean> {
  const [org] = await db
    .select({ subscriptionStatus: organisations.subscriptionStatus })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) return false;

  return ['free', 'active', 'trialing'].includes(org.subscriptionStatus);
}
