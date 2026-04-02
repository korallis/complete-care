'use server';

/**
 * Dashboard data aggregation — server actions.
 *
 * In production these queries will aggregate from domain tables
 * (persons, care_plans, staff, incidents, etc.). For now, we return
 * realistic mock data so the UI is fully functional and can be wired
 * up to real queries when those domain tables land.
 *
 * Multi-tenant: every query must be scoped to organisationId.
 */

import type {
  KpiMetric,
  OperationalDashboardData,
  DomiciliaryDashboardData,
  SupportedLivingDashboardData,
  ChildrensDashboardData,
  StaffComplianceDashboardData,
  CqcDashboardData,
  CoverageLevel,
  TrendSeries,
  DateRange,
  DateRangePreset,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────

export function buildDateRange(preset: DateRangePreset): DateRange {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case 'ytd':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      from.setDate(from.getDate() - 30);
      break;
  }

  return { preset, from, to };
}

function generateTrendData(days: number, min: number, max: number) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      value: Math.floor(Math.random() * (max - min + 1)) + min,
    });
  }
  return data;
}

function kpi(
  label: string,
  value: number,
  previousValue: number,
  formatted: string,
  positiveDirection: 'up' | 'down' = 'up',
): KpiMetric {
  const diff = value - previousValue;
  const changePercent = previousValue === 0 ? 0 : Math.round((diff / previousValue) * 100);
  const trend: KpiMetric['trend'] = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const trendSentiment: KpiMetric['trendSentiment'] =
    trend === 'flat'
      ? 'neutral'
      : trend === positiveDirection ? 'positive' : 'negative';

  return { label, value, previousValue, formatted, trend, trendSentiment, changePercent };
}

// ─── Main Operational Dashboard ──────────────────────────────────────────

export async function getOperationalDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<OperationalDashboardData> {
  // TODO: Replace with real aggregation queries against domain tables
  return {
    activePersons: kpi('Active Persons', 142, 138, '142', 'up'),
    staffComplianceRate: kpi('Staff Compliance', 87, 82, '87%', 'up'),
    overdueCarePlanReviews: kpi('Overdue Care Plans', 8, 12, '8', 'down'),
    medicationIncidents: kpi('Medication Incidents', 3, 5, '3', 'down'),
    upcomingDbsRenewals: kpi('DBS Renewals Due', 6, 4, '6', 'down'),
    trainingCompliance: kpi('Training Compliance', 91, 88, '91%', 'up'),
    openSafeguardingConcerns: kpi('Open Safeguarding', 2, 3, '2', 'down'),
  };
}

// ─── Domain Dashboards ───────────────────────────────────────────────────

export async function getDomiciliaryDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<DomiciliaryDashboardData> {
  return {
    visitCompletionRate: kpi('Visit Completion', 96, 94, '96%', 'up'),
    missedVisitsToday: kpi('Missed Visits Today', 2, 5, '2', 'down'),
    travelTimeAverage: kpi('Avg Travel Time', 18, 22, '18 min', 'down'),
  };
}

export async function getSupportedLivingDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<SupportedLivingDashboardData> {
  return {
    goalProgress: { red: 8, amber: 15, green: 42 },
    restrictivePracticeTrend: generateTrendData(30, 0, 5),
  };
}

export async function getChildrensDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<ChildrensDashboardData> {
  return {
    ofstedReadinessScore: kpi('Ofsted Readiness', 82, 78, '82%', 'up'),
    missingEpisodes: kpi('Missing Episodes', 1, 3, '1', 'down'),
    restraintCountTrend: generateTrendData(30, 0, 3),
  };
}

// ─── Trend Data ──────────────────────────────────────────────────────────

export async function getTrendData(
  _organisationId: string,
  range: DateRange,
): Promise<TrendSeries[]> {
  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));

  return [
    { name: 'Active Persons', data: generateTrendData(days, 130, 150), color: 'var(--chart-1)' },
    { name: 'Staff Compliance %', data: generateTrendData(days, 80, 95), color: 'var(--chart-2)' },
    { name: 'Incidents', data: generateTrendData(days, 0, 8), color: 'var(--chart-3)' },
  ];
}

// ─── Staff Compliance ────────────────────────────────────────────────────

export async function getStaffComplianceDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<StaffComplianceDashboardData> {
  const courses = [
    'Safeguarding Adults',
    'Safeguarding Children',
    'First Aid',
    'Manual Handling',
    'Medication Management',
    'Fire Safety',
    'Infection Control',
    'Mental Capacity Act',
  ];

  const statuses: ('completed' | 'due' | 'overdue' | 'not_required')[] = [
    'completed',
    'due',
    'overdue',
    'not_required',
  ];

  const staffNames = [
    'Sarah Johnson',
    'Mohammed Ali',
    'Emily Chen',
    'James Wright',
    'Priya Patel',
    'David Thompson',
    'Lisa Williams',
    'Robert Brown',
  ];

  const trainingMatrix = staffNames.map((name, i) => ({
    staffName: name,
    staffId: `staff-${i + 1}`,
    courses: Object.fromEntries(
      courses.map((course) => [
        course,
        // Weight towards 'completed' for realism
        statuses[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * statuses.length)],
      ]),
    ),
  }));

  return {
    trainingMatrix,
    dbsStatus: { valid: 32, expiringSoon: 6, expired: 2, notRecorded: 1 },
    supervision: { onTrack: 28, overdue: 7, total: 35, compliancePercent: 80 },
  };
}

// ─── CQC Quality Statements ─────────────────────────────────────────────

export async function getCqcDashboard(
  _organisationId: string,
  _range: DateRange,
): Promise<CqcDashboardData> {
  const categories = [
    'Safe',
    'Effective',
    'Caring',
    'Responsive',
    'Well-led',
  ];

  const statementsPerCategory = [
    // Safe
    [
      { code: 'S1', title: 'Learning culture' },
      { code: 'S2', title: 'Safeguarding' },
      { code: 'S3', title: 'Involving people to manage risks' },
      { code: 'S4', title: 'Safe environments' },
      { code: 'S5', title: 'Safe and effective staffing' },
      { code: 'S6', title: 'Infection prevention and control' },
      { code: 'S7', title: 'Medicines optimisation' },
    ],
    // Effective
    [
      { code: 'E1', title: 'Assessing needs' },
      { code: 'E2', title: 'Delivering evidence-based care and treatment' },
      { code: 'E3', title: 'How staff, teams and services work together' },
      { code: 'E4', title: 'Supporting people to live healthier lives' },
      { code: 'E5', title: 'Monitoring and improving outcomes' },
      { code: 'E6', title: 'Consent to care and treatment' },
    ],
    // Caring
    [
      { code: 'C1', title: 'Kindness, compassion and dignity' },
      { code: 'C2', title: 'Treating people as individuals' },
      { code: 'C3', title: 'Independence, choice and control' },
    ],
    // Responsive
    [
      { code: 'R1', title: 'Person-centred care' },
      { code: 'R2', title: 'Care provision, integration and continuity' },
      { code: 'R3', title: 'Providing information' },
      { code: 'R4', title: 'Listening to and involving people' },
      { code: 'R5', title: 'Equity in access' },
      { code: 'R6', title: 'Equity in experiences and outcomes' },
      { code: 'R7', title: 'Planning for the future' },
    ],
    // Well-led
    [
      { code: 'W1', title: 'Shared direction and culture' },
      { code: 'W2', title: 'Capable, compassionate and inclusive leaders' },
      { code: 'W3', title: 'Freedom to speak up' },
      { code: 'W4', title: 'Governance, management and sustainability' },
      { code: 'W5', title: 'Partnerships and communities' },
      { code: 'W6', title: 'Learning, improvement and innovation' },
    ],
  ];

  let fullCount = 0;
  let partialCount = 0;
  let noneCount = 0;

  const statements = categories.flatMap((category, catIdx) =>
    statementsPerCategory[catIdx].map((stmt, i) => {
      const rand = Math.random();
      const coverageLevel: CoverageLevel = rand < 0.5 ? 'full' : rand < 0.8 ? 'partial' : 'none';
      if (coverageLevel === 'full') fullCount++;
      else if (coverageLevel === 'partial') partialCount++;
      else noneCount++;

      const evidenceCount =
        coverageLevel === 'full'
          ? Math.floor(Math.random() * 5) + 3
          : coverageLevel === 'partial'
            ? Math.floor(Math.random() * 3) + 1
            : 0;

      return {
        id: `qs-${catIdx}-${i}`,
        code: stmt.code,
        title: stmt.title,
        category,
        evidenceCount,
        coverageLevel,
        lastEvidenceDate:
          evidenceCount > 0
            ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
            : null,
      };
    }),
  );

  const totalStatements = statements.length;

  return {
    statements,
    overallCoverage: {
      full: fullCount,
      partial: partialCount,
      none: noneCount,
      totalStatements,
      coveragePercent: Math.round(((fullCount + partialCount * 0.5) / totalStatements) * 100),
    },
  };
}
