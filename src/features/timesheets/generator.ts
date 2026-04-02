/**
 * Timesheet generation and payroll export logic.
 *
 * - Auto-generates timesheet entries from shift assignments.
 * - Calculates actual hours, breaks, and overtime.
 * - Generates payroll CSV data.
 */
import type {
  ShiftAssignment,
  TimesheetEntry,
  PayrollRow,
  PayrollSummary,
} from './types';

const PAYROLL_INCLUDED_STATUSES: ReadonlySet<TimesheetEntry['status']> = new Set([
  'approved',
  'paid',
]);

/** Calculate duration in hours between two HH:MM time strings. */
function timeDiffHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh - sh + (em - sm) / 60;
  if (diff <= 0) diff += 24; // overnight
  return diff;
}

function escapeCSVCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/**
 * Generate timesheet entries from shift assignments.
 * Initially created as drafts with no actual times (to be filled in by staff).
 */
export function generateTimesheets(assignments: ShiftAssignment[]): TimesheetEntry[] {
  return assignments.map((a) => {
    const scheduledHours = timeDiffHours(a.scheduledStart, a.scheduledEnd);

    return {
      staffId: a.staffId,
      staffName: a.staffName,
      shiftDate: a.shiftDate,
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
      actualStart: null,
      actualEnd: null,
      breakMinutes: 0,
      totalHours: scheduledHours,
      overtimeHours: 0,
      shiftType: a.shiftType,
      payRate: a.payRate,
      status: 'draft',
    };
  });
}

/**
 * Calculate total hours from actual start/end times and breaks.
 * Returns updated timesheet entry with calculated fields.
 */
export function calculateActualHours(
  entry: TimesheetEntry,
  actualStart: string,
  actualEnd: string,
  breakMinutes: number,
  overtimeThresholdHours: number = 8,
): TimesheetEntry {
  const rawHours = timeDiffHours(actualStart, actualEnd);
  const netHours = Math.max(0, rawHours - breakMinutes / 60);
  const overtime = Math.max(0, netHours - overtimeThresholdHours);

  return {
    ...entry,
    actualStart,
    actualEnd,
    breakMinutes,
    totalHours: Math.round(netHours * 100) / 100,
    overtimeHours: Math.round(overtime * 100) / 100,
  };
}

/**
 * Generate payroll data from approved timesheet entries.
 *
 * Aggregates by staff member across all their shifts in the period.
 * Overtime rate defaults to 1.5x base pay.
 */
export function generatePayroll(
  timesheetEntries: TimesheetEntry[],
  periodStart: string,
  periodEnd: string,
  overtimeMultiplier: number = 1.5,
): PayrollSummary {
  const exportableEntries = timesheetEntries.filter((entry) =>
    PAYROLL_INCLUDED_STATUSES.has(entry.status),
  );

  // Group entries by staff member
  const byStaff = new Map<string, TimesheetEntry[]>();
  for (const entry of exportableEntries) {
    const existing = byStaff.get(entry.staffId) ?? [];
    existing.push(entry);
    byStaff.set(entry.staffId, existing);
  }

  const rows: PayrollRow[] = [];

  for (const [staffId, entries] of byStaff) {
    const staffName = entries[0].staffName;
    const hoursWorked = entries.reduce((sum, e) => sum + e.totalHours, 0);
    const overtimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
    const regularHours = hoursWorked - overtimeHours;

    // Use weighted average pay rate across shifts
    const totalRateHours = entries.reduce((sum, e) => sum + e.payRate * e.totalHours, 0);
    const avgPayRate = hoursWorked > 0 ? totalRateHours / hoursWorked : 0;
    const overtimeRate = avgPayRate * overtimeMultiplier;

    const regularPay = Math.round(regularHours * avgPayRate * 100) / 100;
    const overtimePay = Math.round(overtimeHours * overtimeRate * 100) / 100;

    // Determine predominant shift type
    const typeCounts = new Map<string, number>();
    for (const e of entries) {
      typeCounts.set(e.shiftType, (typeCounts.get(e.shiftType) ?? 0) + e.totalHours);
    }
    const predominantType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'day';

    rows.push({
      staffName,
      staffId,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      shiftType: predominantType,
      payRate: Math.round(avgPayRate * 100) / 100,
      overtimeRate: Math.round(overtimeRate * 100) / 100,
      regularPay,
      overtimePay,
      totalPay: Math.round((regularPay + overtimePay) * 100) / 100,
    });
  }

  rows.sort((a, b) => a.staffName.localeCompare(b.staffName));

  return {
    periodStart,
    periodEnd,
    staffCount: rows.length,
    totalHours: Math.round(rows.reduce((sum, r) => sum + r.hoursWorked, 0) * 100) / 100,
    totalOvertimeHours: Math.round(rows.reduce((sum, r) => sum + r.overtimeHours, 0) * 100) / 100,
    totalAmount: Math.round(rows.reduce((sum, r) => sum + r.totalPay, 0) * 100) / 100,
    rows,
  };
}

/**
 * Convert payroll data to CSV format.
 * Columns: Staff Name, Staff ID, Hours Worked, Overtime Hours, Shift Type,
 *          Pay Rate, Overtime Rate, Regular Pay, Overtime Pay, Total Pay
 */
export function payrollToCSV(summary: PayrollSummary): string {
  const headers = [
    'Staff Name',
    'Staff ID',
    'Hours Worked',
    'Overtime Hours',
    'Shift Type',
    'Pay Rate',
    'Overtime Rate',
    'Regular Pay',
    'Overtime Pay',
    'Total Pay',
  ];

  const rows = summary.rows.map((r) =>
    [
      escapeCSVCell(r.staffName),
      r.staffId,
      r.hoursWorked.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.shiftType,
      r.payRate.toFixed(2),
      r.overtimeRate.toFixed(2),
      r.regularPay.toFixed(2),
      r.overtimePay.toFixed(2),
      r.totalPay.toFixed(2),
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}
