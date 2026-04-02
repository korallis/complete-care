'use server';

/**
 * Contact Management server actions.
 *
 * Every mutation:
 * 1. Validates input with Zod
 * 2. Checks auth & RBAC
 * 3. Enforces tenant isolation via organisationId
 * 4. Writes an audit log entry
 *
 * VAL-CHILD-014: Approved contacts with court order restrictions enforced
 * VAL-CHILD-015: Contact scheduling and recording with emotional presentation
 */

import { db } from '@/lib/db';
import {
  approvedContacts,
  contactSchedules,
  contactRecords,
  auditLogs,
} from '@/lib/db/schema';
import { eq, and, count, gte, lte } from 'drizzle-orm';
import type { ActionResult } from '@/types';
import type {
  ApprovedContact,
  ContactSchedule,
  ContactRecord,
} from '@/lib/db/schema';
import {
  createApprovedContactSchema,
  updateApprovedContactSchema,
  createContactScheduleSchema,
  updateContactScheduleStatusSchema,
  createContactRecordSchema,
} from './schema';

// ---------------------------------------------------------------------------
// Auth helpers (placeholder — real implementation comes from auth module)
// ---------------------------------------------------------------------------

type SessionContext = {
  userId: string;
  organisationId: string;
  role: string;
};

/**
 * Placeholder: in production this reads from the Auth.js session cookie.
 * The auth feature will provide `requireAuth()` and `requireRole()`.
 */
async function requireAuth(): Promise<SessionContext> {
  // TODO: wire up to Auth.js v5 session
  throw new Error(
    'Auth not yet wired — replace with real session check from auth feature',
  );
}

function hasRole(
  userRole: string,
  minimumRole: string,
): boolean {
  const hierarchy = [
    'owner',
    'admin',
    'manager',
    'senior_carer',
    'carer',
    'viewer',
  ];
  return hierarchy.indexOf(userRole) <= hierarchy.indexOf(minimumRole);
}

// ---------------------------------------------------------------------------
// Approved Contacts CRUD
// ---------------------------------------------------------------------------

export async function createApprovedContact(
  input: unknown,
): Promise<ActionResult<ApprovedContact>> {
  const session = await requireAuth();
  if (!hasRole(session.role, 'senior_carer')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const parsed = createApprovedContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const [contact] = await db
    .insert(approvedContacts)
    .values({
      organisationId: session.organisationId,
      personId: data.personId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      allowedContactTypes: data.allowedContactTypes,
      frequency: data.frequency || null,
      supervisionLevel: data.supervisionLevel,
      hasRestrictions: data.hasRestrictions,
      courtOrderReference: data.courtOrderReference || null,
      courtOrderDate: data.courtOrderDate || null,
      courtOrderConditions: data.courtOrderConditions || null,
      approvedById: session.userId,
      approvedAt: new Date(),
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: session.userId,
    organisationId: session.organisationId,
    action: 'create',
    entityType: 'approved_contact',
    entityId: contact.id,
    changes: { before: null, after: contact },
  });

  return { success: true, data: contact };
}

export async function updateApprovedContact(
  input: unknown,
): Promise<ActionResult<ApprovedContact>> {
  const session = await requireAuth();
  if (!hasRole(session.role, 'senior_carer')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const parsed = updateApprovedContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...updates } = parsed.data;

  // Fetch existing — enforce tenant isolation
  const [existing] = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.id, id),
        eq(approvedContacts.organisationId, session.organisationId),
      ),
    );

  if (!existing) {
    return { success: false, error: 'Contact not found' };
  }

  const [updated] = await db
    .update(approvedContacts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(approvedContacts.id, id))
    .returning();

  await db.insert(auditLogs).values({
    userId: session.userId,
    organisationId: session.organisationId,
    action: 'update',
    entityType: 'approved_contact',
    entityId: id,
    changes: { before: existing, after: updated },
  });

  return { success: true, data: updated };
}

export async function getApprovedContacts(
  personId: string,
): Promise<ActionResult<ApprovedContact[]>> {
  const session = await requireAuth();

  const contacts = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.organisationId, session.organisationId),
        eq(approvedContacts.personId, personId),
        eq(approvedContacts.isActive, true),
      ),
    );

  return { success: true, data: contacts };
}

// ---------------------------------------------------------------------------
// Contact Scheduling
// ---------------------------------------------------------------------------

/**
 * Schedule a contact visit. Validates against the approved register:
 * - Contact must be in the approved register
 * - Restricted contacts require manager override with justification
 * - Contact type must be in the allowed types
 */
export async function createContactSchedule(
  input: unknown,
): Promise<ActionResult<ContactSchedule>> {
  const session = await requireAuth();
  if (!hasRole(session.role, 'carer')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const parsed = createContactScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // VAL-CHILD-014: Validate against approved register
  const [approvedContact] = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.id, data.approvedContactId),
        eq(approvedContacts.organisationId, session.organisationId),
        eq(approvedContacts.personId, data.personId),
        eq(approvedContacts.isActive, true),
      ),
    );

  if (!approvedContact) {
    return {
      success: false,
      error:
        'BLOCKING: Contact is not in the approved register. Cannot schedule unapproved contact.',
    };
  }

  // Validate contact type is allowed
  if (!approvedContact.allowedContactTypes.includes(data.contactType)) {
    return {
      success: false,
      error: `Contact type "${data.contactType}" is not permitted for this contact. Allowed: ${approvedContact.allowedContactTypes.join(', ')}`,
    };
  }

  // VAL-CHILD-014: Restricted contacts require manager override
  if (approvedContact.hasRestrictions) {
    if (!data.managerOverride) {
      return {
        success: false,
        error:
          'RESTRICTED: This contact has court-ordered restrictions. Manager override with justification is required.',
      };
    }
    if (!hasRole(session.role, 'manager')) {
      return {
        success: false,
        error:
          'Only a manager or above can override contact restrictions.',
      };
    }
  }

  const [schedule] = await db
    .insert(contactSchedules)
    .values({
      organisationId: session.organisationId,
      personId: data.personId,
      approvedContactId: data.approvedContactId,
      contactType: data.contactType,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes ?? null,
      supervisionLevel: data.supervisionLevel,
      location: data.location || null,
      managerOverride: data.managerOverride,
      overrideById: data.managerOverride ? session.userId : null,
      overrideJustification: data.overrideJustification || null,
      createdById: session.userId,
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: session.userId,
    organisationId: session.organisationId,
    action: 'create',
    entityType: 'contact_schedule',
    entityId: schedule.id,
    changes: {
      before: null,
      after: schedule,
      managerOverride: data.managerOverride,
      restrictedContact: approvedContact.hasRestrictions,
    },
  });

  return { success: true, data: schedule };
}

export async function updateContactScheduleStatus(
  input: unknown,
): Promise<ActionResult<ContactSchedule>> {
  const session = await requireAuth();
  if (!hasRole(session.role, 'carer')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const parsed = updateContactScheduleStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, status } = parsed.data;

  const [existing] = await db
    .select()
    .from(contactSchedules)
    .where(
      and(
        eq(contactSchedules.id, id),
        eq(contactSchedules.organisationId, session.organisationId),
      ),
    );

  if (!existing) {
    return { success: false, error: 'Schedule not found' };
  }

  const [updated] = await db
    .update(contactSchedules)
    .set({ status, updatedAt: new Date() })
    .where(eq(contactSchedules.id, id))
    .returning();

  await db.insert(auditLogs).values({
    userId: session.userId,
    organisationId: session.organisationId,
    action: 'update',
    entityType: 'contact_schedule',
    entityId: id,
    changes: { before: { status: existing.status }, after: { status } },
  });

  return { success: true, data: updated };
}

export async function getContactSchedules(
  personId: string,
): Promise<ActionResult<ContactSchedule[]>> {
  const session = await requireAuth();

  const schedules = await db
    .select()
    .from(contactSchedules)
    .where(
      and(
        eq(contactSchedules.organisationId, session.organisationId),
        eq(contactSchedules.personId, personId),
      ),
    );

  return { success: true, data: schedules };
}

// ---------------------------------------------------------------------------
// Contact Records
// ---------------------------------------------------------------------------

/**
 * Record a contact event. Validates the contact is in the approved register.
 * VAL-CHILD-015: Captures emotional presentation before/during/after.
 */
export async function createContactRecord(
  input: unknown,
): Promise<ActionResult<ContactRecord>> {
  const session = await requireAuth();
  if (!hasRole(session.role, 'carer')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const parsed = createContactRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Validate approved contact exists in this tenant
  const [approvedContact] = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.id, data.approvedContactId),
        eq(approvedContacts.organisationId, session.organisationId),
      ),
    );

  if (!approvedContact) {
    return {
      success: false,
      error: 'Contact is not in the approved register.',
    };
  }

  const [record] = await db
    .insert(contactRecords)
    .values({
      organisationId: session.organisationId,
      personId: data.personId,
      approvedContactId: data.approvedContactId,
      contactScheduleId: data.contactScheduleId || null,
      contactType: data.contactType,
      contactDate: new Date(data.contactDate),
      durationMinutes: data.durationMinutes ?? null,
      supervisionLevel: data.supervisionLevel,
      whoPresent: data.whoPresent || null,
      location: data.location || null,
      emotionalBefore: data.emotionalBefore || null,
      emotionalDuring: data.emotionalDuring || null,
      emotionalAfter: data.emotionalAfter || null,
      notes: data.notes || null,
      concerns: data.concerns || null,
      disclosures: data.disclosures || null,
      recordedById: session.userId,
    })
    .returning();

  // If linked to a schedule, mark it completed
  if (data.contactScheduleId) {
    await db
      .update(contactSchedules)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(
        and(
          eq(contactSchedules.id, data.contactScheduleId),
          eq(contactSchedules.organisationId, session.organisationId),
        ),
      );
  }

  await db.insert(auditLogs).values({
    userId: session.userId,
    organisationId: session.organisationId,
    action: 'create',
    entityType: 'contact_record',
    entityId: record.id,
    changes: {
      before: null,
      after: record,
      hasConcerns: !!data.concerns,
      hasDisclosures: !!data.disclosures,
    },
  });

  return { success: true, data: record };
}

export async function getContactRecords(
  personId: string,
): Promise<ActionResult<ContactRecord[]>> {
  const session = await requireAuth();

  const records = await db
    .select()
    .from(contactRecords)
    .where(
      and(
        eq(contactRecords.organisationId, session.organisationId),
        eq(contactRecords.personId, personId),
      ),
    );

  return { success: true, data: records };
}

// ---------------------------------------------------------------------------
// Compliance Tracking
// ---------------------------------------------------------------------------

export type ComplianceSummary = {
  approvedContactId: string;
  contactName: string;
  relationship: string;
  expectedFrequency: string | null;
  completedThisMonth: number;
  scheduledThisMonth: number;
};

/**
 * Get compliance summary for all approved contacts of a child.
 * Shows whether contact frequency matches the care plan.
 */
export async function getComplianceSummary(
  personId: string,
): Promise<ActionResult<ComplianceSummary[]>> {
  const session = await requireAuth();

  const contacts = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.organisationId, session.organisationId),
        eq(approvedContacts.personId, personId),
        eq(approvedContacts.isActive, true),
      ),
    );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const summaries: ComplianceSummary[] = [];

  for (const contact of contacts) {
    const [completedResult] = await db
      .select({ value: count() })
      .from(contactRecords)
      .where(
        and(
          eq(contactRecords.organisationId, session.organisationId),
          eq(contactRecords.approvedContactId, contact.id),
          gte(contactRecords.contactDate, monthStart),
          lte(contactRecords.contactDate, monthEnd),
        ),
      );

    const [scheduledResult] = await db
      .select({ value: count() })
      .from(contactSchedules)
      .where(
        and(
          eq(contactSchedules.organisationId, session.organisationId),
          eq(contactSchedules.approvedContactId, contact.id),
          gte(contactSchedules.scheduledAt, monthStart),
          lte(contactSchedules.scheduledAt, monthEnd),
        ),
      );

    summaries.push({
      approvedContactId: contact.id,
      contactName: contact.name,
      relationship: contact.relationship,
      expectedFrequency: contact.frequency,
      completedThisMonth: completedResult.value,
      scheduledThisMonth: scheduledResult.value,
    });
  }

  return { success: true, data: summaries };
}
