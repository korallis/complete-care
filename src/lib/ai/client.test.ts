import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAIAvailable, getBedrockProvider } from './client';

describe('AI Client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear AWS env vars for clean tests
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('isAIAvailable', () => {
    it('returns false when credentials are missing', () => {
      expect(isAIAvailable()).toBe(false);
    });

    it('returns false when only access key is set', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      expect(isAIAvailable()).toBe(false);
    });

    it('returns true when both credentials are set', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      expect(isAIAvailable()).toBe(true);
    });
  });

  describe('getBedrockProvider', () => {
    it('throws when credentials are missing', () => {
      expect(() => getBedrockProvider()).toThrow(
        'AWS Bedrock credentials not configured',
      );
    });

    it('returns a provider when credentials are set', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      const provider = getBedrockProvider();
      expect(provider).toBeDefined();
      expect(typeof provider).toBe('function');
    });
  });
});
