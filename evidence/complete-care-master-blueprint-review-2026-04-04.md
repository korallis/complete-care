# Complete Care master blueprint review

Date: 2026-04-04
Owner: worker-3
Task: roadmap-aligned code-quality review and documentation handoff
Source of truth:
- `/Users/leebarry/complete-care/.omx/specs/deep-interview-scheduling-complex-care-master-blueprint.md`
- `/Users/leebarry/complete-care/.omx/plans/prd-complete-care-master-blueprint-2026-04-04.md`
- `/Users/leebarry/complete-care/.omx/plans/roadmap-complete-care-master-blueprint-2026-04-04.md`
- `/Users/leebarry/complete-care/.omx/plans/test-spec-complete-care-master-blueprint-2026-04-04.md`
- `/Users/leebarry/complete-care/.omx/plans/platform-feature-gap-matrix-2026-04-04.md`

## Purpose

This document turns the approved planning package into an execution-facing review artifact for the current repo. It keeps the planning docs under `.omx/plans` as the only roadmap source of truth, then records what the brownfield codebase already proves, where the code-quality seams still are, and what verification documentation needs to stay aligned during execution.

## Guardrails carried forward from the approved blueprint

- Preserve regulator/domain mapping exactly:
  - Children’s Homes -> Ofsted
  - Domiciliary Care -> CQC
  - Supported Living -> CQC
  - Complex Care -> CQC
- Treat `Observed`, `Inferred`, and `Planned` as different evidence levels; do not smooth them together.
- Keep the anchor bundle explicit: scheduling booking, repeat booking, rota generation/assignment/publishing, Complex Care as the fourth domain, CQC workspace parity, and 3-domain -> 4-domain public-story alignment.
- Do **not** treat pricing or market claims as approved roadmap truth. Existing public pricing copy is part of the current product surface, not this blueprint's decision boundary.

## Repo evidence snapshot

| Workstream | Evidence level | Current repo evidence | Review note |
|---|---|---|---|
| Canonical domain model | Observed | `src/types/index.ts`, `src/features/rota/lib/types.ts`, onboarding/settings domain selectors | Domain unions are still inconsistent and omit `complex_care`; backbone work is still mandatory before overlay work expands. |
| Scheduling / operations anchor | Observed | `src/app/(dashboard)/[orgSlug]/scheduling/page.tsx`, care package + rota modules, payroll route/tests | The route is still week-view and queue-driven, so roadmap claims about booking-first scheduling and publish lifecycle remain future work. |
| Ofsted / children’s flows | Observed | org-scoped Ofsted routes, safeguarding, Reg44, keyworker, LAC-linked features | The children’s-home slice is the most mature compliance workspace and remains the clearest benchmark for regulator-specific depth. |
| CQC workspace parity | Observed + Planned | `src/features/dashboards/components/cqc-dashboard.tsx`, dashboard actions/types | CQC has foundation-level components but not route/workspace parity with Ofsted yet. |
| Public domain story | Observed | `src/app/(marketing)/page.tsx`, demo/footer content | Marketing still presents a 3-domain system, so the 4-domain story remains an approved but not yet implemented workstream. |
| Pricing / commercial surface | Observed | `src/app/(marketing)/pricing/page.tsx` | Contains approval-sensitive pricing and compliance claims; execution should document it honestly but not use it as master-roadmap truth. |

## Code-quality findings that matter to roadmap execution

### 1. Canonical domain contracts are still fragmented
- `src/types/index.ts` includes `domiciliary_care`, `domiciliary`, `supported_living`, `childrens_homes`, and `childrens_residential`, but no `complex_care`.
- `src/features/rota/lib/types.ts` narrows the union again to `domiciliary_care`, `supported_living`, and `childrens_home`.
- `src/components/organisations/onboarding-wizard.tsx` still only offers three setup domains.

**Why this matters:** W0/W1 cannot be treated as administrative cleanup; the platform backbone still lacks one canonical domain contract for the approved four-domain model.

### 2. Scheduling is broad but not yet blueprint-shaped
- `src/app/(dashboard)/[orgSlug]/scheduling/page.tsx` fetches a weekly date range, renders an unassigned queue, and lists all visits.
- The current surface does not yet show a booking-first composer, repeat booking workflow, publish/lock lifecycle, or explicit continuity/competency guidance.

**Why this matters:** W5 should continue to be described as an anchor workstream with honest gaps, not as a nearly-finished feature.

### 3. CQC remains a component foundation, not a first-class workspace
- `src/features/dashboards/components/cqc-dashboard.tsx` provides a useful coverage summary and statement grouping.
- The repo evidence reviewed here does not show equivalent org-scoped route depth or adult-domain workspace parity alongside Ofsted.

**Why this matters:** W6 still needs a genuine workspace/IA pass rather than a cosmetic dashboard pass.

### 4. Public story and commercial copy must stay separated from roadmap truth
- `src/app/(marketing)/page.tsx` is still framed around three care domains.
- `src/app/(marketing)/pricing/page.tsx` includes concrete plan prices and strong compliance claims.

**Why this matters:** W2/W9 documentation should distinguish approved platform planning from existing market-facing copy. The public site is evidence of the current state, not authority for new pricing or promise expansion.

## Documentation implications for execution

1. Keep using the planning package under `.omx/plans` for sequencing and acceptance criteria.
2. Use repo docs and evidence notes to record **current-state truth only**.
3. Require verification docs to prove two specific correctness rules on every relevant lane:
   - no Ofsted leakage into adult/CQC flows
   - no CQC/Complex Care omission from the canonical four-domain platform story
4. Treat public pricing/commercial claims as out-of-scope for autonomous roadmap decisions unless separately approved.

## Recommended near-term handoff order

1. **W0/W1 backbone:** domain enum normalization, alias audit, navigation/workspace taxonomy.
2. **W5 scheduling anchor:** booking-first scheduling, repeat booking, visit-to-rota lifecycle, payroll-adjacent handoff evidence.
3. **W6 compliance symmetry:** first-class CQC workspace and adult-domain entry points.
4. **W2 public architecture:** only after backbone truth exists, update the public 3-domain story to the approved 4-domain model.
5. **Verification:** keep browser/UAT plans aligned with the regulator split and the new domain model.

## Documentation updates in this task

- Added this review artifact to ground roadmap execution in current repo evidence.
- Updated `evidence/browser-uat-plan.md` so browser verification tracks the approved four-domain and regulator-symmetry expectations instead of the older three-domain framing.
