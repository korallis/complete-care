import { describe, it, expect } from 'vitest';
import {
  checkPhotoConsent,
  grantConsent,
  withdrawConsent,
  needsReview,
  getActiveConsents,
  getConsentHistory,
  getGalleryPhotos,
  filterPhotosByTag,
} from './manager';
import type { Consent, PhotoRecord } from './types';

const makeConsent = (overrides: Partial<Consent> = {}): Consent => ({
  id: 'consent-1',
  personId: 'person-1',
  consentType: 'photography',
  status: 'granted',
  grantedDate: '2026-01-15',
  withdrawnDate: null,
  givenBy: 'John Parent',
  relationship: 'parent',
  conditions: null,
  reviewDate: null,
  ...overrides,
});

const makePhoto = (overrides: Partial<PhotoRecord> = {}): PhotoRecord => ({
  id: 'photo-1',
  personId: 'person-1',
  imageUrl: 'https://example.com/photo1.jpg',
  thumbnailUrl: 'https://example.com/thumb1.jpg',
  caption: 'Birthday party',
  takenDate: '2026-03-15',
  uploadedBy: 'staff-1',
  consentVerified: true,
  consentRecordId: 'consent-1',
  tags: ['activity', 'birthday'],
  ...overrides,
});

describe('checkPhotoConsent', () => {
  it('allows upload when active photography consent exists', () => {
    const consents = [makeConsent()];

    const result = checkPhotoConsent(consents, 'person-1');

    expect(result.allowed).toBe(true);
    expect(result.consentRecordId).toBe('consent-1');
  });

  it('denies upload when no photography consent exists', () => {
    const result = checkPhotoConsent([], 'person-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No photography consent');
  });

  it('denies upload when consent has been withdrawn', () => {
    const consents = [
      makeConsent({ status: 'withdrawn', withdrawnDate: '2026-03-01' }),
    ];

    const result = checkPhotoConsent(consents, 'person-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('withdrawn');
  });

  it('uses the most recent consent record', () => {
    const consents = [
      makeConsent({ id: 'old', grantedDate: '2025-01-01', status: 'granted' }),
      makeConsent({
        id: 'newer',
        grantedDate: '2026-06-01',
        status: 'withdrawn',
        withdrawnDate: '2026-06-15',
      }),
    ];

    const result = checkPhotoConsent(consents, 'person-1');

    expect(result.allowed).toBe(false);
    expect(result.consentRecordId).toBe('newer');
  });

  it('ignores non-photography consent types', () => {
    const consents = [makeConsent({ consentType: 'data_sharing' })];

    const result = checkPhotoConsent(consents, 'person-1');
    expect(result.allowed).toBe(false);
  });
});

describe('grantConsent', () => {
  it('creates a granted consent record', () => {
    const result = grantConsent({
      id: 'consent-new',
      personId: 'person-1',
      consentType: 'medical_treatment',
      grantedDate: '2026-04-01',
      givenBy: 'Jane Self',
      relationship: 'self',
      conditions: 'Only for routine treatments',
      reviewDate: '2027-04-01',
    });

    expect(result.status).toBe('granted');
    expect(result.withdrawnDate).toBeNull();
    expect(result.consentType).toBe('medical_treatment');
  });
});

describe('withdrawConsent', () => {
  it('sets status to withdrawn with date', () => {
    const consent = makeConsent();

    const result = withdrawConsent(consent, '2026-04-01');

    expect(result.status).toBe('withdrawn');
    expect(result.withdrawnDate).toBe('2026-04-01');
  });

  it('returns unchanged if already withdrawn', () => {
    const consent = makeConsent({ status: 'withdrawn', withdrawnDate: '2026-03-01' });

    const result = withdrawConsent(consent, '2026-04-01');

    expect(result.withdrawnDate).toBe('2026-03-01');
  });
});

describe('needsReview', () => {
  it('returns true when review date has passed', () => {
    const consent = makeConsent({ reviewDate: '2026-01-01' });
    expect(needsReview(consent, '2026-04-01')).toBe(true);
  });

  it('returns false when review date is in the future', () => {
    const consent = makeConsent({ reviewDate: '2027-01-01' });
    expect(needsReview(consent, '2026-04-01')).toBe(false);
  });

  it('returns false when no review date set', () => {
    const consent = makeConsent({ reviewDate: null });
    expect(needsReview(consent, '2026-04-01')).toBe(false);
  });
});

describe('getActiveConsents', () => {
  it('returns only granted consents for a person', () => {
    const consents = [
      makeConsent({ id: 'c1', status: 'granted' }),
      makeConsent({ id: 'c2', status: 'withdrawn' }),
      makeConsent({ id: 'c3', personId: 'person-2', status: 'granted' }),
    ];

    const result = getActiveConsents(consents, 'person-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });

  it('filters by consent type when specified', () => {
    const consents = [
      makeConsent({ id: 'c1', consentType: 'photography' }),
      makeConsent({ id: 'c2', consentType: 'outings' }),
    ];

    const result = getActiveConsents(consents, 'person-1', 'outings');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });
});

describe('getConsentHistory', () => {
  it('returns all records sorted newest first', () => {
    const consents = [
      makeConsent({ id: 'c1', grantedDate: '2025-01-01' }),
      makeConsent({ id: 'c2', grantedDate: '2026-06-01' }),
      makeConsent({ id: 'c3', grantedDate: '2025-06-01' }),
    ];

    const result = getConsentHistory(consents, 'person-1');
    expect(result.map((c) => c.id)).toEqual(['c2', 'c3', 'c1']);
  });
});

describe('getGalleryPhotos', () => {
  it('returns only consent-verified photos for the person', () => {
    const photos = [
      makePhoto({ id: 'p1', consentVerified: true }),
      makePhoto({ id: 'p2', consentVerified: false }),
      makePhoto({ id: 'p3', personId: 'person-2', consentVerified: true }),
    ];

    const result = getGalleryPhotos(photos, 'person-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('sorts by taken date (newest first)', () => {
    const photos = [
      makePhoto({ id: 'p1', takenDate: '2026-01-01' }),
      makePhoto({ id: 'p2', takenDate: '2026-06-01' }),
    ];

    const result = getGalleryPhotos(photos, 'person-1');
    expect(result[0].id).toBe('p2');
  });
});

describe('filterPhotosByTag', () => {
  it('filters photos by tag', () => {
    const photos = [
      makePhoto({ id: 'p1', tags: ['activity', 'birthday'] }),
      makePhoto({ id: 'p2', tags: ['outing'] }),
    ];

    const result = filterPhotosByTag(photos, 'birthday');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });
});
