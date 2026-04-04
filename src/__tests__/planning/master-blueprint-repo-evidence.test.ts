import { describe, expect, it } from 'vitest';
import { readArtifact, readProjectFile } from '@/__tests__/planning/blueprint-test-helpers';

describe('Complete Care master blueprint brownfield evidence remains grounded in the repo', () => {
  it('matches the documented canonical-domain evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const typesFile = readProjectFile('src/types/index.ts');

    expect(spec).toContain('src/types/index.ts');
    expect(spec).toContain('now includes `complex_care` in the canonical domain union');
    expect(typesFile).toContain("'domiciliary_care'");
    expect(typesFile).toContain("'supported_living'");
    expect(typesFile).toContain("'childrens_homes'");
    expect(typesFile).toContain("'complex_care'");
  });

  it('matches the documented scheduling-page evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const schedulingPage = readProjectFile('src/app/(dashboard)/[orgSlug]/scheduling/page.tsx');

    expect(spec).toContain('src/app/(dashboard)/[orgSlug]/scheduling/page.tsx');
    expect(spec).toContain('shows scheduling is currently week-view / queue oriented, not booking-first');
    expect(schedulingPage).toContain('Week of {formatWeekLabel(startDate, endDate)}');
    expect(schedulingPage).toContain('<UnassignedQueue visits={unassigned} staffOptions={staffOptions} />');
    expect(schedulingPage).toContain('<VisitSchedule visits={allVisits} visitTypeNames={visitTypeNames} />');
  });

  it('matches the documented Ofsted and CQC workspace evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const ofstedPage = readProjectFile('src/app/(dashboard)/[orgSlug]/ofsted/page.tsx');
    const cqcPage = readProjectFile('src/app/(dashboard)/[orgSlug]/cqc/page.tsx');
    const cqcDashboard = readProjectFile('src/features/dashboards/components/cqc-dashboard.tsx');
    const dashboardActions = readProjectFile('src/features/dashboards/actions.ts');

    expect(spec).toContain('src/app/(dashboard)/[orgSlug]/ofsted/page.tsx');
    expect(spec).toContain('confirms a first-class Ofsted workspace already exists');
    expect(spec).toContain('src/app/(dashboard)/[orgSlug]/cqc/page.tsx');
    expect(spec).toContain('src/features/dashboards/actions.ts');
    expect(spec).toContain('src/features/dashboards/components/cqc-dashboard.tsx');
    expect(spec).toContain('show an org-scoped CQC workspace now exists');

    expect(ofstedPage).toContain('title: \'Ofsted Compliance - Complete Care\'');
    expect(ofstedPage).toContain('<OfstedDashboard data={dashboard} orgSlug={orgSlug} />');
    expect(cqcPage).toContain('title: \'CQC Quality Statements - Complete Care\'');
    expect(cqcPage).toContain('Complex Care');
    expect(cqcDashboard).toContain('CQC Quality Statement Coverage');
    expect(dashboardActions).toContain('export async function getCqcDashboard');
  });

  it('matches the documented marketing 4-domain story evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const marketingPage = readProjectFile('src/app/(marketing)/page.tsx');
    const pricingPage = readProjectFile('src/app/(marketing)/pricing/page.tsx');
    const demoPage = readProjectFile('src/app/(marketing)/demo/page.tsx');
    const manifest = readProjectFile('src/app/manifest.ts');

    expect(spec).toContain('src/app/(marketing)/page.tsx');
    expect(spec).toContain('src/app/(marketing)/pricing/page.tsx');
    expect(spec).toContain('src/app/(marketing)/demo/page.tsx');
    expect(spec).toContain('already communicate a 4-domain story that includes Complex Care');

    expect(marketingPage).toContain('A distinctive UK care platform for domiciliary care, supported living, complex care, and children');
    expect(marketingPage).toContain("['4', 'care domains']");
    expect(marketingPage).toMatch(/complex care/i);

    expect(pricingPage).toContain('one domiciliary care branch, one supported living property');
    expect(demoPage).toContain('supported living, complex care');
    expect(manifest).toContain('complex care');
  });
});
