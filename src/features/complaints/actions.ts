'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { complaints, organisations, persons } from '@/lib/db/schema';
import { auditLog } from '@/lib/audit';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import type { ActionResult } from '@/types';
import { createComplaintSchema } from './schema';
import type { CreateComplaintInput } from './schema';

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

export async function listComplaints(personId: string) {
  const { orgId } = await requirePermission('read', 'incidents');

  return db
    .select()
    .from(complaints)
    .where(and(eq(complaints.organisationId, orgId), eq(complaints.personId, personId)))
    .orderBy(desc(complaints.createdAt));
}

export async function createComplaint(
  input: CreateComplaintInput,
): Promise<ActionResult<typeof complaints.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');
    const parsed = createComplaintSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(and(eq(persons.id, data.personId), eq(persons.organisationId, orgId)))
      .limit(1);
    if (!person) return { success: false, error: 'Person not found' };

    const [row] = await db
      .insert(complaints)
      .values({
        organisationId: orgId,
        personId: data.personId,
        complaintDate: data.complaintDate,
        raisedBy: data.raisedBy,
        nature: data.nature,
        desiredOutcome: data.desiredOutcome ?? null,
        status: data.status,
        advocacyOffered: data.advocacyOffered,
        advocacyNotes: data.advocacyNotes ?? null,
        investigationNotes: data.investigationNotes ?? null,
        outcomeSummary: data.outcomeSummary ?? null,
        satisfaction: data.satisfaction ?? null,
        createdById: userId,
      })
      .returning();

    await auditLog(
      'create',
      'childrens_complaint',
      row.id,
      {
        before: null,
        after: {
          personId: data.personId,
          status: data.status,
          advocacyOffered: data.advocacyOffered,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/complaints`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create complaint record' };
  }
}

export async function updateComplaint(
  id: string,
  input: Partial<CreateComplaintInput>,
): Promise<ActionResult<typeof complaints.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');
    const [existing] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    if (!existing) return { success: false, error: 'Complaint not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(complaints)
      .set({
        raisedBy: input.raisedBy ?? existing.raisedBy,
        complaintDate: input.complaintDate ?? existing.complaintDate,
        nature: input.nature ?? existing.nature,
        desiredOutcome: input.desiredOutcome ?? existing.desiredOutcome,
        status: input.status ?? existing.status,
        advocacyOffered: input.advocacyOffered ?? existing.advocacyOffered,
        advocacyNotes: input.advocacyNotes ?? existing.advocacyNotes,
        investigationNotes: input.investigationNotes ?? existing.investigationNotes,
        outcomeSummary: input.outcomeSummary ?? existing.outcomeSummary,
        satisfaction: input.satisfaction ?? existing.satisfaction,
        updatedAt: new Date(),
      })
      .where(eq(complaints.id, id))
      .returning();

    await auditLog(
      'update',
      'childrens_complaint',
      id,
      { before: { status: existing.status }, after: { status: updated.status } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/complaints`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update complaint record' };
  }
}
