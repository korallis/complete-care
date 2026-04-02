/**
 * EVV database schema tests — verify table structure and column properties.
 * VAL-EVV-003: Schema structure validation.
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  evvVisits,
  evvCheckEvents,
  evvGeofenceConfigs,
  evvAlerts,
  evvAlertConfigs,
  evvVisitsRelations,
  evvCheckEventsRelations,
  evvGeofenceConfigsRelations,
  evvAlertsRelations,
  evvAlertConfigsRelations,
} from '../../../lib/db/schema';

describe('evvVisits schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(evvVisits)).toBe('evv_visits');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(evvVisits);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'clientId',
        'clientName',
        'carerId',
        'carerName',
        'scheduledStart',
        'scheduledEnd',
        'expectedLatitude',
        'expectedLongitude',
        'clientAddress',
        'status',
        'actualStart',
        'actualEnd',
        'actualDurationMinutes',
        'notes',
        'visitType',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id is uuid primary key with default random', () => {
    expect(evvVisits.id.columnType).toBe('PgUUID');
    expect(evvVisits.id.primary).toBe(true);
    expect(evvVisits.id.hasDefault).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(evvVisits.organisationId.notNull).toBe(true);
  });

  it('status defaults to scheduled', () => {
    expect(evvVisits.status.default).toBe('scheduled');
    expect(evvVisits.status.notNull).toBe(true);
  });

  it('visitType defaults to personal_care', () => {
    expect(evvVisits.visitType.default).toBe('personal_care');
  });

  it('actualStart and actualEnd are nullable', () => {
    expect(evvVisits.actualStart.notNull).toBeFalsy();
    expect(evvVisits.actualEnd.notNull).toBeFalsy();
  });
});

describe('evvCheckEvents schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(evvCheckEvents)).toBe('evv_check_events');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(evvCheckEvents);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'visitId',
        'carerId',
        'eventType',
        'latitude',
        'longitude',
        'withinGeofence',
        'verificationMethod',
        'timestamp',
      ]),
    );
  });

  it('withinGeofence defaults to false', () => {
    expect(evvCheckEvents.withinGeofence.default).toBe(false);
  });

  it('verificationMethod defaults to gps', () => {
    expect(evvCheckEvents.verificationMethod.default).toBe('gps');
  });
});

describe('evvGeofenceConfigs schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(evvGeofenceConfigs)).toBe('evv_geofence_configs');
  });

  it('radiusMetres defaults to 100', () => {
    expect(evvGeofenceConfigs.radiusMetres.default).toBe(100);
  });

  it('isActive defaults to true', () => {
    expect(evvGeofenceConfigs.isActive.default).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(evvGeofenceConfigs.organisationId.notNull).toBe(true);
  });
});

describe('evvAlerts schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(evvAlerts)).toBe('evv_alerts');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(evvAlerts);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'visitId',
        'alertType',
        'severity',
        'message',
        'status',
        'minutesOverdue',
        'resolvedBy',
        'resolvedAt',
        'escalated',
        'createdAt',
      ]),
    );
  });

  it('severity defaults to medium', () => {
    expect(evvAlerts.severity.default).toBe('medium');
  });

  it('status defaults to active', () => {
    expect(evvAlerts.status.default).toBe('active');
  });

  it('escalated defaults to false', () => {
    expect(evvAlerts.escalated.default).toBe(false);
  });
});

describe('evvAlertConfigs schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(evvAlertConfigs)).toBe('evv_alert_configs');
  });

  it('gracePeriodMinutes defaults to 15', () => {
    expect(evvAlertConfigs.gracePeriodMinutes.default).toBe(15);
  });

  it('escalationDelayMinutes defaults to 30', () => {
    expect(evvAlertConfigs.escalationDelayMinutes.default).toBe(30);
  });

  it('missedThresholdMinutes defaults to 60', () => {
    expect(evvAlertConfigs.missedThresholdMinutes.default).toBe(60);
  });

  it('autoEscalate defaults to true', () => {
    expect(evvAlertConfigs.autoEscalate.default).toBe(true);
  });
});

describe('EVV relations', () => {
  it('evvVisitsRelations is defined', () => {
    expect(evvVisitsRelations).toBeDefined();
  });

  it('evvCheckEventsRelations is defined', () => {
    expect(evvCheckEventsRelations).toBeDefined();
  });

  it('evvGeofenceConfigsRelations is defined', () => {
    expect(evvGeofenceConfigsRelations).toBeDefined();
  });

  it('evvAlertsRelations is defined', () => {
    expect(evvAlertsRelations).toBeDefined();
  });

  it('evvAlertConfigsRelations is defined', () => {
    expect(evvAlertConfigsRelations).toBeDefined();
  });
});
