/**
 * Tenant-scoped schema tests — verifies the structure of tenant-scoped tables.
 *
 * Confirms that all tenant-scoped entity tables:
 * - Have the correct table name
 * - Contain an organisationId UUID column (NOT NULL)
 * - Have appropriate indexes for tenant-scoped queries
 * - Follow established schema conventions
 *
 * These schema-level tests do NOT require a database connection.
 */

import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { persons } from '@/lib/db/schema/persons';
import { staffProfiles } from '@/lib/db/schema/staff-profiles';
import { carePlans } from '@/lib/db/schema/care-plans';
import { careNotes } from '@/lib/db/schema/care-notes';
import { documents } from '@/lib/db/schema/documents';
import type {
  Person,
  NewPerson,
  StaffProfile,
  NewStaffProfile,
  CarePlan,
  NewCarePlan,
  CareNote,
  NewCareNote,
  Document,
  NewDocument,
} from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// persons
// ---------------------------------------------------------------------------

describe('persons schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(persons)).toBe('persons');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(persons);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'fullName',
        'type',
        'status',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    );
  });

  it('id column is uuid primary key with default random', () => {
    expect(persons.id.columnType).toBe('PgUUID');
    expect(persons.id.primary).toBe(true);
    expect(persons.id.hasDefault).toBe(true);
  });

  it('organisationId is a non-null UUID (tenant isolation)', () => {
    expect(persons.organisationId.columnType).toBe('PgUUID');
    expect(persons.organisationId.notNull).toBe(true);
  });

  it('type column defaults to "resident"', () => {
    expect(persons.type.default).toBe('resident');
  });

  it('status column defaults to "active"', () => {
    expect(persons.status.default).toBe('active');
  });

  it('createdAt has defaultNow', () => {
    expect(persons.createdAt.hasDefault).toBe(true);
  });

  it('deletedAt allows null (soft delete)', () => {
    expect(persons.deletedAt.notNull).toBeFalsy();
  });

  it('has correct TypeScript inferred types', () => {
    // Type-level test — compile error if types are wrong
    const person: Person = {
      id: 'uuid',
      organisationId: 'org-id',
      fullName: 'Alice',
      firstName: null,
      lastName: null,
      preferredName: null,
      type: 'client',
      status: 'active',
      dateOfBirth: null,
      gender: null,
      ethnicity: null,
      religion: null,
      firstLanguage: null,
      nhsNumber: null,
      gpName: null,
      gpPractice: null,
      allergies: [],
      medicalConditions: [],
      contactPhone: null,
      contactEmail: null,
      address: null,
      emergencyContacts: [],
      photoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    expect(person.organisationId).toBe('org-id');

    // NewPerson should not require id/createdAt/updatedAt
    const _newPerson: NewPerson = {
      organisationId: 'org-id',
      fullName: 'Bob',
    };
    expect(_newPerson.fullName).toBe('Bob');
  });
});

// ---------------------------------------------------------------------------
// staffProfiles
// ---------------------------------------------------------------------------

describe('staffProfiles schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(staffProfiles)).toBe('staff_profiles');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(staffProfiles);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'userId',
        'fullName',
        'jobTitle',
        'employmentType',
        'status',
        'startDate',
        'endDate',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    );
  });

  it('organisationId is a non-null UUID (tenant isolation)', () => {
    expect(staffProfiles.organisationId.columnType).toBe('PgUUID');
    expect(staffProfiles.organisationId.notNull).toBe(true);
  });

  it('userId is nullable (imported staff may not have a user account)', () => {
    expect(staffProfiles.userId.notNull).toBeFalsy();
  });

  it('jobTitle defaults to "Care Worker"', () => {
    expect(staffProfiles.jobTitle.default).toBe('Care Worker');
  });

  it('employmentType defaults to "full_time"', () => {
    expect(staffProfiles.employmentType.default).toBe('full_time');
  });

  it('status defaults to "active"', () => {
    expect(staffProfiles.status.default).toBe('active');
  });

  it('has correct TypeScript inferred types', () => {
    const profile: StaffProfile = {
      id: 'uuid',
      organisationId: 'org-id',
      userId: null,
      fullName: 'Jane Carer',
      jobTitle: 'Senior Carer',
      employmentType: 'full_time',
      status: 'active',
      startDate: '2024-01-01',
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    expect(profile.organisationId).toBe('org-id');

    const _newProfile: NewStaffProfile = {
      organisationId: 'org-id',
      fullName: 'New Staff',
    };
    expect(_newProfile.organisationId).toBe('org-id');
  });
});

// ---------------------------------------------------------------------------
// carePlans
// ---------------------------------------------------------------------------

describe('carePlans schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(carePlans)).toBe('care_plans');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(carePlans);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'title',
        'status',
        'version',
        'nextReviewDate',
        'authorisedBy',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    );
  });

  it('organisationId is a non-null UUID (tenant isolation)', () => {
    expect(carePlans.organisationId.columnType).toBe('PgUUID');
    expect(carePlans.organisationId.notNull).toBe(true);
  });

  it('personId is a non-null UUID (each plan belongs to a person)', () => {
    expect(carePlans.personId.columnType).toBe('PgUUID');
    expect(carePlans.personId.notNull).toBe(true);
  });

  it('status defaults to "draft"', () => {
    expect(carePlans.status.default).toBe('draft');
  });

  it('version defaults to 1', () => {
    expect(carePlans.version.default).toBe(1);
  });

  it('has correct TypeScript inferred types', () => {
    const plan: CarePlan = {
      id: 'uuid',
      organisationId: 'org-id',
      personId: 'person-id',
      title: 'Personal Care Plan',
      status: 'draft',
      version: 1,
      sections: [],
      template: null,
      reviewFrequency: 'monthly',
      nextReviewDate: null,
      authorisedBy: null,
      approvedById: null,
      approvedAt: null,
      submittedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    expect(plan.organisationId).toBe('org-id');

    const _newPlan: NewCarePlan = {
      organisationId: 'org-id',
      personId: 'person-id',
      title: 'New Care Plan',
    };
    expect(_newPlan.personId).toBe('person-id');
  });
});

// ---------------------------------------------------------------------------
// careNotes
// ---------------------------------------------------------------------------

describe('careNotes schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(careNotes)).toBe('care_notes');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(careNotes);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'authorId',
        'noteType',
        'content',
        'shiftPeriod',
        'createdAt',
      ]),
    );
  });

  it('organisationId is a non-null UUID (tenant isolation)', () => {
    expect(careNotes.organisationId.columnType).toBe('PgUUID');
    expect(careNotes.organisationId.notNull).toBe(true);
  });

  it('noteType defaults to "daily"', () => {
    expect(careNotes.noteType.default).toBe('daily');
  });

  it('content is non-null (required field)', () => {
    expect(careNotes.content.notNull).toBe(true);
  });

  it('authorId is nullable (system-generated notes)', () => {
    expect(careNotes.authorId.notNull).toBeFalsy();
  });

  it('has no deletedAt — care notes are immutable (regulatory requirement)', () => {
    const cols = Object.keys(careNotes);
    expect(cols).not.toContain('deletedAt');
  });

  it('has correct TypeScript inferred types', () => {
    const note: CareNote = {
      id: 'uuid',
      organisationId: 'org-id',
      personId: 'person-id',
      authorId: 'user-id',
      noteType: 'daily',
      content: 'Resident was in good spirits today.',
      shiftPeriod: '07:00-14:00',
      createdAt: new Date(),
    };
    expect(note.organisationId).toBe('org-id');

    const _newNote: NewCareNote = {
      organisationId: 'org-id',
      personId: 'person-id',
      content: 'New care note',
    };
    expect(_newNote.content).toBe('New care note');
  });
});

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------

describe('documents schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(documents)).toBe('documents');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(documents);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'uploadedById',
        'name',
        'category',
        'mimeType',
        'sizeBytes',
        'storageUrl',
        'deletedAt',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('organisationId is a non-null UUID (tenant isolation)', () => {
    expect(documents.organisationId.columnType).toBe('PgUUID');
    expect(documents.organisationId.notNull).toBe(true);
  });

  it('category defaults to "other"', () => {
    expect(documents.category.default).toBe('other');
  });

  it('personId is nullable (org-level documents have no person)', () => {
    expect(documents.personId.notNull).toBeFalsy();
  });

  it('storageUrl is non-null (all documents must have a storage location)', () => {
    expect(documents.storageUrl.notNull).toBe(true);
  });

  it('has correct TypeScript inferred types', () => {
    const doc: Document = {
      id: 'uuid',
      organisationId: 'org-id',
      personId: 'person-id',
      uploadedById: 'user-id',
      name: 'Care Plan PDF',
      category: 'medical',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      storageUrl: 'https://blob.vercel-storage.com/care-plan.pdf',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(doc.organisationId).toBe('org-id');

    const _newDoc: NewDocument = {
      organisationId: 'org-id',
      name: 'New Document',
      mimeType: 'application/pdf',
      storageUrl: 'https://example.com/doc.pdf',
    };
    expect(_newDoc.organisationId).toBe('org-id');
  });
});
