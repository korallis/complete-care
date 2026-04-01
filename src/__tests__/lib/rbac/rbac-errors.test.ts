/**
 * RBAC Error Classes Tests
 *
 * Validates:
 * - UnauthenticatedError is exported and has correct properties
 * - UnauthorizedError is exported and has correct properties
 * - Error types can be distinguished with instanceof
 */

import { describe, it, expect } from 'vitest';
// Import from the pure errors module (no DB/auth dependencies)
import { UnauthenticatedError, UnauthorizedError } from '../../../lib/rbac/errors';

describe('UnauthenticatedError', () => {
  it('has the correct name', () => {
    const err = new UnauthenticatedError();
    expect(err.name).toBe('UnauthenticatedError');
  });

  it('has a default message', () => {
    const err = new UnauthenticatedError();
    expect(err.message).toBe('Authentication required');
  });

  it('accepts a custom message', () => {
    const err = new UnauthenticatedError('Custom auth error');
    expect(err.message).toBe('Custom auth error');
  });

  it('is an instance of Error', () => {
    const err = new UnauthenticatedError();
    expect(err).toBeInstanceOf(Error);
  });

  it('is NOT an instance of UnauthorizedError', () => {
    const err = new UnauthenticatedError();
    expect(err).not.toBeInstanceOf(UnauthorizedError);
  });
});

describe('UnauthorizedError', () => {
  it('has the correct name', () => {
    const err = new UnauthorizedError();
    expect(err.name).toBe('UnauthorizedError');
  });

  it('has a default message', () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe('Insufficient permissions');
  });

  it('accepts a custom message with action and resource', () => {
    const err = new UnauthorizedError('Denied', 'update', 'persons');
    expect(err.message).toBe('Denied');
    expect(err.action).toBe('update');
    expect(err.resource).toBe('persons');
  });

  it('is an instance of Error', () => {
    const err = new UnauthorizedError();
    expect(err).toBeInstanceOf(Error);
  });

  it('is NOT an instance of UnauthenticatedError', () => {
    const err = new UnauthorizedError();
    expect(err).not.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('Error type discrimination', () => {
  it('can distinguish UnauthenticatedError from UnauthorizedError', () => {
    const authErr = new UnauthenticatedError();
    const permErr = new UnauthorizedError();

    // UnauthenticatedError → 401
    const status401 = authErr instanceof UnauthenticatedError ? 401 : 403;
    expect(status401).toBe(401);

    // UnauthorizedError → 403
    const status403 = permErr instanceof UnauthenticatedError ? 401 : 403;
    expect(status403).toBe(403);
  });
});
