/**
 * Tests for Missing from Care Zod validation schemas and utility functions.
 */
import { describe, it, expect } from 'vitest';
import {
  createPhilomenaProfileSchema,
  updatePhilomenaProfileSchema,
  createMissingEpisodeSchema,
  recordPoliceNotificationSchema,
  recordAuthorityNotificationSchema,
  recordReturnSchema,
  addTimelineEntrySchema,
  completeRhiSchema,
  escalateRhiSchema,
  isPhotoStale,
  isEscalationDue,
  calculateRhiDeadline,
  isRhiOverdue,
  PHOTO_STALENESS_DAYS,
  DEFAULT_ESCALATION_THRESHOLDS,
} from '../../../features/missing-from-care/schema';

// ---------------------------------------------------------------------------
// Philomena Profile schemas
// ---------------------------------------------------------------------------

describe('createPhilomenaProfileSchema', () => {
  it('accepts a valid minimal profile', () => {
    const result = createPhilomenaProfileSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a full profile with all fields', () => {
    const result = createPhilomenaProfileSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      photoUrl: 'https://example.com/photo.jpg',
      heightCm: 155,
      build: 'slim',
      hairDescription: 'Brown, shoulder length',
      eyeColour: 'Blue',
      distinguishingFeatures: 'Small scar on left cheek',
      ethnicity: 'White British',
      knownAssociates: [
        { name: 'John Doe', relationship: 'Friend', notes: 'Known from school' },
      ],
      likelyLocations: [
        { location: 'Town Centre', address: '123 High Street' },
      ],
      phoneNumbers: ['07700900000'],
      socialMedia: [{ platform: 'Instagram', handle: '@test' }],
      riskCse: true,
      riskCce: false,
      riskCountyLines: false,
      riskTrafficking: false,
      riskNotes: 'CSE concerns identified',
      medicalNeeds: 'Asthma',
      allergies: 'Penicillin',
      medications: 'Salbutamol inhaler',
      gpDetails: 'Dr Smith, High Street Surgery',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid personId', () => {
    const result = createPhilomenaProfileSchema.safeParse({
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid build value', () => {
    const result = createPhilomenaProfileSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      build: 'muscular',
    });
    expect(result.success).toBe(false);
  });

  it('rejects known associate without name', () => {
    const result = createPhilomenaProfileSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      knownAssociates: [{ name: '', relationship: 'Friend' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('updatePhilomenaProfileSchema', () => {
  it('requires an id', () => {
    const result = updatePhilomenaProfileSchema.safeParse({
      heightCm: 160,
    });
    expect(result.success).toBe(false);
  });

  it('accepts partial updates with id', () => {
    const result = updatePhilomenaProfileSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      heightCm: 160,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Missing Episode schemas
// ---------------------------------------------------------------------------

describe('createMissingEpisodeSchema', () => {
  it('accepts a valid episode', () => {
    const result = createMissingEpisodeSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      absenceNoticedAt: '2026-04-01T10:00:00Z',
      initialActionsTaken: 'Searched building and grounds',
      riskLevel: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing initial actions', () => {
    const result = createMissingEpisodeSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      absenceNoticedAt: '2026-04-01T10:00:00Z',
      initialActionsTaken: '',
      riskLevel: 'high',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid risk level', () => {
    const result = createMissingEpisodeSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      absenceNoticedAt: '2026-04-01T10:00:00Z',
      initialActionsTaken: 'Searched',
      riskLevel: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('coerces date strings to Date objects', () => {
    const result = createMissingEpisodeSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      absenceNoticedAt: '2026-04-01T10:00:00Z',
      initialActionsTaken: 'Searched',
      riskLevel: 'medium',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.absenceNoticedAt).toBeInstanceOf(Date);
    }
  });
});

describe('recordPoliceNotificationSchema', () => {
  it('accepts valid input', () => {
    const result = recordPoliceNotificationSchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      policeReference: 'CAD-12345',
      notifiedAt: '2026-04-01T10:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty police reference', () => {
    const result = recordPoliceNotificationSchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      policeReference: '',
      notifiedAt: '2026-04-01T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('recordAuthorityNotificationSchema', () => {
  it('accepts valid input', () => {
    const result = recordAuthorityNotificationSchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      placingAuthorityContact: 'Jane Smith, Social Worker',
      notifiedAt: '2026-04-01T10:45:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('recordReturnSchema', () => {
  it('accepts valid return data', () => {
    const result = recordReturnSchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      returnedAt: '2026-04-01T18:00:00Z',
      returnMethod: 'self',
      wellbeingCheckNotes: 'Child appeared tired but well',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid return method', () => {
    const result = recordReturnSchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      returnedAt: '2026-04-01T18:00:00Z',
      returnMethod: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});

describe('addTimelineEntrySchema', () => {
  it('accepts valid entry', () => {
    const result = addTimelineEntrySchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'search_conducted',
      description: 'Searched local park and shopping centre',
      occurredAt: '2026-04-01T10:15:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = addTimelineEntrySchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'note_added',
      description: '',
      occurredAt: '2026-04-01T10:15:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action type', () => {
    const result = addTimelineEntrySchema.safeParse({
      episodeId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'invalid_action',
      description: 'Something',
      occurredAt: '2026-04-01T10:15:00Z',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RHI schemas
// ---------------------------------------------------------------------------

describe('completeRhiSchema', () => {
  it('accepts valid RHI completion', () => {
    const result = completeRhiSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      whereChildWas: 'Town centre with friends',
      whoChildWasWith: 'Known associate from school',
      whatHappened: 'Left after argument with staff',
      childAccount: 'Felt upset and wanted space',
      risksIdentified: 'Potential CSE contact',
      exploitationConcerns: ['cse'],
      exploitationDetails: 'Was seen with older male',
      safeguardingReferralNeeded: true,
      actionsRecommended: 'Review placement plan, increase keyworker sessions',
    });
    expect(result.success).toBe(true);
  });

  it('requires the location field', () => {
    const result = completeRhiSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      whereChildWas: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts child declined interview', () => {
    const result = completeRhiSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      whereChildWas: 'Unknown - child declined',
      childDeclined: true,
      declineReason: 'Child did not want to discuss',
    });
    expect(result.success).toBe(true);
  });
});

describe('escalateRhiSchema', () => {
  it('accepts valid escalation', () => {
    const result = escalateRhiSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = escalateRhiSchema.safeParse({ id: 'not-uuid' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('isPhotoStale', () => {
  it('returns true for null photoUpdatedAt', () => {
    expect(isPhotoStale(null)).toBe(true);
  });

  it('returns true for a photo older than 90 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 91);
    expect(isPhotoStale(oldDate)).toBe(true);
  });

  it('returns false for a recent photo', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    expect(isPhotoStale(recentDate)).toBe(false);
  });

  it('returns false for a photo exactly at the boundary', () => {
    const boundaryDate = new Date();
    boundaryDate.setDate(boundaryDate.getDate() - PHOTO_STALENESS_DAYS);
    // At exactly the boundary, diffDays equals PHOTO_STALENESS_DAYS, which is not > threshold
    expect(isPhotoStale(boundaryDate)).toBe(false);
  });
});

describe('isEscalationDue', () => {
  it('returns true when threshold exceeded', () => {
    const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
    expect(isEscalationDue(thirtyOneMinutesAgo, 30)).toBe(true);
  });

  it('returns false when within threshold', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(isEscalationDue(tenMinutesAgo, 30)).toBe(false);
  });

  it('returns true when exactly at threshold', () => {
    const exactlyThirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(isEscalationDue(exactlyThirtyMinutesAgo, 30)).toBe(true);
  });
});

describe('calculateRhiDeadline', () => {
  it('returns a date 72 hours after the return time', () => {
    const returnTime = new Date('2026-04-01T18:00:00Z');
    const deadline = calculateRhiDeadline(returnTime);
    expect(deadline.toISOString()).toBe('2026-04-04T18:00:00.000Z');
  });
});

describe('isRhiOverdue', () => {
  it('returns true when past deadline', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(isRhiOverdue(pastDeadline)).toBe(true);
  });

  it('returns false when before deadline', () => {
    const futureDeadline = new Date(Date.now() + 60 * 60 * 1000);
    expect(isRhiOverdue(futureDeadline)).toBe(false);
  });
});

describe('DEFAULT_ESCALATION_THRESHOLDS', () => {
  it('has 30 minutes for high risk', () => {
    expect(DEFAULT_ESCALATION_THRESHOLDS.high).toBe(30);
  });

  it('has 60 minutes for medium risk', () => {
    expect(DEFAULT_ESCALATION_THRESHOLDS.medium).toBe(60);
  });

  it('has 120 minutes for low risk', () => {
    expect(DEFAULT_ESCALATION_THRESHOLDS.low).toBe(120);
  });
});
