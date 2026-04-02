import { describe, expect, it } from 'vitest';
import {
  filterUpdatesForFamilyPortal,
  requiresPhotoConsent,
} from '../lib/update-visibility';

describe('family portal update visibility', () => {
  it('treats explicit photo updates as consent-gated', () => {
    expect(
      requiresPhotoConsent({
        updateType: 'photo',
        mediaUrls: [],
      }),
    ).toBe(true);
  });

  it('treats updates with media as consent-gated even when typed differently', () => {
    expect(
      requiresPhotoConsent({
        updateType: 'activity',
        mediaUrls: ['https://example.com/photo.jpg'],
      }),
    ).toBe(true);
  });

  it('keeps only non-photo updates when photography consent is absent', () => {
    const updates = [
      { id: '1', updateType: 'general', mediaUrls: [] },
      { id: '2', updateType: 'photo', mediaUrls: [] },
      { id: '3', updateType: 'activity', mediaUrls: ['https://example.com/p.jpg'] },
    ];

    expect(filterUpdatesForFamilyPortal(updates, false)).toEqual([
      { id: '1', updateType: 'general', mediaUrls: [] },
    ]);
  });

  it('returns all updates when photography consent is active', () => {
    const updates = [
      { id: '1', updateType: 'general', mediaUrls: [] },
      { id: '2', updateType: 'photo', mediaUrls: ['https://example.com/p.jpg'] },
    ];

    expect(filterUpdatesForFamilyPortal(updates, true)).toEqual(updates);
  });
});
