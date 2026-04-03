# Children-core behavioral reconciliation — 2026-04-03

Date: 2026-04-03
Worker: worker-2
Scope: `fix-children-core-behavioral-enforcement`

## Audit conclusion
The latest children-core browser synthesis is stale for the behavioral lane. Current repo state already exposes the meetings, complaints, and care-notes workflows that were previously reported as absent, and this pass closes the remaining restraint debrief / manager sign-off gap without widening tenant scope, RBAC, or audit logging behavior.

## Code evidence
- `src/components/person-dashboard/dashboard-tabs.tsx`
  - Person dashboards now expose direct tabs for `Keyworker`, `Meetings`, `Complaints`, and `Care Notes`.
- `src/app/(dashboard)/[orgSlug]/persons/[personId]/meetings/page.tsx`
  - Live children's meetings route is present and wired to `MeetingsPanel`.
- `src/app/(dashboard)/[orgSlug]/persons/[personId]/complaints/page.tsx`
  - Live complaints route is present and wired to `ComplaintsPanel`.
- `src/components/care-notes/care-note-card.tsx`
  - Care notes render structured children-home fields plus auto-generated handover summaries.
- `src/features/keyworker/actions.ts`
  - `createSanction()` rejects prohibited measures.
  - `updateRestraint()` now records missing child/staff debriefs with tenant/RBAC/audit protections.
  - `reviewRestraint()` preserves approve-only manager sign-off with mandatory debrief checks.
- `src/features/keyworker/components/restraint-list.tsx`
  - Restraint register now exposes user-facing debrief completion and manager sign-off controls.

## Validator mapping
- `VAL-CHILD-017`
  - Now covered by the live restraint register plus debrief/sign-off flow in `restraint-list.tsx` and `actions.ts`.
- `VAL-CHILD-018`
  - Already covered by prohibited-sanction blocking in `src/features/keyworker/schema.ts`, `src/features/keyworker/actions.ts`, and `src/features/keyworker/components/sanction-form.tsx`.
- `VAL-CHILD-021`
  - Covered by the existing meetings route + panel.
- `VAL-CHILD-022`
  - Covered by the existing complaints route + panel.
- `VAL-CHILD-023`
  - Covered by the existing care-notes timeline/card/handover implementation.

## Verification
- `bun run test -- src/__tests__/features/keyworker/schema.test.ts src/__tests__/features/keyworker/db-schema.test.ts src/__tests__/features/keyworker/restraint-list.test.tsx src/__tests__/care-notes/care-note-schema.test.ts src/__tests__/care-notes/care-note-components.test.tsx src/__tests__/features/meetings/schema.test.ts src/__tests__/features/complaints/schema.test.ts` → PASS (`7` files, `136` tests)
- `bun run typecheck` → PASS
- `bun run lint -- --file src/app/(dashboard)/[orgSlug]/persons/[personId]/keyworker/page.tsx --file src/features/keyworker/actions.ts --file src/features/keyworker/components/restraint-list.tsx --file src/__tests__/features/keyworker/restraint-list.test.tsx` → PASS

## Notes
- The stale browser artifacts under `.factory/validation/children-core/user-testing/flows/children-core-keyworker-logs.json` still describe the earlier missing-route / incomplete-restraint state from 2026-04-02.
- A fresh validator rerun is still required to replace those artifacts, but repo-side evidence no longer supports keeping `fix-children-core-behavioral-enforcement` as a real pending implementation task.
