'use server';

/**
 * Server actions for End-of-Life care plan management.
 * These will interact with the database once auth context is available.
 */

import type { NewEolCarePlan } from '@/lib/db/schema';

export async function createEolCarePlan(_data: NewEolCarePlan) {
  // TODO: Insert into DB with auth context
  return { success: true, id: crypto.randomUUID() };
}

export async function updateEolCarePlan(id: string, _data: Partial<NewEolCarePlan>) {
  // TODO: Update in DB with auth context and audit log
  return { success: true, id };
}

export async function getEolCarePlan(_id: string) {
  // TODO: Fetch from DB with org-scoped access
  return null;
}

export async function listEolCarePlans(_organisationId: string, _personId?: string) {
  // TODO: Query DB with filters
  return [];
}
