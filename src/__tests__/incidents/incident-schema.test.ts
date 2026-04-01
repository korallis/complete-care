/**
 * Tests for incident reporting schema, constants, workflow transitions,
 * notification triggers, severity logic, and RBAC.
 *
 * Validates:
 * - incidents table has required columns
 * - Zod validation schemas work correctly
 * - Severity classification and labels
 * - Status workflow transitions
 * - Duty of Candour triggers
 * - Auto-notification triggers
 * - CQC/Ofsted notifiable flagging
 * - RBAC permissions for incidents resource
 */

import { describe, it, expect } from 'vitest';
import { incidents } from '@/lib/db/schema/incidents';
import {
  createIncidentSchema,
  updateInvestigationSchema,
  closeIncidentSchema,
  incidentFilterSchema,
  getSeverityVariant,
  formatIncidentDate,
  formatIncidentDateTime,
} from '@/features/incidents/schema';
import {
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  INCIDENT_STATUSES,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  INCIDENT_LOCATIONS,
  LOCATION_LABELS,
  REGULATORY_BODIES,
  REGULATORY_BODY_LABELS,
  triggersDutyOfCandour,
  requiresAutoNotification,
  isPotentiallyNotifiable,
  TREND_PERIODS,
  trendPeriodToDays,
} from '@/features/incidents/constants';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// incidents table schema
// ---------------------------------------------------------------------------

describe('incidents table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(incidents);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('reportedById');
    expect(columns).toContain('reportedByName');
    expect(columns).toContain('dateTime');
    expect(columns).toContain('location');
    expect(columns).toContain('description');
    expect(columns).toContain('immediateActions');
    expect(columns).toContain('severity');
    expect(columns).toContain('status');
    expect(columns).toContain('involvedPersons');
    expect(columns).toContain('witnesses');
    expect(columns).toContain('injuryDetails');
    expect(columns).toContain('linkedBodyMapEntryIds');
    expect(columns).toContain('investigatorId');
    expect(columns).toContain('investigationNotes');
    expect(columns).toContain('outcome');
    expect(columns).toContain('closedAt');
    expect(columns).toContain('closedById');
    expect(columns).toContain('isNotifiable');
    expect(columns).toContain('regulatoryBody');
    expect(columns).toContain('dutyOfCandourTriggered');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(incidents);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createIncidentSchema
// ---------------------------------------------------------------------------

describe('createIncidentSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    dateTime: '2026-04-01T14:30',
    location: 'bedroom',
    description: 'Person found on the floor next to the bed after a fall.',
    severity: 'moderate' as const,
  };

  it('validates a valid input', () => {
    const result = createIncidentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const result = createIncidentSchema.safeParse({
      dateTime: validInput.dateTime,
      location: validInput.location,
      description: validInput.description,
      severity: validInput.severity,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid personId', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing dateTime', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      dateTime: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing location', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      location: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 10 characters', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      description: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      severity: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid severity levels', () => {
    for (const severity of SEVERITY_LEVELS) {
      const result = createIncidentSchema.safeParse({
        ...validInput,
        severity,
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults involvedPersons to empty array', () => {
    const result = createIncidentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.involvedPersons).toEqual([]);
    }
  });

  it('defaults witnesses to empty array', () => {
    const result = createIncidentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.witnesses).toEqual([]);
    }
  });

  it('defaults injuryDetails to empty array', () => {
    const result = createIncidentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.injuryDetails).toEqual([]);
    }
  });

  it('validates involved persons', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      involvedPersons: [
        { name: 'John Doe', role: 'staff' },
        { name: 'Jane Smith', role: 'resident' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects involved person without name', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      involvedPersons: [{ name: '', role: 'staff' }],
    });
    expect(result.success).toBe(false);
  });

  it('validates witnesses with statements', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      witnesses: [
        {
          name: 'John Doe',
          role: 'staff',
          statement: 'I saw the person fall.',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates injury details', () => {
    const result = createIncidentSchema.safeParse({
      ...validInput,
      injuryDetails: [
        {
          bodyRegion: 'Left arm',
          description: 'Bruise on left forearm',
          severity: 'minor',
          treatment: 'Ice pack applied',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('defaults isNotifiable to no', () => {
    const result = createIncidentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isNotifiable).toBe('no');
    }
  });
});

// ---------------------------------------------------------------------------
// updateInvestigationSchema
// ---------------------------------------------------------------------------

describe('updateInvestigationSchema', () => {
  it('validates with just investigation notes', () => {
    const result = updateInvestigationSchema.safeParse({
      investigationNotes: 'Reviewed CCTV footage.',
    });
    expect(result.success).toBe(true);
  });

  it('validates with status transition', () => {
    const result = updateInvestigationSchema.safeParse({
      status: 'investigating',
    });
    expect(result.success).toBe(true);
  });

  it('validates with outcome', () => {
    const result = updateInvestigationSchema.safeParse({
      outcome: 'No further action required.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateInvestigationSchema.safeParse({
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('validates notifiable flag change', () => {
    const result = updateInvestigationSchema.safeParse({
      isNotifiable: 'yes',
      regulatoryBody: 'CQC',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// closeIncidentSchema
// ---------------------------------------------------------------------------

describe('closeIncidentSchema', () => {
  it('validates with outcome', () => {
    const result = closeIncidentSchema.safeParse({
      outcome: 'Investigation complete. Risk mitigations in place.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty outcome', () => {
    const result = closeIncidentSchema.safeParse({
      outcome: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing outcome', () => {
    const result = closeIncidentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// incidentFilterSchema
// ---------------------------------------------------------------------------

describe('incidentFilterSchema', () => {
  it('validates empty filters', () => {
    const result = incidentFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('validates with severity filter', () => {
    const result = incidentFilterSchema.safeParse({
      severity: 'serious',
    });
    expect(result.success).toBe(true);
  });

  it('validates with status filter', () => {
    const result = incidentFilterSchema.safeParse({
      status: 'investigating',
    });
    expect(result.success).toBe(true);
  });

  it('validates date range filter', () => {
    const result = incidentFilterSchema.safeParse({
      dateFrom: '2026-01-01',
      dateTo: '2026-03-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = incidentFilterSchema.safeParse({
      dateFrom: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('severity constants', () => {
  it('defines 4 severity levels', () => {
    expect(SEVERITY_LEVELS).toHaveLength(4);
    expect(SEVERITY_LEVELS).toEqual(['minor', 'moderate', 'serious', 'death']);
  });

  it('all severity levels have labels', () => {
    for (const level of SEVERITY_LEVELS) {
      expect(SEVERITY_LABELS[level]).toBeTruthy();
    }
  });
});

describe('status constants', () => {
  it('defines 5 workflow statuses', () => {
    expect(INCIDENT_STATUSES).toHaveLength(5);
    expect(INCIDENT_STATUSES).toEqual([
      'reported',
      'under_review',
      'investigating',
      'resolved',
      'closed',
    ]);
  });

  it('all statuses have labels', () => {
    for (const status of INCIDENT_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe('location constants', () => {
  it('defines common incident locations', () => {
    expect(INCIDENT_LOCATIONS.length).toBeGreaterThan(0);
  });

  it('all locations have labels', () => {
    for (const loc of INCIDENT_LOCATIONS) {
      expect(LOCATION_LABELS[loc]).toBeTruthy();
    }
  });

  it('includes "other" for custom locations', () => {
    expect(INCIDENT_LOCATIONS).toContain('other');
  });
});

describe('regulatory body constants', () => {
  it('defines regulatory bodies', () => {
    expect(REGULATORY_BODIES).toContain('CQC');
    expect(REGULATORY_BODIES).toContain('Ofsted');
    expect(REGULATORY_BODIES).toContain('both');
    expect(REGULATORY_BODIES).toContain('none');
  });

  it('all regulatory bodies have labels', () => {
    for (const body of REGULATORY_BODIES) {
      expect(REGULATORY_BODY_LABELS[body]).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Workflow transitions
// ---------------------------------------------------------------------------

describe('workflow transitions', () => {
  it('reported can transition to under_review', () => {
    expect(STATUS_TRANSITIONS.reported).toContain('under_review');
  });

  it('under_review can transition to investigating or resolved', () => {
    expect(STATUS_TRANSITIONS.under_review).toContain('investigating');
    expect(STATUS_TRANSITIONS.under_review).toContain('resolved');
  });

  it('investigating can transition to resolved', () => {
    expect(STATUS_TRANSITIONS.investigating).toContain('resolved');
  });

  it('resolved can transition to closed', () => {
    expect(STATUS_TRANSITIONS.resolved).toContain('closed');
  });

  it('closed has no transitions (terminal state)', () => {
    expect(STATUS_TRANSITIONS.closed).toHaveLength(0);
  });

  it('reported CANNOT skip to investigating', () => {
    expect(STATUS_TRANSITIONS.reported).not.toContain('investigating');
  });

  it('reported CANNOT skip to closed', () => {
    expect(STATUS_TRANSITIONS.reported).not.toContain('closed');
  });

  it('investigating CANNOT go back to under_review', () => {
    expect(STATUS_TRANSITIONS.investigating).not.toContain('under_review');
  });
});

// ---------------------------------------------------------------------------
// Duty of Candour triggers
// ---------------------------------------------------------------------------

describe('Duty of Candour', () => {
  it('triggers on serious severity', () => {
    expect(triggersDutyOfCandour('serious')).toBe(true);
  });

  it('triggers on death', () => {
    expect(triggersDutyOfCandour('death')).toBe(true);
  });

  it('does NOT trigger on minor severity', () => {
    expect(triggersDutyOfCandour('minor')).toBe(false);
  });

  it('does NOT trigger on moderate severity', () => {
    expect(triggersDutyOfCandour('moderate')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Auto-notification triggers
// ---------------------------------------------------------------------------

describe('auto-notification triggers', () => {
  it('serious incidents require auto-notification', () => {
    expect(requiresAutoNotification('serious')).toBe(true);
  });

  it('death incidents require auto-notification', () => {
    expect(requiresAutoNotification('death')).toBe(true);
  });

  it('minor incidents do NOT require auto-notification', () => {
    expect(requiresAutoNotification('minor')).toBe(false);
  });

  it('moderate incidents do NOT require auto-notification', () => {
    expect(requiresAutoNotification('moderate')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Notifiable incident flagging
// ---------------------------------------------------------------------------

describe('notifiable incident flagging', () => {
  it('serious is potentially notifiable', () => {
    expect(isPotentiallyNotifiable('serious')).toBe(true);
  });

  it('death is potentially notifiable', () => {
    expect(isPotentiallyNotifiable('death')).toBe(true);
  });

  it('minor is NOT potentially notifiable', () => {
    expect(isPotentiallyNotifiable('minor')).toBe(false);
  });

  it('moderate is NOT potentially notifiable', () => {
    expect(isPotentiallyNotifiable('moderate')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Trend periods
// ---------------------------------------------------------------------------

describe('trend periods', () => {
  it('defines 4 periods', () => {
    expect(TREND_PERIODS).toHaveLength(4);
  });

  it('trendPeriodToDays returns correct days', () => {
    expect(trendPeriodToDays('7d')).toBe(7);
    expect(trendPeriodToDays('30d')).toBe(30);
    expect(trendPeriodToDays('90d')).toBe(90);
    expect(trendPeriodToDays('365d')).toBe(365);
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('helper functions', () => {
  describe('getSeverityVariant', () => {
    it('returns secondary for minor', () => {
      expect(getSeverityVariant('minor')).toBe('secondary');
    });

    it('returns outline for moderate', () => {
      expect(getSeverityVariant('moderate')).toBe('outline');
    });

    it('returns destructive for serious', () => {
      expect(getSeverityVariant('serious')).toBe('destructive');
    });

    it('returns destructive for death', () => {
      expect(getSeverityVariant('death')).toBe('destructive');
    });

    it('returns outline for unknown', () => {
      expect(getSeverityVariant('unknown')).toBe('outline');
    });
  });

  describe('formatIncidentDate', () => {
    it('formats a date string', () => {
      const result = formatIncidentDate('2026-04-01');
      expect(result).toContain('Apr');
      expect(result).toContain('2026');
    });

    it('formats a Date object', () => {
      const result = formatIncidentDate(new Date('2026-04-01'));
      expect(result).toContain('Apr');
    });
  });

  describe('formatIncidentDateTime', () => {
    it('formats date and time', () => {
      const result = formatIncidentDateTime('2026-04-01T14:30:00');
      expect(result).toContain('Apr');
      expect(result).toContain('2026');
    });
  });
});

// ---------------------------------------------------------------------------
// RBAC — incidents resource
// ---------------------------------------------------------------------------

describe('RBAC — incidents resource', () => {
  it('all roles can read incidents', () => {
    for (const role of [
      'owner',
      'admin',
      'manager',
      'senior_carer',
      'carer',
      'viewer',
    ] as const) {
      expect(hasPermission(role, 'read', 'incidents')).toBe(true);
    }
  });

  it('owner can create incidents', () => {
    expect(hasPermission('owner', 'create', 'incidents')).toBe(true);
  });

  it('carer can create incidents', () => {
    expect(hasPermission('carer', 'create', 'incidents')).toBe(true);
  });

  it('viewer CANNOT create incidents', () => {
    expect(hasPermission('viewer', 'create', 'incidents')).toBe(false);
  });

  it('manager can update incidents', () => {
    expect(hasPermission('manager', 'update', 'incidents')).toBe(true);
  });

  it('senior_carer can update incidents', () => {
    expect(hasPermission('senior_carer', 'update', 'incidents')).toBe(true);
  });

  it('carer CANNOT update incidents', () => {
    expect(hasPermission('carer', 'update', 'incidents')).toBe(false);
  });

  it('viewer CANNOT update incidents', () => {
    expect(hasPermission('viewer', 'update', 'incidents')).toBe(false);
  });

  it('owner can export incidents', () => {
    expect(hasPermission('owner', 'export', 'incidents')).toBe(true);
  });

  it('carer CANNOT export incidents', () => {
    expect(hasPermission('carer', 'export', 'incidents')).toBe(false);
  });
});
