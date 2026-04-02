/**
 * Contacts schema tests — verify structure, types, and column properties.
 * Operates on schema objects in memory — no database connection required.
 *
 * VAL-CHILD-014: Approved contacts with court order restrictions
 * VAL-CHILD-015: Contact scheduling and recording with emotional presentation
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  approvedContacts,
  contactSchedules,
  contactRecords,
  approvedContactsRelations,
  contactSchedulesRelations,
  contactRecordsRelations,
} from '../../../lib/db/schema';
import type {
  ApprovedContact,
  NewApprovedContact,
  ContactSchedule,
  NewContactSchedule,
  ContactRecord,
  NewContactRecord,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// approved_contacts
// ---------------------------------------------------------------------------

describe('approvedContacts schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(approvedContacts)).toBe('approved_contacts');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(approvedContacts);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'name',
        'relationship',
        'phone',
        'email',
        'address',
        'allowedContactTypes',
        'frequency',
        'supervisionLevel',
        'hasRestrictions',
        'courtOrderReference',
        'courtOrderDate',
        'courtOrderConditions',
        'isActive',
        'approvedById',
        'approvedAt',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id column is uuid primary key with default random', () => {
    const col = approvedContacts.id;
    expect(col.columnType).toBe('PgUUID');
    expect(col.primary).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it('organisationId is required (tenant isolation)', () => {
    expect(approvedContacts.organisationId.notNull).toBe(true);
  });

  it('personId is required', () => {
    expect(approvedContacts.personId.notNull).toBe(true);
  });

  it('name is required', () => {
    expect(approvedContacts.name.notNull).toBe(true);
  });

  it('hasRestrictions defaults to false', () => {
    expect(approvedContacts.hasRestrictions.default).toBe(false);
  });

  it('isActive defaults to true', () => {
    expect(approvedContacts.isActive.default).toBe(true);
  });

  it('supervisionLevel defaults to supervised_by_staff', () => {
    expect(approvedContacts.supervisionLevel.default).toBe('supervised_by_staff');
  });

  it('allowedContactTypes is a PgArray', () => {
    expect(approvedContacts.allowedContactTypes.columnType).toBe('PgArray');
  });

  it('court order fields are nullable (only needed for restricted contacts)', () => {
    expect(approvedContacts.courtOrderReference.notNull).toBeFalsy();
    expect(approvedContacts.courtOrderDate.notNull).toBeFalsy();
    expect(approvedContacts.courtOrderConditions.notNull).toBeFalsy();
  });

  it('exports types correctly (compile-time check)', () => {
    const contact: ApprovedContact = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      name: 'Jane Doe',
      relationship: 'mother',
      phone: '07700900000',
      email: 'jane@example.com',
      address: null,
      allowedContactTypes: ['phone', 'face_to_face'],
      frequency: 'Weekly',
      supervisionLevel: 'supervised_by_staff',
      hasRestrictions: false,
      courtOrderReference: null,
      courtOrderDate: null,
      courtOrderConditions: null,
      isActive: true,
      approvedById: 'user-uuid',
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(contact.name).toBe('Jane Doe');

    const newContact: NewApprovedContact = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      name: 'John Doe',
      relationship: 'father',
      allowedContactTypes: ['phone'],
    };
    expect(newContact.name).toBe('John Doe');
  });
});

// ---------------------------------------------------------------------------
// contact_schedules
// ---------------------------------------------------------------------------

describe('contactSchedules schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(contactSchedules)).toBe('contact_schedules');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(contactSchedules);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'approvedContactId',
        'contactType',
        'scheduledAt',
        'durationMinutes',
        'supervisionLevel',
        'location',
        'status',
        'managerOverride',
        'overrideById',
        'overrideJustification',
        'createdById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('organisationId is required (tenant isolation)', () => {
    expect(contactSchedules.organisationId.notNull).toBe(true);
  });

  it('status defaults to scheduled', () => {
    expect(contactSchedules.status.default).toBe('scheduled');
  });

  it('managerOverride defaults to false', () => {
    expect(contactSchedules.managerOverride.default).toBe(false);
  });

  it('override fields are nullable', () => {
    expect(contactSchedules.overrideById.notNull).toBeFalsy();
    expect(contactSchedules.overrideJustification.notNull).toBeFalsy();
  });

  it('exports types correctly (compile-time check)', () => {
    const schedule: ContactSchedule = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      approvedContactId: 'contact-uuid',
      contactType: 'phone',
      scheduledAt: new Date(),
      durationMinutes: 60,
      supervisionLevel: 'supervised_by_staff',
      location: 'Visiting room',
      status: 'scheduled',
      managerOverride: false,
      overrideById: null,
      overrideJustification: null,
      createdById: 'user-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(schedule.status).toBe('scheduled');

    const newSchedule: NewContactSchedule = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      approvedContactId: 'contact-uuid',
      contactType: 'phone',
      scheduledAt: new Date(),
      supervisionLevel: 'supervised_by_staff',
    };
    expect(newSchedule.contactType).toBe('phone');
  });
});

// ---------------------------------------------------------------------------
// contact_records
// ---------------------------------------------------------------------------

describe('contactRecords schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(contactRecords)).toBe('contact_records');
  });

  it('defines all required columns including emotional presentation', () => {
    const cols = Object.keys(contactRecords);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'approvedContactId',
        'contactScheduleId',
        'contactType',
        'contactDate',
        'durationMinutes',
        'supervisionLevel',
        'whoPresent',
        'location',
        'emotionalBefore',
        'emotionalDuring',
        'emotionalAfter',
        'notes',
        'concerns',
        'disclosures',
        'recordedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('organisationId is required (tenant isolation)', () => {
    expect(contactRecords.organisationId.notNull).toBe(true);
  });

  it('emotional presentation fields are nullable', () => {
    expect(contactRecords.emotionalBefore.notNull).toBeFalsy();
    expect(contactRecords.emotionalDuring.notNull).toBeFalsy();
    expect(contactRecords.emotionalAfter.notNull).toBeFalsy();
  });

  it('concerns and disclosures are nullable', () => {
    expect(contactRecords.concerns.notNull).toBeFalsy();
    expect(contactRecords.disclosures.notNull).toBeFalsy();
  });

  it('contactScheduleId is nullable (ad-hoc contacts)', () => {
    expect(contactRecords.contactScheduleId.notNull).toBeFalsy();
  });

  it('exports types correctly (compile-time check)', () => {
    const record: ContactRecord = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      approvedContactId: 'contact-uuid',
      contactScheduleId: null,
      contactType: 'face_to_face',
      contactDate: new Date(),
      durationMinutes: 45,
      supervisionLevel: 'supervised_by_staff',
      whoPresent: 'Child, Mother, Staff A',
      location: 'Visiting room',
      emotionalBefore: 'Anxious',
      emotionalDuring: 'Happy',
      emotionalAfter: 'Calm',
      notes: 'Good visit',
      concerns: null,
      disclosures: null,
      recordedById: 'user-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(record.emotionalBefore).toBe('Anxious');

    const newRecord: NewContactRecord = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      approvedContactId: 'contact-uuid',
      contactType: 'face_to_face',
      contactDate: new Date(),
      supervisionLevel: 'supervised_by_staff',
    };
    expect(newRecord.contactType).toBe('face_to_face');
  });
});

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

describe('contacts relations', () => {
  it('approvedContactsRelations is defined', () => {
    expect(approvedContactsRelations).toBeDefined();
  });

  it('contactSchedulesRelations is defined', () => {
    expect(contactSchedulesRelations).toBeDefined();
  });

  it('contactRecordsRelations is defined', () => {
    expect(contactRecordsRelations).toBeDefined();
  });
});
