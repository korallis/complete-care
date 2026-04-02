/**
 * Medication error/incident reporting and topical/homely remedy actions.
 * VAL-EMAR-015: Medication error/incident reporting
 * VAL-EMAR-019: Topical MAR and homely remedies
 */
'use server';

import {
  reportMedicationErrorSchema,
  updateInvestigationSchema,
  createTopicalMarSchema,
  recordTopicalAdministrationSchema,
  createHomelyRemedyProtocolSchema,
  recordHomelyRemedyAdministrationSchema,
} from './types';

// ---------------------------------------------------------------------------
// Medication Error Reporting (VAL-EMAR-015)
// ---------------------------------------------------------------------------

export async function reportMedicationError(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = reportMedicationErrorSchema.parse(data);

  // Validate discoveredAt >= occurredAt
  if (new Date(parsed.discoveredAt) < new Date(parsed.occurredAt)) {
    throw new Error('Discovery date cannot be before occurrence date');
  }

  // TODO: Insert into medicationErrors table
  // TODO: Create audit log entry
  // TODO: If severity >= 'moderate', trigger immediate notification to management
  return { success: true, data: { ...parsed, organisationId, reportedById: userId } };
}

export async function updateInvestigation(
  organisationId: string,
  errorId: string,
  userId: string,
  data: unknown,
) {
  const parsed = updateInvestigationSchema.parse(data);

  // TODO: Update medicationErrors record
  // TODO: If status changed to 'resolved', set resolvedAt
  // TODO: If gpNotified changed to true, set gpNotifiedAt
  // TODO: If personInformed changed to true, set personInformedAt
  // TODO: Create audit log entry

  return { success: true, data: { ...parsed, id: errorId, organisationId } };
}

export async function assignInvestigator(
  _organisationId: string,
  _errorId: string,
  _investigatorId: string,
  _userId: string,
) {
  // TODO: Update medicationErrors.investigatorId
  // TODO: Set investigationStatus to 'under_investigation'
  // TODO: Create audit log entry
  // TODO: Notify assigned investigator
  return { success: true };
}

// ---------------------------------------------------------------------------
// Topical MAR (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export async function createTopicalMar(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = createTopicalMarSchema.parse(data);

  // TODO: Insert into topicalMar table
  // TODO: Create audit log entry
  return { success: true, data: { ...parsed, organisationId } };
}

export async function recordTopicalAdministration(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = recordTopicalAdministrationSchema.parse(data);

  // TODO: Insert into topicalMarAdministrations table
  // TODO: Create audit log entry
  return {
    success: true,
    data: { ...parsed, organisationId, administeredById: userId },
  };
}

export async function discontinueTopicalMar(
  _organisationId: string,
  _topicalMarId: string,
  _userId: string,
  _endDate: string,
) {
  // TODO: Update topicalMar set isActive = false, endDate
  // TODO: Create audit log entry
  return { success: true };
}

// ---------------------------------------------------------------------------
// Homely Remedies (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export async function createHomelyRemedyProtocol(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = createHomelyRemedyProtocolSchema.parse(data);

  // TODO: Insert into homelyRemedyProtocols table
  // TODO: Create audit log entry
  return { success: true, data: { ...parsed, organisationId, recordedById: userId } };
}

export async function recordHomelyRemedyAdministration(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = recordHomelyRemedyAdministrationSchema.parse(data);

  // TODO: Insert into homelyRemedyAdministrations table
  // TODO: Check max dose in 24 hours is not exceeded
  // TODO: Create audit log entry
  return {
    success: true,
    data: { ...parsed, organisationId, administeredById: userId },
  };
}

export async function deactivateHomelyRemedyProtocol(
  _organisationId: string,
  _protocolId: string,
  _userId: string,
) {
  // TODO: Update homelyRemedyProtocols set isActive = false
  // TODO: Create audit log entry
  return { success: true };
}
