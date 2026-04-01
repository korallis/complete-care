'use server';

/**
 * EMAR Server Actions
 *
 * Medication CRUD and administration recording.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * RBAC rules:
 * - medications resource: manager+ can prescribe (create/update), senior_carer+ can administer, carer can view
 * - Carer can record administrations (create on medications resource)
 */

import { and, count, desc, eq, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  medications,
  medicationAdministrations,
  organisations,
  users,
} from '@/lib/db/schema';
import type { Medication, MedicationAdministration } from '@/lib/db/schema/medications';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createMedicationSchema,
  updateMedicationSchema,
  discontinueMedicationSchema,
  recordAdministrationSchema,
} from './schema';
import type {
  CreateMedicationInput,
  UpdateMedicationInput,
  DiscontinueMedicationInput,
  RecordAdministrationInput,
} from './schema';

// Re-export types for external use
export type { CreateMedicationInput, UpdateMedicationInput, DiscontinueMedicationInput, RecordAdministrationInput } from './schema';

// ---------------------------------------------------------------------------
// Helper: get org slug for revalidation
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ---------------------------------------------------------------------------
// List medications for a person
// ---------------------------------------------------------------------------

export type MedicationListItem = {
  id: string;
  drugName: string;
  dose: string;
  doseUnit: string;
  route: string;
  frequency: string;
  status: string;
  prescribedDate: string;
  prescriberName: string;
  pharmacy: string | null;
  specialInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MedicationListResult = {
  medications: MedicationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listMedications({
  personId,
  page = 1,
  pageSize = 50,
  status,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<MedicationListResult> {
  const { orgId } = await requirePermission('read', 'medications');

  const conditions = [
    eq(medications.organisationId, orgId),
    eq(medications.personId, personId),
  ];

  if (status) {
    conditions.push(eq(medications.status, status));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: medications.id,
        drugName: medications.drugName,
        dose: medications.dose,
        doseUnit: medications.doseUnit,
        route: medications.route,
        frequency: medications.frequency,
        status: medications.status,
        prescribedDate: medications.prescribedDate,
        prescriberName: medications.prescriberName,
        pharmacy: medications.pharmacy,
        specialInstructions: medications.specialInstructions,
        createdAt: medications.createdAt,
        updatedAt: medications.updatedAt,
      })
      .from(medications)
      .where(whereClause)
      .orderBy(desc(medications.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(medications).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    medications: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single medication
// ---------------------------------------------------------------------------

export async function getMedication(medicationId: string): Promise<Medication | null> {
  const { orgId } = await requirePermission('read', 'medications');

  const [med] = await db
    .select()
    .from(medications)
    .where(eq(medications.id, medicationId))
    .limit(1);

  if (!med) return null;

  assertBelongsToOrg(med.organisationId, orgId);

  return med;
}

// ---------------------------------------------------------------------------
// Create medication (prescribe)
// ---------------------------------------------------------------------------

export async function createMedication(
  input: CreateMedicationInput,
): Promise<ActionResult<Medication>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'medications');

    const parsed = createMedicationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [med] = await db
      .insert(medications)
      .values({
        organisationId: orgId,
        personId: data.personId,
        drugName: data.drugName,
        dose: data.dose,
        doseUnit: data.doseUnit,
        route: data.route,
        frequency: data.frequency,
        frequencyDetail: data.frequencyDetail,
        prescribedDate: data.prescribedDate,
        prescriberName: data.prescriberName,
        pharmacy: data.pharmacy ?? null,
        specialInstructions: data.specialInstructions ?? null,
        status: 'active',
      })
      .returning();

    await auditLog('create', 'medication', med.id, {
      before: null,
      after: {
        drugName: data.drugName,
        dose: data.dose,
        doseUnit: data.doseUnit,
        route: data.route,
        frequency: data.frequency,
        personId: data.personId,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/emar`);
      revalidatePath(`/${slug}/persons/${data.personId}/emar/medications`);
    }

    return { success: true, data: med };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createMedication] Error:', error);
    return { success: false, error: 'Failed to create medication' };
  }
}

// ---------------------------------------------------------------------------
// Update medication
// ---------------------------------------------------------------------------

export async function updateMedication(
  medicationId: string,
  input: UpdateMedicationInput,
): Promise<ActionResult<Medication>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = updateMedicationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, medicationId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Medication not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'active') {
      return { success: false, error: 'Only active medications can be updated' };
    }

    const data = parsed.data;
    const updates: Partial<typeof medications.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.drugName !== undefined) updates.drugName = data.drugName;
    if (data.dose !== undefined) updates.dose = data.dose;
    if (data.doseUnit !== undefined) updates.doseUnit = data.doseUnit;
    if (data.route !== undefined) updates.route = data.route;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.frequencyDetail !== undefined) updates.frequencyDetail = data.frequencyDetail;
    if (data.prescriberName !== undefined) updates.prescriberName = data.prescriberName;
    if (data.pharmacy !== undefined) updates.pharmacy = data.pharmacy;
    if (data.specialInstructions !== undefined) updates.specialInstructions = data.specialInstructions;

    const [updated] = await db
      .update(medications)
      .set(updates)
      .where(eq(medications.id, medicationId))
      .returning();

    await auditLog('update', 'medication', medicationId, {
      before: { drugName: existing.drugName, dose: existing.dose },
      after: { drugName: updated.drugName, dose: updated.dose },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/emar`);
      revalidatePath(`/${slug}/persons/${existing.personId}/emar/medications`);
      revalidatePath(`/${slug}/persons/${existing.personId}/emar/medications/${medicationId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateMedication] Error:', error);
    return { success: false, error: 'Failed to update medication' };
  }
}

// ---------------------------------------------------------------------------
// Discontinue / suspend / complete medication
// ---------------------------------------------------------------------------

export async function discontinueMedication(
  medicationId: string,
  input: DiscontinueMedicationInput,
): Promise<ActionResult<Medication>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = discontinueMedicationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, medicationId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Medication not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'active' && existing.status !== 'suspended') {
      return { success: false, error: 'Medication cannot be discontinued from its current status' };
    }

    const data = parsed.data;
    const today = new Date().toISOString().slice(0, 10);

    const [updated] = await db
      .update(medications)
      .set({
        status: data.status,
        discontinuedDate: today,
        discontinuedReason: data.reason,
        updatedAt: new Date(),
      })
      .where(eq(medications.id, medicationId))
      .returning();

    await auditLog('discontinue', 'medication', medicationId, {
      before: { status: existing.status },
      after: { status: data.status, reason: data.reason },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/emar`);
      revalidatePath(`/${slug}/persons/${existing.personId}/emar/medications`);
      revalidatePath(`/${slug}/persons/${existing.personId}/emar/medications/${medicationId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[discontinueMedication] Error:', error);
    return { success: false, error: 'Failed to discontinue medication' };
  }
}

// ---------------------------------------------------------------------------
// Record administration
// ---------------------------------------------------------------------------

export async function recordAdministration(
  personId: string,
  input: RecordAdministrationInput,
): Promise<ActionResult<MedicationAdministration>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'medications');

    const parsed = recordAdministrationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify the medication belongs to this org and person
    const [med] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, data.medicationId))
      .limit(1);

    if (!med) {
      return { success: false, error: 'Medication not found' };
    }

    assertBelongsToOrg(med.organisationId, orgId);

    if (med.personId !== personId) {
      return { success: false, error: 'Medication does not belong to this person' };
    }

    // Get administering user name
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [admin] = await db
      .insert(medicationAdministrations)
      .values({
        medicationId: data.medicationId,
        personId,
        organisationId: orgId,
        scheduledTime: new Date(data.scheduledTime),
        administeredAt: data.administeredAt ? new Date(data.administeredAt) : (data.status === 'given' || data.status === 'self_administered' ? new Date() : null),
        status: data.status,
        reason: data.reason ?? null,
        administeredById: userId,
        administeredByName: user?.name ?? null,
        witnessId: data.witnessId ?? null,
        witnessName: data.witnessName ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog('record_administration', 'medication_administration', admin.id, {
      before: null,
      after: {
        medicationId: data.medicationId,
        status: data.status,
        drugName: med.drugName,
        administeredByName: user?.name,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${personId}/emar`);
    }

    return { success: true, data: admin };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordAdministration] Error:', error);
    return { success: false, error: 'Failed to record administration' };
  }
}

// ---------------------------------------------------------------------------
// Get MAR chart data for a date range
// ---------------------------------------------------------------------------

export type MarChartMedication = Medication & {
  administrations: MedicationAdministration[];
};

export type MarChartData = {
  medications: MarChartMedication[];
  date: string;
};

export async function getMarChart({
  personId,
  date,
}: {
  personId: string;
  date: string; // YYYY-MM-DD
}): Promise<MarChartData> {
  const { orgId } = await requirePermission('read', 'medications');

  // Get all active + suspended medications for this person
  const meds = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.organisationId, orgId),
        eq(medications.personId, personId),
      ),
    )
    .orderBy(asc(medications.drugName));

  // Get administrations for the requested date
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const admins = await db
    .select()
    .from(medicationAdministrations)
    .where(
      and(
        eq(medicationAdministrations.organisationId, orgId),
        eq(medicationAdministrations.personId, personId),
        gte(medicationAdministrations.scheduledTime, dayStart),
        lte(medicationAdministrations.scheduledTime, dayEnd),
      ),
    )
    .orderBy(asc(medicationAdministrations.scheduledTime));

  // Group administrations by medication
  const adminsByMed = new Map<string, MedicationAdministration[]>();
  for (const admin of admins) {
    const existing = adminsByMed.get(admin.medicationId) ?? [];
    existing.push(admin);
    adminsByMed.set(admin.medicationId, existing);
  }

  const marMedications: MarChartMedication[] = meds.map((med) => ({
    ...med,
    administrations: adminsByMed.get(med.id) ?? [],
  }));

  return {
    medications: marMedications,
    date,
  };
}

// ---------------------------------------------------------------------------
// Get daily schedule (upcoming administrations)
// ---------------------------------------------------------------------------

export type DailyScheduleItem = {
  medication: Medication;
  scheduledTime: string;
  administration: MedicationAdministration | null;
};

export async function getDailySchedule({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<DailyScheduleItem[]> {
  const { orgId } = await requirePermission('read', 'medications');

  // Get active medications
  const meds = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.organisationId, orgId),
        eq(medications.personId, personId),
        eq(medications.status, 'active'),
      ),
    )
    .orderBy(asc(medications.drugName));

  // Get today's administrations
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const admins = await db
    .select()
    .from(medicationAdministrations)
    .where(
      and(
        eq(medicationAdministrations.organisationId, orgId),
        eq(medicationAdministrations.personId, personId),
        gte(medicationAdministrations.scheduledTime, dayStart),
        lte(medicationAdministrations.scheduledTime, dayEnd),
      ),
    );

  // Build schedule from frequency details
  const { generateTimeSlots } = await import('./utils');
  const schedule: DailyScheduleItem[] = [];

  // Index admins by medicationId + scheduledTime
  const adminIndex = new Map<string, MedicationAdministration>();
  for (const admin of admins) {
    const key = `${admin.medicationId}:${admin.scheduledTime.toISOString()}`;
    adminIndex.set(key, admin);
  }

  for (const med of meds) {
    const slots = generateTimeSlots(
      med.frequency,
      med.frequencyDetail as import('@/lib/db/schema/medications').FrequencyDetail,
      date,
    );

    for (const slot of slots) {
      const key = `${med.id}:${new Date(slot).toISOString()}`;
      schedule.push({
        medication: med,
        scheduledTime: slot,
        administration: adminIndex.get(key) ?? null,
      });
    }

    // PRN medications still appear with no fixed schedule
    if (med.frequency === 'prn') {
      // Show any PRN administrations that were recorded
      const prnAdmins = admins.filter((a) => a.medicationId === med.id);
      if (prnAdmins.length > 0) {
        for (const prnAdmin of prnAdmins) {
          schedule.push({
            medication: med,
            scheduledTime: prnAdmin.scheduledTime.toISOString(),
            administration: prnAdmin,
          });
        }
      }
    }
  }

  // Sort by scheduled time
  schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return schedule;
}
