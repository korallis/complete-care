/**
 * Database schema tests for keyworker engagement tables.
 *
 * Validates table structure, column properties, relations, and type exports.
 * Does NOT require a database connection — tests the schema definition only.
 */

import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  keyworkerSessions,
  restraints,
  sanctions,
  visitorLog,
  childrensVoice,
} from '../../../lib/db/schema';
import type {
  KeyworkerSession,
  NewKeyworkerSession,
  Restraint,
  NewRestraint,
  Sanction,
  NewSanction,
  VisitorLogEntry,
  NewVisitorLogEntry,
  ChildrensVoiceEntry,
  NewChildrensVoiceEntry,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// keyworkerSessions table
// ---------------------------------------------------------------------------

describe('keyworkerSessions schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(keyworkerSessions)).toBe('keyworker_sessions');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(keyworkerSessions);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'keyworkerId',
        'sessionDate',
        'checkIn',
        'weekReview',
        'goals',
        'education',
        'health',
        'family',
        'wishesAndFeelings',
        'actions',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('has correct primary key column', () => {
    expect(keyworkerSessions.id).toBeDefined();
  });

  it('has tenant isolation column', () => {
    expect(keyworkerSessions.organisationId).toBeDefined();
  });

  it('has wishesAndFeelings for child voice capture', () => {
    expect(keyworkerSessions.wishesAndFeelings).toBeDefined();
  });

  it('has actions JSONB column for action items', () => {
    expect(keyworkerSessions.actions).toBeDefined();
  });

  it('exports KeyworkerSession type', () => {
    const _typeCheck: KeyworkerSession = {
      id: 'uuid',
      organisationId: 'uuid',
      personId: 'uuid',
      keyworkerId: 'uuid',
      sessionDate: '2024-06-15',
      checkIn: null,
      weekReview: null,
      goals: {},
      education: null,
      health: null,
      family: null,
      wishesAndFeelings: null,
      actions: [{ action: 'Follow up with school', assignedTo: 'Jane Manager', deadline: '2024-06-20', completed: false }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });

  it('exports NewKeyworkerSession type', () => {
    const _typeCheck: NewKeyworkerSession = {
      organisationId: 'uuid',
      personId: 'uuid',
      keyworkerId: 'uuid',
      sessionDate: '2024-06-15',
    };
    expect(_typeCheck).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// restraints table
// ---------------------------------------------------------------------------

describe('restraints schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(restraints)).toBe('restraints');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(restraints);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'dateTime',
        'duration',
        'technique',
        'reason',
        'injuryCheck',
        'childDebrief',
        'staffDebrief',
        'managementReview',
        'reviewedById',
        'recordedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('has injury check JSONB column', () => {
    expect(restraints.injuryCheck).toBeDefined();
  });

  it('has debrief columns for mandatory debrief workflow', () => {
    expect(restraints.childDebrief).toBeDefined();
    expect(restraints.staffDebrief).toBeDefined();
  });

  it('has management review column', () => {
    expect(restraints.managementReview).toBeDefined();
  });

  it('exports Restraint type', () => {
    const _typeCheck: Restraint = {
      id: 'uuid',
      organisationId: 'uuid',
      personId: 'uuid',
      dateTime: '2024-06-15T14:30',
      duration: 10,
      technique: 'team_teach',
      reason: 'Child at risk',
      injuryCheck: { childInjured: false, staffInjured: false, medicalAttentionRequired: false },
      childDebrief: null,
      staffDebrief: null,
      managementReview: null,
      reviewedById: null,
      recordedById: 'uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });

  it('exports NewRestraint type', () => {
    const _typeCheck: NewRestraint = {
      organisationId: 'uuid',
      personId: 'uuid',
      dateTime: '2024-06-15T14:30',
      duration: 5,
      technique: 'price',
      reason: 'Risk of harm',
      injuryCheck: { childInjured: false, staffInjured: false, medicalAttentionRequired: false },
      recordedById: 'uuid',
    };
    expect(_typeCheck).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// sanctions table
// ---------------------------------------------------------------------------

describe('sanctions schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(sanctions)).toBe('sanctions');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(sanctions);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'dateTime',
        'description',
        'sanctionType',
        'isProhibited',
        'justification',
        'imposedById',
        'reviewedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('has isProhibited flag for regulatory safeguarding', () => {
    expect(sanctions.isProhibited).toBeDefined();
  });

  it('has management review tracking', () => {
    expect(sanctions.reviewedById).toBeDefined();
  });

  it('exports Sanction type', () => {
    const _typeCheck: Sanction = {
      id: 'uuid',
      organisationId: 'uuid',
      personId: 'uuid',
      dateTime: '2024-06-15T14:30',
      description: 'Verbal warning given',
      sanctionType: 'verbal_warning',
      isProhibited: false,
      justification: null,
      imposedById: 'uuid',
      reviewedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });

  it('exports NewSanction type', () => {
    const _typeCheck: NewSanction = {
      organisationId: 'uuid',
      personId: 'uuid',
      dateTime: '2024-06-15T14:30',
      description: 'Description',
      sanctionType: 'verbal_warning',
      imposedById: 'uuid',
    };
    expect(_typeCheck).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// visitorLog table
// ---------------------------------------------------------------------------

describe('visitorLog schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(visitorLog)).toBe('visitor_log');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(visitorLog);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'visitorName',
        'relationship',
        'personVisitedId',
        'visitDate',
        'arrivalTime',
        'departureTime',
        'idChecked',
        'dbsChecked',
        'notes',
        'recordedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('has ID and DBS verification columns', () => {
    expect(visitorLog.idChecked).toBeDefined();
    expect(visitorLog.dbsChecked).toBeDefined();
  });

  it('has arrival and departure time for sign-in/out', () => {
    expect(visitorLog.arrivalTime).toBeDefined();
    expect(visitorLog.departureTime).toBeDefined();
  });

  it('exports VisitorLogEntry type', () => {
    const _typeCheck: VisitorLogEntry = {
      id: 'uuid',
      organisationId: 'uuid',
      visitorName: 'Jane Doe',
      relationship: 'parent',
      personVisitedId: null,
      visitDate: '2024-06-15',
      arrivalTime: '14:00',
      departureTime: null,
      idChecked: true,
      dbsChecked: false,
      notes: null,
      recordedById: 'uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });

  it('exports NewVisitorLogEntry type', () => {
    const _typeCheck: NewVisitorLogEntry = {
      organisationId: 'uuid',
      visitorName: 'Jane Doe',
      relationship: 'parent',
      visitDate: '2024-06-15',
      arrivalTime: '14:00',
      recordedById: 'uuid',
    };
    expect(_typeCheck).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// childrensVoice table
// ---------------------------------------------------------------------------

describe('childrensVoice schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(childrensVoice)).toBe('childrens_voice');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(childrensVoice);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'recordedDate',
        'category',
        'content',
        'method',
        'actionTaken',
        'recordedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('has content column for child voice capture', () => {
    expect(childrensVoice.content).toBeDefined();
  });

  it('has category column for Ofsted quality standards evidence', () => {
    expect(childrensVoice.category).toBeDefined();
  });

  it('has actionTaken column to show response to child voice', () => {
    expect(childrensVoice.actionTaken).toBeDefined();
  });

  it('exports ChildrensVoiceEntry type', () => {
    const _typeCheck: ChildrensVoiceEntry = {
      id: 'uuid',
      organisationId: 'uuid',
      personId: 'uuid',
      recordedDate: '2024-06-15',
      category: 'daily_life',
      content: 'The child expressed their wishes',
      method: null,
      actionTaken: null,
      recordedById: 'uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });

  it('exports NewChildrensVoiceEntry type', () => {
    const _typeCheck: NewChildrensVoiceEntry = {
      organisationId: 'uuid',
      personId: 'uuid',
      recordedDate: '2024-06-15',
      category: 'wishes',
      content: 'Child wants to see their pet',
      recordedById: 'uuid',
    };
    expect(_typeCheck).toBeDefined();
  });
});
