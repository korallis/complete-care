/**
 * Allergy checking engine.
 * VAL-EMAR-009: Allergy alert blocks administration; override requires
 * justification + authorisation; audited.
 *
 * Checks medication against a person's recorded allergies by matching:
 * 1. Medication name against allergen name (case-insensitive)
 * 2. Active ingredients against allergen name
 * 3. Allergen name against active ingredients
 */

import type { Allergy, Medication, DrugInteraction } from '@/lib/db/schema';
import type {
  AllergyAlert,
  InteractionAlert,
  DuplicateTherapeuticAlert,
  MedicationAlert,
} from '../types';

/**
 * Check a medication against a person's allergies.
 * Returns an array of AllergyAlert objects for any matches found.
 */
export function checkAllergies(
  medication: Pick<
    Medication,
    'id' | 'drugName' | 'activeIngredients'
  >,
  allergies: Pick<
    Allergy,
    'id' | 'allergen' | 'severity' | 'reaction' | 'status' | 'personId'
  >[],
): AllergyAlert[] {
  const alerts: AllergyAlert[] = [];
  const activeAllergies = allergies.filter((a) => a.status === 'active');

  for (const allergy of activeAllergies) {
    const allergenLower = allergy.allergen.toLowerCase().trim();
    const medNameLower = medication.drugName.toLowerCase().trim();

    // Check medication name against allergen
    if (
      medNameLower.includes(allergenLower) ||
      allergenLower.includes(medNameLower)
    ) {
      alerts.push({
        type: 'allergy',
        severity: allergy.severity as AllergyAlert['severity'],
        allergyId: allergy.id,
        allergen: allergy.allergen,
        reaction: allergy.reaction ?? null,
        matchedOn: 'medication name',
        medicationName: medication.drugName,
        personId: allergy.personId,
      });
      continue; // Don't double-alert for same allergy
    }

    // Check active ingredients against allergen
    if (medication.activeIngredients) {
      for (const ingredient of medication.activeIngredients) {
        if (!ingredient) continue;
        const ingredientLower = ingredient.toLowerCase().trim();
        if (
          ingredientLower.includes(allergenLower) ||
          allergenLower.includes(ingredientLower)
        ) {
          alerts.push({
            type: 'allergy',
            severity: allergy.severity as AllergyAlert['severity'],
            allergyId: allergy.id,
            allergen: allergy.allergen,
            reaction: allergy.reaction ?? null,
            matchedOn: `active ingredient: ${ingredient}`,
            medicationName: medication.drugName,
            personId: allergy.personId,
          });
          break; // One match per allergy is enough
        }
      }
    }
  }

  return alerts;
}

/**
 * Check for drug interactions between a medication and existing medications.
 * Returns interaction alerts for any known interactions.
 */
export function checkInteractions(
  medicationName: string,
  existingMedications: Pick<Medication, 'drugName'>[],
  knownInteractions: Pick<
    DrugInteraction,
    'id' | 'drugA' | 'drugB' | 'severity' | 'description' | 'recommendation'
  >[],
): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  const medNameLower = medicationName.toLowerCase().trim();

  for (const existing of existingMedications) {
    const existingLower = existing.drugName.toLowerCase().trim();

    for (const interaction of knownInteractions) {
      const drugALower = interaction.drugA.toLowerCase().trim();
      const drugBLower = interaction.drugB.toLowerCase().trim();

      const matchForward =
        (medNameLower.includes(drugALower) ||
          drugALower.includes(medNameLower)) &&
        (existingLower.includes(drugBLower) ||
          drugBLower.includes(existingLower));

      const matchReverse =
        (medNameLower.includes(drugBLower) ||
          drugBLower.includes(medNameLower)) &&
        (existingLower.includes(drugALower) ||
          drugALower.includes(existingLower));

      if (matchForward || matchReverse) {
        alerts.push({
          type: 'interaction',
          severity: interaction.severity as InteractionAlert['severity'],
          interactionId: interaction.id,
          drugA: interaction.drugA,
          drugB: interaction.drugB,
          description: interaction.description,
          recommendation: interaction.recommendation ?? null,
        });
      }
    }
  }

  return alerts;
}

/**
 * Check for duplicate therapeutic class prescriptions.
 * Flags when a new medication shares a therapeutic class with an existing one.
 */
export function checkDuplicateTherapeutic(
  medication: Pick<Medication, 'drugName' | 'therapeuticClass'>,
  existingMedications: Pick<Medication, 'drugName' | 'therapeuticClass'>[],
): DuplicateTherapeuticAlert[] {
  const alerts: DuplicateTherapeuticAlert[] = [];

  if (!medication.therapeuticClass) return alerts;

  for (const existing of existingMedications) {
    if (
      existing.therapeuticClass &&
      existing.therapeuticClass.toLowerCase() ===
        medication.therapeuticClass.toLowerCase() &&
      existing.drugName.toLowerCase() !== medication.drugName.toLowerCase()
    ) {
      alerts.push({
        type: 'duplicate_therapeutic',
        therapeuticClass: medication.therapeuticClass,
        existingMedication: existing.drugName,
        newMedication: medication.drugName,
      });
    }
  }

  return alerts;
}

/**
 * Run all medication safety checks and return combined alerts.
 * Used before medication administration to display warnings.
 */
export function runAllMedicationChecks(params: {
  medication: Pick<
    Medication,
    'id' | 'drugName' | 'activeIngredients' | 'therapeuticClass'
  >;
  personAllergies: Pick<
    Allergy,
    'id' | 'allergen' | 'severity' | 'reaction' | 'status' | 'personId'
  >[];
  existingMedications: Pick<Medication, 'drugName' | 'therapeuticClass'>[];
  knownInteractions: Pick<
    DrugInteraction,
    'id' | 'drugA' | 'drugB' | 'severity' | 'description' | 'recommendation'
  >[];
}): MedicationAlert[] {
  const allergyAlerts = checkAllergies(
    params.medication,
    params.personAllergies,
  );
  const interactionAlerts = checkInteractions(
    params.medication.drugName,
    params.existingMedications,
    params.knownInteractions,
  );
  const duplicateAlerts = checkDuplicateTherapeutic(
    params.medication,
    params.existingMedications,
  );

  return [...allergyAlerts, ...interactionAlerts, ...duplicateAlerts];
}

/**
 * Determine if any alerts are blocking (require override to proceed).
 * Allergy alerts always block. Contraindicated interactions block.
 */
export function hasBlockingAlerts(alerts: MedicationAlert[]): boolean {
  return alerts.some(
    (alert) =>
      alert.type === 'allergy' ||
      (alert.type === 'interaction' && alert.severity === 'contraindicated'),
  );
}

/**
 * Get the highest severity level from a list of alerts.
 */
export function getHighestSeverity(
  alerts: MedicationAlert[],
): 'critical' | 'high' | 'medium' | 'low' | 'none' {
  if (alerts.length === 0) return 'none';

  for (const alert of alerts) {
    if (alert.type === 'allergy' && alert.severity === 'life_threatening')
      return 'critical';
    if (
      alert.type === 'interaction' &&
      alert.severity === 'contraindicated'
    )
      return 'critical';
  }

  for (const alert of alerts) {
    if (alert.type === 'allergy' && alert.severity === 'severe')
      return 'high';
    if (alert.type === 'interaction' && alert.severity === 'major')
      return 'high';
  }

  for (const alert of alerts) {
    if (alert.type === 'allergy' && alert.severity === 'moderate')
      return 'medium';
    if (alert.type === 'interaction' && alert.severity === 'moderate')
      return 'medium';
    if (alert.type === 'duplicate_therapeutic') return 'medium';
  }

  return 'low';
}
