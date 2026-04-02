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

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  approvedContacts,
  contactSchedules,
  contactRecords,
  organisations,
} from '@/lib/db/schema';
import { eq, and, count, gte, lte } from 'drizzle-orm';
import type { ActionResult } from '@/types';
import type {
  ApprovedContact,
  ContactSchedule,
  ContactRecord,
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import {
  createApprovedContactSchema,
  updateApprovedContactSchema,
  createContactScheduleSchema,
  updateContactScheduleStatusSchema,
  createContactRecordSchema,
} from './schema';

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  return org?.slug ?? null;
}

async function revalidateContactsPath(
  orgId: string,
  personId: string,
): Promise<void> {
  const slug = await getOrgSlug(orgId);
  if (!slug) return;
  revalidatePath(`/${slug}/persons/${personId}/contacts`);
}

// ---------------------------------------------------------------------------
// Approved Contacts CRUD
// ---------------------------------------------------------------------------

export async function createApprovedContact(
  input: unknown,
): Promise<ActionResult<ApprovedContact>> {
  const { orgId, userId } = await requirePermission('create', 'persons');

  const parsed = createApprovedContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const [contact] = await db
    .insert(approvedContacts)
    .values({
      organisationId: orgId,
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
      approvedById: userId,
      approvedAt: new Date(),
    })
    .returning();

  await auditLog('create', 'approved_contact', contact.id, {
    before: null,
    after: contact,
  }, { userId, organisationId: orgId });

  await revalidateContactsPath(orgId, data.personId);

  return { success: true, data: contact };
}

export async function updateApprovedContact(
  input: unknown,
): Promise<ActionResult<ApprovedContact>> {
  const { orgId, userId } = await requirePermission('update', 'persons');

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
        eq(approvedContacts.organisationId, orgId),
      ),
    );

  if (!existing) {
    return { success: false, error: 'Contact not found' };
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  const [updated] = await db
    .update(approvedContacts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(approvedContacts.id, id))
    .returning();

  await auditLog('update', 'approved_contact', id, {
    before: existing,
    after: updated,
  }, { userId, organisationId: orgId });

  await revalidateContactsPath(orgId, existing.personId);

  return { success: true, data: updated };
}

export async function getApprovedContacts(
  personId: string,
): Promise<ActionResult<ApprovedContact[]>> {
  const { orgId } = await requirePermission('read', 'persons');

  const contacts = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.organisationId, orgId),
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
  const { orgId, userId, role } = await requirePermission('create', 'persons');

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
        eq(approvedContacts.organisationId, orgId),
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
    const managerRoles = ['owner', 'admin', 'manager'];
    if (!managerRoles.includes(role)) {
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
      organisationId: orgId,
      personId: data.personId,
      approvedContactId: data.approvedContactId,
      contactType: data.contactType,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes ?? null,
      supervisionLevel: data.supervisionLevel,
      location: data.location || null,
      managerOverride: data.managerOverride,
      overrideById: data.managerOverride ? userId : null,
      overrideJustification: data.overrideJustification || null,
      createdById: userId,
    })
    .returning();

  await auditLog('create', 'contact_schedule', schedule.id, {
    before: null,
    after: schedule,
  }, { userId, organisationId: orgId });

  await revalidateContactsPath(orgId, data.personId);

  return { success: true, data: schedule };
}

export async function updateContactScheduleStatus(
  input: unknown,
): Promise<ActionResult<ContactSchedule>> {
  const { orgId, userId } = await requirePermission('update', 'persons');

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
        eq(contactSchedules.organisationId, orgId),
      ),
    );

  if (!existing) {
    return { success: false, error: 'Schedule not found' };
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  const [updated] = await db
    .update(contactSchedules)
    .set({ status, updatedAt: new Date() })
    .where(eq(contactSchedules.id, id))
    .returning();

  await auditLog('update', 'contact_schedule', id, {
    before: { status: existing.status },
    after: { status },
  }, { userId, organisationId: orgId });

  await revalidateContactsPath(orgId, existing.personId);

  return { success: true, data: updated };
}

export async function getContactSchedules(
  personId: string,
): Promise<ActionResult<ContactSchedule[]>> {
  const { orgId } = await requirePermission('read', 'persons');

  const schedules = await db
    .select()
    .from(contactSchedules)
    .where(
      and(
        eq(contactSchedules.organisationId, orgId),
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
  const { orgId, userId } = await requirePermission('create', 'persons');

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
        eq(approvedContacts.organisationId, orgId),
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
      organisationId: orgId,
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
      recordedById: userId,
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
          eq(contactSchedules.organisationId, orgId),
        ),
      );
  }

  await auditLog('create', 'contact_record', record.id, {
    before: null,
    after: record,
  }, { userId, organisationId: orgId });

  await revalidateContactsPath(orgId, data.personId);

  return { success: true, data: record };
}

export async function getContactRecords(
  personId: string,
): Promise<ActionResult<ContactRecord[]>> {
  const { orgId } = await requirePermission('read', 'persons');

  const records = await db
    .select()
    .from(contactRecords)
    .where(
      and(
        eq(contactRecords.organisationId, orgId),
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
  const { orgId } = await requirePermission('read', 'persons');

  const contacts = await db
    .select()
    .from(approvedContacts)
    .where(
      and(
        eq(approvedContacts.organisationId, orgId),
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
          eq(contactRecords.organisationId, orgId),
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
          eq(contactSchedules.organisationId, orgId),
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
