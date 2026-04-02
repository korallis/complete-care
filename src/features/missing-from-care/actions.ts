'use server';

/**
 * Server actions for Missing from Care feature.
 *
 * Every mutation:
 *  1. Validates input with Zod
 *  2. Checks auth & RBAC via requirePermission()
 *  3. Enforces tenant isolation via organisationId
 *  4. Creates an audit log entry
 */

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  philomenaProfiles,
  missingEpisodes,
  missingEpisodeTimeline,
  returnHomeInterviews,
} from '@/lib/db/schema';
import type { ActionResult } from '@/types';
import { requirePermission } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import {
  createPhilomenaProfileSchema,
  updatePhilomenaProfileSchema,
  createMissingEpisodeSchema,
  recordPoliceNotificationSchema,
  recordAuthorityNotificationSchema,
  recordReturnSchema,
  addTimelineEntrySchema,
  completeRhiSchema,
  escalateRhiSchema,
  calculateRhiDeadline,
  DEFAULT_ESCALATION_THRESHOLDS,
} from './schema';

// ---------------------------------------------------------------------------
// Philomena Profile actions
// ---------------------------------------------------------------------------

export async function createPhilomenaProfile(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createPhilomenaProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('create', 'persons');
  const data = parsed.data;

  const [profile] = await db
    .insert(philomenaProfiles)
    .values({
      organisationId,
      personId: data.personId,
      photoUrl: data.photoUrl ?? null,
      photoUpdatedAt: data.photoUrl ? new Date() : null,
      heightCm: data.heightCm ?? null,
      build: data.build ?? null,
      hairDescription: data.hairDescription ?? null,
      eyeColour: data.eyeColour ?? null,
      distinguishingFeatures: data.distinguishingFeatures ?? null,
      ethnicity: data.ethnicity ?? null,
      knownAssociates: data.knownAssociates ?? null,
      likelyLocations: data.likelyLocations ?? null,
      phoneNumbers: data.phoneNumbers ?? null,
      socialMedia: data.socialMedia ?? null,
      riskCse: data.riskCse,
      riskCce: data.riskCce,
      riskCountyLines: data.riskCountyLines,
      riskTrafficking: data.riskTrafficking,
      riskNotes: data.riskNotes ?? null,
      medicalNeeds: data.medicalNeeds ?? null,
      allergies: data.allergies ?? null,
      medications: data.medications ?? null,
      gpDetails: data.gpDetails ?? null,
      updatedById: userId,
    })
    .returning({ id: philomenaProfiles.id });

  await auditLog('create', 'philomena_profile', profile.id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, data: { id: profile.id } };
}

export async function updatePhilomenaProfile(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updatePhilomenaProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const { id, ...data } = parsed.data;

  // If photo URL changed, update the photo timestamp
  const updateData: Record<string, unknown> = {
    ...data,
    updatedById: userId,
    updatedAt: new Date(),
  };
  if (data.photoUrl !== undefined) {
    updateData.photoUpdatedAt = data.photoUrl ? new Date() : null;
  }

  await db
    .update(philomenaProfiles)
    .set(updateData)
    .where(
      and(
        eq(philomenaProfiles.id, id),
        eq(philomenaProfiles.organisationId, organisationId),
      ),
    );

  await auditLog('update', 'philomena_profile', id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, data: { id } };
}

async function getPhilomenaProfileByOrg(
  personId: string,
  organisationId: string,
) {
  const [profile] = await db
    .select()
    .from(philomenaProfiles)
    .where(
      and(
        eq(philomenaProfiles.personId, personId),
        eq(philomenaProfiles.organisationId, organisationId),
      ),
    )
    .limit(1);

  return profile ?? null;
}

export async function getPhilomenaProfile(
  personId: string,
) {
  const { orgId } = await requirePermission('read', 'persons');
  return getPhilomenaProfileByOrg(personId, orgId);
}

// ---------------------------------------------------------------------------
// Missing Episode actions
// ---------------------------------------------------------------------------

export async function createMissingEpisode(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createMissingEpisodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('create', 'persons');
  const data = parsed.data;

  // Look up existing Philomena profile for this child
  const existingProfile = await getPhilomenaProfileByOrg(
    data.personId,
    organisationId,
  );

  // Count previous episodes for this child
  const previousEpisodes = await db
    .select({ id: missingEpisodes.id })
    .from(missingEpisodes)
    .where(
      and(
        eq(missingEpisodes.personId, data.personId),
        eq(missingEpisodes.organisationId, organisationId),
      ),
    );

  const thresholdMinutes =
    data.escalationThresholdMinutes ??
    DEFAULT_ESCALATION_THRESHOLDS[data.riskLevel];

  const [episode] = await db
    .insert(missingEpisodes)
    .values({
      organisationId,
      personId: data.personId,
      philomenaProfileId: existingProfile?.id ?? null,
      status: 'open',
      absenceNoticedAt: data.absenceNoticedAt,
      lastSeenAt: data.lastSeenAt ?? null,
      lastSeenLocation: data.lastSeenLocation ?? null,
      lastSeenClothing: data.lastSeenClothing ?? null,
      initialActionsTaken: data.initialActionsTaken,
      riskLevel: data.riskLevel,
      riskAssessmentNotes: data.riskAssessmentNotes ?? null,
      previousEpisodeCount: previousEpisodes.length,
      escalationThresholdMinutes: thresholdMinutes,
      reportedById: userId,
    })
    .returning({ id: missingEpisodes.id });

  // Create initial timeline entry
  await db.insert(missingEpisodeTimeline).values({
    organisationId,
    episodeId: episode.id,
    actionType: 'absence_noticed',
    description: `Absence noticed. Risk level: ${data.riskLevel}. ${data.initialActionsTaken}`,
    occurredAt: data.absenceNoticedAt,
    recordedById: userId,
  });

  await auditLog('create', 'missing_episode', episode.id, {
    after: { ...data, previousEpisodeCount: previousEpisodes.length },
  }, { userId, organisationId });

  return { success: true, data: { id: episode.id } };
}

export async function recordPoliceNotification(
  input: unknown,
): Promise<ActionResult<void>> {
  const parsed = recordPoliceNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const data = parsed.data;

  await db
    .update(missingEpisodes)
    .set({
      policeNotified: true,
      policeNotifiedAt: data.notifiedAt,
      policeReference: data.policeReference,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(missingEpisodes.id, data.episodeId),
        eq(missingEpisodes.organisationId, organisationId),
      ),
    );

  await db.insert(missingEpisodeTimeline).values({
    organisationId,
    episodeId: data.episodeId,
    actionType: 'police_notified',
    description: `Police notified. Reference: ${data.policeReference}`,
    occurredAt: data.notifiedAt,
    recordedById: userId,
    metadata: { policeReference: data.policeReference },
  });

  await auditLog('update', 'missing_episode', data.episodeId, {
    after: { policeNotified: true, policeReference: data.policeReference },
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

export async function recordAuthorityNotification(
  input: unknown,
): Promise<ActionResult<void>> {
  const parsed = recordAuthorityNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const data = parsed.data;

  await db
    .update(missingEpisodes)
    .set({
      placingAuthorityNotified: true,
      placingAuthorityNotifiedAt: data.notifiedAt,
      placingAuthorityContact: data.placingAuthorityContact,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(missingEpisodes.id, data.episodeId),
        eq(missingEpisodes.organisationId, organisationId),
      ),
    );

  await db.insert(missingEpisodeTimeline).values({
    organisationId,
    episodeId: data.episodeId,
    actionType: 'authority_notified',
    description: `Placing authority notified. Contact: ${data.placingAuthorityContact}`,
    occurredAt: data.notifiedAt,
    recordedById: userId,
    metadata: { contact: data.placingAuthorityContact },
  });

  await auditLog('update', 'missing_episode', data.episodeId, {
    after: { placingAuthorityNotified: true },
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

export async function recordReturn(
  input: unknown,
): Promise<ActionResult<{ rhiId: string }>> {
  const parsed = recordReturnSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const data = parsed.data;

  // Fetch the episode to get personId
  const [episode] = await db
    .select()
    .from(missingEpisodes)
    .where(
      and(
        eq(missingEpisodes.id, data.episodeId),
        eq(missingEpisodes.organisationId, organisationId),
      ),
    )
    .limit(1);

  if (!episode) {
    return { success: false, error: 'Episode not found' };
  }

  // Update episode status
  await db
    .update(missingEpisodes)
    .set({
      status: 'returned',
      returnedAt: data.returnedAt,
      returnMethod: data.returnMethod,
      wellbeingCheckCompleted: true,
      wellbeingCheckNotes: data.wellbeingCheckNotes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(missingEpisodes.id, data.episodeId));

  // Add timeline entries for return and wellbeing check
  await db.insert(missingEpisodeTimeline).values([
    {
      organisationId,
      episodeId: data.episodeId,
      actionType: 'child_returned',
      description: `Child returned via ${data.returnMethod.replace(/_/g, ' ')}`,
      occurredAt: data.returnedAt,
      recordedById: userId,
    },
    {
      organisationId,
      episodeId: data.episodeId,
      actionType: 'wellbeing_check',
      description: `Wellbeing check completed on return. ${data.wellbeingCheckNotes ?? ''}`.trim(),
      occurredAt: new Date(),
      recordedById: userId,
    },
  ]);

  // Auto-create RHI with 72-hour deadline
  const rhiDeadline = calculateRhiDeadline(data.returnedAt);

  const [rhi] = await db
    .insert(returnHomeInterviews)
    .values({
      organisationId,
      personId: episode.personId,
      episodeId: data.episodeId,
      status: 'pending',
      deadlineAt: rhiDeadline,
    })
    .returning({ id: returnHomeInterviews.id });

  // Add RHI creation to timeline
  await db.insert(missingEpisodeTimeline).values({
    organisationId,
    episodeId: data.episodeId,
    actionType: 'rhi_created',
    description: `Return Home Interview created. Deadline: ${rhiDeadline.toISOString()}`,
    occurredAt: new Date(),
    recordedById: userId,
    metadata: { rhiId: rhi.id, deadlineAt: rhiDeadline.toISOString() },
  });

  await auditLog('update', 'missing_episode', data.episodeId, {
    after: { status: 'returned', returnedAt: data.returnedAt },
  }, { userId, organisationId });
  await auditLog('create', 'return_home_interview', rhi.id, {
    after: { episodeId: data.episodeId, deadlineAt: rhiDeadline },
  }, { userId, organisationId });

  return { success: true, data: { rhiId: rhi.id } };
}

export async function addTimelineEntry(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = addTimelineEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('create', 'persons');
  const data = parsed.data;

  const [entry] = await db
    .insert(missingEpisodeTimeline)
    .values({
      organisationId,
      episodeId: data.episodeId,
      actionType: data.actionType,
      description: data.description,
      occurredAt: data.occurredAt,
      recordedById: userId,
      metadata: data.metadata ?? null,
    })
    .returning({ id: missingEpisodeTimeline.id });

  await auditLog('create', 'missing_episode_timeline', entry.id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, data: { id: entry.id } };
}

// ---------------------------------------------------------------------------
// RHI actions
// ---------------------------------------------------------------------------

export async function completeRhi(
  input: unknown,
): Promise<ActionResult<void>> {
  const parsed = completeRhiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const { id, ...data } = parsed.data;

  await db
    .update(returnHomeInterviews)
    .set({
      ...data,
      exploitationConcerns: data.exploitationConcerns ?? null,
      status: 'completed',
      conductedById: userId,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(returnHomeInterviews.id, id),
        eq(returnHomeInterviews.organisationId, organisationId),
      ),
    );

  await auditLog('update', 'return_home_interview', id, {
    after: { ...data, status: 'completed' },
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

export async function escalateRhi(
  input: unknown,
): Promise<ActionResult<void>> {
  const parsed = escalateRhiSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');
  const { id } = parsed.data;

  await db
    .update(returnHomeInterviews)
    .set({
      status: 'escalated',
      escalatedToRi: true,
      escalatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(returnHomeInterviews.id, id),
        eq(returnHomeInterviews.organisationId, organisationId),
      ),
    );

  await auditLog('update', 'return_home_interview', id, {
    after: { status: 'escalated', escalatedToRi: true },
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Query helpers (read actions)
// ---------------------------------------------------------------------------

export async function getMissingEpisodesForPerson(
  personId: string,
) {
  const { orgId } = await requirePermission('read', 'persons');
  return db
    .select()
    .from(missingEpisodes)
    .where(
      and(
        eq(missingEpisodes.personId, personId),
        eq(missingEpisodes.organisationId, orgId),
      ),
    )
    .orderBy(desc(missingEpisodes.absenceNoticedAt));
}

export async function getOpenMissingEpisodes() {
  const { orgId } = await requirePermission('read', 'persons');
  return db
    .select()
    .from(missingEpisodes)
    .where(
      and(
        eq(missingEpisodes.organisationId, orgId),
        eq(missingEpisodes.status, 'open'),
      ),
    )
    .orderBy(desc(missingEpisodes.absenceNoticedAt));
}

export async function getEpisodeTimeline(
  episodeId: string,
) {
  const { orgId } = await requirePermission('read', 'persons');
  return db
    .select()
    .from(missingEpisodeTimeline)
    .where(
      and(
        eq(missingEpisodeTimeline.episodeId, episodeId),
        eq(missingEpisodeTimeline.organisationId, orgId),
      ),
    )
    .orderBy(missingEpisodeTimeline.occurredAt);
}

export async function getPendingRhis() {
  const { orgId } = await requirePermission('read', 'persons');
  return db
    .select()
    .from(returnHomeInterviews)
    .where(
      and(
        eq(returnHomeInterviews.organisationId, orgId),
        eq(returnHomeInterviews.status, 'pending'),
      ),
    )
    .orderBy(returnHomeInterviews.deadlineAt);
}

export async function getOverdueRhis() {
  const { orgId } = await requirePermission('read', 'persons');
  return db
    .select()
    .from(returnHomeInterviews)
    .where(
      and(
        eq(returnHomeInterviews.organisationId, orgId),
        eq(returnHomeInterviews.status, 'overdue'),
      ),
    )
    .orderBy(returnHomeInterviews.deadlineAt);
}

export async function getRhiForEpisode(
  episodeId: string,
) {
  const { orgId } = await requirePermission('read', 'persons');
  const [rhi] = await db
    .select()
    .from(returnHomeInterviews)
    .where(
      and(
        eq(returnHomeInterviews.episodeId, episodeId),
        eq(returnHomeInterviews.organisationId, orgId),
      ),
    )
    .limit(1);

  return rhi ?? null;
}
