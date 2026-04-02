import type { Person } from '@/lib/db/schema/persons';
import type {
  IndependentLivingAssessment,
  PathwayPlan,
  TransitionMilestone,
} from '@/lib/db/schema/reg44';

export type TransitionChronologyEntry = {
  id: string;
  date: string;
  source: string;
  title: string;
  description: string;
  href?: string;
  category?: string | null;
  isManual?: boolean;
};

export type TransitionChecklistItem = {
  key: string;
  label: string;
  status: 'not_started' | 'in_progress' | 'completed';
  detail: string;
};

export const TRANSITION_SKILL_DOMAIN_LABELS = {
  dailyLiving: 'Daily living',
  financialCapability: 'Financial capability',
  healthAndWellbeing: 'Health & wellbeing',
  socialAndRelationships: 'Social & relationships',
  educationAndWork: 'Education & work',
  housingKnowledge: 'Housing knowledge',
} as const;

export type TransitionSkillDomain = keyof typeof TRANSITION_SKILL_DOMAIN_LABELS;

export function calculateAge(
  dateOfBirth: string | null | undefined,
  now = new Date(),
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function calculateAssessmentReadiness(
  skills: IndependentLivingAssessment['skills'],
) {
  const domains = Object.entries(TRANSITION_SKILL_DOMAIN_LABELS).map(
    ([key, label]) => {
      const items = skills[key as TransitionSkillDomain] ?? [];
      const score = items.length
        ? Math.round(
            (items.reduce((sum, item) => sum + item.rating, 0) /
              (items.length * 5)) *
              100,
          )
        : 0;
      return {
        key: key as TransitionSkillDomain,
        label,
        score,
        count: items.length,
      };
    },
  );

  const overall = domains.length
    ? Math.round(domains.reduce((sum, domain) => sum + domain.score, 0) / domains.length)
    : 0;

  return { overall, domains };
}

export function buildPathwayPlanAlerts(input: {
  person: Pick<Person, 'dateOfBirth' | 'fullName'> | null;
  plan: Pick<PathwayPlan, 'sections' | 'planReviewDate' | 'status'>;
  milestones: Pick<TransitionMilestone, 'title' | 'status' | 'targetDate'>[];
  now?: Date;
}) {
  const alerts: string[] = [];
  const now = input.now ?? new Date();
  const age = calculateAge(input.person?.dateOfBirth, now);
  const accommodationText = input.plan.sections?.accommodation?.toLowerCase?.() ?? '';
  const securedWords = ['secured', 'signed', 'confirmed', 'move-in', 'supported lodgings'];
  const hasAccommodationSecured = securedWords.some((word) => accommodationText.includes(word));

  if (age !== null && age >= 17 && age < 18 && !hasAccommodationSecured) {
    alerts.push('Accommodation is not clearly secured for a young person approaching 18.');
  }

  if (input.plan.planReviewDate) {
    const reviewDate = new Date(input.plan.planReviewDate);
    if (!Number.isNaN(reviewDate.getTime())) {
      const daysUntilReview = Math.ceil(
        (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysUntilReview <= 30) {
        alerts.push(
          daysUntilReview < 0
            ? 'Pathway plan review is overdue.'
            : `Pathway plan review is due within ${daysUntilReview} days.`,
        );
      }
    }
  }

  const overdueMilestones = input.milestones.filter((milestone) => {
    if (!milestone.targetDate || milestone.status === 'completed') return false;
    const target = new Date(milestone.targetDate);
    return !Number.isNaN(target.getTime()) && target < now;
  });
  if (overdueMilestones.length > 0) {
    alerts.push(`${overdueMilestones.length} milestone${overdueMilestones.length === 1 ? '' : 's'} overdue.`);
  }

  return alerts;
}

export function buildLeavingCareChecklist(input: {
  person: Pick<
    Person,
    | 'gpName'
    | 'gpPractice'
    | 'allergies'
    | 'medicalConditions'
    | 'emergencyContacts'
    | 'address'
    | 'nhsNumber'
  > | null;
  plan: Pick<PathwayPlan, 'sections'>;
  readiness: number;
}) {
  const person = input.person;
  const section = input.plan.sections;
  const hasAccommodation = Boolean(section.accommodation?.trim());
  const hasEet = Boolean(section.education?.trim() || section.employment?.trim());
  const hasFinancialPlan = Boolean(section.financialSupport?.trim());
  const hasHealthPlan = Boolean(section.health?.trim());
  const hasSupportNetwork = Boolean(section.relationships?.trim());
  const hasIdentityPlan = Boolean(section.identity?.trim());
  const hasEmergencyContact = Boolean(person?.emergencyContacts?.length);
  const hasMedicalContext = Boolean(person?.gpName || person?.gpPractice || person?.medicalConditions?.length);

  const checklist: TransitionChecklistItem[] = [
    {
      key: 'accommodation',
      label: 'Accommodation confirmed',
      status: hasAccommodation ? 'completed' : 'not_started',
      detail: hasAccommodation
        ? 'Accommodation and move-on planning recorded in pathway plan.'
        : 'Record accommodation options, tenancy readiness, and move-in target.',
    },
    {
      key: 'health',
      label: 'Health passport ready',
      status: hasHealthPlan && hasMedicalContext ? 'completed' : hasHealthPlan ? 'in_progress' : 'not_started',
      detail: hasMedicalContext
        ? 'GP / medical context available for handover.'
        : 'Capture GP, medication, allergy, and health support information.',
    },
    {
      key: 'finance',
      label: 'Financial arrangements in place',
      status: hasFinancialPlan ? 'completed' : 'not_started',
      detail: hasFinancialPlan
        ? 'Financial capability / support planning recorded.'
        : 'Add budgeting, benefits, and money-management planning.',
    },
    {
      key: 'eet',
      label: 'Education / employment continuity confirmed',
      status: hasEet ? 'completed' : 'not_started',
      detail: hasEet
        ? 'EET status and next steps recorded.'
        : 'Document current EET status, barriers, and support plan.',
    },
    {
      key: 'contacts',
      label: 'Key contacts list provided',
      status: hasSupportNetwork && hasEmergencyContact ? 'completed' : hasSupportNetwork ? 'in_progress' : 'not_started',
      detail: hasEmergencyContact
        ? 'Support network and emergency contacts available.'
        : 'Add emergency contacts and support-network details.',
    },
    {
      key: 'identity',
      label: 'Identity and personal documents prepared',
      status: hasIdentityPlan && Boolean(person?.nhsNumber) ? 'completed' : hasIdentityPlan ? 'in_progress' : 'not_started',
      detail: hasIdentityPlan
        ? 'Identity / emotional wellbeing planning recorded.'
        : 'Capture ID, emotional wellbeing, and personal-document handover plan.',
    },
    {
      key: 'readiness',
      label: 'Transition readiness threshold met',
      status: input.readiness >= 70 ? 'completed' : input.readiness >= 40 ? 'in_progress' : 'not_started',
      detail: `Current readiness score ${input.readiness}%.`,
    },
  ];

  return checklist;
}

export function buildHealthPassport(
  person: Pick<
    Person,
    | 'fullName'
    | 'gpName'
    | 'gpPractice'
    | 'medicalConditions'
    | 'allergies'
    | 'nhsNumber'
    | 'contactPhone'
    | 'contactEmail'
  > | null,
) {
  if (!person) return null;

  return {
    name: person.fullName,
    gp: [person.gpName, person.gpPractice].filter(Boolean).join(' — ') || 'Add GP details',
    allergies: person.allergies?.length ? person.allergies.join(', ') : 'No allergies recorded',
    medicalConditions: person.medicalConditions?.length
      ? person.medicalConditions.join(', ')
      : 'No medical conditions recorded',
    nhsNumber: person.nhsNumber || 'No NHS number recorded',
    contact: [person.contactPhone, person.contactEmail].filter(Boolean).join(' · ') || 'No direct contact details recorded',
  };
}

export function matchesPersonName(
  names: string[] | null | undefined,
  person: Pick<Person, 'fullName' | 'preferredName'> | null,
) {
  if (!person || !names?.length) return false;
  const candidates = [person.fullName, person.preferredName]
    .filter(Boolean)
    .map((value) => value!.trim().toLowerCase());
  return names.some((name) => candidates.includes(name.trim().toLowerCase()));
}

export function sortChronologyEntries(entries: TransitionChronologyEntry[]) {
  return [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.title.localeCompare(b.title);
  });
}
