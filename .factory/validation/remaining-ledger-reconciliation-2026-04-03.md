# Remaining ledger reconciliation — 2026-04-03

Date: 2026-04-03
Worker: worker-5
Scope: repo-side evidence packaging for stale-vs-real pending features in the external mission ledgers.

## Source ledgers reviewed
- Mission `features.json`: `/Users/leebarry/.factory/missions/0151c86a-d61e-40f6-af14-f9e925a367f3/features.json`
- Mission `validation-state.json`: `/Users/leebarry/.factory/missions/0151c86a-d61e-40f6-af14-f9e925a367f3/validation-state.json`
- Existing repo evidence: `.factory/validation/*.md`, `.factory/validation/**/synthesis*.json`

## Important note
The authoritative ledgers currently live outside this repo. This pass does **not** mutate those mission files directly. Instead it adds a repo-side reconciliation manifest so the leader can update the external ledgers without re-discovering repo evidence.

## Classification summary

### Still real / not just ledger-stale
1. `fix-children-core-contacts-ofsted`
   - Ledger state: `in_progress`
   - Why still real: `.factory/validation/children-core/user-testing/synthesis.json` still records active failures for `VAL-CHILD-001`, `VAL-CHILD-002`, and `VAL-CHILD-003`.
   - Evidence anchors:
     - commit `ccf4989` — additional recovery work landed
     - `.factory/validation/children-core/user-testing/synthesis.json`

2. `fix-children-core-behavioral-enforcement`
   - Ledger state: `pending`
   - Why still real: children-core synthesis still records failures for `VAL-CHILD-017`, `VAL-CHILD-018`, `VAL-CHILD-021`, `VAL-CHILD-022`, and `VAL-CHILD-023`.
   - Evidence anchors:
     - commit `fae0e83` — lane-C recovery landed
     - `.factory/validation/children-core/user-testing/synthesis.json`

3. `user-testing-validator-children-core`
   - Ledger state: `pending`
   - Why still real: the latest repo-side synthesis for children-core is still `fail` with `1 passed / 22 failed / 3 blocked`, so the validator lane is not reconciled to green yet.
   - Evidence anchors:
     - `.factory/validation/children-core/user-testing/synthesis.json`
     - mission handoff `2026-04-02T11-35-57-197Z__user-testing-validator-children-core__9aabad7e-0cd1-4dac-a4f9-e11ae65a9dfe.json`

### Ledger-stale / implementation already landed in repo
1. `m5-reg44-monitoring`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `ace8f04` — Reg44 monitoring live instead of placeholder shells
     - commit `07fb6e9` — validator evidence refresh
     - `.factory/validation/reg44-transition-evidence-2026-04-02.md`
     - `src/features/reg44/actions.ts`, `src/app/(dashboard)/[orgSlug]/reg44/*`

2. `m5-transition-planning`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `ace8f04`
     - commit `07fb6e9`
     - `.factory/validation/reg44-transition-evidence-2026-04-02.md`
     - `src/features/reg44/actions.ts`, `src/app/(dashboard)/[orgSlug]/reg44/transition/page.tsx`

3. `m7-travel-safety`
   - Proposed ledger interpretation: implementation-complete, validator follow-up still advisable for route-optimisation UX.
   - Evidence anchors:
     - commit `7a3f847` — travel-safety enforcement gaps closed
     - commit `b091884` — baseline travel/lone-worker implementation
     - `src/features/travel-safety/actions.ts`
     - `src/app/(dashboard)/[orgSlug]/travel-safety/page.tsx`
     - `src/__tests__/features/travel-safety/actions.test.ts`
   - Caveat: route optimisation remains heuristic/placeholder-based in `src/features/travel-safety/route-optimisation.ts`, so this is best treated as implementation-landed + validator/manual-review pending rather than fully browser-validated.

4. `m8-controlled-drugs`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `28c4d64` — controlled-drug/alert enforcement restored before handoff
     - commit `ac13526` — EMAR verification coverage refresh
     - `src/features/emar/actions/controlled-drugs.ts`
     - `src/__tests__/features/emar/cd-register.test.ts`
     - `src/__tests__/features/emar/validation-schemas.test.ts`

5. `m8-medication-alerts`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `28c4d64`
     - commit `ac13526`
     - `src/features/emar/actions/medication-alerts.ts`
     - `src/__tests__/features/emar/medication-alert-actions.test.ts`

6. `m8-stock-management`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `ac13526`
     - commit `b0e1fd7` — original EMAR stock-management implementation
     - `src/features/emar/stock/actions.ts`
     - `src/__tests__/features/emar/stock-actions.test.ts`

7. `m8-medication-errors-handover`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `ac13526`
     - `src/features/emar/errors/actions.ts`
     - `src/__tests__/features/emar/medication-error-actions.test.ts`

8. `m10-auto-scheduling`
   - Proposed ledger interpretation: implementation landed, still needs ledger reconciliation.
   - Evidence anchors:
     - commit `edc6992` — auto-scheduling/timesheets/payroll/consent feature drop
     - `src/features/scheduling/engine.ts`
     - `src/features/scheduling/engine.test.ts`
     - `src/app/(dashboard)/[orgSlug]/scheduling/page.tsx`

9. `m10-timesheets-payroll`
   - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
   - Evidence anchors:
     - commit `b7e70d4` — rota-backed timesheet approval + payroll export workflows
     - commit `27d97b9` — payroll export safety fix
     - `.factory/validation/rostering-timesheets-payroll-family-portal-review-2026-04-02.md`
     - `src/features/timesheets/actions.ts`
     - `src/features/timesheets/generator.test.ts`
     - `src/app/(dashboard)/[orgSlug]/rostering/page.tsx`
     - `src/app/(dashboard)/[orgSlug]/rostering/payroll/route.ts`

10. `m10-consent-photos`
    - Proposed ledger interpretation: implementation landed, validation evidence partially indirect but sufficient for ledger reconciliation support.
    - Evidence anchors:
      - commit `8608bae` — consent-aware family portal sharing
      - commit `edc6992`
      - `src/features/consent/actions.ts`
      - `src/features/consent/manager.test.ts`
      - `src/app/(dashboard)/[orgSlug]/persons/[personId]/consent/page.tsx`

11. `m12-gdpr-data`
    - Proposed ledger interpretation: implementation-complete, evidence-ready, awaiting external ledger update.
    - Evidence anchors:
      - commit `9341bb7` — GDPR admin workflows + evidence packaging
      - commit `0193a8e` — GDPR routes made navigable
      - commit `d5037dd` — SAR path compatibility alias
      - commit `024895b` — evidence refresh
      - `.factory/validation/gdpr-evidence-2026-04-02.md`
      - `src/features/gdpr/actions.ts`
      - `src/app/(dashboard)/[orgSlug]/settings/gdpr/page.tsx`
      - `src/__tests__/features/gdpr/components.test.tsx`

## Recommended external ledger updates
- Keep these as truly active:
  - `fix-children-core-contacts-ofsted`
  - `fix-children-core-behavioral-enforcement`
  - `user-testing-validator-children-core`
- Reconcile these away from `pending` in the external mission `features.json` because repo evidence shows they already landed:
  - `m5-reg44-monitoring`
  - `m5-transition-planning`
  - `m7-travel-safety`
  - `m8-controlled-drugs`
  - `m8-medication-alerts`
  - `m8-stock-management`
  - `m8-medication-errors-handover`
  - `m10-auto-scheduling`
  - `m10-timesheets-payroll`
  - `m10-consent-photos`
  - `m12-gdpr-data`

## Verification used for this reconciliation pass
- Repo evidence/doc scan over `.factory/validation/**`
- Mission-ledger scan over external `features.json` and `validation-state.json`
- Commit-history reconciliation via `git log --grep 'GDPR|reg44|transition|travel|controlled drugs|medication alerts|stock|handover|timesheet|payroll|consent|children-core|validator'`
- Test-file presence reconciliation for travel/EMAR/timesheets/consent/GDPR slices
