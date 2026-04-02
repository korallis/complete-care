/**
 * Consent management and photo sharing logic.
 *
 * - Record/withdraw consent per person with date tracking.
 * - Check consent before photo uploads.
 * - Photo gallery helpers.
 */
import type {
  Consent,
  ConsentType,
  ConsentCheckResult,
  PhotoRecord,
} from './types';

/**
 * Check whether a person has active consent for photography.
 * Returns a result indicating whether photo upload is allowed.
 */
export function checkPhotoConsent(
  consents: Consent[],
  personId: string,
): ConsentCheckResult {
  const photographyConsents = consents.filter(
    (c) => c.personId === personId && c.consentType === 'photography',
  );

  if (photographyConsents.length === 0) {
    return {
      allowed: false,
      consentRecordId: null,
      reason: 'No photography consent record found for this person.',
    };
  }

  // Find the most recent consent record
  const sorted = [...photographyConsents].sort(
    (a, b) => new Date(b.grantedDate).getTime() - new Date(a.grantedDate).getTime(),
  );

  const latest = sorted[0];

  if (latest.status === 'withdrawn') {
    return {
      allowed: false,
      consentRecordId: latest.id,
      reason: `Photography consent was withdrawn on ${latest.withdrawnDate}.`,
    };
  }

  return {
    allowed: true,
    consentRecordId: latest.id,
    reason: 'Active photography consent found.',
  };
}

/**
 * Grant consent for a person.
 * Returns an updated consent record with status 'granted'.
 */
export function grantConsent(
  consent: Omit<Consent, 'status' | 'withdrawnDate'>,
): Consent {
  return {
    ...consent,
    status: 'granted',
    withdrawnDate: null,
  };
}

/**
 * Withdraw existing consent.
 * Returns an updated consent record with status 'withdrawn' and the withdrawal date.
 */
export function withdrawConsent(consent: Consent, withdrawnDate: string): Consent {
  if (consent.status === 'withdrawn') {
    return consent; // Already withdrawn
  }

  return {
    ...consent,
    status: 'withdrawn',
    withdrawnDate,
  };
}

/**
 * Check whether a consent record needs review (review date has passed).
 */
export function needsReview(consent: Consent, currentDate: string): boolean {
  if (!consent.reviewDate) return false;
  return new Date(consent.reviewDate) <= new Date(currentDate);
}

/**
 * Get all active consents for a person, optionally filtered by type.
 */
export function getActiveConsents(
  consents: Consent[],
  personId: string,
  consentType?: ConsentType,
): Consent[] {
  return consents.filter(
    (c) =>
      c.personId === personId &&
      c.status === 'granted' &&
      (consentType === undefined || c.consentType === consentType),
  );
}

/**
 * Get consent history for a person (all records, sorted newest first).
 */
export function getConsentHistory(
  consents: Consent[],
  personId: string,
): Consent[] {
  return consents
    .filter((c) => c.personId === personId)
    .sort((a, b) => new Date(b.grantedDate).getTime() - new Date(a.grantedDate).getTime());
}

/**
 * Filter photos for a gallery view — only photos with verified consent.
 */
export function getGalleryPhotos(
  photos: PhotoRecord[],
  personId: string,
): PhotoRecord[] {
  return photos
    .filter((p) => p.personId === personId && p.consentVerified)
    .sort((a, b) => {
      const dateA = a.takenDate ? new Date(a.takenDate).getTime() : 0;
      const dateB = b.takenDate ? new Date(b.takenDate).getTime() : 0;
      return dateB - dateA;
    });
}

/**
 * Filter photos by tag.
 */
export function filterPhotosByTag(photos: PhotoRecord[], tag: string): PhotoRecord[] {
  return photos.filter((p) => p.tags.includes(tag));
}
