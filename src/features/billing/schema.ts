import { z } from 'zod';

/**
 * Zod validation schemas for billing actions.
 */

export const createCheckoutSessionSchema = z.object({
  orgId: z.string().uuid('Invalid organisation ID'),
  plan: z.enum(['professional', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid plan selection' }),
  }),
});

export const createPortalSessionSchema = z.object({
  orgId: z.string().uuid('Invalid organisation ID'),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>;
