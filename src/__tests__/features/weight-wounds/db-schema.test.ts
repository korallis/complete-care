/**
 * Database schema structure tests for weight-wounds tables.
 * Validates table names, columns, types, and constraints in memory.
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  weightSchedules,
  weightRecords,
  waterlowAssessments,
  wounds,
  woundAssessments,
  weightSchedulesRelations,
  weightRecordsRelations,
  waterlowAssessmentsRelations,
  woundsRelations,
  woundAssessmentsRelations,
} from '../../../lib/db/schema';
import type {
  WeightSchedule,
  NewWeightSchedule,
  Wound,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// weight_schedules
// ---------------------------------------------------------------------------

describe('weightSchedules schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(weightSchedules)).toBe('weight_schedules');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(weightSchedules);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'frequency',
        'changeAlertThreshold',
        'changeAlertDays',
        'heightCm',
        'isActive',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id is uuid primary key', () => {
    expect(weightSchedules.id.columnType).toBe('PgUUID');
    expect(weightSchedules.id.primary).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(weightSchedules.organisationId.notNull).toBe(true);
  });

  it('frequency defaults to monthly', () => {
    expect(weightSchedules.frequency.default).toBe('monthly');
  });

  it('exports types', () => {
    const schedule: WeightSchedule = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      frequency: 'weekly',
      changeAlertThreshold: 5,
      changeAlertDays: 30,
      heightCm: 175,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(schedule.frequency).toBe('weekly');

    const newSchedule: NewWeightSchedule = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
    };
    expect(newSchedule.organisationId).toBe('org-uuid');
  });
});

// ---------------------------------------------------------------------------
// weight_records
// ---------------------------------------------------------------------------

describe('weightRecords schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(weightRecords)).toBe('weight_records');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(weightRecords);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'recordedDate',
        'weightKg',
        'heightCm',
        'bmi',
        'bmiCategory',
        'notes',
        'recordedById',
        'createdAt',
      ]),
    );
  });

  it('weightKg is not null', () => {
    expect(weightRecords.weightKg.notNull).toBe(true);
  });

  it('bmi is nullable', () => {
    expect(weightRecords.bmi.notNull).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// waterlow_assessments
// ---------------------------------------------------------------------------

describe('waterlowAssessments schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(waterlowAssessments)).toBe('waterlow_assessments');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(waterlowAssessments);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'assessmentDate',
        'scores',
        'totalScore',
        'riskCategory',
        'notes',
        'assessedById',
        'createdAt',
      ]),
    );
  });

  it('totalScore is not null', () => {
    expect(waterlowAssessments.totalScore.notNull).toBe(true);
  });

  it('scores column is jsonb', () => {
    expect(waterlowAssessments.scores.columnType).toBe('PgJsonb');
  });
});

// ---------------------------------------------------------------------------
// wounds
// ---------------------------------------------------------------------------

describe('wounds schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(wounds)).toBe('wounds');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(wounds);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'location',
        'bodyMapPosition',
        'woundType',
        'dateIdentified',
        'dateResolved',
        'status',
        'dressingType',
        'dressingFrequency',
        'specialInstructions',
        'nextAssessmentDate',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('status defaults to open', () => {
    expect(wounds.status.default).toBe('open');
  });

  it('organisationId is not null', () => {
    expect(wounds.organisationId.notNull).toBe(true);
  });

  it('exports types', () => {
    const wound: Wound = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      location: 'Left heel',
      bodyMapPosition: { x: 30, y: 88, region: 'left_heel' },
      woundType: 'pressure_ulcer',
      dateIdentified: '2026-03-15',
      dateResolved: null,
      status: 'open',
      dressingType: 'Hydrocolloid',
      dressingFrequency: 'Every 3 days',
      specialInstructions: null,
      nextAssessmentDate: '2026-04-05',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(wound.woundType).toBe('pressure_ulcer');
  });
});

// ---------------------------------------------------------------------------
// wound_assessments
// ---------------------------------------------------------------------------

describe('woundAssessments schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(woundAssessments)).toBe('wound_assessments');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(woundAssessments);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'woundId',
        'assessmentDate',
        'lengthCm',
        'widthCm',
        'depthCm',
        'pressureUlcerGrade',
        'woundBed',
        'exudate',
        'surroundingSkin',
        'signsOfInfection',
        'painLevel',
        'photoRef',
        'treatmentApplied',
        'notes',
        'assessedById',
        'createdAt',
      ]),
    );
  });

  it('woundId is not null', () => {
    expect(woundAssessments.woundId.notNull).toBe(true);
  });

  it('signsOfInfection defaults to false', () => {
    expect(woundAssessments.signsOfInfection.default).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

describe('weight-wounds relations', () => {
  it('weightSchedulesRelations is defined', () => {
    expect(weightSchedulesRelations).toBeDefined();
  });

  it('weightRecordsRelations is defined', () => {
    expect(weightRecordsRelations).toBeDefined();
  });

  it('waterlowAssessmentsRelations is defined', () => {
    expect(waterlowAssessmentsRelations).toBeDefined();
  });

  it('woundsRelations is defined', () => {
    expect(woundsRelations).toBeDefined();
  });

  it('woundAssessmentsRelations is defined', () => {
    expect(woundAssessmentsRelations).toBeDefined();
  });
});
