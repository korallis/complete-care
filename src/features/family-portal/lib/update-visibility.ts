/**
 * Shared visibility rules for family-portal updates.
 *
 * Photo updates must only be visible when the linked person has active
 * photography consent. Non-photo updates remain visible regardless.
 */

export interface FamilyPortalUpdateVisibilityRecord {
  updateType: string;
  mediaUrls?: string[] | null;
}

export function requiresPhotoConsent(
  update: FamilyPortalUpdateVisibilityRecord,
): boolean {
  return update.updateType === 'photo' || (update.mediaUrls?.length ?? 0) > 0;
}

export function filterUpdatesForFamilyPortal<T extends FamilyPortalUpdateVisibilityRecord>(
  updates: T[],
  hasActivePhotographyConsent: boolean,
): T[] {
  if (hasActivePhotographyConsent) {
    return updates;
  }

  return updates.filter((update) => !requiresPhotoConsent(update));
}
