import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Consent records — tracks consent per person for various purposes.
 * Consent can be given/withdrawn with full date tracking.
 */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (service user) this consent relates to */
    personId: uuid('person_id').notNull(),
    /** photography | data_sharing | medical_treatment | outings | social_media | research | third_party_sharing */
    consentType: text('consent_type').notNull(),
    /** granted | withdrawn */
    status: text('status').notNull().default('granted'),
    /** Date consent was given */
    grantedDate: date('granted_date').notNull(),
    /** Date consent was withdrawn (null if still active) */
    withdrawnDate: date('withdrawn_date'),
    /** Who gave the consent (person themselves, parent, guardian, etc.) */
    givenBy: text('given_by').notNull(),
    /** Relationship to the person (self | parent | guardian | social_worker | other) */
    relationship: text('relationship').notNull().default('self'),
    /** Any specific conditions or restrictions */
    conditions: text('conditions'),
    /** Recorded by (staff member) */
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    /** Review date for periodic review of consent */
    reviewDate: date('review_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('consent_records_org_idx').on(t.organisationId),
    index('consent_records_person_idx').on(t.personId),
    index('consent_records_type_idx').on(t.consentType),
    index('consent_records_status_idx').on(t.status),
  ],
);

/**
 * Photos — uploaded photos linked to persons, with consent checks.
 */
export const photos = pgTable(
  'photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person shown in the photo */
    personId: uuid('person_id').notNull(),
    /** URL to the stored image */
    imageUrl: text('image_url').notNull(),
    /** Optional thumbnail URL */
    thumbnailUrl: text('thumbnail_url'),
    /** Photo caption/description */
    caption: text('caption'),
    /** Date the photo was taken */
    takenDate: date('taken_date'),
    /** Who uploaded the photo */
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    /** Whether consent has been verified before upload */
    consentVerified: boolean('consent_verified').notNull().default(false),
    /** Reference to the consent record that authorises this photo */
    consentRecordId: uuid('consent_record_id').references(() => consentRecords.id, {
      onDelete: 'set null',
    }),
    /** Tags for categorisation */
    tags: text('tags').array().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('photos_org_idx').on(t.organisationId),
    index('photos_person_idx').on(t.personId),
    index('photos_uploaded_by_idx').on(t.uploadedBy),
  ],
);

export type ConsentRecord = typeof consentRecords.$inferSelect;
export type NewConsentRecord = typeof consentRecords.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
