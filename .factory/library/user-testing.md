# User Testing

Testing surface, required testing skills/tools, and resource cost classification.

**What belongs here:** Validation surface findings, tools used for testing, concurrency limits, runtime observations.
**What does NOT belong here:** Feature requirements or implementation details.

---

## Validation Surface

### Primary Surface: Browser UI
- **Tool**: `agent-browser` skill
- **URL**: http://localhost:3200
- **Scope**: All UI flows — navigation, forms, data display, interactive features, responsive layout
- **Setup**: Start Next.js dev server via `PORT=3200 bun run dev`

### Secondary Surface: API
- **Tool**: `curl`
- **Scope**: API route verification, webhook testing, server action validation
- **Base URL**: http://localhost:3200/api

## Validation Concurrency

### agent-browser (Primary)
- **Machine**: 24GB RAM, 12 CPU cores
- **Baseline usage**: ~9.6GB active+wired
- **Reclaimable headroom (70%)**: ~2.6GB
- **Per-validator cost**: ~500-700MB (Next.js dev server shared + headless browser instance)
- **Max concurrent validators**: **3**
- **Rationale**: Memory-constrained. 3 instances × 600MB avg = 1.8GB, within 2.6GB budget. Dev server shared across instances.

## Testing Prerequisites

- Next.js dev server running on port 3200
- Database accessible (Vercel Postgres / Neon)
- Seed data loaded for testing (test organisation, test users with different roles)
- `.env.local` configured with all required variables

## Runtime Observations

- In development, verification, password reset, and invitation emails are **logged to the Next.js dev server console** when SMTP is not configured. Flow validators can read the shared dev-server log to recover real verification/reset/invitation URLs without adding any email mock service.
- Opening logged verification links inside browser automation can intermittently fail during the redirect chain with a transient "Execution context was destroyed" error even though the server-side verification still succeeds. When that happens, reuse the token from the logged URL against `/api/auth/verify-email?token=...` or reload the final redirected login URL and continue from the success banner.
- The app is healthy at `http://localhost:3200` with `.env.local` loaded.
- The earlier `audit_logs.ip_address` schema mismatch no longer blocks the foundation rerun surfaces: onboarding, invitations, team management, org settings, and the central audit log now complete without the prior NeonDbError. The remaining audit limitation is missing care-significant mutation UI/routes needed to fully verify end-to-end audit coverage.
- For org-scoped API validation, the custom `/api/auth/login` path is not sufficient to establish `activeOrgId`/role context. Use the real Auth.js credentials callback/browser login flow (or an equivalent session established through it) before running org-scoped API checks.
- If auth/onboarding controls stop hydrating (for example the register form falls back to a `GET /register?...` submission, billing routes throw missing vendor-chunk errors, or owner-only pages suddenly 500), restart the shared Next.js dev server before treating those symptoms as product failures. A clean `PORT=3200 bun run dev` restart cleared that stale-runtime state during the foundation round-3 rerun and restored the real browser flows.

## Known Constraints

- No Docker available — all services must run natively
- Google Maps API requires valid key for EVV/mapping tests
- Stripe webhook testing requires `stripe listen` CLI forwarding
- AWS Bedrock requires valid credentials for AI feature testing
- Google OAuth is currently misconfigured in this environment: the real provider flow fails immediately with `Missing required parameter: client_id`.

## Flow Validator Guidance: agent-browser

- Stay inside your assigned email namespace, org names, and browser session only.
- Use unique emails and unique org slugs per validator group to avoid shared-state collisions.
- If a flow needs an emailed link, read it from the shared dev-server log instead of inventing tokens.
- Do not revoke, expire, or edit invitations, memberships, or organisations created by other validator groups.
- Prefer UI-driven setup first; only use direct data setup when the assertion explicitly requires an expired or tampered credential case that cannot be produced through the UI alone.

## Flow Validator Guidance: curl

- Use only credentials, cookies, JWTs, org IDs, and record IDs created within your own validator group.
- Capture auth/session artifacts from real app flows before sending API requests.
- Keep destructive API calls scoped to the minimum needed to verify permission enforcement.
- When testing tenant isolation, create dedicated Org A / Org B data for your own group and never reuse another group's entities.
