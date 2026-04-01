/**
 * Tests for the DBS tracking alert engine.
 *
 * Validates:
 * - daysUntilRecheck calculation
 * - isDbsExpired helper
 * - isDbsExpiringSoon helper
 * - isDbsRedAlert helper
 * - getDbsAlertSeverity
 * - getDbsCheckAlerts
 * - getAlertsForDbsChecks
 * - getHighestDbsSeverity
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  daysUntilRecheck,
  isDbsExpired,
  isDbsExpiringSoon,
  isDbsRedAlert,
  getDbsAlertSeverity,
  getDbsCheckAlerts,
  getAlertsForDbsChecks,
  getHighestDbsSeverity,
} from '@/features/dbs-tracking/alerts';

// ---------------------------------------------------------------------------
// Helper: create a date string offset from today
// ---------------------------------------------------------------------------

function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// daysUntilRecheck
// ---------------------------------------------------------------------------

describe('daysUntilRecheck', () => {
  it('returns positive days for a future recheck date', () => {
    const days = daysUntilRecheck(dateFromNow(10));
    expect(days).toBe(10);
  });

  it('returns negative days for a past recheck date', () => {
    const days = daysUntilRecheck(dateFromNow(-5));
    // Allow -4 or -5 due to time-of-day rounding with Math.ceil
    expect(days).toBeLessThanOrEqual(-4);
    expect(days).toBeGreaterThanOrEqual(-5);
  });

  it('returns 0 for today', () => {
    const days = daysUntilRecheck(dateFromNow(0));
    expect(days).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isDbsExpired
// ---------------------------------------------------------------------------

describe('isDbsExpired', () => {
  it('returns true for a past recheck date', () => {
    expect(isDbsExpired(dateFromNow(-1))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isDbsExpired(dateFromNow(0))).toBe(false);
  });

  it('returns false for a future recheck date', () => {
    expect(isDbsExpired(dateFromNow(30))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDbsExpiringSoon
// ---------------------------------------------------------------------------

describe('isDbsExpiringSoon', () => {
  it('returns true for a date within 30 days', () => {
    expect(isDbsExpiringSoon(dateFromNow(15))).toBe(true);
  });

  it('returns true for a date exactly 30 days out', () => {
    expect(isDbsExpiringSoon(dateFromNow(30))).toBe(true);
  });

  it('returns true for today', () => {
    expect(isDbsExpiringSoon(dateFromNow(0))).toBe(true);
  });

  it('returns false for a date 31 days out', () => {
    expect(isDbsExpiringSoon(dateFromNow(31))).toBe(false);
  });

  it('returns false for a past date (already expired)', () => {
    expect(isDbsExpiringSoon(dateFromNow(-1))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDbsRedAlert
// ---------------------------------------------------------------------------

describe('isDbsRedAlert', () => {
  it('returns true for an expired DBS check', () => {
    expect(isDbsRedAlert(dateFromNow(-5))).toBe(true);
  });

  it('returns true for a DBS check expiring in 7 days', () => {
    expect(isDbsRedAlert(dateFromNow(7))).toBe(true);
  });

  it('returns true for a DBS check expiring in 3 days', () => {
    expect(isDbsRedAlert(dateFromNow(3))).toBe(true);
  });

  it('returns false for a DBS check expiring in 8 days', () => {
    expect(isDbsRedAlert(dateFromNow(8))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDbsAlertSeverity
// ---------------------------------------------------------------------------

describe('getDbsAlertSeverity', () => {
  it('returns "red" for expired checks', () => {
    expect(getDbsAlertSeverity(dateFromNow(-5))).toBe('red');
  });

  it('returns "red" for checks expiring within 7 days', () => {
    expect(getDbsAlertSeverity(dateFromNow(5))).toBe('red');
  });

  it('returns "amber" for checks expiring within 8-30 days', () => {
    expect(getDbsAlertSeverity(dateFromNow(20))).toBe('amber');
  });

  it('returns null for checks more than 30 days out', () => {
    expect(getDbsAlertSeverity(dateFromNow(60))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getDbsCheckAlerts
// ---------------------------------------------------------------------------

describe('getDbsCheckAlerts', () => {
  const baseCheck = {
    id: 'check-1',
    staffProfileId: 'staff-1',
    certificateNumber: '001234567890',
    staffName: 'John Doe',
  };

  it('returns a red alert for an expired check', () => {
    const alerts = getDbsCheckAlerts({
      ...baseCheck,
      recheckDate: dateFromNow(-10),
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('red');
    expect(alerts[0]?.title).toContain('DBS expired');
    expect(alerts[0]?.message).toContain('expired');
  });

  it('returns a red alert for a check expiring in 5 days', () => {
    const alerts = getDbsCheckAlerts({
      ...baseCheck,
      recheckDate: dateFromNow(5),
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('red');
    expect(alerts[0]?.title).toContain('DBS expiring');
  });

  it('returns an amber alert for a check expiring in 20 days', () => {
    const alerts = getDbsCheckAlerts({
      ...baseCheck,
      recheckDate: dateFromNow(20),
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('amber');
    expect(alerts[0]?.title).toContain('DBS recheck approaching');
  });

  it('returns no alerts for a check 60 days out', () => {
    const alerts = getDbsCheckAlerts({
      ...baseCheck,
      recheckDate: dateFromNow(60),
    });
    expect(alerts).toHaveLength(0);
  });

  it('includes staff name in alert messages', () => {
    const alerts = getDbsCheckAlerts({
      ...baseCheck,
      recheckDate: dateFromNow(-1),
    });
    expect(alerts[0]?.message).toContain('John Doe');
  });

  it('uses fallback when staffName is undefined', () => {
    const alerts = getDbsCheckAlerts({
      id: 'check-2',
      staffProfileId: 'staff-2',
      certificateNumber: '999',
      recheckDate: dateFromNow(-1),
    });
    expect(alerts[0]?.title).toContain('Staff member');
  });
});

// ---------------------------------------------------------------------------
// getAlertsForDbsChecks
// ---------------------------------------------------------------------------

describe('getAlertsForDbsChecks', () => {
  it('returns alerts for all checks that need them', () => {
    const checks = [
      {
        id: 'c1',
        staffProfileId: 's1',
        certificateNumber: '001',
        recheckDate: dateFromNow(-5),
      },
      {
        id: 'c2',
        staffProfileId: 's2',
        certificateNumber: '002',
        recheckDate: dateFromNow(15),
      },
      {
        id: 'c3',
        staffProfileId: 's3',
        certificateNumber: '003',
        recheckDate: dateFromNow(60),
      },
    ];
    const alerts = getAlertsForDbsChecks(checks);
    // c1 = red, c2 = amber, c3 = none
    expect(alerts).toHaveLength(2);
  });

  it('returns empty array for no checks', () => {
    expect(getAlertsForDbsChecks([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getHighestDbsSeverity
// ---------------------------------------------------------------------------

describe('getHighestDbsSeverity', () => {
  it('returns null for empty alerts', () => {
    expect(getHighestDbsSeverity([])).toBeNull();
  });

  it('returns "red" if any red alert exists', () => {
    const alerts = [
      {
        severity: 'amber' as const,
        title: '',
        message: '',
        dbsCheckId: '1',
        staffProfileId: '1',
        daysUntilExpiry: 20,
      },
      {
        severity: 'red' as const,
        title: '',
        message: '',
        dbsCheckId: '2',
        staffProfileId: '2',
        daysUntilExpiry: -5,
      },
    ];
    expect(getHighestDbsSeverity(alerts)).toBe('red');
  });

  it('returns "amber" if only amber alerts exist', () => {
    const alerts = [
      {
        severity: 'amber' as const,
        title: '',
        message: '',
        dbsCheckId: '1',
        staffProfileId: '1',
        daysUntilExpiry: 20,
      },
    ];
    expect(getHighestDbsSeverity(alerts)).toBe('amber');
  });
});
