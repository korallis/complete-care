import { describe, it, expect } from 'vitest';
import {
  buildDateRange,
  getOperationalDashboard,
  getDomiciliaryDashboard,
  getSupportedLivingDashboard,
  getChildrensDashboard,
  getTrendData,
  getStaffComplianceDashboard,
  getCqcDashboard,
} from './actions';

const ORG_ID = 'test-org-id';

describe('buildDateRange', () => {
  it('returns a 7-day range', () => {
    const range = buildDateRange('7d');
    expect(range.preset).toBe('7d');
    const diffMs = range.to.getTime() - range.from.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('returns a 30-day range', () => {
    const range = buildDateRange('30d');
    const diffDays = Math.round(
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(30);
  });

  it('returns a 90-day range', () => {
    const range = buildDateRange('90d');
    const diffDays = Math.round(
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(90);
  });

  it('returns a year-to-date range', () => {
    const range = buildDateRange('ytd');
    expect(range.from.getMonth()).toBe(0);
    expect(range.from.getDate()).toBe(1);
  });
});

describe('getOperationalDashboard', () => {
  it('returns all expected KPI metrics', async () => {
    const range = buildDateRange('30d');
    const data = await getOperationalDashboard(ORG_ID, range);

    expect(data.activePersons).toBeDefined();
    expect(data.activePersons.label).toBe('Active Persons');
    expect(data.staffComplianceRate.formatted).toBe('87%');
    expect(data.overdueCarePlanReviews).toBeDefined();
    expect(data.medicationIncidents).toBeDefined();
    expect(data.upcomingDbsRenewals).toBeDefined();
    expect(data.trainingCompliance).toBeDefined();
    expect(data.openSafeguardingConcerns).toBeDefined();
  });

  it('KPI metrics include trend data', async () => {
    const range = buildDateRange('30d');
    const data = await getOperationalDashboard(ORG_ID, range);
    const metric = data.activePersons;

    expect(['up', 'down', 'flat']).toContain(metric.trend);
    expect(['positive', 'negative', 'neutral']).toContain(metric.trendSentiment);
    expect(typeof metric.changePercent).toBe('number');
  });
});

describe('getDomiciliaryDashboard', () => {
  it('returns domiciliary KPIs', async () => {
    const range = buildDateRange('30d');
    const data = await getDomiciliaryDashboard(ORG_ID, range);

    expect(data.visitCompletionRate.formatted).toBe('96%');
    expect(data.missedVisitsToday).toBeDefined();
    expect(data.travelTimeAverage).toBeDefined();
  });
});

describe('getSupportedLivingDashboard', () => {
  it('returns goal progress RAG distribution', async () => {
    const range = buildDateRange('30d');
    const data = await getSupportedLivingDashboard(ORG_ID, range);

    expect(data.goalProgress.red).toBeGreaterThanOrEqual(0);
    expect(data.goalProgress.amber).toBeGreaterThanOrEqual(0);
    expect(data.goalProgress.green).toBeGreaterThanOrEqual(0);
    expect(data.restrictivePracticeTrend.length).toBeGreaterThan(0);
  });
});

describe('getChildrensDashboard', () => {
  it('returns children-specific KPIs', async () => {
    const range = buildDateRange('30d');
    const data = await getChildrensDashboard(ORG_ID, range);

    expect(data.ofstedReadinessScore.formatted).toBe('82%');
    expect(data.missingEpisodes).toBeDefined();
    expect(data.restraintCountTrend.length).toBeGreaterThan(0);
  });
});

describe('getTrendData', () => {
  it('returns trend series with correct structure', async () => {
    const range = buildDateRange('30d');
    const series = await getTrendData(ORG_ID, range);

    expect(series.length).toBe(3);
    for (const s of series) {
      expect(s.name).toBeTruthy();
      expect(s.data.length).toBeGreaterThan(0);
      expect(s.data[0]).toHaveProperty('date');
      expect(s.data[0]).toHaveProperty('value');
    }
  });
});

describe('getStaffComplianceDashboard', () => {
  it('returns training matrix with staff and courses', async () => {
    const range = buildDateRange('30d');
    const data = await getStaffComplianceDashboard(ORG_ID, range);

    expect(data.trainingMatrix.length).toBeGreaterThan(0);
    const row = data.trainingMatrix[0];
    expect(row.staffName).toBeTruthy();
    expect(row.staffId).toBeTruthy();
    expect(Object.keys(row.courses).length).toBeGreaterThan(0);
  });

  it('returns DBS status summary', async () => {
    const range = buildDateRange('30d');
    const data = await getStaffComplianceDashboard(ORG_ID, range);

    expect(data.dbsStatus.valid).toBeGreaterThanOrEqual(0);
    expect(data.dbsStatus.expiringSoon).toBeGreaterThanOrEqual(0);
    expect(data.dbsStatus.expired).toBeGreaterThanOrEqual(0);
  });

  it('returns supervision compliance', async () => {
    const range = buildDateRange('30d');
    const data = await getStaffComplianceDashboard(ORG_ID, range);

    expect(data.supervision.total).toBeGreaterThan(0);
    expect(data.supervision.compliancePercent).toBeGreaterThanOrEqual(0);
    expect(data.supervision.compliancePercent).toBeLessThanOrEqual(100);
  });
});

describe('getCqcDashboard', () => {
  it('returns quality statements grouped by category', async () => {
    const range = buildDateRange('30d');
    const data = await getCqcDashboard(ORG_ID, range);

    expect(data.statements.length).toBeGreaterThan(0);
    const categories = new Set(data.statements.map((s) => s.category));
    expect(categories.size).toBe(5); // Safe, Effective, Caring, Responsive, Well-led
  });

  it('returns overall coverage summary', async () => {
    const range = buildDateRange('30d');
    const data = await getCqcDashboard(ORG_ID, range);

    const { overallCoverage } = data;
    expect(overallCoverage.full + overallCoverage.partial + overallCoverage.none).toBe(
      overallCoverage.totalStatements,
    );
    expect(overallCoverage.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(overallCoverage.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('statements have correct coverage levels', async () => {
    const range = buildDateRange('30d');
    const data = await getCqcDashboard(ORG_ID, range);

    for (const stmt of data.statements) {
      expect(['full', 'partial', 'none']).toContain(stmt.coverageLevel);
      if (stmt.coverageLevel === 'none') {
        expect(stmt.evidenceCount).toBe(0);
        expect(stmt.lastEvidenceDate).toBeNull();
      }
    }
  });
});
