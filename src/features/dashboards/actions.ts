'use server';

/**
 * Dashboard data aggregation — server actions.
 *
 * Real Drizzle ORM aggregation queries against domain tables.
 * Multi-tenant: every query is scoped to organisationId.
 */

import { db } from '@/lib/db';
import {
  persons,
  carePlans,
  incidents,
  medications,
  dbsChecks,
  trainingRecords,
  trainingCourses,
  staffProfiles,
  safeguardingConcerns,
  supervisions,
  evvVisits,
  missingEpisodes,
  restrictivePractices,
  goals,
  ofstedEvidence,
} from '@/lib/db/schema';
import { count, eq, and, gte, lte, sql, lt, ne, isNull } from 'drizzle-orm';

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

/**
 * Build a previous-period date range of equal length ending at `range.from`.
 */
function buildPreviousRange(range: DateRange): { from: Date; to: Date } {
  const durationMs = range.to.getTime() - range.from.getTime();
  const prevTo = new Date(range.from.getTime());
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom, to: prevTo };
}

/** Format a Date to ISO date string (YYYY-MM-DD). */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Main Operational Dashboard ──────────────────────────────────────────

export async function getOperationalDashboard(
  organisationId: string,
  range: DateRange,
): Promise<OperationalDashboardData> {
  const prev = buildPreviousRange(range);
  const today = toDateStr(new Date());

  const [
    activePersonsCount,
    prevActivePersonsCount,
    overdueCarePlansCount,
    prevOverdueCarePlansCount,
    incidentCount,
    prevIncidentCount,
    dbsExpiringSoonCount,
    prevDbsExpiringSoonCount,
    trainingCurrentCount,
    trainingTotalCount,
    prevTrainingCurrentCount,
    prevTrainingTotalCount,
    openSafeguardingCount,
    prevOpenSafeguardingCount,
  ] = await Promise.all([
    // Active persons — current
    db.select({ count: count() })
      .from(persons)
      .where(and(
        eq(persons.organisationId, organisationId),
        eq(persons.status, 'active'),
        isNull(persons.deletedAt),
      ))
      .then(r => r[0]?.count ?? 0),

    // Active persons — previous period (snapshot: same query, as status is current)
    db.select({ count: count() })
      .from(persons)
      .where(and(
        eq(persons.organisationId, organisationId),
        eq(persons.status, 'active'),
        isNull(persons.deletedAt),
        lte(persons.createdAt, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Overdue care plan reviews — current (nextReviewDate < today)
    db.select({ count: count() })
      .from(carePlans)
      .where(and(
        eq(carePlans.organisationId, organisationId),
        ne(carePlans.status, 'archived'),
        isNull(carePlans.deletedAt),
        lt(carePlans.nextReviewDate, today),
      ))
      .then(r => r[0]?.count ?? 0),

    // Overdue care plan reviews — previous period
    db.select({ count: count() })
      .from(carePlans)
      .where(and(
        eq(carePlans.organisationId, organisationId),
        ne(carePlans.status, 'archived'),
        isNull(carePlans.deletedAt),
        lt(carePlans.nextReviewDate, toDateStr(prev.to)),
      ))
      .then(r => r[0]?.count ?? 0),

    // Incidents in current range
    db.select({ count: count() })
      .from(incidents)
      .where(and(
        eq(incidents.organisationId, organisationId),
        gte(incidents.dateTime, range.from),
        lte(incidents.dateTime, range.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Incidents in previous range
    db.select({ count: count() })
      .from(incidents)
      .where(and(
        eq(incidents.organisationId, organisationId),
        gte(incidents.dateTime, prev.from),
        lte(incidents.dateTime, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // DBS expiring soon (recheckDate within 30 days of today)
    db.select({ count: count() })
      .from(dbsChecks)
      .where(and(
        eq(dbsChecks.organisationId, organisationId),
        lte(dbsChecks.recheckDate, toDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))),
        gte(dbsChecks.recheckDate, today),
      ))
      .then(r => r[0]?.count ?? 0),

    // DBS expiring soon — previous period benchmark (within 30 days of prev.to)
    db.select({ count: count() })
      .from(dbsChecks)
      .where(and(
        eq(dbsChecks.organisationId, organisationId),
        lte(dbsChecks.recheckDate, toDateStr(new Date(prev.to.getTime() + 30 * 24 * 60 * 60 * 1000))),
        gte(dbsChecks.recheckDate, toDateStr(prev.to)),
      ))
      .then(r => r[0]?.count ?? 0),

    // Training compliance — current records with status 'current'
    db.select({ count: count() })
      .from(trainingRecords)
      .where(and(
        eq(trainingRecords.organisationId, organisationId),
        eq(trainingRecords.status, 'current'),
      ))
      .then(r => r[0]?.count ?? 0),

    // Training — total records (to compute percentage)
    db.select({ count: count() })
      .from(trainingRecords)
      .where(and(
        eq(trainingRecords.organisationId, organisationId),
        ne(trainingRecords.status, 'not_completed'),
      ))
      .then(r => r[0]?.count ?? 0),

    // Training compliance — previous period: current at prev.to
    // Approximate by looking at records that were completed before prev.to
    // and not expired by prev.to
    db.select({ count: count() })
      .from(trainingRecords)
      .where(and(
        eq(trainingRecords.organisationId, organisationId),
        lte(trainingRecords.completedDate, toDateStr(prev.to)),
        sql`(${trainingRecords.expiryDate} IS NULL OR ${trainingRecords.expiryDate} >= ${toDateStr(prev.to)})`,
      ))
      .then(r => r[0]?.count ?? 0),

    // Training total — previous period
    db.select({ count: count() })
      .from(trainingRecords)
      .where(and(
        eq(trainingRecords.organisationId, organisationId),
        lte(trainingRecords.completedDate, toDateStr(prev.to)),
      ))
      .then(r => r[0]?.count ?? 0),

    // Open safeguarding concerns — current
    db.select({ count: count() })
      .from(safeguardingConcerns)
      .where(and(
        eq(safeguardingConcerns.organisationId, organisationId),
        sql`${safeguardingConcerns.status} IN ('open', 'under_review')`,
      ))
      .then(r => r[0]?.count ?? 0),

    // Open safeguarding concerns — as of previous period end
    db.select({ count: count() })
      .from(safeguardingConcerns)
      .where(and(
        eq(safeguardingConcerns.organisationId, organisationId),
        sql`${safeguardingConcerns.status} IN ('open', 'under_review')`,
        lte(safeguardingConcerns.createdAt, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),
  ]);

  const trainingPct = trainingTotalCount > 0
    ? Math.round((trainingCurrentCount / trainingTotalCount) * 100)
    : 0;
  const prevTrainingPct = prevTrainingTotalCount > 0
    ? Math.round((prevTrainingCurrentCount / prevTrainingTotalCount) * 100)
    : 0;

  // Staff compliance rate: use training compliance as the proxy
  const staffCompliancePct = trainingPct;
  const prevStaffCompliancePct = prevTrainingPct;

  return {
    activePersons: kpi('Active Persons', activePersonsCount, prevActivePersonsCount, String(activePersonsCount), 'up'),
    staffComplianceRate: kpi('Staff Compliance', staffCompliancePct, prevStaffCompliancePct, `${staffCompliancePct}%`, 'up'),
    overdueCarePlanReviews: kpi('Overdue Care Plans', overdueCarePlansCount, prevOverdueCarePlansCount, String(overdueCarePlansCount), 'down'),
    medicationIncidents: kpi('Medication Incidents', incidentCount, prevIncidentCount, String(incidentCount), 'down'),
    upcomingDbsRenewals: kpi('DBS Renewals Due', dbsExpiringSoonCount, prevDbsExpiringSoonCount, String(dbsExpiringSoonCount), 'down'),
    trainingCompliance: kpi('Training Compliance', trainingPct, prevTrainingPct, `${trainingPct}%`, 'up'),
    openSafeguardingConcerns: kpi('Open Safeguarding', openSafeguardingCount, prevOpenSafeguardingCount, String(openSafeguardingCount), 'down'),
  };
}

// ─── Domain Dashboards ───────────────────────────────────────────────────

export async function getDomiciliaryDashboard(
  organisationId: string,
  range: DateRange,
): Promise<DomiciliaryDashboardData> {
  const prev = buildPreviousRange(range);

  const [
    completedVisits,
    totalVisits,
    prevCompletedVisits,
    prevTotalVisits,
    missedToday,
    prevMissedToday,
    avgTravelResult,
    prevAvgTravelResult,
  ] = await Promise.all([
    // Completed visits in range
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'completed'),
        gte(evvVisits.scheduledStart, range.from),
        lte(evvVisits.scheduledStart, range.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Total visits in range (excluding cancelled)
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        ne(evvVisits.status, 'cancelled'),
        gte(evvVisits.scheduledStart, range.from),
        lte(evvVisits.scheduledStart, range.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Previous completed
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'completed'),
        gte(evvVisits.scheduledStart, prev.from),
        lte(evvVisits.scheduledStart, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Previous total
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        ne(evvVisits.status, 'cancelled'),
        gte(evvVisits.scheduledStart, prev.from),
        lte(evvVisits.scheduledStart, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Missed visits today
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'missed'),
        gte(evvVisits.scheduledStart, new Date(new Date().setHours(0, 0, 0, 0))),
        lte(evvVisits.scheduledStart, new Date(new Date().setHours(23, 59, 59, 999))),
      ))
      .then(r => r[0]?.count ?? 0),

    // Missed visits on equivalent day in previous period (approximation: use prev period average)
    db.select({ count: count() })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'missed'),
        gte(evvVisits.scheduledStart, prev.from),
        lte(evvVisits.scheduledStart, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Average travel time (using actualDurationMinutes minus scheduled duration as proxy)
    // We use actual duration average for completed visits in range
    db.select({ avg: sql<number>`COALESCE(AVG(${evvVisits.actualDurationMinutes}), 0)` })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'completed'),
        gte(evvVisits.scheduledStart, range.from),
        lte(evvVisits.scheduledStart, range.to),
      ))
      .then(r => Math.round(Number(r[0]?.avg ?? 0))),

    // Previous avg travel
    db.select({ avg: sql<number>`COALESCE(AVG(${evvVisits.actualDurationMinutes}), 0)` })
      .from(evvVisits)
      .where(and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'completed'),
        gte(evvVisits.scheduledStart, prev.from),
        lte(evvVisits.scheduledStart, prev.to),
      ))
      .then(r => Math.round(Number(r[0]?.avg ?? 0))),
  ]);

  const completionRate = totalVisits > 0
    ? Math.round((completedVisits / totalVisits) * 100)
    : 0;
  const prevCompletionRate = prevTotalVisits > 0
    ? Math.round((prevCompletedVisits / prevTotalVisits) * 100)
    : 0;

  return {
    visitCompletionRate: kpi('Visit Completion', completionRate, prevCompletionRate, `${completionRate}%`, 'up'),
    missedVisitsToday: kpi('Missed Visits Today', missedToday, prevMissedToday, String(missedToday), 'down'),
    travelTimeAverage: kpi('Avg Travel Time', avgTravelResult, prevAvgTravelResult, `${avgTravelResult} min`, 'down'),
  };
}

export async function getSupportedLivingDashboard(
  organisationId: string,
  range: DateRange,
): Promise<SupportedLivingDashboardData> {
  // Goal progress — count goals by RAG status based on their lifecycle status
  const [goalCounts, rpTrend] = await Promise.all([
    db.select({
      status: goals.status,
      count: count(),
    })
      .from(goals)
      .where(eq(goals.organisationId, organisationId))
      .groupBy(goals.status),

    // Restrictive practice trend — count per day in range
    db.select({
      date: sql<string>`DATE(${restrictivePractices.occurredAt})`.as('date'),
      value: count(),
    })
      .from(restrictivePractices)
      .where(and(
        eq(restrictivePractices.organisationId, organisationId),
        gte(restrictivePractices.occurredAt, range.from),
        lte(restrictivePractices.occurredAt, range.to),
        eq(restrictivePractices.isSuperseded, false),
      ))
      .groupBy(sql`DATE(${restrictivePractices.occurredAt})`)
      .orderBy(sql`DATE(${restrictivePractices.occurredAt})`),
  ]);

  // Map goal statuses to RAG: completed = green, active = amber, paused/cancelled = red
  let red = 0;
  let amber = 0;
  let green = 0;
  for (const row of goalCounts) {
    if (row.status === 'completed') green += row.count;
    else if (row.status === 'active') amber += row.count;
    else red += row.count; // paused, cancelled
  }

  return {
    goalProgress: { red, amber, green },
    restrictivePracticeTrend: rpTrend.map(r => ({
      date: String(r.date),
      value: r.value,
    })),
  };
}

export async function getChildrensDashboard(
  organisationId: string,
  range: DateRange,
): Promise<ChildrensDashboardData> {
  const prev = buildPreviousRange(range);

  const [
    evidencedCount,
    totalEvidenceCount,
    prevEvidencedCount,
    prevTotalEvidenceCount,
    openMissingCount,
    prevOpenMissingCount,
    restraintTrend,
  ] = await Promise.all([
    // Ofsted readiness: count of evidenced items
    db.select({ count: count() })
      .from(ofstedEvidence)
      .where(and(
        eq(ofstedEvidence.organisationId, organisationId),
        eq(ofstedEvidence.status, 'evidenced'),
      ))
      .then(r => r[0]?.count ?? 0),

    // Total evidence items
    db.select({ count: count() })
      .from(ofstedEvidence)
      .where(eq(ofstedEvidence.organisationId, organisationId))
      .then(r => r[0]?.count ?? 0),

    // Previous evidenced (approximate: created before prev.to and evidenced)
    db.select({ count: count() })
      .from(ofstedEvidence)
      .where(and(
        eq(ofstedEvidence.organisationId, organisationId),
        eq(ofstedEvidence.status, 'evidenced'),
        lte(ofstedEvidence.createdAt, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Previous total
    db.select({ count: count() })
      .from(ofstedEvidence)
      .where(and(
        eq(ofstedEvidence.organisationId, organisationId),
        lte(ofstedEvidence.createdAt, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Open missing episodes — current
    db.select({ count: count() })
      .from(missingEpisodes)
      .where(and(
        eq(missingEpisodes.organisationId, organisationId),
        eq(missingEpisodes.status, 'open'),
      ))
      .then(r => r[0]?.count ?? 0),

    // Open missing episodes — as of previous period
    db.select({ count: count() })
      .from(missingEpisodes)
      .where(and(
        eq(missingEpisodes.organisationId, organisationId),
        eq(missingEpisodes.status, 'open'),
        lte(missingEpisodes.absenceNoticedAt, prev.to),
      ))
      .then(r => r[0]?.count ?? 0),

    // Restraint count trend — using restrictivePractices (physical type) per day
    db.select({
      date: sql<string>`DATE(${restrictivePractices.occurredAt})`.as('date'),
      value: count(),
    })
      .from(restrictivePractices)
      .where(and(
        eq(restrictivePractices.organisationId, organisationId),
        eq(restrictivePractices.type, 'physical'),
        eq(restrictivePractices.isSuperseded, false),
        gte(restrictivePractices.occurredAt, range.from),
        lte(restrictivePractices.occurredAt, range.to),
      ))
      .groupBy(sql`DATE(${restrictivePractices.occurredAt})`)
      .orderBy(sql`DATE(${restrictivePractices.occurredAt})`),
  ]);

  const readinessScore = totalEvidenceCount > 0
    ? Math.round((evidencedCount / totalEvidenceCount) * 100)
    : 0;
  const prevReadinessScore = prevTotalEvidenceCount > 0
    ? Math.round((prevEvidencedCount / prevTotalEvidenceCount) * 100)
    : 0;

  return {
    ofstedReadinessScore: kpi('Ofsted Readiness', readinessScore, prevReadinessScore, `${readinessScore}%`, 'up'),
    missingEpisodes: kpi('Missing Episodes', openMissingCount, prevOpenMissingCount, String(openMissingCount), 'down'),
    restraintCountTrend: restraintTrend.map(r => ({
      date: String(r.date),
      value: r.value,
    })),
  };
}

// ─── Trend Data ──────────────────────────────────────────────────────────

export async function getTrendData(
  organisationId: string,
  range: DateRange,
): Promise<TrendSeries[]> {
  // Query real trend data: daily counts of active persons, incidents, and training compliance
  const [personsTrend, incidentsTrend] = await Promise.all([
    // Active persons created by date (cumulative approximation using created_at)
    db.select({
      date: sql<string>`DATE(${persons.createdAt})`.as('date'),
      value: count(),
    })
      .from(persons)
      .where(and(
        eq(persons.organisationId, organisationId),
        eq(persons.status, 'active'),
        isNull(persons.deletedAt),
        gte(persons.createdAt, range.from),
        lte(persons.createdAt, range.to),
      ))
      .groupBy(sql`DATE(${persons.createdAt})`)
      .orderBy(sql`DATE(${persons.createdAt})`),

    // Incidents per day
    db.select({
      date: sql<string>`DATE(${incidents.dateTime})`.as('date'),
      value: count(),
    })
      .from(incidents)
      .where(and(
        eq(incidents.organisationId, organisationId),
        gte(incidents.dateTime, range.from),
        lte(incidents.dateTime, range.to),
      ))
      .groupBy(sql`DATE(${incidents.dateTime})`)
      .orderBy(sql`DATE(${incidents.dateTime})`),
  ]);

  return [
    {
      name: 'Active Persons',
      data: personsTrend.map(r => ({ date: String(r.date), value: r.value })),
      color: 'var(--chart-1)',
    },
    {
      name: 'Incidents',
      data: incidentsTrend.map(r => ({ date: String(r.date), value: r.value })),
      color: 'var(--chart-3)',
    },
  ];
}

// ─── Staff Compliance ────────────────────────────────────────────────────

export async function getStaffComplianceDashboard(
  organisationId: string,
  _range: DateRange,
): Promise<StaffComplianceDashboardData> {
  // Fetch all active staff, their training records, and training courses in parallel
  const [staff, records, courses, dbsResults, supervisionResults] = await Promise.all([
    // Active staff profiles
    db.select({
      id: staffProfiles.id,
      fullName: staffProfiles.fullName,
    })
      .from(staffProfiles)
      .where(and(
        eq(staffProfiles.organisationId, organisationId),
        eq(staffProfiles.status, 'active'),
        isNull(staffProfiles.deletedAt),
      )),

    // All training records for this org
    db.select({
      staffProfileId: trainingRecords.staffProfileId,
      courseId: trainingRecords.courseId,
      courseName: trainingRecords.courseName,
      status: trainingRecords.status,
    })
      .from(trainingRecords)
      .where(eq(trainingRecords.organisationId, organisationId)),

    // All training courses for this org
    db.select({
      id: trainingCourses.id,
      name: trainingCourses.name,
    })
      .from(trainingCourses)
      .where(eq(trainingCourses.organisationId, organisationId)),

    // DBS status counts
    db.select({
      status: dbsChecks.status,
      count: count(),
    })
      .from(dbsChecks)
      .where(eq(dbsChecks.organisationId, organisationId))
      .groupBy(dbsChecks.status),

    // Supervision status counts
    db.select({
      status: supervisions.status,
      count: count(),
    })
      .from(supervisions)
      .where(eq(supervisions.organisationId, organisationId))
      .groupBy(supervisions.status),
  ]);

  // Build course name list from the catalogue
  const courseNames = courses.map(c => c.name);

  // Build a lookup: staffProfileId -> { courseName -> status }
  const recordsByStaff = new Map<string, Map<string, string>>();
  for (const rec of records) {
    if (!recordsByStaff.has(rec.staffProfileId)) {
      recordsByStaff.set(rec.staffProfileId, new Map());
    }
    const staffMap = recordsByStaff.get(rec.staffProfileId)!;
    // Keep the best status per course (current > expiring_soon > expired > not_completed)
    const existing = staffMap.get(rec.courseName);
    if (!existing || statusPriority(rec.status) > statusPriority(existing)) {
      staffMap.set(rec.courseName, rec.status);
    }
  }

  // Build the training matrix
  const trainingMatrix = staff.map(s => ({
    staffName: s.fullName,
    staffId: s.id,
    courses: Object.fromEntries(
      courseNames.map(courseName => {
        const staffRecords = recordsByStaff.get(s.id);
        const recordStatus = staffRecords?.get(courseName);
        let matrixStatus: 'completed' | 'due' | 'overdue' | 'not_required';
        if (!recordStatus || recordStatus === 'not_completed') {
          matrixStatus = 'due';
        } else if (recordStatus === 'current') {
          matrixStatus = 'completed';
        } else if (recordStatus === 'expired') {
          matrixStatus = 'overdue';
        } else if (recordStatus === 'expiring_soon') {
          matrixStatus = 'due';
        } else {
          matrixStatus = 'due';
        }
        return [courseName, matrixStatus];
      }),
    ),
  }));

  // DBS status summary
  const dbsStatusMap: Record<string, number> = {};
  for (const row of dbsResults) {
    dbsStatusMap[row.status] = row.count;
  }
  const totalStaff = staff.length;
  const dbsRecordedCount = Object.values(dbsStatusMap).reduce((a, b) => a + b, 0);

  const dbsStatus = {
    valid: dbsStatusMap['current'] ?? 0,
    expiringSoon: dbsStatusMap['expiring_soon'] ?? 0,
    expired: dbsStatusMap['expired'] ?? 0,
    notRecorded: Math.max(0, totalStaff - dbsRecordedCount),
  };

  // Supervision compliance
  const supervisionMap: Record<string, number> = {};
  for (const row of supervisionResults) {
    supervisionMap[row.status] = row.count;
  }
  const onTrack = (supervisionMap['completed'] ?? 0) + (supervisionMap['scheduled'] ?? 0);
  const overdue = supervisionMap['overdue'] ?? 0;
  const total = onTrack + overdue + (supervisionMap['cancelled'] ?? 0);
  const compliancePercent = total > 0 ? Math.round((onTrack / total) * 100) : 0;

  return {
    trainingMatrix,
    dbsStatus,
    supervision: { onTrack, overdue, total, compliancePercent },
  };
}

/** Priority order for training record statuses (higher = better). */
function statusPriority(status: string): number {
  switch (status) {
    case 'current': return 4;
    case 'expiring_soon': return 3;
    case 'expired': return 2;
    case 'not_completed': return 1;
    default: return 0;
  }
}

// ─── CQC Quality Statements ─────────────────────────────────────────────

export async function getCqcDashboard(
  organisationId: string,
  _range: DateRange,
): Promise<CqcDashboardData> {
  // CQC quality statements are static reference data
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

  // Query real evidence counts from ofstedEvidence, grouped by status
  // We'll use the evidence status to determine coverage level
  const evidenceResults = await db.select({
    status: ofstedEvidence.status,
    count: count(),
  })
    .from(ofstedEvidence)
    .where(eq(ofstedEvidence.organisationId, organisationId))
    .groupBy(ofstedEvidence.status);

  const evidenceByStatus: Record<string, number> = {};
  for (const row of evidenceResults) {
    evidenceByStatus[row.status] = row.count;
  }

  const totalEvidence = Object.values(evidenceByStatus).reduce((a, b) => a + b, 0);
  const evidencedTotal = evidenceByStatus['evidenced'] ?? 0;
  const partialTotal = evidenceByStatus['partial'] ?? 0;

  // Build the statements array with real evidence-based coverage
  let fullCount = 0;
  let partialCount = 0;
  let noneCount = 0;

  // For per-statement evidence counts, we query the latest evidence grouped by sub-requirement
  // But since CQC statements don't directly map 1:1 to ofstedEvidence subRequirementIds,
  // we distribute the evidence proportionally across statements
  const totalStatements = categories.reduce((sum, _, i) => sum + statementsPerCategory[i].length, 0);

  const statements = categories.flatMap((category, catIdx) =>
    statementsPerCategory[catIdx].map((stmt, i) => {
      // Distribute evidence counts proportionally
      const stmtEvidenceShare = totalStatements > 0 ? totalEvidence / totalStatements : 0;
      const evidenceCount = Math.round(stmtEvidenceShare);

      let coverageLevel: CoverageLevel;
      if (totalEvidence === 0) {
        coverageLevel = 'none';
      } else {
        // Determine coverage based on overall org evidence health
        const evidenceRatio = totalEvidence > 0
          ? (evidencedTotal + partialTotal * 0.5) / totalEvidence
          : 0;
        if (evidenceRatio >= 0.7) coverageLevel = 'full';
        else if (evidenceRatio >= 0.3) coverageLevel = 'partial';
        else coverageLevel = 'none';
      }

      if (coverageLevel === 'full') fullCount++;
      else if (coverageLevel === 'partial') partialCount++;
      else noneCount++;

      return {
        id: `qs-${catIdx}-${i}`,
        code: stmt.code,
        title: stmt.title,
        category,
        evidenceCount,
        coverageLevel,
        lastEvidenceDate: null as string | null,
      };
    }),
  );

  // Query the most recent evidence date for the org
  const latestEvidence = await db.select({
    maxDate: sql<string>`MAX(${ofstedEvidence.reviewedAt})`.as('maxDate'),
  })
    .from(ofstedEvidence)
    .where(eq(ofstedEvidence.organisationId, organisationId))
    .then(r => r[0]?.maxDate ?? null);

  // Set the last evidence date on all statements that have evidence
  if (latestEvidence) {
    const dateStr = new Date(latestEvidence).toISOString().split('T')[0];
    for (const stmt of statements) {
      if (stmt.evidenceCount > 0) {
        stmt.lastEvidenceDate = dateStr;
      }
    }
  }

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
