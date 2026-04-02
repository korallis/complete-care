/**
 * Types for timesheet generation and payroll export.
 */

/** A shift assignment from which a timesheet entry is generated. */
export interface ShiftAssignment {
  staffId: string;
  staffName: string;
  shiftDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  shiftType: 'day' | 'night' | 'weekend' | 'bank_holiday';
  payRate: number;
}

/** A timesheet entry with actual hours tracked. */
export interface TimesheetEntry {
  staffId: string;
  staffName: string;
  shiftDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  breakMinutes: number;
  totalHours: number;
  overtimeHours: number;
  shiftType: string;
  payRate: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
}

/** A row in the payroll CSV export. */
export interface PayrollRow {
  staffName: string;
  staffId: string;
  hoursWorked: number;
  overtimeHours: number;
  shiftType: string;
  payRate: number;
  overtimeRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

/** Summary of a payroll export. */
export interface PayrollSummary {
  periodStart: string;
  periodEnd: string;
  staffCount: number;
  totalHours: number;
  totalOvertimeHours: number;
  totalAmount: number;
  rows: PayrollRow[];
}
