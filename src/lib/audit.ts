/**
 * Audit Trail Utility
 *
 * Provides the `auditLog()` function for recording every data mutation in the
 * platform. Required for CQC/Ofsted regulatory compliance.
 *
 * IMMUTABILITY CONTRACT:
 * - Only INSERT operations are allowed on the audit_logs table.
 * - This function NEVER updates or deletes audit entries.
 * - Audit failures are silently suppressed — we must not let audit errors
 *   break the main application flow.
 *
 * Usage:
 * ```typescript
 * await auditLog('create', 'person', personId, {
 *   before: null,
 *   after: { name: 'Alice', dob: '1990-01-01' },
 * });
 * ```
 */

import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction = 'create' | 'update' | 'delete' | string;

export type AuditChanges = {
  /** State of the entity before the mutation. Null for create operations. */
  before?: Record<string, unknown> | null;
  /** State of the entity after the mutation. Null for delete operations. */
  after?: Record<string, unknown> | null;
};

export type AuditLogOptions = {
  /** The ID of the user who performed the action. */
  userId?: string | null;
  /** The organisation context for this event. */
  organisationId?: string | null;
  /** The IP address of the client request. */
  ipAddress?: string | null;
};

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Records an immutable audit trail entry for a data mutation.
 *
 * This function NEVER throws — audit failures are silently suppressed to
 * prevent audit logging from blocking the main application flow.
 *
 * @param action - The type of operation: 'create' | 'update' | 'delete' | custom
 * @param entityType - The type of entity affected (e.g., 'person', 'care_plan', 'staff')
 * @param entityId - The ID of the affected entity
 * @param changes - Optional before/after snapshot of changed fields
 * @param opts - Optional user/org/IP context (if not provided, logged as system event)
 */
export async function auditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes?: AuditChanges,
  opts?: AuditLogOptions,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action,
      entityType,
      entityId,
      changes: changes ?? null,
      userId: opts?.userId ?? null,
      organisationId: opts?.organisationId ?? null,
      ipAddress: opts?.ipAddress ?? null,
    });
  } catch (error) {
    // Silently suppress audit failures — regulatory compliance requires us to
    // log, but an audit failure must NOT block the user's primary operation.
    // In production, this should be forwarded to an error monitoring service.
    console.error('[audit] Failed to write audit log entry:', error);
  }
}
