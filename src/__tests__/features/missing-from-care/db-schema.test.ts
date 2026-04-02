/**
 * Database schema tests for Missing from Care tables.
 * Validates table structure, column properties, and type exports.
 * Does NOT require a database connection.
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  philomenaProfiles,
  missingEpisodes,
  missingEpisodeTimeline,
  returnHomeInterviews,
  philomenaProfilesRelations,
  missingEpisodesRelations,
  missingEpisodeTimelineRelations,
  returnHomeInterviewsRelations,
} from '../../../lib/db/schema';
import type {
  PhilomenaProfile,
  NewPhilomenaProfile,
  MissingEpisode,
  NewMissingEpisode,
  MissingEpisodeTimelineEntry,
  NewMissingEpisodeTimelineEntry,
  ReturnHomeInterview,
  NewReturnHomeInterview,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// philomena_profiles
// ---------------------------------------------------------------------------

describe('philomenaProfiles schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(philomenaProfiles)).toBe('philomena_profiles');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(philomenaProfiles);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'photoUrl',
        'photoUpdatedAt',
        'heightCm',
        'build',
        'hairDescription',
        'eyeColour',
        'distinguishingFeatures',
        'ethnicity',
        'knownAssociates',
        'likelyLocations',
        'phoneNumbers',
        'socialMedia',
        'riskCse',
        'riskCce',
        'riskCountyLines',
        'riskTrafficking',
        'riskNotes',
        'medicalNeeds',
        'allergies',
        'medications',
        'gpDetails',
        'updatedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id column is uuid primary key with default random', () => {
    const col = philomenaProfiles.id;
    expect(col.columnType).toBe('PgUUID');
    expect(col.primary).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(philomenaProfiles.organisationId.notNull).toBe(true);
  });

  it('personId is not null', () => {
    expect(philomenaProfiles.personId.notNull).toBe(true);
  });

  it('risk flags default to false', () => {
    expect(philomenaProfiles.riskCse.default).toBe(false);
    expect(philomenaProfiles.riskCce.default).toBe(false);
    expect(philomenaProfiles.riskCountyLines.default).toBe(false);
    expect(philomenaProfiles.riskTrafficking.default).toBe(false);
  });

  it('exports PhilomenaProfile and NewPhilomenaProfile types', () => {
    const profile: PhilomenaProfile = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      photoUrl: null,
      photoUpdatedAt: null,
      heightCm: null,
      build: null,
      hairDescription: null,
      eyeColour: null,
      distinguishingFeatures: null,
      ethnicity: null,
      knownAssociates: null,
      likelyLocations: null,
      phoneNumbers: null,
      socialMedia: null,
      riskCse: false,
      riskCce: false,
      riskCountyLines: false,
      riskTrafficking: false,
      riskNotes: null,
      medicalNeeds: null,
      allergies: null,
      medications: null,
      gpDetails: null,
      updatedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(profile.personId).toBe('person-uuid');

    const newProfile: NewPhilomenaProfile = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
    };
    expect(newProfile.organisationId).toBe('org-uuid');
  });
});

// ---------------------------------------------------------------------------
// missing_episodes
// ---------------------------------------------------------------------------

describe('missingEpisodes schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(missingEpisodes)).toBe('missing_episodes');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(missingEpisodes);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'status',
        'absenceNoticedAt',
        'riskLevel',
        'policeNotified',
        'placingAuthorityNotified',
        'returnedAt',
        'reportedById',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('organisationId is not null', () => {
    expect(missingEpisodes.organisationId.notNull).toBe(true);
  });

  it('status defaults to open', () => {
    expect(missingEpisodes.status.default).toBe('open');
  });

  it('policeNotified defaults to false', () => {
    expect(missingEpisodes.policeNotified.default).toBe(false);
  });

  it('placingAuthorityNotified defaults to false', () => {
    expect(missingEpisodes.placingAuthorityNotified.default).toBe(false);
  });

  it('escalationThresholdMinutes defaults to 30', () => {
    expect(missingEpisodes.escalationThresholdMinutes.default).toBe(30);
  });

  it('exports MissingEpisode and NewMissingEpisode types', () => {
    const episode: MissingEpisode = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      philomenaProfileId: null,
      status: 'open',
      absenceNoticedAt: new Date(),
      lastSeenAt: null,
      lastSeenLocation: null,
      lastSeenClothing: null,
      initialActionsTaken: null,
      riskLevel: 'high',
      riskAssessmentNotes: null,
      previousEpisodeCount: 0,
      escalationThresholdMinutes: 30,
      policeNotified: false,
      policeNotifiedAt: null,
      policeReference: null,
      placingAuthorityNotified: false,
      placingAuthorityNotifiedAt: null,
      placingAuthorityContact: null,
      responsibleIndividualNotified: false,
      responsibleIndividualNotifiedAt: null,
      returnedAt: null,
      returnMethod: null,
      wellbeingCheckCompleted: false,
      wellbeingCheckNotes: null,
      reportedById: null,
      closedById: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(episode.riskLevel).toBe('high');

    const newEpisode: NewMissingEpisode = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      absenceNoticedAt: new Date(),
      riskLevel: 'high',
    };
    expect(newEpisode.riskLevel).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// missing_episode_timeline
// ---------------------------------------------------------------------------

describe('missingEpisodeTimeline schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(missingEpisodeTimeline)).toBe(
      'missing_episode_timeline',
    );
  });

  it('defines all required columns', () => {
    const cols = Object.keys(missingEpisodeTimeline);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'episodeId',
        'actionType',
        'description',
        'occurredAt',
        'recordedById',
        'metadata',
        'createdAt',
      ]),
    );
  });

  it('organisationId is not null', () => {
    expect(missingEpisodeTimeline.organisationId.notNull).toBe(true);
  });

  it('episodeId is not null', () => {
    expect(missingEpisodeTimeline.episodeId.notNull).toBe(true);
  });

  it('exports timeline entry types', () => {
    const entry: MissingEpisodeTimelineEntry = {
      id: 'uuid',
      organisationId: 'org-uuid',
      episodeId: 'episode-uuid',
      actionType: 'police_notified',
      description: 'Police notified',
      occurredAt: new Date(),
      recordedById: null,
      metadata: null,
      createdAt: new Date(),
    };
    expect(entry.actionType).toBe('police_notified');

    const newEntry: NewMissingEpisodeTimelineEntry = {
      organisationId: 'org-uuid',
      episodeId: 'episode-uuid',
      actionType: 'police_notified',
      description: 'Police notified',
      occurredAt: new Date(),
    };
    expect(newEntry.actionType).toBe('police_notified');
  });
});

// ---------------------------------------------------------------------------
// return_home_interviews
// ---------------------------------------------------------------------------

describe('returnHomeInterviews schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(returnHomeInterviews)).toBe('return_home_interviews');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(returnHomeInterviews);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'episodeId',
        'status',
        'deadlineAt',
        'deadlineBreached',
        'whereChildWas',
        'whoChildWasWith',
        'whatHappened',
        'childAccount',
        'risksIdentified',
        'exploitationConcerns',
        'exploitationDetails',
        'safeguardingReferralNeeded',
        'actionsRecommended',
        'childDeclined',
        'declineReason',
        'conductedById',
        'completedAt',
        'escalatedToRi',
        'escalatedAt',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('organisationId is not null', () => {
    expect(returnHomeInterviews.organisationId.notNull).toBe(true);
  });

  it('status defaults to pending', () => {
    expect(returnHomeInterviews.status.default).toBe('pending');
  });

  it('deadlineBreached defaults to false', () => {
    expect(returnHomeInterviews.deadlineBreached.default).toBe(false);
  });

  it('escalatedToRi defaults to false', () => {
    expect(returnHomeInterviews.escalatedToRi.default).toBe(false);
  });

  it('safeguardingReferralNeeded defaults to false', () => {
    expect(returnHomeInterviews.safeguardingReferralNeeded.default).toBe(false);
  });

  it('childDeclined defaults to false', () => {
    expect(returnHomeInterviews.childDeclined.default).toBe(false);
  });

  it('exports ReturnHomeInterview and NewReturnHomeInterview types', () => {
    const rhi: ReturnHomeInterview = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      episodeId: 'episode-uuid',
      status: 'pending',
      deadlineAt: new Date(),
      deadlineBreached: false,
      whereChildWas: null,
      whoChildWasWith: null,
      whatHappened: null,
      childAccount: null,
      risksIdentified: null,
      exploitationConcerns: null,
      exploitationDetails: null,
      safeguardingReferralNeeded: false,
      actionsRecommended: null,
      childDeclined: false,
      declineReason: null,
      conductedById: null,
      completedAt: null,
      escalatedToRi: false,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(rhi.status).toBe('pending');

    const newRhi: NewReturnHomeInterview = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      episodeId: 'episode-uuid',
      deadlineAt: new Date(),
    };
    expect(newRhi.episodeId).toBe('episode-uuid');
  });
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

describe('missing-from-care relations', () => {
  it('philomenaProfilesRelations is defined', () => {
    expect(philomenaProfilesRelations).toBeDefined();
  });

  it('missingEpisodesRelations is defined', () => {
    expect(missingEpisodesRelations).toBeDefined();
  });

  it('missingEpisodeTimelineRelations is defined', () => {
    expect(missingEpisodeTimelineRelations).toBeDefined();
  });

  it('returnHomeInterviewsRelations is defined', () => {
    expect(returnHomeInterviewsRelations).toBeDefined();
  });
});
