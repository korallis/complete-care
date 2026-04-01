---
name: feature-worker
description: Full-stack feature development for Complete Care — database, server actions, API routes, and UI. MUST invoke the frontend-design skill for all UI work.
---

# Feature Worker

The primary workhorse for the Complete Care UK care management platform. Handles full-stack feature development end-to-end: database schema additions, server actions, API routes, and **all frontend UI**. Responsible for ~90% of features in the backlog.

**CRITICAL**: This worker MUST invoke the `frontend-design` skill (via the Skill tool) before writing ANY frontend or UI code. Every component, page, layout, form, table, and dashboard element must go through the frontend-design skill to ensure beautiful, modern, intuitive design. This is non-negotiable.

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
| Forms | react-hook-form + zod |
| Testing | Vitest + React Testing Library |
| Language | TypeScript (strict) |

## When to Use This Skill

Use the feature-worker for any task that involves **both backend logic and frontend UI**, including:

- **Care management features** — Visit scheduling, care plans, medication (eMAR), incident reporting, assessments
- **Staff management** — Rosters, availability, training records, DBS tracking, timesheets
- **Client management** — Service user profiles, risk assessments, family portal, care package configuration
- **Operational tools** — Dashboards, reports, analytics, compliance tracking, audit trails
- **Communication** — Messaging, notifications, handover notes, family updates
- **Forms and data entry** — Any feature with user input, validation, and server-side persistence
- **Data tables and lists** — Sortable, filterable, paginated tables for any entity
- **AI-powered features** — Care note generation, risk predictions, smart scheduling suggestions

**Do NOT use for** pure infrastructure tasks (database-only schema, auth config, middleware) — those belong to the **infrastructure-worker**.

## Required Skills

| Skill | Purpose | When Invoked |
|---|---|---|
| **`frontend-design`** | Ensures beautiful, modern, intuitive UI/UX for all frontend code | **Before writing ANY UI component, page, or layout** |

The `frontend-design` skill MUST be invoked via the Skill tool before any frontend work begins. This applies to:
- New page layouts
- React Server Components with UI
- Client Components (forms, interactive elements)
- Data tables and dashboards
- Charts and visualisations
- Modal dialogs and sheets
- Navigation and sidebar elements
- Empty states, loading states, error states

## Work Procedure

### 1. Understand the Feature

- Read the full feature description, preconditions, expectedBehavior, and acceptance criteria.
- Identify all layers affected: database → server actions/API → UI components → pages.
- Note any CQC regulatory requirements or UK care industry specifics.

### 2. Gather Architectural Context

- Read `.factory/library/` files for project conventions, directory structure, component patterns, and architectural decisions.
- Read `.factory/research/tech-stack-patterns.md` for Drizzle, Auth.js, and Next.js patterns.
- Read `.factory/research/platform-features.md` for care domain workflows and data requirements.
- Read `.factory/research/emar-clinical-standards.md` if the feature involves medication management.
- Read `.factory/research/regulatory-compliance.md` if the feature has compliance implications.
- Check existing code to understand current patterns for similar features.

### 3. Plan the Feature

- Map out the data model (new tables, columns, relations, indexes).
- Design server actions and/or API routes (inputs, outputs, auth checks, validation).
- Sketch the UI flow (pages, components, user interactions, state management).
- Identify reusable components from shadcn/ui and existing project components.

### 4. Database Schema Changes (if needed)

- Add or modify Drizzle ORM schemas following existing conventions.
- Use proper TypeScript inference types (`$inferSelect`, `$inferInsert`).
- Add appropriate indexes for query patterns.
- Generate migration with `bun run db:generate`.

### 5. Server Actions and API Routes

- Write server actions in `src/app/` co-located with their routes, or in `src/actions/` for shared actions.
- Use zod for input validation on all server actions.
- Enforce auth and RBAC checks at the start of every action.
- Return typed responses with proper error handling.

### 6. Write Tests First (TDD)

- Write failing tests using **Vitest** and **React Testing Library** before implementing.
- Test coverage should include:
  - Schema validation and constraints
  - Server action logic (happy path, validation errors, auth failures)
  - Component rendering and user interactions
  - Form validation and submission
  - Edge cases specific to the care domain (e.g. medication time windows, overlapping visits)

### 7. Invoke `frontend-design` Skill

**Before writing ANY UI code**, invoke the `frontend-design` skill:

```
Invoke Skill: frontend-design
```

Provide the skill with:
- The feature description and user stories
- The data shape (what the backend returns)
- The user roles who will interact with this UI
- Any specific UI requirements from the feature spec

Follow the skill's guidance for:
- Component architecture and composition
- Layout and spacing
- Colour, typography, and visual hierarchy
- Interaction patterns and animations
- Responsive behaviour
- Accessibility requirements
- Loading, empty, and error states

### 8. Build UI Components

Following the frontend-design skill's guidance:
- Use **shadcn/ui** components as the base layer.
- Use **Tailwind CSS** for all styling — no CSS modules or styled-components.
- Use **React Server Components** by default; add `"use client"` only when needed (forms, interactive state, event handlers).
- Use **react-hook-form** + **zod** for all forms.
- Ensure full keyboard navigation and screen reader support.
- Implement proper loading states (Suspense boundaries, skeletons).
- Implement meaningful empty states with clear calls to action.
- Implement error boundaries with user-friendly messages.

### 9. Verify

Run all verification commands:

```bash
bun run typecheck    # TypeScript strict mode — zero errors
bun run lint         # ESLint — zero warnings/errors
bun run test         # Vitest — all tests pass
```

For database changes, also verify:
```bash
bun run db:generate  # Generate Drizzle migration SQL
```

### 10. Visual Verification

If the feature has UI, use the **agent-browser** skill to:
- Navigate to the feature's pages.
- Verify the layout renders correctly.
- Test form submissions and interactions.
- Check responsive behaviour at different viewport widths.
- Screenshot key states (empty, populated, error, loading).

### 11. Commit

Write a clear, descriptive commit message:

```
feat(visits): add visit scheduling page with drag-and-drop rota builder

- visits and visit_tasks Drizzle schema with carer/client FK relations
- createVisit, updateVisit, deleteVisit server actions with zod validation
- weekly rota view with drag-and-drop carer assignment (dnd-kit)
- visit detail sheet with task checklist and care notes
- conflict detection: double-booking, travel time, skills mismatch warnings
- 23 tests covering scheduling logic, form validation, and component rendering
```

## Example Handoff

```json
{
  "status": "completed",
  "feature": "Medication Administration (eMAR) — recording and dashboard",
  "filesChanged": [
    "src/db/schema/medications.ts",
    "src/db/schema/medication-administrations.ts",
    "src/db/migrations/0007_add_emar_tables.sql",
    "src/actions/medications.ts",
    "src/actions/medication-administrations.ts",
    "src/app/(dashboard)/[orgSlug]/clients/[clientId]/medications/page.tsx",
    "src/app/(dashboard)/[orgSlug]/clients/[clientId]/medications/loading.tsx",
    "src/app/(dashboard)/[orgSlug]/clients/[clientId]/medications/error.tsx",
    "src/components/medications/medication-list.tsx",
    "src/components/medications/medication-form.tsx",
    "src/components/medications/administration-record.tsx",
    "src/components/medications/emar-chart.tsx",
    "src/components/medications/medication-due-badge.tsx",
    "tests/actions/medications.test.ts",
    "tests/actions/medication-administrations.test.ts",
    "tests/components/medications/medication-list.test.tsx",
    "tests/components/medications/medication-form.test.tsx",
    "tests/components/medications/emar-chart.test.tsx"
  ],
  "summary": "Implemented the eMAR (electronic Medication Administration Record) feature for recording and viewing medication administration. Database schema includes medications table (drug name, dosage, route, frequency, PRN flag, prescriber, start/end dates) and medication_administrations table (scheduled time, actual time, status enum [given/refused/omitted/withheld/self-administered], witness requirement, notes, administering carer FK). Server actions handle CRUD for medications and recording administrations with strict validation — refuses recording outside the ±60 minute administration window, enforces witness signatures for controlled drugs, and requires reason codes for refused/omitted/withheld statuses per CQC guidelines. UI built following frontend-design skill guidance: medication list with colour-coded due-status badges (green=given, amber=due-soon, red=overdue, grey=not-yet-due), administration recording form with real-time validation, and a 7-day eMAR chart view matching the paper MAR chart format care staff are familiar with. All components use shadcn/ui with Tailwind CSS. 31 tests covering schema constraints, administration window logic, controlled drug witness flow, CQC reason codes, component rendering, and form validation. Typecheck, lint, and all tests pass.",
  "skillsInvoked": ["frontend-design"],
  "testResults": {
    "total": 31,
    "passed": 31,
    "failed": 0
  },
  "verificationCommands": [
    "bun run typecheck — 0 errors",
    "bun run lint — 0 warnings",
    "bun run test -- tests/actions/medications.test.ts — 9 passed",
    "bun run test -- tests/actions/medication-administrations.test.ts — 8 passed",
    "bun run test -- tests/components/medications/medication-list.test.tsx — 5 passed",
    "bun run test -- tests/components/medications/medication-form.test.tsx — 5 passed",
    "bun run test -- tests/components/medications/emar-chart.test.tsx — 4 passed",
    "bun run db:generate — migration 0007_add_emar_tables.sql generated"
  ],
  "browserVerification": [
    "Navigated to /acme-care/clients/1/medications — page loads with medication list",
    "Added new medication via form — validation works, saved successfully",
    "Recorded administration — time window enforced, status badge updated to green",
    "Viewed eMAR chart — 7-day grid renders correctly with all status colours",
    "Responsive check at 768px — table scrolls horizontally, form stacks vertically"
  ],
  "commitHash": "e8b4f19",
  "commitMessage": "feat(emar): add medication administration recording and eMAR chart"
}
```

## When to Return to Orchestrator

Return to the orchestrator when:

1. **Feature is complete** — All acceptance criteria met, tests pass, typecheck and lint clean, browser verification done (if UI), commit made.
2. **Blocked by missing infrastructure** — e.g. a database schema, auth provider, or middleware that should have been set up by the infrastructure-worker isn't present.
3. **Blocked by missing dependency** — A prerequisite feature hasn't been built yet (e.g. "client profile" needed before "care plan" can reference it).
4. **Scope larger than expected** — The feature requires significantly more work than described; return to orchestrator for task decomposition.
5. **Regulatory uncertainty** — CQC, NICE, or other regulatory requirements are ambiguous and could affect data model or workflow design.
6. **Design decision needed** — Multiple valid UI/UX approaches exist and the choice has significant implications for user workflow.
