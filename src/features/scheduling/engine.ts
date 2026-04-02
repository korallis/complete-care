/**
 * Auto-scheduling engine.
 *
 * Generates a draft rota from hard constraints (qualifications, availability,
 * minimum staffing) and soft constraints (continuity, geography, cost).
 * Produces a scored trade-off summary.
 */
import type {
  SchedulableStaff,
  ScheduleSlot,
  Assignment,
  ScheduleSummary,
  TradeOff,
  GapFillCandidate,
  GapFillReason,
} from './types';

// ── Hard constraint checks ────────────────────────────────────────────

/** Staff must hold all qualifications required by the slot. */
function hasRequiredQualifications(staff: SchedulableStaff, slot: ScheduleSlot): boolean {
  return slot.requiredQualifications.every((q) => staff.qualifications.includes(q));
}

/** Staff must be available during the slot window. */
function isAvailableDuring(staff: SchedulableStaff, slot: ScheduleSlot): boolean {
  return staff.availability.some(
    (a) =>
      a.dayOfWeek === slot.dayOfWeek &&
      a.type !== 'unavailable' &&
      a.startTime <= slot.startTime &&
      a.endTime >= slot.endTime,
  );
}

/** Staff must not exceed their maximum weekly hours. */
function hasHoursRemaining(staff: SchedulableStaff, slotDurationHours: number): boolean {
  return staff.scheduledHours + slotDurationHours <= staff.maxWeeklyHours;
}

/** Check all hard constraints for a staff-slot pairing. */
function passesHardConstraints(
  staff: SchedulableStaff,
  slot: ScheduleSlot,
  slotDurationHours: number,
): boolean {
  return (
    hasRequiredQualifications(staff, slot) &&
    isAvailableDuring(staff, slot) &&
    hasHoursRemaining(staff, slotDurationHours)
  );
}

// ── Soft constraint scoring ───────────────────────────────────────────

/** Score based on geographic proximity (0-100). Higher = closer. */
function scoreGeography(staff: SchedulableStaff, slot: ScheduleSlot): number {
  if (!slot.locationId || !staff.baseLocation) return 50; // neutral if no location data
  return staff.baseLocation === slot.locationId ? 100 : 30;
}

/** Score based on cost efficiency (0-100). Lower cost = higher score. */
function scoreCost(staff: SchedulableStaff): number {
  // Normalise: assume £8-£30/hr range. Lower rate = higher score.
  const minRate = 8;
  const maxRate = 30;
  const clamped = Math.max(minRate, Math.min(maxRate, staff.hourlyRate));
  return Math.round(((maxRate - clamped) / (maxRate - minRate)) * 100);
}

/** Score based on hours remaining (0-100). More hours available = higher score. */
function scoreHoursRemaining(staff: SchedulableStaff): number {
  const remaining = staff.maxWeeklyHours - staff.scheduledHours;
  const maxPossible = staff.maxWeeklyHours || 1;
  return Math.round((remaining / maxPossible) * 100);
}

/** Score based on preference (availability type). */
function scorePreference(staff: SchedulableStaff, slot: ScheduleSlot): number {
  const match = staff.availability.find(
    (a) =>
      a.dayOfWeek === slot.dayOfWeek && a.startTime <= slot.startTime && a.endTime >= slot.endTime,
  );
  if (!match) return 0;
  return match.type === 'preferred' ? 100 : 60;
}

/** Calculate composite suitability score for a staff-slot pairing. */
function calculateSuitabilityScore(staff: SchedulableStaff, slot: ScheduleSlot): number {
  const weights = { geography: 0.2, cost: 0.2, hoursRemaining: 0.3, preference: 0.3 };

  const geo = scoreGeography(staff, slot) * weights.geography;
  const cost = scoreCost(staff) * weights.cost;
  const hours = scoreHoursRemaining(staff) * weights.hoursRemaining;
  const pref = scorePreference(staff, slot) * weights.preference;

  return Math.round(geo + cost + hours + pref);
}

/** Parse time strings (HH:MM) and calculate duration in hours. */
export function calculateSlotDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let duration = endH - startH + (endM - startM) / 60;
  // Handle overnight shifts
  if (duration <= 0) duration += 24;
  return duration;
}

// ── Main engine ───────────────────────────────────────────────────────

/**
 * Generate a draft schedule by assigning staff to slots.
 *
 * Algorithm:
 * 1. For each slot, find all eligible staff (pass hard constraints).
 * 2. Score eligible staff by soft constraints.
 * 3. Assign the highest-scoring staff member.
 * 4. Update the staff member's scheduled hours.
 * 5. Repeat until all slots are processed.
 */
export function generateSchedule(
  staff: SchedulableStaff[],
  slots: ScheduleSlot[],
): { assignments: Assignment[]; summary: ScheduleSummary } {
  // Work with mutable copies of staff hours
  const staffHours = new Map<string, number>();
  for (const s of staff) {
    staffHours.set(s.id, s.scheduledHours);
  }

  const assignments: Assignment[] = [];
  const tradeOffScores = {
    geography: { total: 0, max: 0 },
    cost: { total: 0, max: 0 },
    hoursRemaining: { total: 0, max: 0 },
    preference: { total: 0, max: 0 },
  };

  // Sort slots by number of required qualifications (hardest to fill first)
  const sortedSlots = [...slots].sort(
    (a, b) => b.requiredQualifications.length - a.requiredQualifications.length,
  );

  for (const slot of sortedSlots) {
    const duration = calculateSlotDuration(slot.startTime, slot.endTime);
    const assignmentsNeeded = slot.minStaff;

    for (let i = 0; i < assignmentsNeeded; i++) {
      // Find eligible staff
      const eligible = staff.filter((s) => {
        const currentHours = staffHours.get(s.id) ?? s.scheduledHours;
        return passesHardConstraints({ ...s, scheduledHours: currentHours }, slot, duration);
      });

      if (eligible.length === 0) {
        assignments.push({
          slotId: slot.id,
          staffId: null,
          suitabilityScore: 0,
          status: 'unfilled',
        });
        continue;
      }

      // Score and rank eligible staff
      const scored = eligible
        .map((s) => {
          const currentHours = staffHours.get(s.id) ?? s.scheduledHours;
          const score = calculateSuitabilityScore({ ...s, scheduledHours: currentHours }, slot);
          return { staff: s, score };
        })
        .sort((a, b) => b.score - a.score);

      const best = scored[0];

      // Assign best staff member
      assignments.push({
        slotId: slot.id,
        staffId: best.staff.id,
        suitabilityScore: best.score,
        status: 'assigned',
      });

      // Update tracked hours
      const currentHours = staffHours.get(best.staff.id) ?? best.staff.scheduledHours;
      staffHours.set(best.staff.id, currentHours + duration);

      // Track trade-off scores
      tradeOffScores.geography.total += scoreGeography(best.staff, slot);
      tradeOffScores.geography.max += 100;
      tradeOffScores.cost.total += scoreCost(best.staff);
      tradeOffScores.cost.max += 100;
      tradeOffScores.hoursRemaining.total += scoreHoursRemaining(best.staff);
      tradeOffScores.hoursRemaining.max += 100;
      tradeOffScores.preference.total += scorePreference(best.staff, slot);
      tradeOffScores.preference.max += 100;
    }
  }

  const filled = assignments.filter((a) => a.status === 'assigned').length;
  const unfilled = assignments.filter((a) => a.status === 'unfilled').length;
  const totalScore =
    assignments.length > 0
      ? Math.round(assignments.reduce((sum, a) => sum + a.suitabilityScore, 0) / assignments.length)
      : 0;

  const tradeOffs: TradeOff[] = Object.entries(tradeOffScores).map(([key, val]) => ({
    constraint: key,
    score: val.max > 0 ? Math.round((val.total / val.max) * 100) : 0,
    maxScore: 100,
    details: `${key}: ${val.max > 0 ? Math.round((val.total / val.max) * 100) : 0}/100`,
  }));

  return {
    assignments,
    summary: {
      totalSlots: assignments.length,
      filledSlots: filled,
      unfilledSlots: unfilled,
      overallScore: totalScore,
      tradeOffs,
    },
  };
}

// ── Gap filling ───────────────────────────────────────────────────────

/**
 * For an unfilled slot, rank available staff by suitability.
 * Ranking factors: skills match > availability > hours remaining > cost.
 */
export function rankCandidatesForGap(
  staff: SchedulableStaff[],
  slot: ScheduleSlot,
): GapFillCandidate[] {
  const duration = calculateSlotDuration(slot.startTime, slot.endTime);

  return staff
    .filter((s) => passesHardConstraints(s, slot, duration))
    .map((s) => {
      const reasons: GapFillReason[] = [];

      // Skills score (most important)
      const skillsMatch =
        slot.requiredQualifications.length === 0
          ? 100
          : Math.round(
              (slot.requiredQualifications.filter((q) => s.qualifications.includes(q)).length /
                slot.requiredQualifications.length) *
                100,
            );
      reasons.push({ factor: 'skills', score: skillsMatch, detail: `${skillsMatch}% skills match` });

      // Availability score
      const availScore = scorePreference(s, slot);
      reasons.push({
        factor: 'availability',
        score: availScore,
        detail: availScore === 100 ? 'Preferred time' : 'Available',
      });

      // Hours remaining
      const hoursScore = scoreHoursRemaining(s);
      const remaining = s.maxWeeklyHours - s.scheduledHours;
      reasons.push({
        factor: 'hours_remaining',
        score: hoursScore,
        detail: `${remaining.toFixed(1)}h remaining of ${s.maxWeeklyHours}h`,
      });

      // Cost
      const costScore = scoreCost(s);
      reasons.push({
        factor: 'cost',
        score: costScore,
        detail: `£${s.hourlyRate.toFixed(2)}/hr`,
      });

      // Weighted composite: skills 40%, availability 25%, hours 20%, cost 15%
      const composite = Math.round(
        skillsMatch * 0.4 + availScore * 0.25 + hoursScore * 0.2 + costScore * 0.15,
      );

      return {
        staffId: s.id,
        staffName: s.name,
        suitabilityScore: composite,
        reasons,
      };
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
