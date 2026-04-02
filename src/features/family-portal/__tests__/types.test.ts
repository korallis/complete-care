import { describe, it, expect } from 'vitest';
import {
  createInvitationSchema,
  sendMessageSchema,
  createUpdateSchema,
  reviewMessageSchema,
  reviewUpdateSchema,
  approveFamilyMemberSchema,
} from '../types';

describe('Family Portal validation schemas', () => {
  describe('createInvitationSchema', () => {
    it('accepts a valid invitation', () => {
      const result = createInvitationSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        email: 'parent@example.com',
        name: 'Jane Doe',
        relationship: 'parent',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid email', () => {
      const result = createInvitationSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        email: 'not-an-email',
        name: 'Jane Doe',
        relationship: 'parent',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty name', () => {
      const result = createInvitationSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        email: 'parent@example.com',
        name: '',
        relationship: 'parent',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid relationship', () => {
      const result = createInvitationSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        email: 'parent@example.com',
        name: 'Jane Doe',
        relationship: 'friend',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid UUID for personId', () => {
      const result = createInvitationSchema.safeParse({
        personId: 'not-a-uuid',
        email: 'parent@example.com',
        name: 'Jane Doe',
        relationship: 'parent',
      });
      expect(result.success).toBe(false);
    });

    it('accepts all valid relationship types', () => {
      const relationships = [
        'parent',
        'sibling',
        'spouse',
        'child',
        'guardian',
        'other',
      ] as const;

      for (const relationship of relationships) {
        const result = createInvitationSchema.safeParse({
          personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
          email: 'test@example.com',
          name: 'Test User',
          relationship,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('sendMessageSchema', () => {
    it('accepts a valid message', () => {
      const result = sendMessageSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        content: 'Hello, how is my mother doing today?',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an empty message', () => {
      const result = sendMessageSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a message exceeding 5000 characters', () => {
      const result = sendMessageSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        content: 'a'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createUpdateSchema', () => {
    it('accepts a valid update', () => {
      const result = createUpdateSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        title: 'Activity Day',
        content: 'We had a wonderful day at the park.',
        updateType: 'activity',
        mediaUrls: [],
      });
      expect(result.success).toBe(true);
    });

    it('defaults updateType to general', () => {
      const result = createUpdateSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        title: 'Daily Update',
        content: 'Everything is going well.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updateType).toBe('general');
      }
    });

    it('rejects more than 10 media URLs', () => {
      const result = createUpdateSchema.safeParse({
        personId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        title: 'Photos',
        content: 'Many photos!',
        mediaUrls: Array.from({ length: 11 }, (_, i) => `https://example.com/photo-${i}.jpg`),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reviewMessageSchema', () => {
    it('accepts approve action', () => {
      const result = reviewMessageSchema.safeParse({
        messageId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'approve',
      });
      expect(result.success).toBe(true);
    });

    it('accepts reject action', () => {
      const result = reviewMessageSchema.safeParse({
        messageId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'reject',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid action', () => {
      const result = reviewMessageSchema.safeParse({
        messageId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'delete',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reviewUpdateSchema', () => {
    it('accepts approve action', () => {
      const result = reviewUpdateSchema.safeParse({
        updateId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'approve',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = reviewUpdateSchema.safeParse({
        updateId: 'invalid',
        action: 'approve',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('approveFamilyMemberSchema', () => {
    it('accepts approve action', () => {
      const result = approveFamilyMemberSchema.safeParse({
        familyMemberId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'approve',
      });
      expect(result.success).toBe(true);
    });

    it('accepts reject action', () => {
      const result = approveFamilyMemberSchema.safeParse({
        familyMemberId: 'b5f5c8e0-1234-4abc-9def-abcdef123456',
        action: 'reject',
      });
      expect(result.success).toBe(true);
    });
  });
});
