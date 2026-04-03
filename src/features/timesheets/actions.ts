'use server';

import { and, asc, eq, gte, inArray, isNotNull, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { payrollExports, shiftAssignments, shiftPatterns, timesheets, users } from '@/lib/db/schema';
import { auditLog } from '@/lib/audit';
import { requirePermission } from '@/lib/rbac';
import type { ActionResult } from '@/types';
import {
  calculateActualHours,
  generatePayroll,
  generateTimesheets,
  payrollToCSV,
} from './generator';
import type { PayrollSummary, ShiftAssignment as GeneratedShiftAssignment, TimesheetEntry } from './types';

const DEFAULT_BASE_PAY_RATE = 12;
const ASSIGNABLE_SHIFT_STATUSES = ['assigned', 'confirmed', 'completed'] as const;
const APPROVABLE_TIMESHEET_STATUSES = ['draft', 'submitted'] as const;

export type TimesheetRecord = typeof timesheets.$inferSelect & {
  staffName: string | null;
};

function normaliseDate(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function withSeconds(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function trimTime(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function buildTimesheetKey(input: {
  staffId: string;
  shiftDate: string | Date;
  scheduledStart: string;
  scheduledEnd: string;
}): string {
  return [
    input.staffId,
    normaliseDate(input.shiftDate),
    trimTime(input.scheduledStart),
    trimTime(input.scheduledEnd),
  ].join('::');
}

function getPeriodBounds(startDate: string, endDate: string) {
  return {
    startsAt: new Date(`${startDate}T00:00:00.000Z`),
    endsAt: new Date(`${endDate}T23:59:59.999Z`),
  };
}

function mapShiftType(shiftType: string, shiftDate: string): GeneratedShiftAssignment['shiftType'] {
  if (shiftType === 'waking_night' || shiftType === 'sleep_in' || shiftType === 'on_call') {
    return 'night';
  }

  const day = new Date(`${shiftDate}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? 'weekend' : 'day';
}

function deriveTimesheetPayRate(multiplier: string | number | null | undefined): number {
  const parsedMultiplier = Number(multiplier ?? 1);
  if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
    return DEFAULT_BASE_PAY_RATE;
  }

  return Math.round(DEFAULT_BASE_PAY_RATE * parsedMultiplier * 100) / 100;
}

function buildPayrollExportFilename(startDate: string, endDate: string): string {
  return `payroll-${startDate}-to-${endDate}.csv`;
}

function toTimesheetEntry(record: TimesheetRecord): TimesheetEntry {
  const scheduledStart = trimTime(record.scheduledStart) ?? '00:00';
  const scheduledEnd = trimTime(record.scheduledEnd) ?? '00:00';
  const actualStart = trimTime(record.actualStart);
  const actualEnd = trimTime(record.actualEnd);
  const baseEntry: TimesheetEntry = {
    staffId: record.staffId,
    staffName: record.staffName ?? 'Unknown staff',
    shiftDate: normaliseDate(record.shiftDate),
    scheduledStart,
    scheduledEnd,
    actualStart,
    actualEnd,
    breakMinutes: record.breakMinutes,
    totalHours: record.totalHours ?? 0,
    overtimeHours: record.overtimeHours ?? 0,
    shiftType: record.shiftType,
    payRate: record.payRate ?? 0,
    status: record.status as TimesheetEntry['status'],
  };

  if (actualStart && actualEnd) {
    return calculateActualHours(baseEntry, actualStart, actualEnd, record.breakMinutes);
  }

  return baseEntry;
}

export async function listTimesheetsForPeriod({
  startDate,
  endDate,
  staffId,
}: {
  startDate: string;
  endDate: string;
  staffId?: string;
}): Promise<TimesheetRecord[]> {
  const { orgId } = await requirePermission('read', 'rota');

  const conditions = [
    eq(timesheets.organisationId, orgId),
    gte(timesheets.shiftDate, startDate),
    lte(timesheets.shiftDate, endDate),
  ];

  if (staffId) {
    conditions.push(eq(timesheets.staffId, staffId));
  }

  const rows = await db
    .select()
    .from(timesheets)
    .where(and(...conditions))
    .orderBy(asc(timesheets.shiftDate), asc(timesheets.scheduledStart));

  const staffIds = [...new Set(rows.map((row) => row.staffId))];
  const staffRows = staffIds.length > 0
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, staffIds))
    : [];

  const staffNameMap = new Map(staffRows.map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    ...row,
    staffName: staffNameMap.get(row.staffId) ?? null,
  }));
}

export async function getPayrollSummaryForPeriod({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<PayrollSummary> {
  const rows = await listTimesheetsForPeriod({ startDate, endDate });
  return generatePayroll(rows.map(toTimesheetEntry), startDate, endDate);
}

export async function generateTimesheetsForPeriod({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'rota');
    const { startsAt, endsAt } = getPeriodBounds(startDate, endDate);

    const assignments = await db
      .select({
        staffId: shiftAssignments.staffId,
        staffName: users.name,
        shiftDate: shiftAssignments.shiftDate,
        scheduledStart: shiftPatterns.startTime,
        scheduledEnd: shiftPatterns.endTime,
        shiftType: shiftPatterns.shiftType,
        payRateMultiplier: shiftPatterns.payRateMultiplier,
      })
      .from(shiftAssignments)
      .innerJoin(shiftPatterns, eq(shiftAssignments.shiftPatternId, shiftPatterns.id))
      .leftJoin(users, eq(shiftAssignments.staffId, users.id))
      .where(
        and(
          eq(shiftAssignments.organisationId, orgId),
          isNotNull(shiftAssignments.staffId),
          or(...ASSIGNABLE_SHIFT_STATUSES.map((status) => eq(shiftAssignments.status, status))),
          gte(shiftAssignments.shiftDate, startsAt),
          lte(shiftAssignments.shiftDate, endsAt),
        ),
      )
      .orderBy(asc(shiftAssignments.shiftDate), asc(shiftPatterns.startTime));

    if (assignments.length === 0) {
      return { success: true, data: { created: 0, skipped: 0 } };
    }

    const existing = await db
      .select({
        staffId: timesheets.staffId,
        shiftDate: timesheets.shiftDate,
        scheduledStart: timesheets.scheduledStart,
        scheduledEnd: timesheets.scheduledEnd,
      })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.organisationId, orgId),
          gte(timesheets.shiftDate, startDate),
          lte(timesheets.shiftDate, endDate),
        ),
      );

    const existingKeys = new Set(existing.map(buildTimesheetKey));

    const generatedAssignments: GeneratedShiftAssignment[] = assignments.map((assignment) => ({
      staffId: assignment.staffId!,
      staffName: assignment.staffName ?? 'Unknown staff',
      shiftDate: normaliseDate(assignment.shiftDate),
      scheduledStart: trimTime(assignment.scheduledStart) ?? '00:00',
      scheduledEnd: trimTime(assignment.scheduledEnd) ?? '00:00',
      shiftType: mapShiftType(assignment.shiftType, normaliseDate(assignment.shiftDate)),
      payRate: deriveTimesheetPayRate(assignment.payRateMultiplier),
    }));

    const generatedEntries = generateTimesheets(generatedAssignments);
    const entriesToInsert = generatedEntries.filter(
      (entry) => !existingKeys.has(buildTimesheetKey(entry)),
    );

    if (entriesToInsert.length > 0) {
      await db.insert(timesheets).values(
        entriesToInsert.map((entry) => ({
          organisationId: orgId,
          staffId: entry.staffId,
          shiftDate: entry.shiftDate,
          scheduledStart: withSeconds(entry.scheduledStart),
          scheduledEnd: withSeconds(entry.scheduledEnd),
          actualStart: null,
          actualEnd: null,
          breakMinutes: entry.breakMinutes,
          totalHours: entry.totalHours,
          overtimeHours: entry.overtimeHours,
          shiftType: entry.shiftType,
          payRate: entry.payRate,
          status: entry.status,
        })),
      );
    }

    await auditLog(
      'generate',
      'timesheet',
      `${startDate}:${endDate}`,
      {
        before: null,
        after: { created: entriesToInsert.length, skipped: generatedEntries.length - entriesToInsert.length },
      },
      { userId, organisationId: orgId },
    );

    return {
      success: true,
      data: {
        created: entriesToInsert.length,
        skipped: generatedEntries.length - entriesToInsert.length,
      },
    };
  } catch (error) {
    console.error('[generateTimesheetsForPeriod] Error:', error);
    return { success: false, error: 'Failed to generate timesheets' };
  }
}

export async function approveTimesheetsForPeriod({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<ActionResult<{ approved: number }>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'rota');

    const approvedRows = await db
      .update(timesheets)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timesheets.organisationId, orgId),
          gte(timesheets.shiftDate, startDate),
          lte(timesheets.shiftDate, endDate),
          or(...APPROVABLE_TIMESHEET_STATUSES.map((status) => eq(timesheets.status, status))),
        ),
      )
      .returning({ id: timesheets.id });

    await auditLog(
      'approve',
      'timesheet',
      `${startDate}:${endDate}`,
      {
        before: null,
        after: { approved: approvedRows.length },
      },
      { userId, organisationId: orgId },
    );

    return { success: true, data: { approved: approvedRows.length } };
  } catch (error) {
    console.error('[approveTimesheetsForPeriod] Error:', error);
    return { success: false, error: 'Failed to approve timesheets' };
  }
}

export async function exportPayrollCsvForPeriod({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<ActionResult<{ csv: string; fileName: string; summary: PayrollSummary }>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'rota');
    const summary = await getPayrollSummaryForPeriod({ startDate, endDate });

    if (summary.rows.length === 0) {
      return { success: false, error: 'No approved timesheets available for export' };
    }

    const csv = payrollToCSV(summary);
    const fileName = buildPayrollExportFilename(startDate, endDate);

    const [exportRecord] = await db
      .insert(payrollExports)
      .values({
        organisationId: orgId,
        generatedBy: userId,
        periodStart: startDate,
        periodEnd: endDate,
        staffCount: summary.staffCount,
        totalHours: summary.totalHours,
        totalAmount: summary.totalAmount,
        status: 'downloaded',
        downloaded: true,
      })
      .returning({ id: payrollExports.id });

    await auditLog(
      'export',
      'payroll_export',
      exportRecord.id,
      {
        before: null,
        after: {
          periodStart: startDate,
          periodEnd: endDate,
          staffCount: summary.staffCount,
          totalAmount: summary.totalAmount,
        },
      },
      { userId, organisationId: orgId },
    );

    return { success: true, data: { csv, fileName, summary } };
  } catch (error) {
    console.error('[exportPayrollCsvForPeriod] Error:', error);
    return { success: false, error: 'Failed to export payroll CSV' };
  }
}
