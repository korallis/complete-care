'use server';

import { db } from '@/lib/db';
import {
  shiftPatterns,
  rotaPeriods,
  shiftAssignments,
  conflictOverrides,
} from '@/lib/db/schema/shift-patterns';
import { eq, and } from 'drizzle-orm';
import {
  createShiftPatternSchema,
  updateShiftPatternSchema,
  rotaPeriodSchema,
  assignStaffSchema,
  conflictOverrideSchema,
} from '../lib/validation';
import { calculateDurationMinutes } from '../lib/wtd-checks';

// --- Shift Pattern CRUD ---

export async function createShiftPattern(
  organisationId: string,
  data: unknown,
) {
  const parsed = createShiftPatternSchema.parse(data);

  const durationMinutes = calculateDurationMinutes(
    parsed.startTime,
    parsed.endTime,
    parsed.isOvernight,
  );
  const paidMinutes = durationMinutes - parsed.breakMinutes;

  const [pattern] = await db
    .insert(shiftPatterns)
    .values({
      organisationId,
      ...parsed,
      durationMinutes,
      paidMinutes,
    })
    .returning();

  return pattern;
}

export async function updateShiftPattern(
  organisationId: string,
  patternId: string,
  data: unknown,
) {
  const parsed = updateShiftPatternSchema.parse(data);

  // Recalculate duration if times changed
  let durationMinutes: number | undefined;
  let paidMinutes: number | undefined;

  if (parsed.startTime && parsed.endTime) {
    durationMinutes = calculateDurationMinutes(
      parsed.startTime,
      parsed.endTime,
      parsed.isOvernight ?? false,
    );
    paidMinutes = durationMinutes - (parsed.breakMinutes ?? 0);
  }

  const [updated] = await db
    .update(shiftPatterns)
    .set({
      ...parsed,
      ...(durationMinutes !== undefined ? { durationMinutes, paidMinutes } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(shiftPatterns.id, patternId),
        eq(shiftPatterns.organisationId, organisationId),
      ),
    )
    .returning();

  return updated;
}

export async function deleteShiftPattern(
  organisationId: string,
  patternId: string,
) {
  const [deleted] = await db
    .update(shiftPatterns)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(shiftPatterns.id, patternId),
        eq(shiftPatterns.organisationId, organisationId),
      ),
    )
    .returning();

  return deleted;
}

export async function getShiftPatterns(organisationId: string) {
  return db
    .select()
    .from(shiftPatterns)
    .where(
      and(
        eq(shiftPatterns.organisationId, organisationId),
        eq(shiftPatterns.isActive, true),
      ),
    );
}

export async function getShiftPatternById(
  organisationId: string,
  patternId: string,
) {
  const [pattern] = await db
    .select()
    .from(shiftPatterns)
    .where(
      and(
        eq(shiftPatterns.id, patternId),
        eq(shiftPatterns.organisationId, organisationId),
      ),
    );
  return pattern ?? null;
}

// --- Rota Period CRUD ---

export async function createRotaPeriod(
  organisationId: string,
  data: unknown,
) {
  const parsed = rotaPeriodSchema.parse(data);

  const [period] = await db
    .insert(rotaPeriods)
    .values({
      organisationId,
      ...parsed,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    })
    .returning();

  return period;
}

export async function getRotaPeriods(organisationId: string) {
  return db
    .select()
    .from(rotaPeriods)
    .where(eq(rotaPeriods.organisationId, organisationId));
}

// --- Shift Assignment ---

export async function assignStaffToShift(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = assignStaffSchema.parse(data);

  const [assignment] = await db
    .update(shiftAssignments)
    .set({
      staffId: parsed.staffId,
      status: 'assigned',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(shiftAssignments.id, parsed.shiftAssignmentId),
        eq(shiftAssignments.organisationId, organisationId),
      ),
    )
    .returning();

  return assignment;
}

export async function unassignStaffFromShift(
  organisationId: string,
  assignmentId: string,
) {
  const [assignment] = await db
    .update(shiftAssignments)
    .set({
      staffId: null,
      status: 'unassigned',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(shiftAssignments.id, assignmentId),
        eq(shiftAssignments.organisationId, organisationId),
      ),
    )
    .returning();

  return assignment;
}

// --- Conflict Override ---

export async function createConflictOverride(
  organisationId: string,
  userId: string,
  data: unknown,
) {
  const parsed = conflictOverrideSchema.parse(data);

  const [override] = await db
    .insert(conflictOverrides)
    .values({
      organisationId,
      ...parsed,
      overriddenBy: userId,
    })
    .returning();

  return override;
}

// --- Rota Period Confirmation ---

export async function confirmRotaPeriod(
  organisationId: string,
  periodId: string,
  userId: string,
) {
  // This would check all WTD violations before confirming
  // WTD violations are hard constraints — cannot confirm if any exist

  const [period] = await db
    .update(rotaPeriods)
    .set({
      status: 'confirmed',
      confirmedBy: userId,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(rotaPeriods.id, periodId),
        eq(rotaPeriods.organisationId, organisationId),
      ),
    )
    .returning();

  return period;
}

// --- Get assignments for a rota period ---

export async function getRotaAssignments(
  organisationId: string,
  periodId: string,
) {
  return db
    .select()
    .from(shiftAssignments)
    .where(
      and(
        eq(shiftAssignments.organisationId, organisationId),
        eq(shiftAssignments.rotaPeriodId, periodId),
      ),
    );
}
