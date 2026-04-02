'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { meetings, organisations, persons } from '@/lib/db/schema';
import { auditLog } from '@/lib/audit';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import type { ActionResult } from '@/types';
import { createMeetingSchema } from './schema';
import type { CreateMeetingInput } from './schema';

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

export async function listMeetings(personId: string) {
  const { orgId } = await requirePermission('read', 'care_plans');

  return db
    .select()
    .from(meetings)
    .where(and(eq(meetings.organisationId, orgId), eq(meetings.personId, personId)))
    .orderBy(desc(meetings.meetingDate), desc(meetings.createdAt));
}

export async function createMeeting(
  input: CreateMeetingInput,
): Promise<ActionResult<typeof meetings.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');
    const parsed = createMeetingSchema.safeParse(input);
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
      .insert(meetings)
      .values({
        organisationId: orgId,
        personId: data.personId,
        meetingDate: data.meetingDate,
        title: data.title,
        childAttendees: data.childAttendees,
        staffAttendees: data.staffAttendees,
        agendaItems: data.agendaItems,
        discussionPoints: data.discussionPoints,
        decisions: data.decisions,
        actions: data.actions,
        sharedWithReg44: data.sharedWithReg44,
        createdById: userId,
      })
      .returning();

    await auditLog(
      'create',
      'childrens_meeting',
      row.id,
      {
        before: null,
        after: {
          personId: data.personId,
          meetingDate: data.meetingDate,
          title: data.title,
          actionCount: data.actions.length,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/meetings`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create meeting record' };
  }
}

export async function updateMeeting(
  id: string,
  input: Partial<CreateMeetingInput>,
): Promise<ActionResult<typeof meetings.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');
    const [existing] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    if (!existing) return { success: false, error: 'Meeting not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(meetings)
      .set({
        title: input.title ?? existing.title,
        meetingDate: input.meetingDate ?? existing.meetingDate,
        childAttendees: input.childAttendees ?? existing.childAttendees,
        staffAttendees: input.staffAttendees ?? existing.staffAttendees,
        agendaItems: input.agendaItems ?? existing.agendaItems,
        discussionPoints: input.discussionPoints ?? existing.discussionPoints,
        decisions: input.decisions ?? existing.decisions,
        actions: input.actions ?? existing.actions,
        sharedWithReg44: input.sharedWithReg44 ?? existing.sharedWithReg44,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, id))
      .returning();

    await auditLog(
      'update',
      'childrens_meeting',
      id,
      { before: { title: existing.title }, after: { title: updated.title } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/meetings`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update meeting record' };
  }
}
