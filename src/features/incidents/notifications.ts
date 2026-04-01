/**
 * Incident Notification Engine
 *
 * Handles automatic notifications for serious incidents:
 * - Serious/death incidents auto-notify managers and directors
 * - Duty of Candour triggers on serious incidents
 *
 * This module is server-only (imports from db/schema).
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications, memberships } from '@/lib/db/schema';
import type { Incident } from '@/lib/db/schema/incidents';
import {
  requiresAutoNotification,
  triggersDutyOfCandour,
  SEVERITY_LABELS,
  type SeverityLevel,
} from './constants';

// ---------------------------------------------------------------------------
// Notify managers/directors of serious incidents
// ---------------------------------------------------------------------------

/**
 * Creates notifications for all managers, admins, and owners in the organisation
 * when a serious incident (serious/death) is reported.
 *
 * Non-blocking: errors are logged but do not propagate.
 */
export async function notifySeriousIncident(
  incident: Incident,
  reporterName: string,
): Promise<void> {
  try {
    const severity = incident.severity as SeverityLevel;
    if (!requiresAutoNotification(severity)) return;

    // Find all managers, admins, and owners in the organisation
    const managementMembers = await db
      .select({
        userId: memberships.userId,
        role: memberships.role,
      })
      .from(memberships)
      .where(
        and(
          eq(memberships.organisationId, incident.organisationId),
          eq(memberships.status, 'active'),
        ),
      );

    const managementRoles = ['owner', 'admin', 'manager'];
    const notifyUserIds = managementMembers
      .filter((m) => managementRoles.includes(m.role))
      .map((m) => m.userId);

    if (notifyUserIds.length === 0) return;

    const severityLabel = SEVERITY_LABELS[severity];
    const dutyOfCandour = triggersDutyOfCandour(severity);

    const notificationValues = notifyUserIds.map((userId) => ({
      userId,
      organisationId: incident.organisationId,
      type: 'incident_serious',
      title: `${severityLabel} incident reported`,
      body: `A ${severityLabel.toLowerCase()} incident has been reported by ${reporterName} at ${incident.location}.${dutyOfCandour ? ' Duty of Candour applies.' : ''}`,
      entityType: 'incident',
      entityId: incident.id,
    }));

    // Batch insert all notifications
    await db.insert(notifications).values(notificationValues);
  } catch (error) {
    // Non-blocking — don't let notification errors break the main flow
    console.error('[notifySeriousIncident] Error:', error);
  }
}

// ---------------------------------------------------------------------------
// Duty of Candour notification
// ---------------------------------------------------------------------------

/**
 * Creates a Duty of Candour reminder notification for the reporter
 * when a serious incident is filed.
 */
export async function createDutyOfCandourReminder(
  incident: Incident,
): Promise<void> {
  try {
    const severity = incident.severity as SeverityLevel;
    if (!triggersDutyOfCandour(severity)) return;
    if (!incident.reportedById) return;

    await db.insert(notifications).values({
      userId: incident.reportedById,
      organisationId: incident.organisationId,
      type: 'incident_duty_of_candour',
      title: 'Duty of Candour required',
      body: 'This incident requires Duty of Candour. Please ensure the affected person and/or their family are informed openly and honestly about what happened.',
      entityType: 'incident',
      entityId: incident.id,
    });
  } catch (error) {
    console.error('[createDutyOfCandourReminder] Error:', error);
  }
}
