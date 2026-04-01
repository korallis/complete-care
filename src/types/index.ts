// Global TypeScript types for Complete Care
// Feature-specific types live in their feature module

/**
 * Care domain types — determines which features and terminology are used
 */
export type CareDomain =
  | 'domiciliary'
  | 'supported_living'
  | 'childrens_residential';

/**
 * User roles ordered by privilege level (highest to lowest)
 */
export type Role =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'senior_carer'
  | 'carer'
  | 'viewer';

/**
 * Subscription plan tiers
 */
export type Plan = 'free' | 'professional' | 'enterprise';

/**
 * API response shape for mutations
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };
