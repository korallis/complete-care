import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Philomena Protocol profiles
// ---------------------------------------------------------------------------

/**
 * Philomena Protocol profile — single-page printable profile for each child
 * containing physical description, known associates, risk factors, and medical
 * needs. Used by police and partner agencies when a child goes missing.
 *
 * Relations defined in ./relations.ts.
 */
export const philomenaProfiles = pgTable(
  'philomena_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child (person) this profile belongs to */
    personId: uuid('person_id').notNull(),
    /** URL or storage key for the child's recent photo */
    photoUrl: text('photo_url'),
    /** When the photo was last updated — alert if > 3 months stale */
    photoUpdatedAt: timestamp('photo_updated_at'),
    /** Height in centimetres */
    heightCm: integer('height_cm'),
    /** Build description: slim | average | stocky | heavy */
    build: text('build'),
    /** Hair colour and style */
    hairDescription: text('hair_description'),
    /** Eye colour */
    eyeColour: text('eye_colour'),
    /** Distinguishing features: scars, tattoos, piercings, etc. */
    distinguishingFeatures: text('distinguishing_features'),
    /** Ethnicity for identification purposes */
    ethnicity: text('ethnicity'),
    /** Known associates — JSON array of { name, relationship, notes } */
    knownAssociates: jsonb('known_associates').$type<
      { name: string; relationship: string; notes?: string }[]
    >(),
    /** Likely locations the child may go to — JSON array of { location, address, notes } */
    likelyLocations: jsonb('likely_locations').$type<
      { location: string; address?: string; notes?: string }[]
    >(),
    /** Phone number(s) */
    phoneNumbers: text('phone_numbers').array(),
    /** Social media accounts — JSON array of { platform, handle } */
    socialMedia: jsonb('social_media').$type<
      { platform: string; handle: string }[]
    >(),
    /** Child Sexual Exploitation risk flag */
    riskCse: boolean('risk_cse').notNull().default(false),
    /** Child Criminal Exploitation risk flag */
    riskCce: boolean('risk_cce').notNull().default(false),
    /** County lines risk flag */
    riskCountyLines: boolean('risk_county_lines').notNull().default(false),
    /** Trafficking risk flag */
    riskTrafficking: boolean('risk_trafficking').notNull().default(false),
    /** Free-text risk factor notes */
    riskNotes: text('risk_notes'),
    /** Medical needs and medication requirements */
    medicalNeeds: text('medical_needs'),
    /** Allergies */
    allergies: text('allergies'),
    /** Current medications */
    medications: text('medications'),
    /** GP / doctor details */
    gpDetails: text('gp_details'),
    /** User who last updated this profile */
    updatedById: uuid('updated_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('philomena_profiles_org_idx').on(t.organisationId),
    index('philomena_profiles_person_idx').on(t.personId),
  ],
);

export type PhilomenaProfile = typeof philomenaProfiles.$inferSelect;
export type NewPhilomenaProfile = typeof philomenaProfiles.$inferInsert;

// ---------------------------------------------------------------------------
// Missing episodes
// ---------------------------------------------------------------------------

/**
 * Missing episode — records the full lifecycle of a child going missing,
 * from initial absence through escalation to return.
 *
 * Relations defined in ./relations.ts.
 */
export const missingEpisodes = pgTable(
  'missing_episodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child (person) who is missing */
    personId: uuid('person_id').notNull(),
    /** Reference to the child's Philomena profile at time of episode */
    philomenaProfileId: uuid('philomena_profile_id').references(
      () => philomenaProfiles.id,
      { onDelete: 'set null' },
    ),
    /** Episode status: open | returned | closed */
    status: text('status').notNull().default('open'),
    /** Time the absence was first noticed by staff */
    absenceNoticedAt: timestamp('absence_noticed_at').notNull(),
    /** Time the child was last seen */
    lastSeenAt: timestamp('last_seen_at'),
    /** Where the child was last seen */
    lastSeenLocation: text('last_seen_location'),
    /** What the child was wearing when last seen */
    lastSeenClothing: text('last_seen_clothing'),
    /** Initial actions taken on discovering absence */
    initialActionsTaken: text('initial_actions_taken'),
    /** Risk assessment level: low | medium | high */
    riskLevel: text('risk_level').notNull(),
    /** Rationale for risk assessment */
    riskAssessmentNotes: text('risk_assessment_notes'),
    /** Number of previous missing episodes (captured at time of recording) */
    previousEpisodeCount: integer('previous_episode_count')
      .notNull()
      .default(0),
    /** Escalation threshold in minutes (configurable per risk level) */
    escalationThresholdMinutes: integer('escalation_threshold_minutes')
      .notNull()
      .default(30),
    /** Whether police have been notified */
    policeNotified: boolean('police_notified').notNull().default(false),
    /** Timestamp of police notification */
    policeNotifiedAt: timestamp('police_notified_at'),
    /** Police reference number */
    policeReference: text('police_reference'),
    /** Whether the placing authority / local authority has been notified */
    placingAuthorityNotified: boolean('placing_authority_notified')
      .notNull()
      .default(false),
    /** Timestamp of placing authority notification */
    placingAuthorityNotifiedAt: timestamp('placing_authority_notified_at'),
    /** Name of the person at the placing authority who was contacted */
    placingAuthorityContact: text('placing_authority_contact'),
    /** Whether the Responsible Individual has been notified */
    responsibleIndividualNotified: boolean('responsible_individual_notified')
      .notNull()
      .default(false),
    /** Timestamp of RI notification */
    responsibleIndividualNotifiedAt: timestamp(
      'responsible_individual_notified_at',
    ),
    /** Time of child's return */
    returnedAt: timestamp('returned_at'),
    /** How the child returned: self | found_by_police | found_by_staff | other */
    returnMethod: text('return_method'),
    /** Wellbeing check completed on return */
    wellbeingCheckCompleted: boolean('wellbeing_check_completed')
      .notNull()
      .default(false),
    /** Notes from the wellbeing check */
    wellbeingCheckNotes: text('wellbeing_check_notes'),
    /** User who reported the child missing */
    reportedById: uuid('reported_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** User who closed the episode */
    closedById: uuid('closed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    closedAt: timestamp('closed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('missing_episodes_org_idx').on(t.organisationId),
    index('missing_episodes_person_idx').on(t.personId),
    index('missing_episodes_status_idx').on(t.organisationId, t.status),
    index('missing_episodes_absence_idx').on(t.absenceNoticedAt),
  ],
);

export type MissingEpisode = typeof missingEpisodes.$inferSelect;
export type NewMissingEpisode = typeof missingEpisodes.$inferInsert;

// ---------------------------------------------------------------------------
// Missing episode timeline (timestamped steps)
// ---------------------------------------------------------------------------

/**
 * Timeline entry for a missing episode — every action, escalation, and
 * communication is recorded with a timestamp for audit purposes.
 */
export const missingEpisodeTimeline = pgTable(
  'missing_episode_timeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    episodeId: uuid('episode_id')
      .notNull()
      .references(() => missingEpisodes.id, { onDelete: 'cascade' }),
    /**
     * Action type:
     * absence_noticed | search_conducted | police_notified | authority_notified |
     * ri_notified | sighting_reported | child_returned | wellbeing_check |
     * escalation_triggered | note_added | rhi_created
     */
    actionType: text('action_type').notNull(),
    /** Human-readable description of what happened */
    description: text('description').notNull(),
    /** The exact time the action occurred */
    occurredAt: timestamp('occurred_at').notNull(),
    /** User who recorded this step */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Additional structured data (e.g. police reference, search area) */
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('missing_episode_timeline_episode_idx').on(t.episodeId),
    index('missing_episode_timeline_org_idx').on(t.organisationId),
  ],
);

export type MissingEpisodeTimelineEntry =
  typeof missingEpisodeTimeline.$inferSelect;
export type NewMissingEpisodeTimelineEntry =
  typeof missingEpisodeTimeline.$inferInsert;

// ---------------------------------------------------------------------------
// Return Home Interviews (RHI)
// ---------------------------------------------------------------------------

/**
 * Return Home Interview — statutory requirement to be completed within 72 hours
 * of a child's return from a missing episode. Records the child's account and
 * any exploitation/safeguarding concerns.
 *
 * Relations defined in ./relations.ts.
 */
export const returnHomeInterviews = pgTable(
  'return_home_interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child (person) */
    personId: uuid('person_id').notNull(),
    /** The missing episode this RHI relates to */
    episodeId: uuid('episode_id')
      .notNull()
      .references(() => missingEpisodes.id, { onDelete: 'cascade' }),
    /** Status: pending | in_progress | completed | overdue | escalated */
    status: text('status').notNull().default('pending'),
    /** 72-hour deadline calculated from the child's return */
    deadlineAt: timestamp('deadline_at').notNull(),
    /** Whether the deadline has been breached */
    deadlineBreached: boolean('deadline_breached').notNull().default(false),
    /** Where the child was during the missing episode */
    whereChildWas: text('where_child_was'),
    /** Who the child was with */
    whoChildWasWith: text('who_child_was_with'),
    /** What happened during the episode (child's account) */
    whatHappened: text('what_happened'),
    /** Child's own account in their words */
    childAccount: text('child_account'),
    /** Identified risks from the episode */
    risksIdentified: text('risks_identified'),
    /** Exploitation concerns: none | cse | cce | county_lines | trafficking | other */
    exploitationConcerns: text('exploitation_concerns').array(),
    /** Details of exploitation concerns */
    exploitationDetails: text('exploitation_details'),
    /** Whether a safeguarding referral is needed */
    safeguardingReferralNeeded: boolean('safeguarding_referral_needed')
      .notNull()
      .default(false),
    /** Actions/recommendations arising from the RHI */
    actionsRecommended: text('actions_recommended'),
    /** Whether the child declined the interview */
    childDeclined: boolean('child_declined').notNull().default(false),
    /** Reason the child declined (if applicable) */
    declineReason: text('decline_reason'),
    /** User who conducted the interview */
    conductedById: uuid('conducted_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** When the interview was completed */
    completedAt: timestamp('completed_at'),
    /** Whether this RHI has been escalated to the Responsible Individual */
    escalatedToRi: boolean('escalated_to_ri').notNull().default(false),
    /** When it was escalated */
    escalatedAt: timestamp('escalated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('rhi_org_idx').on(t.organisationId),
    index('rhi_person_idx').on(t.personId),
    index('rhi_episode_idx').on(t.episodeId),
    index('rhi_status_idx').on(t.organisationId, t.status),
    index('rhi_deadline_idx').on(t.deadlineAt),
  ],
);

export type ReturnHomeInterview = typeof returnHomeInterviews.$inferSelect;
export type NewReturnHomeInterview = typeof returnHomeInterviews.$inferInsert;
