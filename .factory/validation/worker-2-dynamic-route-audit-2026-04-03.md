# Worker 2 dynamic route audit — 2026-04-03

## Scope
Task 2: browser-audit seeded dynamic person/property/reg44 routes with Playwright and report concrete failures.

Environment used:
- App: `http://localhost:3200`
- Account: existing Lee admin (`lee@completecare.test`)
- Org: `redesign-admin-workspace`

## Seed snapshot used for audit
Command:
- `node /Users/leebarry/complete-care/.omx/fetch-seed-ids.mjs`
- `node /Users/leebarry/complete-care/.omx/check-redesign-seed.mjs`
- ad hoc SQL count check for deeper child/reg44/emar tables

Resolved seeded IDs:
- personId: `1a3dfc32-da59-4f41-b53d-943a3da1d03e` (`Amelia Hart`)
- propertyId: `a01bca38-979f-4f0e-ad59-fc137318815d`
- referralId: `8e409e61-48c6-4249-bc97-b58d3d44d231`
- carePlanId: `09ac0cac-f23b-4aa4-9cab-0c987b0bb66d`
- incidentId: `1206ab0d-b420-4730-968e-61f028f53b4c`

Available seeded counts at audit time:
- `persons=1`, `properties=1`, `care_plans=1`, `incidents=1`, `referrals=1`
- `childrens_meetings=0`, `lac_records=0`, `placement_plans=0`, `approved_contacts=0`, `contact_schedules=0`, `contact_records=0`
- `philomena_profiles=0`, `missing_episodes=0`, `return_home_interviews=0`
- `medications=0`, `medication_administrations=0`, `prn_protocols=0`
- `reg44_visits=0`, `reg44_reports=0`, `reg44_recommendations=0`, `reg40_notifiable_events=0`, `pathway_plans=0`

## Routes audited with Playwright
All direct page navigations below returned HTTP `200` and rendered their primary screen content:

### Seeded detail routes
- `/redesign-admin-workspace/persons/<personId>`
- `/redesign-admin-workspace/persons/<personId>/care-plans`
- `/redesign-admin-workspace/persons/<personId>/care-plans/<carePlanId>`
- `/redesign-admin-workspace/persons/<personId>/incidents`
- `/redesign-admin-workspace/persons/<personId>/incidents/<incidentId>`
- `/redesign-admin-workspace/properties/<propertyId>`
- `/redesign-admin-workspace/properties/<propertyId>/edit`
- `/redesign-admin-workspace/admissions/<referralId>`

### Empty-state dynamic person routes still rendering successfully
- `/redesign-admin-workspace/persons/<personId>/meetings`
- `/redesign-admin-workspace/persons/<personId>/contacts`
- `/redesign-admin-workspace/persons/<personId>/lac`
- `/redesign-admin-workspace/persons/<personId>/lac/placement-plans`
- `/redesign-admin-workspace/persons/<personId>/missing`
- `/redesign-admin-workspace/persons/<personId>/missing/philomena`
- `/redesign-admin-workspace/persons/<personId>/emar`
- `/redesign-admin-workspace/persons/<personId>/emar/medications`
- `/redesign-admin-workspace/persons/<personId>/emar/prn`
- `/redesign-admin-workspace/persons/<personId>/clinical/alerts`
- `/redesign-admin-workspace/persons/<personId>/clinical/vitals`

### Reg44 routes
- `/redesign-admin-workspace/reg44`
- `/redesign-admin-workspace/reg44/reports`
- `/redesign-admin-workspace/reg44/recommendations`
- `/redesign-admin-workspace/reg44/notifiable-events`
- `/redesign-admin-workspace/reg44/transition`
- `/redesign-admin-workspace/reg44/visits`

## Concrete failures found
### 1) Sidebar/nav prefetches hit non-existent org-level routes from every audited page
Playwright response capture consistently reported `404` responses for these URLs:
- `/redesign-admin-workspace/care-plans?_rsc=...`
- `/redesign-admin-workspace/notes?_rsc=...`
- `/redesign-admin-workspace/assessments?_rsc=...`
- `/redesign-admin-workspace/medications?_rsc=...`
- `/redesign-admin-workspace/incidents?_rsc=...`

Representative capture from `/redesign-admin-workspace/persons/<personId>`:
- `404 /redesign-admin-workspace/care-plans?_rsc=1wqkl`
- `404 /redesign-admin-workspace/notes?_rsc=1wqkl`
- `404 /redesign-admin-workspace/assessments?_rsc=1wqkl`
- `404 /redesign-admin-workspace/medications?_rsc=1wqkl`
- `404 /redesign-admin-workspace/incidents?_rsc=1wqkl`

Same 404 set reproduced on:
- person detail pages
- person meetings page
- reg44 overview page
- other audited routes in the same session

### 2) Likely source of the broken hrefs
The failing URLs match role-nav entries in:
- `src/lib/rbac/nav-items.ts`

Current entries point to top-level org routes that do not exist:
- `href: '/care-plans'`
- `href: '/notes'`
- `href: '/assessments'`
- `href: '/medications'`
- `href: '/incidents'`

These appear in multiple role blocks, so the breakage is role-wide, not limited to one page.

## Impact assessment
- Direct deep links to the audited seeded pages work.
- Shared dashboard/sidebar navigation currently advertises broken org-level routes and triggers repeat 404s during hover/prefetch/render.
- Because the relevant LAC/contact/missing/medication/reg44 data tables are still empty in the audit org, only empty-state render checks were possible for those features in this lane.

## Verification evidence
- Browser audit: Playwright login + 24 route navigations → PASS for direct route loads, FAIL for repeated sidebar prefetch 404s
- Route-status evidence: representative `response.status() >= 400` capture → FAIL on the five org-level nav destinations above
- Targeted lint: `bun run lint -- --file src/lib/rbac/nav-items.ts --file src/components/dashboard/sidebar-nav.tsx --file 'src/app/(dashboard)/[orgSlug]/layout.tsx'` → PASS
- Targeted tests: `bun run test -- src/__tests__/dashboard/sidebar-nav.test.tsx src/__tests__/dashboard/billing-page.test.tsx src/__tests__/lib/rbac/rbac.test.ts` → PASS (125 tests)
- Typecheck: `bun run typecheck` → PASS

## Recommended handoff
Best next fix lane is the runtime/navigation owner for `src/lib/rbac/nav-items.ts`.
