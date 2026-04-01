// Database schema — Drizzle ORM
// One file per domain area. All exports aggregated here for drizzle.config.ts.
// Relations are centralised in ./relations.ts to avoid circular imports.

export * from './organisations';
export * from './users';
export * from './memberships';
export * from './invitations';
export * from './audit-logs';
export * from './email-verification-tokens';
export * from './password-reset-tokens';
export * from './login-attempts';

// Tenant-scoped entity tables (m1: minimal stubs for isolation enforcement)
export * from './persons';
export * from './staff-profiles';
export * from './care-plans';
export * from './care-notes';
export * from './documents';

export * from './relations';
