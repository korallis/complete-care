# Browser UAT Plan (Playwright)

## Goal
Exercise the Complete Care app in a real browser using Playwright, cover every reachable route/feature/button we can drive from the seeded workspace, fix defects found during execution, and iterate until coverage evidence is materially complete.

This UAT plan is aligned to the approved 2026-04-04 master blueprint:
- preserve Children’s Homes -> Ofsted
- preserve Domiciliary Care / Supported Living / Complex Care -> CQC
- verify the public product story and in-app workspaces against the approved four-domain model

## Scope baseline
- App routes discovered from `src/app/**/page.tsx`: **164**
- Existing seeded org/workspace: `redesign-admin-workspace`
- Existing QA browser helpers: `.omx/playwright/*`
- Browser target: local app at `http://localhost:3200`

## Coverage model
### 1. Public + auth flows
- Marketing: landing, demo, pricing, privacy, terms
- Auth: login, register, forgot/reset password, verify email
- Invitations + onboarding entry paths
- Verify public story does not contradict the approved regulator split or the four-domain roadmap direction

### 2. Org-scoped dashboard + compliance flows
- Dashboard, admissions, audit log, billing, ofsted, properties, safeguarding, scheduling, rostering, travel safety, visitor log, visits
- Org-level EMAR pages
- Reg44 section
- Adult-domain compliance entry points, including current CQC surfaces and any future workspace parity work

### 3. Person-centric flows
- Person list + create/edit/detail
- Care plans, care notes, risk assessments, incidents, documents, consent, timeline
- Clinical pages: alerts, fluids, nutrition, bowel, sleep, pain, vitals
- EMAR pages: medications, PRN, MAR detail
- Children’s flows: LAC, placement plans, missing from care, contacts, keyworker, behaviour, education, complaints, meetings, PBS, outcomes, body map
- Complex-care overlays once domain backbone work lands

### 4. Staff + admin flows
- Staff list, new, detail, edit, DBS, leave, training, supervisions, compliance, agencies
- Settings, team, security, billing, GDPR sub-pages
- Domain-aware onboarding/RBAC checks so users land in the correct workspace and terminology context

### 5. Family + global dashboard flows
- Family invite/portal/messages/updates/care-info
- Global dashboard, budgets, custom reports, AI queries, invoicing, duty of candour, end-of-life care, reg45
- Verify family/reporting surfaces do not leak the wrong regulator/domain framing

## Browser interaction strategy
1. **Smoke route audit**: verify route accessibility/status and login redirect behavior.
2. **Navigation audit**: traverse all visible sidebar/top-nav links and validate landing states.
3. **Button/CTA audit**: on each reachable page, enumerate visible buttons/links, click safe CTAs, confirm dialogs/forms/panels render without crashes.
4. **Task flows**: execute representative create/view/update flows for seeded entities per feature area.
5. **Regulator/domain audit**: explicitly check that Children’s Homes stay Ofsted-only and adult domains stay CQC-aligned.
6. **Regression loop**: after each fix, re-run targeted Playwright flow plus broader affected suite.
7. **Durable automation**: codify high-value flows as reusable Playwright tests/helpers instead of one-off manual checks where practical.

## Safety / execution rules
- Stay on port 3200.
- Use Bun commands only.
- Do not expose secrets in committed artifacts.
- Favor seeded/demo-safe mutations or idempotent checks.
- Preserve tenant isolation / RBAC behavior.
- Treat roadmap truth as coming from the approved planning docs under `.omx/plans`, not from existing public pricing or market copy.

## Team staffing (6 lanes)
1. **Lane 1 – public/auth**: marketing, auth, invitation, onboarding browser checks.
2. **Lane 2 – org core**: dashboard/admissions/audit/ofsted/cqc/properties/safeguarding/scheduling/rostering.
3. **Lane 3 – persons core**: list/detail/care plans/notes/risk/incidents/documents/timeline.
4. **Lane 4 – clinical + EMAR + children flows**: clinical, EMAR, contacts, keyworker, missing, LAC, education, complaints, meetings.
5. **Lane 5 – staff/settings/family/global**: staff, settings/GDPR/team/security, family portal, global pages.
6. **Lane 6 – automation + verification**: improve Playwright harness/coverage inventory, seed verification, reruns, evidence collation.

## Exit criteria
- App boots and login works locally.
- High-value reachable flows in each coverage area have browser evidence.
- Public and in-app journeys do not contradict the approved four-domain/regulator model.
- All bugs found during the loop are either fixed and re-verified or explicitly documented as remaining blockers.
- Playwright/browser artifacts exist for route coverage and key flows.
- Final verification includes relevant Playwright runs plus lint/typecheck/tests as appropriate for code touched.
