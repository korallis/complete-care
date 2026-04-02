# Rostering / timesheets / payroll + family portal review

## Scope reviewed

- `src/features/timesheets/*`
- `src/lib/db/schema/timesheets.ts`
- `src/features/family-portal/*`
- `src/app/(family)/portal/*`

## Code-quality findings and actions

1. **Payroll exports could include non-approved timesheets**
   - `generatePayroll()` documented approved-entry inputs but accepted every status.
   - Fixed by restricting exports to `approved` and `paid` entries so draft, submitted, and rejected rows cannot leak into payroll totals.

2. **Payroll CSV names were not escaped safely**
   - CSV output wrapped staff names in quotes but did not escape embedded double quotes.
   - Fixed by escaping embedded quotes before serialisation.

3. **Family portal cleanup review**
   - Reviewed the consent-aware family portal slice now on `main`, including `server.ts`, portal routes, and update visibility filtering.
   - No additional in-scope cleanup was required here after the consent gating and linked-person context work already landed; current follow-up remains documentation + verification for this worker lane.

## Verification focus

- Timesheet generator/unit coverage now proves:
  - overnight and normal shift generation
  - actual-hour calculations
  - payroll aggregation only for exportable statuses
  - CSV escaping for embedded quotes
- Family portal confidence is anchored to the current targeted tests already present in the repo for:
  - update visibility filtering
  - domain view mapping
  - component rendering

## Remaining risks

- This review only touched the in-memory timesheet/payroll generator layer, not database-backed payroll submission flows.
- Family portal end-to-end verification still depends on environment-backed dashboard/auth flows outside this worker lane.
