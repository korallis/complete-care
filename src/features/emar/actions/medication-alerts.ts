'use server';

/**
 * Server actions for medication alert operations.
 * VAL-EMAR-009: Allergy alert blocks administration; override requires
 * justification + authorisation; audited.
 */

import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import {
  allergies,
  allergyAlertOverrides,
  drugInteractions,
  medications,
  memberships,
  persons,
} from '@/lib/db/schema';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { allergySchema, allergyOverrideSchema } from '../types';
import type { MedicationAlert } from '../types';
import { hasBlockingAlerts, runAllMedicationChecks } from '../lib/allergy-checker';

type ActionFailure = { success: false; error: string };

type ActionResult<T = void> =
  | { success: true; data: T }
  | ActionFailure;

const NOT_FOUND_ERROR = 'Resource not found';

async function requireMedicationAccess(action: 'read' | 'update') {
  try {
    return { success: true as const, data: await requirePermission(action, 'medications') };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false as const, error: error.message };
    }

    throw error;
  }
}

function ensureSameOrg(requestedOrgId: string, activeOrgId: string): ActionFailure | null {
  if (requestedOrgId !== activeOrgId) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  return null;
}

async function isMemberInOrg(userId: string, orgId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, orgId),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  return Boolean(membership);
}

// ---------------------------------------------------------------------------
// Record Allergy
// ---------------------------------------------------------------------------

export async function recordAllergy(
  organisationId: string,
  _userId: string,
  formData: z.infer<typeof allergySchema>,
): Promise<ActionResult<{ allergyId: string }>> {
  const parsed = allergySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await requireMedicationAccess('update');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const data = parsed.data;

  const [person] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, data.personId), eq(persons.organisationId, ctx.orgId)))
    .limit(1);

  if (!person) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [allergy] = await db
    .insert(allergies)
    .values({
      organisationId: ctx.orgId,
      personId: data.personId,
      allergen: data.allergen,
      allergyType: data.allergyType,
      severity: data.severity,
      reaction: data.reaction ?? null,
      identifiedDate: data.identifiedDate ?? null,
      recordedBy: ctx.userId,
      notes: data.notes ?? null,
    })
    .returning({ id: allergies.id });

  await auditLog(
    'create',
    'allergy',
    allergy.id,
    {
      before: null,
      after: {
        personId: data.personId,
        allergen: data.allergen,
        allergyType: data.allergyType,
        severity: data.severity,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return {
    success: true,
    data: { allergyId: allergy.id },
  };
}

// ---------------------------------------------------------------------------
// Check Medication Alerts before Administration
// ---------------------------------------------------------------------------

export async function checkMedicationAlerts(
  organisationId: string,
  medicationId: string,
  personId: string,
): Promise<ActionResult<{ alerts: MedicationAlert[]; isBlocking: boolean }>> {
  const permission = await requireMedicationAccess('read');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [medication] = await db
    .select({
      id: medications.id,
      personId: medications.personId,
      drugName: medications.drugName,
      activeIngredients: medications.activeIngredients,
      therapeuticClass: medications.therapeuticClass,
    })
    .from(medications)
    .where(
      and(
        eq(medications.id, medicationId),
        eq(medications.organisationId, ctx.orgId),
      ),
    )
    .limit(1);

  if (!medication || medication.personId !== personId) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [person] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.organisationId, ctx.orgId)))
    .limit(1);

  if (!person) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [personAllergies, existingMedications, knownInteractions] = await Promise.all([
    db
      .select({
        id: allergies.id,
        allergen: allergies.allergen,
        severity: allergies.severity,
        reaction: allergies.reaction,
        status: allergies.status,
        personId: allergies.personId,
      })
      .from(allergies)
      .where(
        and(
          eq(allergies.organisationId, ctx.orgId),
          eq(allergies.personId, personId),
          eq(allergies.status, 'active'),
        ),
      ),
    db
      .select({
        drugName: medications.drugName,
        therapeuticClass: medications.therapeuticClass,
      })
      .from(medications)
      .where(
        and(
          eq(medications.organisationId, ctx.orgId),
          eq(medications.personId, personId),
          eq(medications.status, 'active'),
          ne(medications.id, medicationId),
        ),
      ),
    db
      .select({
        id: drugInteractions.id,
        drugA: drugInteractions.drugA,
        drugB: drugInteractions.drugB,
        severity: drugInteractions.severity,
        description: drugInteractions.description,
        recommendation: drugInteractions.recommendation,
      })
      .from(drugInteractions)
      .where(eq(drugInteractions.organisationId, ctx.orgId)),
  ]);

  const alerts = runAllMedicationChecks({
    medication,
    personAllergies,
    existingMedications,
    knownInteractions,
  });

  return {
    success: true,
    data: { alerts, isBlocking: hasBlockingAlerts(alerts) },
  };
}

// ---------------------------------------------------------------------------
// Record Allergy Override
// ---------------------------------------------------------------------------

export async function recordAllergyOverride(
  organisationId: string,
  formData: z.infer<typeof allergyOverrideSchema>,
): Promise<ActionResult<{ overrideId: string }>> {
  const parsed = allergyOverrideSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  if (data.requestedBy === data.authorisedBy) {
    return {
      success: false,
      error: 'Override must be authorised by a different senior staff member',
    };
  }

  const permission = await requireMedicationAccess('update');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  if (data.authorisedBy !== ctx.userId) {
    return { success: false, error: 'Current user must be the authorising staff member' };
  }

  if (!(await isMemberInOrg(data.requestedBy, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [allergy, medication] = await Promise.all([
    db
      .select({
        id: allergies.id,
        personId: allergies.personId,
        allergen: allergies.allergen,
        status: allergies.status,
      })
      .from(allergies)
      .where(
        and(
          eq(allergies.id, data.allergyId),
          eq(allergies.organisationId, ctx.orgId),
        ),
      )
      .then((rows) => rows[0]),
    db
      .select({ id: medications.id, personId: medications.personId })
      .from(medications)
      .where(
        and(
          eq(medications.id, data.medicationId),
          eq(medications.organisationId, ctx.orgId),
        ),
      )
      .then((rows) => rows[0]),
  ]);

  if (!allergy || !medication || allergy.status !== 'active') {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  if (allergy.personId !== data.personId || medication.personId !== data.personId) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [override] = await db
    .insert(allergyAlertOverrides)
    .values({
      organisationId: ctx.orgId,
      personId: data.personId,
      medicationId: data.medicationId,
      allergyId: data.allergyId,
      requestedBy: data.requestedBy,
      authorisedBy: ctx.userId,
      clinicalJustification: data.clinicalJustification,
      matchedAllergen: data.matchedAllergen,
      matchedMedicationDetail: data.matchedMedicationDetail,
    })
    .returning({ id: allergyAlertOverrides.id });

  await auditLog(
    'create',
    'allergy_alert_override',
    override.id,
    {
      before: null,
      after: {
        personId: data.personId,
        medicationId: data.medicationId,
        allergyId: data.allergyId,
        requestedBy: data.requestedBy,
        authorisedBy: ctx.userId,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return {
    success: true,
    data: { overrideId: override.id },
  };
}
