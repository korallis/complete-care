---
name: infrastructure-worker
description: Handles project scaffolding, database schema, auth, middleware, and backend infrastructure for the Complete Care platform.
---

# Infrastructure Worker

Specialised worker for foundational backend and infrastructure tasks on the Complete Care UK care management platform. Handles everything that is **not** a user-facing feature with UI — project scaffolding, database schema design, authentication, middleware, service configuration, and environment setup.

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Next.js 15 (App Router) |
| Database | Vercel Postgres (Neon) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 |
| AI | AWS Bedrock |
| Payments | Stripe |
| Styling | Tailwind CSS + shadcn/ui |
| Testing | Vitest |
| Language | TypeScript (strict) |

## When to Use This Skill

Use the infrastructure-worker when the task involves:

- **Project scaffolding** — Initial setup, directory structure, tooling configuration (ESLint, Prettier, Vitest, TypeScript config)
- **Database schema design** — Creating or modifying Drizzle ORM schemas, writing migrations, setting up connection pooling
- **Authentication** — Auth.js v5 configuration, providers, session strategy, user/account tables
- **Middleware** — Auth middleware, multi-tenancy (organisation-scoped data isolation), RBAC enforcement
- **Service configuration** — AWS Bedrock client setup, Stripe webhook handlers, email service wiring
- **Environment setup** — `.env` templates, validation (e.g. `@t3-oss/env-nextjs`), deployment config
- **Backend-only infrastructure** — Background jobs, cron tasks, audit logging, rate limiting, error tracking

**Do NOT use for** tasks that include frontend UI components, pages, or interactive forms — those belong to the **feature-worker**.

## Required Skills

None — this worker operates independently. It does not invoke other skills.

## Work Procedure

### 1. Understand the Task

- Read the full feature description, preconditions, and acceptance criteria.
- Identify which infrastructure layers are affected (database, auth, middleware, config).

### 2. Gather Architectural Context

- Read `.factory/library/` files for project conventions, directory structure, and architectural decisions.
- Read `.factory/research/tech-stack-patterns.md` for Drizzle, Auth.js, and connection pooling patterns.
- Read `.factory/research/regulatory-compliance.md` if the task involves data handling or audit requirements.
- Check existing code in `src/lib/`, `src/db/`, `src/middleware.ts`, and `src/auth.ts` (or equivalent) to understand current patterns.

### 3. Plan Changes

- List every file that will be created or modified.
- For database schema changes: plan the migration strategy, consider data preservation, and check for index requirements.
- For middleware: consider the order of execution and interaction with existing middleware.

### 4. Write Tests First (TDD)

- Write failing tests using **Vitest** before implementing.
- For database schemas: test schema validation, constraints, and relationships.
- For middleware: test auth enforcement, role checking, and tenant isolation.
- For config: test environment variable validation and fallback behaviour.

### 5. Implement

- Follow existing project conventions found in `.factory/library/` and the codebase.
- Use Drizzle ORM patterns from `.factory/research/tech-stack-patterns.md`:
  - Use Neon HTTP driver as the default connection method.
  - Use `drizzle-kit` for migrations.
  - Define schemas with proper TypeScript inference (`$inferSelect`, `$inferInsert`).
- For auth: follow Auth.js v5 patterns with the Drizzle adapter.
- For middleware: use Next.js middleware with `matcher` config for route protection.

### 6. Verify

Run all verification commands:

```bash
bun run typecheck    # TypeScript strict mode — zero errors
bun run lint         # ESLint — zero warnings/errors
bun run test         # Vitest — all tests pass
```

For database changes, also verify:
```bash
bun run db:generate  # Generate Drizzle migration SQL
bun run db:push      # Push schema to dev database (if available)
```

### 7. Commit

Write a clear, descriptive commit message following the project's convention:

```
feat(db): add organisation and membership schema with RLS policies

- organisations table with slug, subscription tier, settings JSONB
- memberships table linking users to orgs with role enum
- row-level security via org_id foreign keys on all tenant-scoped tables
- Drizzle migration generated and verified
```

## Example Handoff

```json
{
  "status": "completed",
  "feature": "Multi-tenant database schema and organisation middleware",
  "filesChanged": [
    "src/db/schema/organisations.ts",
    "src/db/schema/memberships.ts",
    "src/db/schema/index.ts",
    "src/db/migrations/0002_add_organisations.sql",
    "src/middleware.ts",
    "src/lib/auth/org-context.ts",
    "src/lib/db.ts",
    "tests/db/organisations.test.ts",
    "tests/middleware/org-context.test.ts"
  ],
  "summary": "Created organisations and memberships schema with Drizzle ORM. Organisations have slug-based routing, subscription tiers (free/professional/enterprise), and JSONB settings. Memberships link users to orgs with roles (owner/admin/manager/carer/viewer). Added middleware that extracts org slug from the URL path, validates membership, and injects orgId into the request context. All tenant-scoped tables require org_id foreign key. Wrote 14 tests covering schema constraints, role validation, middleware auth enforcement, and cross-tenant data isolation. Typecheck, lint, and all tests pass.",
  "testResults": {
    "total": 14,
    "passed": 14,
    "failed": 0
  },
  "verificationCommands": [
    "bun run typecheck — 0 errors",
    "bun run lint — 0 warnings",
    "bun run test -- tests/db/organisations.test.ts — 8 passed",
    "bun run test -- tests/middleware/org-context.test.ts — 6 passed",
    "bun run db:generate — migration 0002_add_organisations.sql generated"
  ],
  "commitHash": "a3f7c21",
  "commitMessage": "feat(db): add multi-tenant org schema and membership middleware"
}
```

## When to Return to Orchestrator

Return to the orchestrator when:

1. **Task is complete** — All acceptance criteria met, tests pass, typecheck and lint clean, commit made.
2. **Blocked by missing dependency** — e.g. a required environment variable isn't set, a service isn't configured, or a prerequisite feature hasn't been built yet.
3. **Scope creep detected** — The task requires UI components or frontend work that should be handled by the feature-worker instead.
4. **Ambiguity in requirements** — The acceptance criteria are unclear and multiple valid interpretations exist that would lead to significantly different implementations.
5. **Breaking change risk** — The change would break existing functionality and needs orchestrator confirmation before proceeding.
