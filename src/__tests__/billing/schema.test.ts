/**
 * Billing Zod schema validation tests.
 *
 * Covers:
 * - createCheckoutSessionSchema
 * - createPortalSessionSchema
 */

import { describe, it, expect } from 'vitest';
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
} from '@/features/billing/schema';

describe('createCheckoutSessionSchema', () => {
  it('accepts valid professional plan input', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      plan: 'professional',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid enterprise plan input', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      plan: 'enterprise',
    });
    expect(result.success).toBe(true);
  });

  it('rejects free plan (checkout not needed for free)', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      plan: 'free',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid plan name', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      plan: 'super_plan',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID orgId', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: 'not-a-uuid',
      plan: 'professional',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing orgId', () => {
    const result = createCheckoutSessionSchema.safeParse({
      plan: 'professional',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing plan', () => {
    const result = createCheckoutSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPortalSessionSchema', () => {
  it('accepts a valid UUID orgId', () => {
    const result = createPortalSessionSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID orgId', () => {
    const result = createPortalSessionSchema.safeParse({
      orgId: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing orgId', () => {
    const result = createPortalSessionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
