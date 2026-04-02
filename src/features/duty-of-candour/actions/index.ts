'use server';

import type { NewDutyOfCandourIncident } from '@/lib/db/schema';

export async function createDocIncident(_data: NewDutyOfCandourIncident) {
  // TODO: Insert with auto-calculated written follow-up deadline (10 working days)
  return { success: true, id: crypto.randomUUID() };
}

export async function updateDocIncident(id: string, _data: Partial<NewDutyOfCandourIncident>) {
  // TODO: Update in DB, advance workflow status, audit log
  return { success: true, id };
}

export async function listDocIncidents(_organisationId: string) {
  // TODO: Query DB with org filter
  return [];
}

export async function getOverdueDocIncidents(_organisationId: string) {
  // TODO: Query for incidents past their 10-day written follow-up deadline
  return [];
}
