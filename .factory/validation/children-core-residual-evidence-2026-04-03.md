# Children-core residual / validator-prep evidence

Date: 2026-04-03
Worker: worker-1
Execution brief:
- `/Users/leebarry/.factory/missions/0151c86a-d61e-40f6-af14-f9e925a367f3/.omx/plans/prd-complete-care-consensus-2026-04-02.md`
- `/Users/leebarry/.factory/missions/0151c86a-d61e-40f6-af14-f9e925a367f3/.omx/plans/test-spec-complete-care-consensus-2026-04-02.md`

## Covered residuals
- `fix-children-core-contacts-ofsted`
- `fix-children-core-behavioral-enforcement`
- `user-testing-validator-children-core`

## Audit conclusion
The previously failing children-core residuals appear to be ledger-stale rather than still missing in the repo. Current code already contains the previously missing contact-management, LAC creation, and placement-plan creation surfaces that the 2026-04-02 validator artifacts flagged as absent.

## Code evidence
- Contact-management route now renders live add/schedule/record/compliance flows via:
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/contacts/page.tsx`
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/contacts/contacts-page-client.tsx`
  - `src/features/contacts/actions.ts`
  - `src/features/contacts/components/approved-contact-form.tsx`
  - `src/features/contacts/components/contact-schedule-form.tsx`
  - `src/features/contacts/components/contact-record-form.tsx`
- LAC creation route that validator previously reported as 404 is present at:
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/new/page.tsx`
- Placement-plan creation route that validator previously reported as 404 is present at:
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/placement-plans/new/page.tsx`
- Existing recovery history already landed these slices in repo history:
  - `fae8cbc` — `Recover lane-A children-core workflows with real contacts and LAC visibility`
  - `a7fc125` — `feat(children-core): fix routing and wiring gaps for keyworker, safeguarding, LAC, and missing-from-care`

## Verification evidence
- `bun run test -- src/__tests__/features/contacts/schema.test.ts src/__tests__/lib/db/contacts-schema.test.ts src/__tests__/lac/lac-schema.test.ts src/__tests__/lac/lac-components.test.tsx src/__tests__/lac/placement-plan-detail.test.tsx src/__tests__/ofsted/schema.test.ts src/__tests__/ofsted/standard-detail.test.tsx src/__tests__/ofsted/standards.test.ts` → PASS (`8` files, `199` tests)
- `bun run typecheck` → PASS
- `bun run lint -- --file src/features/contacts/actions.ts --file src/features/contacts/components/approved-contact-form.tsx --file src/features/contacts/components/contact-schedule-form.tsx --file src/features/contacts/components/contact-record-form.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/contacts/page.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/contacts/contacts-page-client.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/page.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/new/page.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/placement-plans/page.tsx --file src/app/(dashboard)/[orgSlug]/persons/[personId]/lac/placement-plans/new/page.tsx` → PASS
- `bun run build` → FAIL due pre-existing unrelated Next.js server-action errors in education wrappers:
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/education/attendance/attendance-form-wrapper.tsx`
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/education/exclusions/new/exclusion-form-wrapper.tsx`
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/education/pep/new/pep-form-wrapper.tsx`
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/education/pp-plus/new/pp-plus-form-wrapper.tsx`
  - `src/app/(dashboard)/[orgSlug]/persons/[personId]/education/school/new/school-record-form-wrapper.tsx`

## Validator-prep notes
- The stale artifacts under `.factory/validation/children-core/user-testing/flows/*.json` still describe earlier browser failures from 2026-04-02.
- Before ledger reconciliation, the next validator rerun should specifically re-check:
  - contact add/schedule/record/compliance interactions
  - `/persons/[personId]/lac/new`
  - `/persons/[personId]/lac/placement-plans/new`
- Ofsted/dashboard assertions may still need a fresh browser rerun for evidence-linking UX expectations, but the route-missing failures are no longer grounded in current code.
