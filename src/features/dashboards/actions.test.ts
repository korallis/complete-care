import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, selectQueue } = vi.hoisted(() => {
  const selectQueue: unknown[] = [];

  function makeAwaitableQuery<T>(result: T) {
    const query = {
      where: vi.fn(() => query),
      groupBy: vi.fn(() => query),
      orderBy: vi.fn(() => Promise.resolve(result)),
      then: (
        resolve: (value: T) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };

    return query;
  }

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => makeAwaitableQuery(selectQueue.shift())),
    })),
  };

  return { mockDb, selectQueue };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

import {
  getChildrensDashboard,
  getCqcDashboard,
  getDomiciliaryDashboard,
  getOperationalDashboard,
  getStaffComplianceDashboard,
  getSupportedLivingDashboard,
  getTrendData,
} from './actions';
import { buildDateRange } from './date-range';

const ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

function queueSelectResults(...results: unknown[]) {
  selectQueue.push(...results);
}

describe('dashboard actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    vi.clearAllMocks();
  });

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
    it('returns expected KPI metrics and derived percentages', async () => {
      queueSelectResults(
        [{ count: 12 }],
        [{ count: 10 }],
        [{ count: 4 }],
        [{ count: 6 }],
        [{ count: 3 }],
        [{ count: 5 }],
        [{ count: 2 }],
        [{ count: 1 }],
        [{ count: 87 }],
        [{ count: 100 }],
        [{ count: 70 }],
        [{ count: 100 }],
        [{ count: 8 }],
        [{ count: 5 }],
      );

      const data = await getOperationalDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.activePersons).toMatchObject({
        label: 'Active Persons',
        value: 12,
        previousValue: 10,
        formatted: '12',
        trend: 'up',
      });
      expect(data.staffComplianceRate.formatted).toBe('87%');
      expect(data.staffComplianceRate.changePercent).toBe(24);
      expect(data.overdueCarePlanReviews.trendSentiment).toBe('positive');
      expect(data.medicationIncidents.trend).toBe('down');
      expect(data.upcomingDbsRenewals.value).toBe(2);
      expect(data.trainingCompliance.formatted).toBe('87%');
      expect(data.openSafeguardingConcerns.value).toBe(8);
    });
  });

  describe('getDomiciliaryDashboard', () => {
    it('returns domiciliary KPIs from live-query aggregates', async () => {
      queueSelectResults(
        [{ count: 24 }],
        [{ count: 25 }],
        [{ count: 20 }],
        [{ count: 25 }],
        [{ count: 1 }],
        [{ count: 3 }],
        [{ avg: 18 }],
        [{ avg: 22 }],
      );

      const data = await getDomiciliaryDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.visitCompletionRate.formatted).toBe('96%');
      expect(data.visitCompletionRate.previousValue).toBe(80);
      expect(data.missedVisitsToday.value).toBe(1);
      expect(data.travelTimeAverage.formatted).toBe('18 min');
      expect(data.travelTimeAverage.trendSentiment).toBe('positive');
    });
  });

  describe('getSupportedLivingDashboard', () => {
    it('maps goal statuses into RAG counts and trend rows', async () => {
      queueSelectResults(
        [
          { status: 'completed', count: 4 },
          { status: 'active', count: 3 },
          { status: 'paused', count: 2 },
          { status: 'cancelled', count: 1 },
        ],
        [
          { date: '2026-03-01', value: 1 },
          { date: '2026-03-02', value: 2 },
        ],
      );

      const data = await getSupportedLivingDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.goalProgress).toEqual({ red: 3, amber: 3, green: 4 });
      expect(data.restrictivePracticeTrend).toEqual([
        { date: '2026-03-01', value: 1 },
        { date: '2026-03-02', value: 2 },
      ]);
    });
  });

  describe('getChildrensDashboard', () => {
    it('returns children-specific KPIs and restraint trend data', async () => {
      queueSelectResults(
        [{ count: 82 }],
        [{ count: 100 }],
        [{ count: 75 }],
        [{ count: 100 }],
        [{ count: 2 }],
        [{ count: 3 }],
        [
          { date: '2026-03-05', value: 1 },
          { date: '2026-03-07', value: 2 },
        ],
      );

      const data = await getChildrensDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.ofstedReadinessScore.formatted).toBe('82%');
      expect(data.ofstedReadinessScore.previousValue).toBe(75);
      expect(data.missingEpisodes.value).toBe(2);
      expect(data.restraintCountTrend).toEqual([
        { date: '2026-03-05', value: 1 },
        { date: '2026-03-07', value: 2 },
      ]);
    });
  });

  describe('getTrendData', () => {
    it('returns the currently exposed dashboard series', async () => {
      queueSelectResults(
        [
          { date: '2026-03-01', value: 2 },
          { date: '2026-03-02', value: 3 },
        ],
        [{ date: '2026-03-01', value: 1 }],
      );

      const series = await getTrendData(ORG_ID, buildDateRange('30d'));

      expect(series).toEqual([
        {
          name: 'Active Persons',
          color: 'var(--chart-1)',
          data: [
            { date: '2026-03-01', value: 2 },
            { date: '2026-03-02', value: 3 },
          ],
        },
        {
          name: 'Incidents',
          color: 'var(--chart-3)',
          data: [{ date: '2026-03-01', value: 1 }],
        },
      ]);
    });
  });

  describe('getStaffComplianceDashboard', () => {
    it('builds training, DBS, and supervision summaries from tenant-scoped query results', async () => {
      queueSelectResults(
        [
          { id: 'staff-1', fullName: 'Asha Khan' },
          { id: 'staff-2', fullName: 'Ben Moss' },
        ],
        [
          {
            staffProfileId: 'staff-1',
            courseId: 'course-1',
            courseName: 'Fire Safety',
            status: 'current',
          },
          {
            staffProfileId: 'staff-1',
            courseId: 'course-2',
            courseName: 'Medication',
            status: 'expired',
          },
          {
            staffProfileId: 'staff-2',
            courseId: 'course-1',
            courseName: 'Fire Safety',
            status: 'expiring_soon',
          },
        ],
        [
          { id: 'course-1', name: 'Fire Safety' },
          { id: 'course-2', name: 'Medication' },
        ],
        [
          { status: 'current', count: 1 },
          { status: 'expiring_soon', count: 1 },
        ],
        [
          { status: 'completed', count: 1 },
          { status: 'scheduled', count: 1 },
          { status: 'overdue', count: 1 },
        ],
      );

      const data = await getStaffComplianceDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.trainingMatrix).toEqual([
        {
          staffName: 'Asha Khan',
          staffId: 'staff-1',
          courses: {
            'Fire Safety': 'completed',
            Medication: 'overdue',
          },
        },
        {
          staffName: 'Ben Moss',
          staffId: 'staff-2',
          courses: {
            'Fire Safety': 'due',
            Medication: 'due',
          },
        },
      ]);
      expect(data.dbsStatus).toEqual({
        valid: 1,
        expiringSoon: 1,
        expired: 0,
        notRecorded: 0,
      });
      expect(data.supervision).toEqual({
        onTrack: 2,
        overdue: 1,
        total: 3,
        compliancePercent: 67,
      });
    });
  });

  describe('getCqcDashboard', () => {
    it('derives coverage levels and dates from evidence aggregates', async () => {
      queueSelectResults(
        [
          { status: 'evidenced', count: 18 },
          { status: 'partial', count: 9 },
        ],
        [{ maxDate: '2026-03-31T10:15:00.000Z' }],
      );

      const data = await getCqcDashboard(ORG_ID, buildDateRange('30d'));

      expect(data.statements.length).toBe(29);
      expect(new Set(data.statements.map((statement) => statement.category))).toEqual(
        new Set(['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led']),
      );
      expect(data.statements.every((statement) => statement.coverageLevel === 'full')).toBe(true);
      expect(data.statements.every((statement) => statement.lastEvidenceDate === '2026-03-31')).toBe(
        true,
      );
      expect(data.overallCoverage).toEqual({
        full: 29,
        partial: 0,
        none: 0,
        totalStatements: 29,
        coveragePercent: 100,
      });
    });
  });
});
