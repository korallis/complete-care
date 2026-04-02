'use server';

/**
 * Rota Server Actions
 *
 * Coordinator rota management: visit assignment, bulk operations,
 * cancellation with reason codes, hospital admission tracking,
 * and conflict detection.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, eq, gte, lte, inArray, asc, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  scheduledVisits,
  organisations,
  staffProfiles,
  persons,
} from '@/lib/db/schema';
import { hospitalAdmissions, visitCancellations } from '@/lib/db/schema/rota';
import type { ScheduledVisit } from '@/lib/db/schema/care-packages';
import type { HospitalAdmission } from '@/lib/db/schema/rota';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  assignVisitSchema,
  bulkAssignSchema,
  cancelVisitSchema,
  admitToHospitalSchema,
  dischargeFromHospitalSchema,
  rotaViewSchema,
} from './schema';
import type {
  AssignVisitInput,
  BulkAssignInput,
  CancelVisitInput,
  AdmitToHospitalInput,
  DischargeFromHospitalInput,
  RotaViewInput,
} from './schema';
import { detectAllConflicts, checkAssignmentConflicts } from './conflicts';
import type { Conflict, VisitSlot } from './conflicts';

// Re-export for external use
export type {
  AssignVisitInput,
  BulkAssignInput,
  CancelVisitInput,
  AdmitToHospitalInput,
  DischargeFromHospitalInput,
  RotaViewInput,
} from './schema';

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

// =========================================================================
// ROTA VIEW
// =========================================================================

export type RotaVisit = ScheduledVisit & {
  staffName: string | null;
  personName: string | null;
};

export type RotaViewResult = {
  visits: RotaVisit[];
  conflicts: Conflict[];
  staff: { id: string; name: string }[];
};

/**
 * Get the rota view for a date range with optional filters.
 * Returns visits, detected conflicts, and active staff list.
 */
export async function getRotaView(
  input: RotaViewInput,
): Promise<RotaViewResult> {
  const { orgId } = await requirePermission('read', 'rota');

  const parsed = rotaViewSchema.safeParse(input);
  if (!parsed.success) {
    return { visits: [], conflicts: [], staff: [] };
  }

  const data = parsed.data;

  const conditions = [
    eq(scheduledVisits.organisationId, orgId),
    gte(scheduledVisits.date, data.startDate),
    lte(scheduledVisits.date, data.endDate),
  ];

  if (data.staffIds && data.staffIds.length > 0) {
    conditions.push(inArray(scheduledVisits.assignedStaffId, data.staffIds));
  }

  if (data.personIds && data.personIds.length > 0) {
    conditions.push(inArray(scheduledVisits.personId, data.personIds));
  }

  if (data.statuses && data.statuses.length > 0) {
    conditions.push(inArray(scheduledVisits.status, data.statuses));
  }

  // Fetch visits and staff in parallel
  const [visitRows, staffRows, personRows] = await Promise.all([
    db
      .select()
      .from(scheduledVisits)
      .where(and(...conditions))
      .orderBy(asc(scheduledVisits.date), asc(scheduledVisits.scheduledStart)),
    db
      .select({ id: staffProfiles.id, name: staffProfiles.fullName })
      .from(staffProfiles)
      .where(
        and(
          eq(staffProfiles.organisationId, orgId),
          eq(staffProfiles.status, 'active'),
          isNull(staffProfiles.deletedAt),
        ),
      )
      .orderBy(asc(staffProfiles.fullName)),
    db
      .select({ id: persons.id, displayName: persons.fullName })
      .from(persons)
      .where(
        and(
          eq(persons.organisationId, orgId),
          isNull(persons.deletedAt),
        ),
      ),
  ]);

  // Build lookup maps
  const staffMap = new Map(staffRows.map((s) => [s.id, s.name]));
  const personMap = new Map(personRows.map((p) => [p.id, p.displayName]));

  // Enrich visits
  const visits: RotaVisit[] = visitRows.map((v) => ({
    ...v,
    staffName: v.assignedStaffId ? (staffMap.get(v.assignedStaffId) ?? null) : null,
    personName: personMap.get(v.personId) ?? null,
  }));

  // Detect conflicts
  const visitSlots: VisitSlot[] = visitRows.map((v) => ({
    id: v.id,
    date: v.date,
    scheduledStart: v.scheduledStart,
    scheduledEnd: v.scheduledEnd,
    assignedStaffId: v.assignedStaffId,
    personId: v.personId,
    status: v.status,
  }));

  const conflicts = detectAllConflicts(visitSlots);

  return {
    visits,
    conflicts,
    staff: staffRows.map((s) => ({ id: s.id, name: s.name })),
  };
}

// =========================================================================
// VISIT ASSIGNMENT
// =========================================================================

/**
 * Assign a staff member to a single visit with conflict checking.
 */
export async function assignVisit(
  input: AssignVisitInput,
): Promise<ActionResult<{ visit: ScheduledVisit; conflicts: Conflict[] }>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'rota');

    const parsed = assignVisitSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const { visitId, staffId } = parsed.data;

    // Get the visit
    const [visit] = await db
      .select()
      .from(scheduledVisits)
      .where(eq(scheduledVisits.id, visitId))
      .limit(1);

    if (!visit) return { success: false, error: 'Visit not found' };
    assertBelongsToOrg(visit.organisationId, orgId);

    // If assigning (not unassigning), check for conflicts
    let conflicts: Conflict[] = [];
    if (staffId) {
      const sameDateVisits = await db
        .select()
        .from(scheduledVisits)
        .where(
          and(
            eq(scheduledVisits.organisationId, orgId),
            eq(scheduledVisits.date, visit.date),
            eq(scheduledVisits.assignedStaffId, staffId),
          ),
        );

      const visitSlot: VisitSlot = {
        id: visit.id,
        date: visit.date,
        scheduledStart: visit.scheduledStart,
        scheduledEnd: visit.scheduledEnd,
        assignedStaffId: visit.assignedStaffId,
        personId: visit.personId,
        status: visit.status,
      };

      const existingSlots: VisitSlot[] = sameDateVisits.map((v) => ({
        id: v.id,
        date: v.date,
        scheduledStart: v.scheduledStart,
        scheduledEnd: v.scheduledEnd,
        assignedStaffId: v.assignedStaffId,
        personId: v.personId,
        status: v.status,
      }));

      conflicts = checkAssignmentConflicts(visitSlot, staffId, existingSlots);
    }

    // Perform assignment
    const [updated] = await db
      .update(scheduledVisits)
      .set({
        assignedStaffId: staffId,
        updatedAt: new Date(),
      })
      .where(eq(scheduledVisits.id, visitId))
      .returning();

    await auditLog('assign_visit', 'scheduled_visit', visitId, {
      before: { assignedStaffId: visit.assignedStaffId },
      after: { assignedStaffId: staffId },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/scheduling`);
      revalidatePath(`/${slug}/rota`);
    }

    return { success: true, data: { visit: updated, conflicts } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[assignVisit] Error:', error);
    return { success: false, error: 'Failed to assign visit' };
  }
}

// =========================================================================
// BULK ASSIGNMENT
// =========================================================================

/**
 * Assign a staff member to multiple visits at once.
 */
export async function bulkAssign(
  input: BulkAssignInput,
): Promise<ActionResult<{ assignedCount: number; conflicts: Conflict[] }>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'rota');

    const parsed = bulkAssignSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const { visitIds, staffId } = parsed.data;

    // Verify all visits belong to the org
    const visits = await db
      .select()
      .from(scheduledVisits)
      .where(
        and(
          inArray(scheduledVisits.id, visitIds),
          eq(scheduledVisits.organisationId, orgId),
        ),
      );

    if (visits.length === 0) {
      return { success: false, error: 'No valid visits found' };
    }

    // Detect conflicts for the bulk assignment
    const visitSlots: VisitSlot[] = visits.map((v) => ({
      id: v.id,
      date: v.date,
      scheduledStart: v.scheduledStart,
      scheduledEnd: v.scheduledEnd,
      assignedStaffId: staffId,
      personId: v.personId,
      status: v.status,
    }));

    // Also get existing visits for this staff member on affected dates
    const affectedDates = [...new Set(visits.map((v) => v.date))];
    const existingStaffVisits = await db
      .select()
      .from(scheduledVisits)
      .where(
        and(
          eq(scheduledVisits.organisationId, orgId),
          eq(scheduledVisits.assignedStaffId, staffId),
          inArray(scheduledVisits.date, affectedDates),
        ),
      );

    const existingSlots: VisitSlot[] = existingStaffVisits
      .filter((v) => !visitIds.includes(v.id))
      .map((v) => ({
        id: v.id,
        date: v.date,
        scheduledStart: v.scheduledStart,
        scheduledEnd: v.scheduledEnd,
        assignedStaffId: v.assignedStaffId,
        personId: v.personId,
        status: v.status,
      }));

    const conflicts = detectAllConflicts([...visitSlots, ...existingSlots]);

    // Perform bulk assignment
    const validIds = visits.map((v) => v.id);
    await db
      .update(scheduledVisits)
      .set({
        assignedStaffId: staffId,
        updatedAt: new Date(),
      })
      .where(inArray(scheduledVisits.id, validIds));

    await auditLog('bulk_assign', 'rota', staffId, {
      before: null,
      after: { visitCount: validIds.length, staffId },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/scheduling`);
      revalidatePath(`/${slug}/rota`);
    }

    return {
      success: true,
      data: { assignedCount: validIds.length, conflicts },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[bulkAssign] Error:', error);
    return { success: false, error: 'Failed to bulk assign visits' };
  }
}

// =========================================================================
// VISIT CANCELLATION
// =========================================================================

/**
 * Cancel a visit with a reason code, billing exclusion, and notification tracking.
 */
export async function cancelVisit(
  input: CancelVisitInput,
): Promise<ActionResult<ScheduledVisit>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'rota');

    const parsed = cancelVisitSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get the visit
    const [visit] = await db
      .select()
      .from(scheduledVisits)
      .where(eq(scheduledVisits.id, data.visitId))
      .limit(1);

    if (!visit) return { success: false, error: 'Visit not found' };
    assertBelongsToOrg(visit.organisationId, orgId);

    if (visit.status === 'cancelled') {
      return { success: false, error: 'Visit is already cancelled' };
    }

    // Update visit status
    const [updated] = await db
      .update(scheduledVisits)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(scheduledVisits.id, data.visitId))
      .returning();

    // Record cancellation details
    await db.insert(visitCancellations).values({
      organisationId: orgId,
      visitId: data.visitId,
      reasonCode: data.reasonCode,
      reasonNotes: data.reasonNotes ?? null,
      billingExcluded: data.billingExcluded,
      carerNotified: data.carerNotified,
      cancelledById: userId,
    });

    await auditLog('cancel_visit', 'scheduled_visit', data.visitId, {
      before: { status: visit.status },
      after: {
        status: 'cancelled',
        reasonCode: data.reasonCode,
        billingExcluded: data.billingExcluded,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/scheduling`);
      revalidatePath(`/${slug}/rota`);
      revalidatePath(`/${slug}/persons/${visit.personId}/care-package`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[cancelVisit] Error:', error);
    return { success: false, error: 'Failed to cancel visit' };
  }
}

// =========================================================================
// HOSPITAL ADMISSIONS
// =========================================================================

/**
 * Record a hospital admission for a client and optionally suspend their visits.
 */
export async function admitToHospital(
  input: AdmitToHospitalInput,
): Promise<ActionResult<HospitalAdmission>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'rota');

    const parsed = admitToHospitalSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify person belongs to org
    const [person] = await db
      .select({ id: persons.id, organisationId: persons.organisationId })
      .from(persons)
      .where(eq(persons.id, data.personId))
      .limit(1);

    if (!person) return { success: false, error: 'Person not found' };
    assertBelongsToOrg(person.organisationId, orgId);

    // Create admission record
    const [admission] = await db
      .insert(hospitalAdmissions)
      .values({
        organisationId: orgId,
        personId: data.personId,
        admittedDate: data.admittedDate,
        hospital: data.hospital,
        ward: data.ward ?? null,
        expectedDischarge: data.expectedDischarge ?? null,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
        status: 'admitted',
        recordedById: userId,
      })
      .returning();

    // Auto-suspend future visits if requested
    if (data.suspendVisits) {
      const today = new Date().toISOString().slice(0, 10);
      await db
        .update(scheduledVisits)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(scheduledVisits.organisationId, orgId),
            eq(scheduledVisits.personId, data.personId),
            eq(scheduledVisits.status, 'scheduled'),
            gte(scheduledVisits.date, today),
          ),
        );
    }

    await auditLog('hospital_admission', 'hospital_admission', admission.id, {
      before: null,
      after: {
        personId: data.personId,
        hospital: data.hospital,
        suspendedVisits: data.suspendVisits,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/scheduling`);
      revalidatePath(`/${slug}/rota`);
      revalidatePath(`/${slug}/persons/${data.personId}`);
      revalidatePath(`/${slug}/persons/${data.personId}/hospital`);
    }

    return { success: true, data: admission };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[admitToHospital] Error:', error);
    return { success: false, error: 'Failed to record hospital admission' };
  }
}

/**
 * Discharge a client from hospital and optionally resume visits.
 */
export async function dischargeFromHospital(
  input: DischargeFromHospitalInput,
): Promise<ActionResult<HospitalAdmission>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'rota');

    const parsed = dischargeFromHospitalSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get the admission
    const [admission] = await db
      .select()
      .from(hospitalAdmissions)
      .where(eq(hospitalAdmissions.id, data.admissionId))
      .limit(1);

    if (!admission) return { success: false, error: 'Admission not found' };
    assertBelongsToOrg(admission.organisationId, orgId);

    if (admission.status === 'discharged') {
      return { success: false, error: 'Patient already discharged' };
    }

    // Update admission
    const [updated] = await db
      .update(hospitalAdmissions)
      .set({
        status: 'discharged',
        dischargedDate: data.dischargedDate,
        notes: data.notes ?? admission.notes,
        dischargedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(hospitalAdmissions.id, data.admissionId))
      .returning();

    // Resume visits is a business decision -- the rota view will show
    // the client as discharged, and the coordinator can regenerate visits.

    await auditLog('hospital_discharge', 'hospital_admission', data.admissionId, {
      before: { status: 'admitted' },
      after: {
        status: 'discharged',
        dischargedDate: data.dischargedDate,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/scheduling`);
      revalidatePath(`/${slug}/rota`);
      revalidatePath(`/${slug}/persons/${admission.personId}`);
      revalidatePath(`/${slug}/persons/${admission.personId}/hospital`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[dischargeFromHospital] Error:', error);
    return { success: false, error: 'Failed to record discharge' };
  }
}

// ---------------------------------------------------------------------------
// Get hospital admissions for a person
// ---------------------------------------------------------------------------

export async function getHospitalAdmissions(
  personId: string,
): Promise<HospitalAdmission[]> {
  const { orgId } = await requirePermission('read', 'rota');

  return db
    .select()
    .from(hospitalAdmissions)
    .where(
      and(
        eq(hospitalAdmissions.organisationId, orgId),
        eq(hospitalAdmissions.personId, personId),
      ),
    )
    .orderBy(asc(hospitalAdmissions.admittedDate));
}

/**
 * Get the current active admission for a person (if any).
 */
export async function getActiveAdmission(
  personId: string,
): Promise<HospitalAdmission | null> {
  const { orgId } = await requirePermission('read', 'rota');

  const [admission] = await db
    .select()
    .from(hospitalAdmissions)
    .where(
      and(
        eq(hospitalAdmissions.organisationId, orgId),
        eq(hospitalAdmissions.personId, personId),
        eq(hospitalAdmissions.status, 'admitted'),
      ),
    )
    .limit(1);

  return admission ?? null;
}

// ---------------------------------------------------------------------------
// Conflict detection endpoint
// ---------------------------------------------------------------------------

/**
 * Detect conflicts for the current rota view.
 */
export async function detectConflicts(
  startDate: string,
  endDate: string,
): Promise<Conflict[]> {
  const { orgId } = await requirePermission('read', 'rota');

  const visits = await db
    .select()
    .from(scheduledVisits)
    .where(
      and(
        eq(scheduledVisits.organisationId, orgId),
        gte(scheduledVisits.date, startDate),
        lte(scheduledVisits.date, endDate),
      ),
    );

  const visitSlots: VisitSlot[] = visits.map((v) => ({
    id: v.id,
    date: v.date,
    scheduledStart: v.scheduledStart,
    scheduledEnd: v.scheduledEnd,
    assignedStaffId: v.assignedStaffId,
    personId: v.personId,
    status: v.status,
  }));

  return detectAllConflicts(visitSlots);
}
