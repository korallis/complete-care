'use server';

/**
 * Server actions for weight monitoring and wound care.
 * All mutations are tenant-scoped via organisationId.
 */
import { db } from '@/lib/db';
import {
  weightSchedules,
  weightRecords,
  waterlowAssessments,
  wounds,
  woundAssessments,
} from '@/lib/db/schema/weight-wounds';
import { eq, and, desc, gte } from 'drizzle-orm';
import type { ActionResult } from '@/types';
import {
  weightScheduleSchema,
  weightRecordSchema,
  waterlowAssessmentSchema,
  createWoundSchema,
  updateWoundSchema,
  woundAssessmentSchema,
  calculateBmi,
  getBmiCategory,
  calculateWeightChangePercent,
  calculateWaterlowTotal,
  getWaterlowRiskCategory,
} from './schema';

// ---------------------------------------------------------------------------
// Weight Schedule
// ---------------------------------------------------------------------------

export async function createWeightSchedule(
  organisationId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = weightScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [schedule] = await db
    .insert(weightSchedules)
    .values({
      organisationId,
      ...parsed.data,
      heightCm: parsed.data.heightCm ?? null,
    })
    .returning({ id: weightSchedules.id });

  return { success: true, data: { id: schedule.id } };
}

export async function updateWeightSchedule(
  organisationId: string,
  scheduleId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = weightScheduleSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [updated] = await db
    .update(weightSchedules)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(weightSchedules.id, scheduleId),
        eq(weightSchedules.organisationId, organisationId),
      ),
    )
    .returning({ id: weightSchedules.id });

  if (!updated) {
    return { success: false, error: 'Weight schedule not found' };
  }

  return { success: true, data: { id: updated.id } };
}

export async function getWeightSchedule(
  organisationId: string,
  personId: string,
) {
  const results = await db
    .select()
    .from(weightSchedules)
    .where(
      and(
        eq(weightSchedules.organisationId, organisationId),
        eq(weightSchedules.personId, personId),
        eq(weightSchedules.isActive, true),
      ),
    )
    .limit(1);

  return results[0] ?? null;
}

// ---------------------------------------------------------------------------
// Weight Records
// ---------------------------------------------------------------------------

export async function recordWeight(
  organisationId: string,
  recordedById: string,
  input: unknown,
): Promise<ActionResult<{ id: string; bmi: number | null; bmiCategory: string | null; changeAlert: boolean }>> {
  const parsed = weightRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { personId, weightKg, recordedDate } = parsed.data;
  let heightCm = parsed.data.heightCm ?? null;

  // Fall back to schedule height if not provided
  if (!heightCm) {
    const schedule = await getWeightSchedule(organisationId, personId);
    if (schedule?.heightCm) {
      heightCm = schedule.heightCm;
    }
  }

  // Calculate BMI if height is available
  let bmi: number | null = null;
  let bmiCategory: string | null = null;
  if (heightCm) {
    bmi = calculateBmi(weightKg, heightCm);
    bmiCategory = getBmiCategory(bmi);
  }

  const [record] = await db
    .insert(weightRecords)
    .values({
      organisationId,
      personId,
      recordedDate,
      weightKg,
      heightCm,
      bmi,
      bmiCategory,
      notes: parsed.data.notes,
      recordedById,
    })
    .returning({ id: weightRecords.id });

  // Check for significant weight change
  let changeAlert = false;
  const schedule = await getWeightSchedule(organisationId, personId);
  if (schedule) {
    const thresholdDays = schedule.changeAlertDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    const previousRecords = await db
      .select()
      .from(weightRecords)
      .where(
        and(
          eq(weightRecords.organisationId, organisationId),
          eq(weightRecords.personId, personId),
          gte(weightRecords.recordedDate, cutoffDate.toISOString().split('T')[0]),
        ),
      )
      .orderBy(weightRecords.recordedDate)
      .limit(1);

    if (previousRecords.length > 0) {
      const changePercent = Math.abs(
        calculateWeightChangePercent(weightKg, previousRecords[0].weightKg),
      );
      if (changePercent >= schedule.changeAlertThreshold) {
        changeAlert = true;
        // In production, this would create a clinical alert via the alert engine
      }
    }
  }

  return { success: true, data: { id: record.id, bmi, bmiCategory, changeAlert } };
}

export async function getWeightRecords(
  organisationId: string,
  personId: string,
  limit = 100,
) {
  return db
    .select()
    .from(weightRecords)
    .where(
      and(
        eq(weightRecords.organisationId, organisationId),
        eq(weightRecords.personId, personId),
      ),
    )
    .orderBy(desc(weightRecords.recordedDate))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Waterlow Assessment
// ---------------------------------------------------------------------------

export async function createWaterlowAssessment(
  organisationId: string,
  assessedById: string,
  input: unknown,
): Promise<ActionResult<{ id: string; totalScore: number; riskCategory: string }>> {
  const parsed = waterlowAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const totalScore = calculateWaterlowTotal(parsed.data.scores);
  const riskCategory = getWaterlowRiskCategory(totalScore);

  const [assessment] = await db
    .insert(waterlowAssessments)
    .values({
      organisationId,
      personId: parsed.data.personId,
      assessmentDate: parsed.data.assessmentDate,
      scores: parsed.data.scores,
      totalScore,
      riskCategory,
      notes: parsed.data.notes,
      assessedById,
    })
    .returning({ id: waterlowAssessments.id });

  return { success: true, data: { id: assessment.id, totalScore, riskCategory } };
}

export async function getWaterlowAssessments(
  organisationId: string,
  personId: string,
  limit = 50,
) {
  return db
    .select()
    .from(waterlowAssessments)
    .where(
      and(
        eq(waterlowAssessments.organisationId, organisationId),
        eq(waterlowAssessments.personId, personId),
      ),
    )
    .orderBy(desc(waterlowAssessments.assessmentDate))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Wound Management
// ---------------------------------------------------------------------------

export async function createWound(
  organisationId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createWoundSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [wound] = await db
    .insert(wounds)
    .values({
      organisationId,
      personId: parsed.data.personId,
      location: parsed.data.location,
      bodyMapPosition: parsed.data.bodyMapPosition ?? null,
      woundType: parsed.data.woundType,
      dateIdentified: parsed.data.dateIdentified,
      dressingType: parsed.data.dressingType,
      dressingFrequency: parsed.data.dressingFrequency,
      specialInstructions: parsed.data.specialInstructions,
      nextAssessmentDate: parsed.data.nextAssessmentDate,
    })
    .returning({ id: wounds.id });

  return { success: true, data: { id: wound.id } };
}

export async function updateWound(
  organisationId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateWoundSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...data } = parsed.data;

  const [updated] = await db
    .update(wounds)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(wounds.id, id), eq(wounds.organisationId, organisationId)),
    )
    .returning({ id: wounds.id });

  if (!updated) {
    return { success: false, error: 'Wound not found' };
  }

  return { success: true, data: { id: updated.id } };
}

export async function getWounds(
  organisationId: string,
  personId: string,
  statusFilter?: string,
) {
  const conditions = [
    eq(wounds.organisationId, organisationId),
    eq(wounds.personId, personId),
  ];

  if (statusFilter) {
    conditions.push(eq(wounds.status, statusFilter));
  }

  return db
    .select()
    .from(wounds)
    .where(and(...conditions))
    .orderBy(desc(wounds.createdAt));
}

export async function getWound(organisationId: string, woundId: string) {
  const results = await db
    .select()
    .from(wounds)
    .where(
      and(eq(wounds.id, woundId), eq(wounds.organisationId, organisationId)),
    )
    .limit(1);

  return results[0] ?? null;
}

// ---------------------------------------------------------------------------
// Wound Assessments
// ---------------------------------------------------------------------------

export async function createWoundAssessment(
  organisationId: string,
  assessedById: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = woundAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Verify wound belongs to this org
  const wound = await getWound(organisationId, parsed.data.woundId);
  if (!wound) {
    return { success: false, error: 'Wound not found' };
  }

  const [assessment] = await db
    .insert(woundAssessments)
    .values({
      organisationId,
      woundId: parsed.data.woundId,
      assessmentDate: parsed.data.assessmentDate,
      lengthCm: parsed.data.lengthCm ?? null,
      widthCm: parsed.data.widthCm ?? null,
      depthCm: parsed.data.depthCm ?? null,
      pressureUlcerGrade: parsed.data.pressureUlcerGrade ?? null,
      woundBed: parsed.data.woundBed ?? null,
      exudate: parsed.data.exudate ?? null,
      surroundingSkin: parsed.data.surroundingSkin ?? null,
      signsOfInfection: parsed.data.signsOfInfection,
      painLevel: parsed.data.painLevel ?? null,
      photoRef: parsed.data.photoRef ?? null,
      treatmentApplied: parsed.data.treatmentApplied,
      notes: parsed.data.notes,
      assessedById,
    })
    .returning({ id: woundAssessments.id });

  return { success: true, data: { id: assessment.id } };
}

export async function getWoundAssessments(
  organisationId: string,
  woundId: string,
) {
  return db
    .select()
    .from(woundAssessments)
    .where(
      and(
        eq(woundAssessments.organisationId, organisationId),
        eq(woundAssessments.woundId, woundId),
      ),
    )
    .orderBy(desc(woundAssessments.assessmentDate));
}
