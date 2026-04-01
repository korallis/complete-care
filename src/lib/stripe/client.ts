import Stripe from 'stripe';

/**
 * Stripe SDK client (server-side only).
 * Uses the secret key from env. Never import this on the client.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});
