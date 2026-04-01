/**
 * RBAC Custom Error Classes
 *
 * These are in a separate file (no DB or auth imports) so they can be
 * imported in both the server-only RBAC module and in tests.
 */

/**
 * Thrown when the request is not authenticated (no valid session).
 * Maps to HTTP 401 Unauthorized.
 */
export class UnauthenticatedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

/**
 * Thrown when the authenticated user lacks required permissions.
 * Maps to HTTP 403 Forbidden.
 */
export class UnauthorizedError extends Error {
  readonly action?: string;
  readonly resource?: string;

  constructor(
    message: string = 'Insufficient permissions',
    action?: string,
    resource?: string,
  ) {
    super(message);
    this.name = 'UnauthorizedError';
    this.action = action;
    this.resource = resource;
  }
}
