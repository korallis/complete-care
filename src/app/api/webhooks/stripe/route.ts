/**
 * Stripe Webhook Handler
 *
 * Receives and processes Stripe webhook events for subscription lifecycle management.
 * Must use Node.js runtime for raw body access (Stripe signature verification).
 *
 * Events handled:
 * - checkout.session.completed — activate subscription after successful checkout
 * - customer.subscription.updated — plan changes (upgrade/downgrade)
 * - customer.subscription.deleted — subscription canceled
 * - invoice.payment_succeeded — confirm payment
 * - invoice.payment_failed — mark subscription as past_due
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { getPlanByPriceId, PLANS } from '@/lib/stripe/plans';
import { db } from '@/lib/db';
import { organisations, auditLogs } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[stripe-webhook] Signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const orgId = session.metadata?.orgId;
  if (!orgId) {
    console.error('[stripe-webhook] checkout.session.completed missing orgId in metadata');
    return;
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) return;

  // Fetch the subscription to get price and period details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = getPlanByPriceId(priceId);
  const planConfig = PLANS[plan];

  await db
    .update(organisations)
    .set({
      stripeCustomerId: typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      plan,
      subscriptionStatus: 'active',
      currentPeriodEnd: new Date(
        subscription.items.data[0]?.current_period_end * 1000,
      ),
      maxUsers: planConfig.maxUsers === Infinity ? 999999 : planConfig.maxUsers,
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, orgId));

  // Audit log
  await db.insert(auditLogs).values({
    organisationId: orgId,
    action: 'subscription_activated',
    entityType: 'organisation',
    entityId: orgId,
    changes: { after: { plan, subscriptionStatus: 'active' } },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const [org] = await db
    .select({ id: organisations.id, plan: organisations.plan })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newPlan = getPlanByPriceId(priceId);
  const planConfig = PLANS[newPlan];
  const status = mapStripeStatus(subscription.status);

  await db
    .update(organisations)
    .set({
      stripePriceId: priceId,
      stripeSubscriptionId: subscription.id,
      plan: newPlan,
      subscriptionStatus: status,
      currentPeriodEnd: new Date(
        subscription.items.data[0]?.current_period_end * 1000,
      ),
      maxUsers: planConfig.maxUsers === Infinity ? 999999 : planConfig.maxUsers,
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, org.id));

  // Audit log for plan changes
  if (org.plan !== newPlan) {
    await db.insert(auditLogs).values({
      organisationId: org.id,
      action: 'subscription_changed',
      entityType: 'organisation',
      entityId: org.id,
      changes: {
        before: { plan: org.plan },
        after: { plan: newPlan, subscriptionStatus: status },
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const [org] = await db
    .select({ id: organisations.id, plan: organisations.plan })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  // Downgrade to free
  await db
    .update(organisations)
    .set({
      plan: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      maxUsers: PLANS.free.maxUsers,
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, org.id));

  await db.insert(auditLogs).values({
    organisationId: org.id,
    action: 'subscription_canceled',
    entityType: 'organisation',
    entityId: org.id,
    changes: {
      before: { plan: org.plan },
      after: { plan: 'free', subscriptionStatus: 'canceled' },
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  // Ensure the subscription status is active after successful payment
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  await db
    .update(organisations)
    .set({
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, org.id));
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1);

  if (!org) return;

  await db
    .update(organisations)
    .set({
      subscriptionStatus: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, org.id));

  await db.insert(auditLogs).values({
    organisationId: org.id,
    action: 'payment_failed',
    entityType: 'organisation',
    entityId: org.id,
    changes: { after: { subscriptionStatus: 'past_due' } },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'trialing':
      return 'trialing';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    default:
      return 'free';
  }
}
