import { describe, expect, it } from 'vitest';
import { readArtifact, readProjectFile } from '@/__tests__/planning/blueprint-test-helpers';

describe('Complete Care master blueprint brownfield evidence remains grounded in the repo', () => {
  it('matches the documented canonical-domain gap', () => {
    const spec = readArtifact('deepInterviewSpec');
    const typesFile = readProjectFile('src/types/index.ts');

    expect(spec).toContain('src/types/index.ts');
    expect(spec).toContain('still excludes `complex_care` from canonical domain unions');
    expect(typesFile).toContain("'domiciliary_care'");
    expect(typesFile).toContain("'supported_living'");
    expect(typesFile).toContain("'childrens_homes'");
    expect(typesFile).not.toContain("'complex_care'");
  });

  it('matches the documented scheduling-page evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const schedulingPage = readProjectFile('src/app/(dashboard)/[orgSlug]/scheduling/page.tsx');

    expect(spec).toContain('src/app/(dashboard)/[orgSlug]/scheduling/page.tsx');
    expect(spec).toContain('Scheduling surface already exists but remains week-view / queue-oriented instead of booking-first');
    expect(schedulingPage).toContain('Week of {formatWeekLabel(startDate, endDate)}');
    expect(schedulingPage).toContain('<UnassignedQueue visits={unassigned} staffOptions={staffOptions} />');
    expect(schedulingPage).toContain('<VisitSchedule visits={allVisits} visitTypeNames={visitTypeNames} />');
  });

  it('matches the documented Ofsted and partial CQC workspace evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const ofstedPage = readProjectFile('src/app/(dashboard)/[orgSlug]/ofsted/page.tsx');
    const cqcDashboard = readProjectFile('src/features/dashboards/components/cqc-dashboard.tsx');
    const dashboardActions = readProjectFile('src/features/dashboards/actions.ts');

    expect(spec).toContain('src/app/(dashboard)/[orgSlug]/ofsted/page.tsx');
    expect(spec).toContain('confirms a first-class Ofsted workspace already exists');
    expect(spec).toContain('src/features/dashboards/actions.ts');
    expect(spec).toContain('src/features/dashboards/components/cqc-dashboard.tsx');
    expect(spec).toContain('show partial CQC dashboard foundations already exist');

    expect(ofstedPage).toContain('title: \'Ofsted Compliance - Complete Care\'');
    expect(ofstedPage).toContain('<OfstedDashboard data={dashboard} orgSlug={orgSlug} />');
    expect(cqcDashboard).toContain('CQC Quality Statement Coverage');
    expect(dashboardActions).toContain('export async function getCqcDashboard');
  });

  it('matches the documented marketing 3-domain story evidence', () => {
    const spec = readArtifact('deepInterviewSpec');
    const marketingPage = readProjectFile('src/app/(marketing)/page.tsx');
    const pricingPage = readProjectFile('src/app/(marketing)/pricing/page.tsx');
    const demoPage = readProjectFile('src/app/(marketing)/demo/page.tsx');

    expect(spec).toContain('src/app/(marketing)/page.tsx');
    expect(spec).toContain('src/app/(marketing)/pricing/page.tsx');
    expect(spec).toContain('src/app/(marketing)/demo/page.tsx');
    expect(spec).toContain('still communicate a 3-domain story');

    expect(marketingPage).toContain('A distinctive UK care platform for domiciliary care, supported living, and children\'s homes');
    expect(marketingPage).toContain("['3', 'care domains']");
    expect(marketingPage).not.toMatch(/Complex Care/);

    expect(pricingPage).toContain('one domiciliary care branch, one supported living property, or one children\'s home');
    expect(demoPage).toContain('domiciliary, supported living, or children\'s homes');
    expect(demoPage).not.toMatch(/Complex Care/);
  });
});
