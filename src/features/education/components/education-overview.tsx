'use client';

/**
 * Education Overview — summary dashboard for a child's education record.
 * Shows current school, latest PEP status, attendance stats, exclusions,
 * PP+ spend, and SDQ trend chart.
 */

import { SdqTrendChart } from './sdq-trend-chart';
import type { SenStatusValues, AttendanceMarkValues } from './types';

// ── Types ─────────────────────────────────────────────────────────────

interface SchoolRecordSummary {
  id: string;
  schoolName: string;
  yearGroup?: string | null;
  senStatus: SenStatusValues;
  ehcpInPlace: boolean;
  designatedTeacherName?: string | null;
  isCurrent: boolean;
}

interface PepSummary {
  id: string;
  academicYear: string;
  term: string;
  status: string;
  meetingDate?: string | null;
}

interface AttendanceStat {
  mark: AttendanceMarkValues;
  count: number;
}

interface ExclusionSummary {
  id: string;
  exclusionType: string;
  reason: string;
  startDate: string;
  durationDays?: number | null;
}

interface PpPlusSummary {
  academicYear: string;
  totalAllocated: number;
  totalSpent: number;
}

interface SdqDataPoint {
  date: string;
  emotional: number;
  conduct: number;
  hyperactivity: number;
  peer: number;
  prosocial: number;
  totalDifficulties: number;
}

interface EducationOverviewProps {
  currentSchool?: SchoolRecordSummary | null;
  latestPep?: PepSummary | null;
  attendanceStats: AttendanceStat[];
  recentExclusions: ExclusionSummary[];
  ppPlusSummary?: PpPlusSummary | null;
  sdqTrend: SdqDataPoint[];
}

// ── Helpers ───────────────────────────────────────────────────────────

const SEN_LABELS: Record<string, string> = {
  none: 'None',
  sen_support: 'SEN Support',
  ehcp: 'EHCP',
  assessment_pending: 'Assessment Pending',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  reviewed: 'bg-purple-100 text-purple-700',
};

function formatPence(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? 'bg-gray-100 text-gray-700'}`}
    >
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────

export function EducationOverview({
  currentSchool,
  latestPep,
  attendanceStats,
  recentExclusions,
  ppPlusSummary,
  sdqTrend,
}: EducationOverviewProps) {
  const totalAttendanceDays = attendanceStats.reduce((a, s) => a + s.count, 0);
  const presentDays =
    attendanceStats.find((s) => s.mark === 'present')?.count ?? 0;
  const attendancePct = totalAttendanceDays > 0
    ? ((presentDays / totalAttendanceDays) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current school */}
        <StatCard title="Current School">
          {currentSchool ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {currentSchool.schoolName}
              </p>
              {currentSchool.yearGroup && (
                <p className="text-sm text-gray-500">
                  Year {currentSchool.yearGroup}
                </p>
              )}
              <div className="flex gap-2">
                <Badge
                  label={SEN_LABELS[currentSchool.senStatus] ?? currentSchool.senStatus}
                  className={
                    currentSchool.senStatus === 'ehcp'
                      ? 'bg-indigo-100 text-indigo-700'
                      : undefined
                  }
                />
                {currentSchool.ehcpInPlace && (
                  <Badge label="EHCP" className="bg-indigo-100 text-indigo-700" />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No school record</p>
          )}
        </StatCard>

        {/* Latest PEP */}
        <StatCard title="Latest PEP">
          {latestPep ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {latestPep.academicYear} &mdash;{' '}
                {latestPep.term.charAt(0).toUpperCase() + latestPep.term.slice(1)}
              </p>
              <Badge
                label={latestPep.status.charAt(0).toUpperCase() + latestPep.status.slice(1)}
                className={STATUS_STYLES[latestPep.status]}
              />
              {latestPep.meetingDate && (
                <p className="text-xs text-gray-500">
                  Meeting:{' '}
                  {new Date(latestPep.meetingDate).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No PEP recorded</p>
          )}
        </StatCard>

        {/* Attendance */}
        <StatCard title="Attendance">
          <p className="text-3xl font-bold text-gray-900">{attendancePct}%</p>
          <p className="text-xs text-gray-500">
            {presentDays} of {totalAttendanceDays} sessions present
          </p>
        </StatCard>

        {/* PP+ spend */}
        <StatCard title="Pupil Premium Plus">
          {ppPlusSummary ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {formatPence(ppPlusSummary.totalSpent)}{' '}
                <span className="text-sm font-normal text-gray-500">
                  of {formatPence(ppPlusSummary.totalAllocated)}
                </span>
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ppPlusSummary.totalAllocated > 0
                        ? (ppPlusSummary.totalSpent / ppPlusSummary.totalAllocated) * 100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">{ppPlusSummary.academicYear}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No PP+ records</p>
          )}
        </StatCard>
      </div>

      {/* Exclusions alert */}
      {recentExclusions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800">
            Recent Exclusions ({recentExclusions.length})
          </h3>
          <div className="mt-2 space-y-2">
            {recentExclusions.map((exc) => (
              <div key={exc.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-amber-900">
                    {exc.exclusionType === 'fixed_term' ? 'Fixed Term' : 'Permanent'}
                  </span>
                  {' - '}
                  <span className="text-amber-700">{exc.reason}</span>
                </div>
                <div className="text-xs text-amber-600">
                  {new Date(exc.startDate).toLocaleDateString('en-GB')}
                  {exc.durationDays != null && ` (${exc.durationDays} days)`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SDQ Trend Chart */}
      <SdqTrendChart data={sdqTrend} />
    </div>
  );
}

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
        {title}
      </h4>
      {children}
    </div>
  );
}
