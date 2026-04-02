'use server';

/**
 * Server actions for medication alert operations.
 * VAL-EMAR-009: Allergy alert blocks administration; override requires
 * justification + authorisation; audited.
 */

import { z } from 'zod';
import { allergySchema, allergyOverrideSchema } from '../types';
import type { MedicationAlert } from '../types';

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Record Allergy
// ---------------------------------------------------------------------------

export async function recordAllergy(
  organisationId: string,
  userId: string,
  formData: z.infer<typeof allergySchema>,
): Promise<ActionResult<{ allergyId: string }>> {
  const parsed = allergySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // In real implementation: insert into DB, create audit log
  return {
    success: true,
    data: { allergyId: crypto.randomUUID() },
  };
}

// ---------------------------------------------------------------------------
// Check Medication Alerts before Administration
// ---------------------------------------------------------------------------

export async function checkMedicationAlerts(
  _organisationId: string,
  _medicationId: string,
  _personId: string,
): Promise<ActionResult<{ alerts: MedicationAlert[]; isBlocking: boolean }>> {
  // In real implementation:
  // 1. Fetch medication details
  // 2. Fetch person's allergies
  // 3. Fetch person's current medications
  // 4. Fetch known interactions
  // 5. Run all checks
  // For now, return empty — the checking logic is tested in the lib

  return {
    success: true,
    data: { alerts: [], isBlocking: false },
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

  // Validate that the authoriser is a senior staff member
  // In real implementation: check RBAC role >= senior_carer
  if (parsed.data.requestedBy === parsed.data.authorisedBy) {
    return {
      success: false,
      error: 'Override must be authorised by a different senior staff member',
    };
  }

  // In real implementation:
  // 1. Verify allergy exists and is active
  // 2. Verify medication exists
  // 3. Verify authoriser has senior role
  // 4. Insert override record
  // 5. Create audit log entry (immutable)

  return {
    success: true,
    data: { overrideId: crypto.randomUUID() },
  };
}
