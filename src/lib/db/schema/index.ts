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
export * from './care-plan-versions';
export * from './care-notes';
export * from './documents';

export * from './notifications';
export * from './risk-assessments';
export * from './incidents';
export * from './medications';
export * from './prn-protocols';
export * from './clinical-monitoring';
export * from './vital-signs';
export * from './bowel-sleep-pain';
export * from './dbs-checks';
export * from './training';
export * from './supervisions';
export * from './compliance';
export * from './leave';

export * from './relations';
