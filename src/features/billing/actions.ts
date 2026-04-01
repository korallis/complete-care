'use server';

/**
 * Billing Server Actions
 *
 * - createCheckoutSession — redirect to Stripe Checkout for subscription
 * - createPortalSession — redirect to Stripe Customer Portal for management
 * - getSubscriptionStatus — fetch current org subscription state
 * - getCurrentPlan — fetch the current plan tier and config
 */

import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations, memberships } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe/client';
import { PLANS, getPlanConfig } from '@/lib/stripe/plans';
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
} from './schema';
import type { Plan, ActionResult } from '@/types';
import type { PlanConfig } from '@/lib/stripe/plans';

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

export async function createCheckoutSession(input: {
  orgId: string;
  plan: 'professional' | 'enterprise';
}): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const parsed = createCheckoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { orgId, plan } = parsed.data;

  // Verify user is owner of this org
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.organisationId, orgId),
      ),
    )
    .limit(1);

  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Only organisation owners can manage billing' };
  }

  // Get org details
  const [org] = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      stripeCustomerId: organisations.stripeCustomerId,
    })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) {
    return { success: false, error: 'Organisation not found' };
  }

  const planConfig = PLANS[plan];
  if (!planConfig.stripePriceId) {
    return { success: false, error: 'Plan price not configured' };
  }

  // Create or reuse Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { orgId: org.id },
    });
    customerId = customer.id;

    await db
      .update(organisations)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(organisations.id, orgId));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/${org.slug}/settings/billing?success=true`,
    cancel_url: `${appUrl}/${org.slug}/settings/billing?canceled=true`,
    metadata: {
      orgId: org.id,
    },
    subscription_data: {
      metadata: {
        orgId: org.id,
      },
    },
  });

  if (!checkoutSession.url) {
    return { success: false, error: 'Failed to create checkout session' };
  }

  return { success: true, data: { url: checkoutSession.url } };
}

// ---------------------------------------------------------------------------
// createPortalSession
// ---------------------------------------------------------------------------

export async function createPortalSession(input: {
  orgId: string;
}): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  const parsed = createPortalSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { orgId } = parsed.data;

  // Verify user is owner
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.organisationId, orgId),
      ),
    )
    .limit(1);

  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Only organisation owners can manage billing' };
  }

  const [org] = await db
    .select({
      stripeCustomerId: organisations.stripeCustomerId,
      slug: organisations.slug,
    })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org?.stripeCustomerId) {
    return { success: false, error: 'No billing account found. Subscribe to a plan first.' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl}/${org.slug}/settings/billing`,
  });

  return { success: true, data: { url: portalSession.url } };
}

// ---------------------------------------------------------------------------
// getSubscriptionStatus
// ---------------------------------------------------------------------------

export type SubscriptionStatus = {
  plan: Plan;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  maxUsers: number;
  currentUserCount: number;
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const session = await auth();
  if (!session?.user?.activeOrgId) return null;

  const orgId = session.user.activeOrgId;

  const [org] = await db
    .select({
      plan: organisations.plan,
      subscriptionStatus: organisations.subscriptionStatus,
      currentPeriodEnd: organisations.currentPeriodEnd,
      stripeSubscriptionId: organisations.stripeSubscriptionId,
      stripeCustomerId: organisations.stripeCustomerId,
      maxUsers: organisations.maxUsers,
    })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (!org) return null;

  // Count current members
  const members = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.organisationId, orgId));

  return {
    plan: org.plan as Plan,
    subscriptionStatus: org.subscriptionStatus,
    currentPeriodEnd: org.currentPeriodEnd,
    stripeSubscriptionId: org.stripeSubscriptionId,
    stripeCustomerId: org.stripeCustomerId,
    maxUsers: org.maxUsers,
    currentUserCount: members.length,
  };
}

// ---------------------------------------------------------------------------
// getCurrentPlan
// ---------------------------------------------------------------------------

export type CurrentPlanInfo = {
  plan: Plan;
  config: PlanConfig;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  maxUsers: number;
  currentUserCount: number;
};

export async function getCurrentPlan(): Promise<CurrentPlanInfo | null> {
  const status = await getSubscriptionStatus();
  if (!status) return null;

  const config = getPlanConfig(status.plan);

  return {
    plan: status.plan,
    config,
    subscriptionStatus: status.subscriptionStatus,
    currentPeriodEnd: status.currentPeriodEnd,
    maxUsers: status.maxUsers,
    currentUserCount: status.currentUserCount,
  };
}
