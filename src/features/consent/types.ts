/**
 * Types for consent management and photo sharing.
 */

/** Supported consent types. */
export type ConsentType =
  | 'photography'
  | 'data_sharing'
  | 'medical_treatment'
  | 'outings'
  | 'social_media'
  | 'research'
  | 'third_party_sharing';

/** Consent status. */
export type ConsentStatus = 'granted' | 'withdrawn';

/** Relationship of consent giver to the person. */
export type ConsentRelationship = 'self' | 'parent' | 'guardian' | 'social_worker' | 'other';

/** Consent record for a person. */
export interface Consent {
  id: string;
  personId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  grantedDate: string;
  withdrawnDate: string | null;
  givenBy: string;
  relationship: ConsentRelationship;
  conditions: string | null;
  reviewDate: string | null;
}

/** Photo record linked to a person. */
export interface PhotoRecord {
  id: string;
  personId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  takenDate: string | null;
  uploadedBy: string;
  consentVerified: boolean;
  consentRecordId: string | null;
  tags: string[];
}

/** Result of a consent check before photo upload. */
export interface ConsentCheckResult {
  allowed: boolean;
  consentRecordId: string | null;
  reason: string;
}
