import { describe, it, expect } from 'vitest';
import {
  generateTimesheets,
  calculateActualHours,
  generatePayroll,
  payrollToCSV,
} from './generator';
import type { ShiftAssignment, TimesheetEntry } from './types';

const makeAssignment = (overrides: Partial<ShiftAssignment> = {}): ShiftAssignment => ({
  staffId: 'staff-1',
  staffName: 'Alice Smith',
  shiftDate: '2026-04-06',
  scheduledStart: '08:00',
  scheduledEnd: '16:00',
  shiftType: 'day',
  payRate: 12.5,
  ...overrides,
});

const makeEntry = (overrides: Partial<TimesheetEntry> = {}): TimesheetEntry => ({
  staffId: 'staff-1',
  staffName: 'Alice Smith',
  shiftDate: '2026-04-06',
  scheduledStart: '08:00',
  scheduledEnd: '16:00',
  actualStart: '07:55',
  actualEnd: '16:10',
  breakMinutes: 30,
  totalHours: 7.75,
  overtimeHours: 0,
  shiftType: 'day',
  payRate: 12.5,
  status: 'approved',
  ...overrides,
});

describe('generateTimesheets', () => {
  it('creates draft entries from shift assignments', () => {
    const assignments = [makeAssignment()];

    const entries = generateTimesheets(assignments);

    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('draft');
    expect(entries[0].actualStart).toBeNull();
    expect(entries[0].actualEnd).toBeNull();
    expect(entries[0].totalHours).toBe(8); // 08:00 to 16:00
  });

  it('handles overnight shifts', () => {
    const entries = generateTimesheets([
      makeAssignment({ scheduledStart: '22:00', scheduledEnd: '06:00' }),
    ]);

    expect(entries[0].totalHours).toBe(8);
  });

  it('processes multiple assignments', () => {
    const assignments = [
      makeAssignment({ staffId: 'staff-1', shiftDate: '2026-04-06' }),
      makeAssignment({ staffId: 'staff-2', staffName: 'Bob Jones', shiftDate: '2026-04-06' }),
    ];

    const entries = generateTimesheets(assignments);
    expect(entries).toHaveLength(2);
  });
});

describe('calculateActualHours', () => {
  it('calculates net hours minus breaks', () => {
    const entry = makeEntry();

    const updated = calculateActualHours(entry, '07:55', '16:10', 30);

    // 07:55 to 16:10 = 8.25h, minus 0.5h break = 7.75h
    expect(updated.totalHours).toBe(7.75);
    expect(updated.actualStart).toBe('07:55');
    expect(updated.actualEnd).toBe('16:10');
    expect(updated.breakMinutes).toBe(30);
  });

  it('calculates overtime when exceeding threshold', () => {
    const entry = makeEntry();

    const updated = calculateActualHours(entry, '06:00', '18:00', 30, 8);

    // 06:00 to 18:00 = 12h, minus 0.5h break = 11.5h, overtime = 3.5h
    expect(updated.totalHours).toBe(11.5);
    expect(updated.overtimeHours).toBe(3.5);
  });

  it('does not produce negative hours', () => {
    const entry = makeEntry();

    const updated = calculateActualHours(entry, '08:00', '08:15', 60);

    expect(updated.totalHours).toBe(0);
    expect(updated.overtimeHours).toBe(0);
  });
});

describe('generatePayroll', () => {
  it('aggregates hours and pay by staff member', () => {
    const entries: TimesheetEntry[] = [
      makeEntry({ totalHours: 8, overtimeHours: 0, payRate: 12 }),
      makeEntry({ shiftDate: '2026-04-07', totalHours: 8, overtimeHours: 1, payRate: 12 }),
    ];

    const payroll = generatePayroll(entries, '2026-04-06', '2026-04-12');

    expect(payroll.staffCount).toBe(1);
    expect(payroll.totalHours).toBe(16);
    expect(payroll.totalOvertimeHours).toBe(1);
    expect(payroll.rows[0].regularPay).toBe(180); // 15h * 12
    expect(payroll.rows[0].overtimePay).toBe(18); // 1h * 18 (12 * 1.5)
    expect(payroll.rows[0].totalPay).toBe(198);
  });

  it('handles multiple staff members', () => {
    const entries: TimesheetEntry[] = [
      makeEntry({ staffId: 'staff-1', staffName: 'Alice Smith', totalHours: 8, payRate: 12 }),
      makeEntry({ staffId: 'staff-2', staffName: 'Bob Jones', totalHours: 8, payRate: 15 }),
    ];

    const payroll = generatePayroll(entries, '2026-04-06', '2026-04-12');

    expect(payroll.staffCount).toBe(2);
    expect(payroll.rows).toHaveLength(2);
    // Sorted alphabetically
    expect(payroll.rows[0].staffName).toBe('Alice Smith');
    expect(payroll.rows[1].staffName).toBe('Bob Jones');
  });

  it('applies custom overtime multiplier', () => {
    const entries: TimesheetEntry[] = [
      makeEntry({ totalHours: 10, overtimeHours: 2, payRate: 10 }),
    ];

    const payroll = generatePayroll(entries, '2026-04-06', '2026-04-12', 2.0);

    expect(payroll.rows[0].overtimeRate).toBe(20); // 10 * 2.0
    expect(payroll.rows[0].overtimePay).toBe(40); // 2h * 20
  });
});

describe('payrollToCSV', () => {
  it('produces valid CSV with headers and data', () => {
    const entries: TimesheetEntry[] = [
      makeEntry({ totalHours: 8, overtimeHours: 0, payRate: 12 }),
    ];
    const payroll = generatePayroll(entries, '2026-04-06', '2026-04-12');

    const csv = payrollToCSV(payroll);
    const lines = csv.split('\n');

    expect(lines[0]).toBe(
      'Staff Name,Staff ID,Hours Worked,Overtime Hours,Shift Type,Pay Rate,Overtime Rate,Regular Pay,Overtime Pay,Total Pay',
    );
    expect(lines).toHaveLength(2); // header + 1 data row
    expect(lines[1]).toContain('"Alice Smith"');
    expect(lines[1]).toContain('staff-1');
  });

  it('escapes staff names with quotes', () => {
    const entries: TimesheetEntry[] = [
      makeEntry({ staffName: 'O\'Brien, Pat', totalHours: 8, payRate: 10 }),
    ];
    const payroll = generatePayroll(entries, '2026-04-06', '2026-04-12');

    const csv = payrollToCSV(payroll);
    expect(csv).toContain('"O\'Brien, Pat"');
  });
});
