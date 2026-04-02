/**
 * Dashboard data types for Complete Care operational dashboards.
 * All metrics are computed server-side via aggregation queries.
 */

// ─── Date Range ──────────────────────────────────────────────────────────

export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from: Date;
  to: Date;
}

// ─── KPI Cards ───────────────────────────────────────────────────────────

export interface KpiMetric {
  label: string;
  value: number;
  previousValue?: number;
  /** Formatted string e.g. "87%" or "142" */
  formatted: string;
  /** Change direction for trend indicator */
  trend: 'up' | 'down' | 'flat';
  /** Positive or negative sentiment of the trend */
  trendSentiment: 'positive' | 'negative' | 'neutral';
  /** Percentage change from previous period */
  changePercent: number;
}

// ─── Main Operational Dashboard ──────────────────────────────────────────

export interface OperationalDashboardData {
  activePersons: KpiMetric;
  staffComplianceRate: KpiMetric;
  overdueCarePlanReviews: KpiMetric;
  medicationIncidents: KpiMetric;
  upcomingDbsRenewals: KpiMetric;
  trainingCompliance: KpiMetric;
  openSafeguardingConcerns: KpiMetric;
}

// ─── Domain Dashboards ───────────────────────────────────────────────────

export interface DomiciliaryDashboardData {
  visitCompletionRate: KpiMetric;
  missedVisitsToday: KpiMetric;
  travelTimeAverage: KpiMetric;
}

export interface SupportedLivingDashboardData {
  goalProgress: { red: number; amber: number; green: number };
  restrictivePracticeTrend: TrendPoint[];
}

export interface ChildrensDashboardData {
  ofstedReadinessScore: KpiMetric;
  missingEpisodes: KpiMetric;
  restraintCountTrend: TrendPoint[];
}

// ─── Trend Charts ────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendSeries {
  name: string;
  data: TrendPoint[];
  color?: string;
}

// ─── Staff Compliance ────────────────────────────────────────────────────

export interface TrainingMatrixRow {
  staffName: string;
  staffId: string;
  courses: Record<string, 'completed' | 'due' | 'overdue' | 'not_required'>;
}

export interface DbsStatusSummary {
  valid: number;
  expiringSoon: number;
  expired: number;
  notRecorded: number;
}

export interface SupervisionCompliance {
  onTrack: number;
  overdue: number;
  total: number;
  compliancePercent: number;
}

export interface StaffComplianceDashboardData {
  trainingMatrix: TrainingMatrixRow[];
  dbsStatus: DbsStatusSummary;
  supervision: SupervisionCompliance;
}

// ─── CQC Quality Statement Mapping ──────────────────────────────────────

export type CoverageLevel = 'full' | 'partial' | 'none';

export interface QualityStatement {
  id: string;
  code: string;
  title: string;
  category: string;
  evidenceCount: number;
  coverageLevel: CoverageLevel;
  lastEvidenceDate: string | null;
}

export interface CqcDashboardData {
  statements: QualityStatement[];
  overallCoverage: {
    full: number;
    partial: number;
    none: number;
    totalStatements: number;
    coveragePercent: number;
  };
}
