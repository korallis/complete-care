# Complete Care — Architecture

> **Status**: Reference document  
> **Stack**: Next.js 15 (App Router) · Bun · Vercel · Neon Postgres · Drizzle ORM · Auth.js v5 · AWS Bedrock · Stripe · Tailwind CSS + shadcn/ui

---

## 1. System Overview

Complete Care is a multi-tenant SaaS platform for UK care organisations that manages care delivery, regulatory compliance, and operational workflows across **three care domains**:

- **Domiciliary care** — home visits, scheduling, EVV, travel/route management
- **Supported living** — tenancy-based support, PBS plans, community access, outcomes tracking
- **Children's residential homes** — Ofsted compliance, safeguarding, LAC documentation, education tracking

An organisation subscribes and configures which domains it operates in. The platform adapts terminology, compliance tooling, and available features based on those domains.

### User Roles

| Actor | Context |
|---|---|
| **Organisation owner** | Sets up org, manages billing, full platform access |
| **Admin** | Manages users, settings, configuration |
| **Manager** | Oversees care plans, staff, compliance dashboards |
| **Senior carer** | Approves notes, creates care plans, elevated clinical access |
| **Carer** | Logs daily notes, records visits, views assigned persons |
| **Viewer** | Read-only access — inspectors, family portal users |

---

## 2. Application Architecture

### 2.1 Route Group Structure

The Next.js App Router uses **route groups** to separate layout trees without affecting URLs:

```
src/app/
├── (marketing)/          # Public pages — landing, pricing, blog
│   └── layout.tsx        # Marketing nav + footer
├── (auth)/               # Sign-in, register, forgot-password
│   └── layout.tsx        # Centred card layout, no sidebar
├── (dashboard)/          # Authenticated application
│   └── layout.tsx        # Auth gate → sidebar + org context + main content
└── api/                  # Webhooks and streaming endpoints only
    ├── webhooks/stripe/  # Stripe webhook handler
    └── chat/             # AI streaming (Vercel AI SDK)
```

The `(dashboard)` layout performs an `auth()` check and redirects unauthenticated users. It provides the sidebar, org-switcher, and notification system to all child routes.

### 2.2 Server vs Client Component Boundaries

**Default: Server Components.** Pages, layouts, and data-fetching wrappers are Server Components. They call `auth()`, query the database directly via Drizzle, and render HTML on the server.

**Client Components (`'use client'`)** are pushed to the leaf level — interactive tables, forms, maps, charts, rich text editors, and the AI chat panel. They receive pre-fetched data as props from parent Server Components.

```
Server Component (page.tsx)
  ├── auth() + db query
  ├── Renders heading, metadata
  └── <InteractiveTable data={rows} />   ← 'use client'
```

This boundary keeps the JS bundle small and ensures sensitive operations (auth checks, DB queries) never run in the browser.

### 2.3 Mutations via Server Actions

All data mutations go through **Server Actions** (`'use server'`), not API routes. Each action:

1. Calls `auth()` to get session and active org
2. Checks RBAC permissions
3. Validates input with Zod
4. Executes the Drizzle mutation (always scoped by `organisationId`)
5. Writes an audit trail entry
6. Calls `revalidatePath()` to refresh cached data

API routes (`src/app/api/`) are reserved for:
- **Webhooks** — Stripe payment events, external system callbacks
- **Streaming** — AI chat via Vercel AI SDK's `toDataStreamResponse()`

### 2.4 Feature Module Organisation

Domain logic lives in `src/features/`, not in the `app/` directory. Each feature module owns its components, server actions, hooks, and types:

```
src/features/
├── persons/           # Person management (residents/clients/young people)
├── care-plans/        # Care plan CRUD, versioning, reviews
├── daily-notes/       # Structured daily care notes
├── medications/       # EMAR, MAR charts, controlled drugs
├── risk-assessments/  # Scoring engines, alerts
├── staff/             # Employment, DBS, training matrix
├── compliance/        # CQC quality statements, Ofsted standards
├── rostering/         # Shift patterns, rota builder
├── billing/           # Stripe integration, invoicing
└── ai-assistant/      # Bedrock-powered features
```

Page files in `src/app/(dashboard)/` are thin — they import from the relevant feature module, fetch data, and compose the UI.

---

## 3. Data Architecture

### 3.1 Multi-Tenant Model

Every tenant-scoped table carries an `organisationId` column. There is **no shared data across tenants** in any user-facing table.

**Isolation strategy**: Application-level filtering enforced in a data access layer, with Postgres Row-Level Security (RLS) policies as defense-in-depth before production launch.

```
┌─────────────────────────────────────────────┐
│  Application Layer (Server Actions / DAL)    │
│  → Always filters by session.activeOrgId     │
├─────────────────────────────────────────────┤
│  Postgres RLS Policy                         │
│  → organisation_id = current_setting(...)    │
│  → Catches any application-layer bugs        │
└─────────────────────────────────────────────┘
```

### 3.2 Core Entity Relationships

```
organisations
  ├── memberships ←→ users          (many-to-many: user belongs to multiple orgs)
  ├── persons                        (residents / clients / young people)
  │   ├── care_plans                 (versioned, with review schedules)
  │   ├── daily_notes                (timestamped, linked to shifts)
  │   ├── risk_assessments           (scored, with alert thresholds)
  │   ├── medications                (MAR records, PRN, controlled drugs)
  │   ├── documents                  (uploaded files, categorised)
  │   └── incidents                  (safeguarding, falls, restraints)
  ├── staff_profiles                 (DBS, training, qualifications)
  ├── shifts / rosters               (scheduling, EVV records)
  ├── compliance_records             (CQC / Ofsted evidence)
  └── audit_log                      (immutable, every mutation)
```

Key design choices:

- **Users are global; memberships are tenant-scoped.** A user signs in once and can switch between organisations they belong to. The `memberships` table holds the `role` per org.
- **Persons are polymorphic by domain.** The `persons` table stores all care recipients. A `type` discriminator (`resident` | `client` | `young_person`) and the org's configured domains determine which features and terminology apply.
- **Soft deletes + audit trail.** Records are never physically deleted in tenant-scoped tables — they're soft-deleted with a `deletedAt` timestamp. The audit log records who did what, when, and the before/after state.

### 3.3 Drizzle ORM Patterns

- **Schema-first**: All tables defined in `src/lib/schema.ts` using Drizzle's `pgTable()`. Relations defined separately with `relations()`.
- **Neon HTTP driver** (`@neondatabase/serverless`) as the default connection — stateless HTTPS per query, no connection pool management, works on both Node and Edge runtimes.
- **Migrations**: `drizzle-kit generate` produces SQL migration files checked into git. `drizzle-kit push` for rapid local development only.
- **Type safety**: Drizzle infers TypeScript types from the schema. `InferSelectModel<typeof persons>` provides the select type; Zod schemas validate inputs at the boundary.

---

## 4. Authentication & Authorization

### 4.1 Auth.js v5 Flow

```
Browser → /api/auth/[...nextauth] → Auth.js
  ├── Credentials provider: email + password (bcrypt hash comparison)
  └── OAuth providers: Google (extendable to Microsoft, etc.)
```

- **Session strategy**: JWT (not database sessions). The JWT is stored in an HTTP-only cookie.
- **JWT payload**: `userId`, `activeOrgId`, `activeRole`, `memberships[]` (org IDs, slugs, roles).
- **Org switching**: Client calls `update()` with a new `activeOrgId`. The `jwt` callback verifies the user has a membership in that org and updates the token.

### 4.2 Session Structure

```typescript
session.user = {
  id: string;              // User's global ID
  email: string;
  name: string;
  activeOrgId: string;     // Currently selected organisation
  activeRole: Role;        // Role within that organisation
  memberships: [{          // All orgs user belongs to
    orgId, orgName, orgSlug, role
  }];
}
```

Every server-side operation reads `session.user.activeOrgId` to scope data access and `session.user.activeRole` to enforce permissions.

### 4.3 RBAC: Roles and Permissions

Six roles, ordered by privilege:

```
owner > admin > manager > senior_carer > carer > viewer
```

A **permission matrix** maps actions to allowed roles:

| Permission | owner | admin | manager | senior_carer | carer | viewer |
|---|---|---|---|---|---|---|
| persons:create | ✓ | ✓ | ✓ | | | |
| persons:read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| care_plans:approve | ✓ | ✓ | ✓ | | | |
| notes:create | ✓ | ✓ | ✓ | ✓ | ✓ | |
| medications:admin_cd | ✓ | ✓ | ✓ | ✓ | | |
| users:manage | ✓ | ✓ | | | | |
| billing:manage | ✓ | | | | | |

Enforcement happens in **two layers**:

1. **Middleware** — Redirects unauthenticated users; ensures `activeOrgId` exists for dashboard routes.
2. **Server Actions** — Every action calls `requirePermission('action:verb')` which checks the session role against the matrix and throws/redirects if denied.

### 4.4 Edge Compatibility

Auth.js config is split into an **edge-safe config** (`auth.config.ts` — providers, pages, no DB imports) used by middleware, and a **full config** (`auth.ts` — adapter, callbacks, session logic) used by server components and actions. This avoids importing Drizzle/pg into the Edge runtime.

---

## 5. Domain Model

### 5.1 Three Care Domains

An organisation selects one or more domains during onboarding: **domiciliary**, **supported_living**, **childrens_residential**.

Each domain brings domain-specific:

| Aspect | Domiciliary | Supported Living | Children's Residential |
|---|---|---|---|
| **Regulatory body** | CQC | CQC | Ofsted |
| **Person term** | Client | Client / Tenant | Young Person |
| **Core workflow** | Scheduled visits, EVV | Ongoing support hours, PBS | 24/7 residential, education |
| **Compliance tools** | CQC quality statements | CQC RSRCRC framework | Ofsted 9 Quality Standards, Reg 44/45 |
| **Safeguarding** | Standard adult | DoLS/LPS, MCA, restraint register | LADO, MASH, missing from care protocol |
| **Unique features** | Route optimisation, travel time, invoicing from visits | Personal budgets, community access, outcomes tracking | LAC documentation, PEPs, Statement of Purpose |

### 5.2 Person Model Flexibility

The `persons` table is a single entity with a `type` field. Shared attributes (name, DOB, contact details, allergies, GP info) are common columns. Domain-specific attributes are stored in structured JSONB fields or in related domain-specific tables (e.g. `placement_plans` for children, `tenancy_records` for supported living, `care_packages` for domiciliary).

### 5.3 Domain-Adaptive UI

The dashboard layout reads the organisation's configured domains and adapts:

- **Navigation items** — Children's homes see "Young People", "Education", "Reg 44 Reports"; domiciliary sees "Visits", "Routes", "Invoicing"
- **Terminology** — Column headers, form labels, and notification text swap based on domain context
- **Compliance sidebar** — Shows CQC quality statements or Ofsted quality standards depending on the person/org's regulatory context
- **Feature flags** — EMAR, EVV, PBS plans, restraint register, etc. are conditionally available based on domain + subscription plan

---

## 6. Key Invariants

These properties must hold at all times. Any violation is a critical bug.

### 6.1 Tenant Data Isolation

- Every tenant-scoped query MUST include `WHERE organisation_id = ?` with the session's `activeOrgId`.
- No API route, server action, or server component may return data belonging to a different organisation.
- Postgres RLS policies provide a second barrier — if the application layer has a bug, the database rejects cross-tenant reads/writes.

### 6.2 Audit Trail Immutability

- Every create, update, and delete operation writes to the `audit_log` table.
- The audit log is **append-only** — no UPDATE or DELETE operations are permitted on it.
- Each entry records: `timestamp`, `userId`, `organisationId`, `action`, `entityType`, `entityId`, `before` (JSON), `after` (JSON).
- Regulatory auditors (CQC, Ofsted) require evidence of who changed what and when.

### 6.3 RBAC Enforcement

- No mutation occurs without a permission check.
- Permission checks run server-side (never rely on client-side UI hiding).
- Role elevation (e.g. carer → manager) is itself a permissioned action restricted to owner/admin.

### 6.4 Regulatory Compliance

- **CQC quality statements** — The platform maps evidence (care plans, notes, incidents, training records) to CQC's quality statement framework for adult services.
- **Ofsted quality standards** — For children's homes, the 9 Quality Standards (Quality of Care, Children's Views, Education, Health & Wellbeing, Positive Relationships, Protection, Leadership & Management, plus Schedule 1–4 compliance) are tracked with evidence linkage.
- **Regulation 44** (monthly independent monitoring) and **Regulation 45** (six-monthly quality review) reports are generated from system data.

### 6.5 Medication Safety

- **Allergy blocks** — The system prevents administration of medications flagged against a person's recorded allergies.
- **Dose limits** — PRN medications have maximum dose frequencies. The system enforces them and blocks over-administration.
- **Controlled drugs** — Dual-witness digital signatures required for all CD administration. Running balance maintained and reconciled. Discrepancies trigger alerts.
- **NICE SC1 compliance** — EMAR implementation follows NICE SC1 guidelines for managing medicines in care homes.

---

## 7. External Integrations

### 7.1 AWS Bedrock (AI)

- **Provider**: `@ai-sdk/amazon-bedrock` via Vercel AI SDK
- **Region**: `eu-west-2` (London) where available, `us-east-1` fallback
- **Models**: Claude Sonnet (general tasks), Claude Haiku (quick summaries), Claude Opus (complex compliance analysis)
- **Usage patterns**:
  - `generateText()` in server actions — care note assistance, risk assessment suggestions, compliance gap detection
  - `streamText()` via `/api/chat` route — interactive AI assistant with streaming responses
  - Structured output via tool calling — e.g. extracting structured risk assessments from free-text descriptions
- **Security**: AI inputs are scoped to the authenticated user's organisation. No cross-tenant data is sent to models. Prompts include domain-specific regulatory context (CQC/Ofsted guidelines).

### 7.2 Stripe (Billing)

- **Model**: Per-organisation subscription billing (not per-user)
- **Tiers**: Free → Professional → Enterprise, with plan-based feature limits (person count, user count, AI credits)
- **Flow**: Server action creates a Stripe Checkout Session → user completes payment on Stripe-hosted page → webhook updates org's plan in the database
- **Webhook route**: `/api/webhooks/stripe` handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Entitlements**: A utility checks the org's `plan` + `stripeCurrentPeriodEnd` to gate features. Expired subscriptions fall back to free tier.

### 7.3 Google Maps (Mapping & EVV)

- **Electronic Visit Verification**: GPS coordinates captured at visit check-in/check-out, compared against the client's registered address to confirm physical presence.
- **Route optimisation**: Domiciliary care coordinators see carers on a map, with travel time estimates between visits.
- **Client-side only**: Maps render in `'use client'` components. The API key is restricted to the app's domain. No server-side geocoding calls unless address validation is needed.

---

## Architecture Diagram (Conceptual)

```
                    ┌──────────────┐
                    │   Vercel CDN  │
                    │  (static +    │
                    │   edge cache) │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Next.js 15   │
                    │  App Router   │
                    │  (Vercel      │
                    │   Serverless) │
                    └──┬───┬───┬───┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          │                │                │
  ┌───────▼──────┐ ┌──────▼───────┐ ┌──────▼───────┐
  │ Neon Postgres │ │ AWS Bedrock   │ │   Stripe      │
  │ (via HTTP     │ │ (AI models)   │ │ (billing)     │
  │  driver)      │ │               │ │               │
  └───────────────┘ └───────────────┘ └───────────────┘

  ┌───────────────┐
  │ Google Maps   │  ← Client-side only (browser)
  │ (EVV, routing)│
  └───────────────┘
```

All server-side computation runs on Vercel Serverless Functions. The database connection is stateless HTTP to Neon — no connection pool to manage in the serverless environment. Auth.js middleware runs at the edge for fast route protection.
