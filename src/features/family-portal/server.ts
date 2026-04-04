import { auth } from '@/auth';
import { checkPhotoConsent } from '@/features/consent/manager';
import type { Consent } from '@/features/consent/types';
import { db } from '@/lib/db';
import {
  approvedContacts,
  careNotes,
  carePlans,
  contactSchedules,
  consentRecords,
  familyMembers,
  familyPortalSettings,
  keyworkerSessions,
  medications,
  organisations,
  persons,
  users,
} from '@/lib/db/schema';
import { and, asc, desc, eq, gte, isNull } from 'drizzle-orm';
import { buildEmptyPortalView, DOMAIN_CONFIG } from './lib/domain-views';
import type {
  CareDomain,
  CareInformationView,
  CareNote,
  MedicationEntry,
  PortalView,
} from './types';

const DEFAULT_VISIBLE_SECTIONS = [
  'care_plans',
  'care_notes',
  'medications',
  'appointments',
] as const;

type VisibleSection = (typeof DEFAULT_VISIBLE_SECTIONS)[number];

export interface FamilyPortalLinkedPerson {
  organisationId: string;
  organisationName: string;
  personId: string;
  personName: string;
  personStatus: string;
  photoUrl: string | null;
  relationship: string;
  domains: string[];
  domain: CareDomain;
  domainLabel: string;
}

export interface FamilyPortalContext {
  userId: string;
  linkedPersons: FamilyPortalLinkedPerson[];
  currentPerson: FamilyPortalLinkedPerson | null;
  visibleSections: VisibleSection[];
  messageApprovalRequired: boolean;
  updateApprovalRequired: boolean;
}

function normaliseCareDomain(domains: string[]): CareDomain {
  if (
    domains.includes('childrens_homes') ||
    domains.includes('childrens_home') ||
    domains.includes('childrens_residential')
  ) {
    return 'childrens_homes';
  }

  if (domains.includes('complex_care')) {
    return 'complex_care';
  }

  if (
    domains.includes('domiciliary_care') ||
    domains.includes('domiciliary')
  ) {
    return 'domiciliary_care';
  }

  return 'supported_living';
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return 'Not recorded';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return 'Not scheduled';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function mapContactType(value: string): 'visit' | 'phone' | 'video' {
  if (value == 'video') {
    return 'video';
  }

  if (value == 'phone') {
    return 'phone';
  }

  return 'visit';
}

function mapContactStatus(value: string): 'scheduled' | 'completed' | 'cancelled' {
  if (value == 'completed') {
    return 'completed';
  }

  if (value == 'scheduled') {
    return 'scheduled';
  }

  return 'cancelled';
}

function summariseText(...parts: Array<string | null | undefined>): string {
  const summary = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!summary) {
    return 'No summary recorded.';
  }

  return summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary;
}

function toConsentRecord(record: {
  id: string;
  personId: string;
  consentType: string;
  status: string;
  grantedDate: string;
  withdrawnDate: string | null;
  givenBy: string;
  relationship: string;
  conditions: string | null;
  reviewDate: string | null;
}): Consent {
  return {
    id: record.id,
    personId: record.personId,
    consentType: record.consentType as Consent['consentType'],
    status: record.status as Consent['status'],
    grantedDate: record.grantedDate,
    withdrawnDate: record.withdrawnDate,
    givenBy: record.givenBy,
    relationship: record.relationship as Consent['relationship'],
    conditions: record.conditions,
    reviewDate: record.reviewDate,
  };
}

export async function getFamilyPortalContext(
  selectedPersonId?: string,
): Promise<FamilyPortalContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const rawLinkedPersons = await db
    .select({
      organisationId: familyMembers.organisationId,
      organisationName: organisations.name,
      personId: familyMembers.personId,
      personName: persons.fullName,
      personStatus: persons.status,
      photoUrl: persons.photoUrl,
      relationship: familyMembers.relationship,
      domains: organisations.domains,
    })
    .from(familyMembers)
    .innerJoin(persons, eq(familyMembers.personId, persons.id))
    .innerJoin(organisations, eq(familyMembers.organisationId, organisations.id))
    .where(
      and(
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, 'approved'),
        isNull(persons.deletedAt),
      ),
    )
    .orderBy(asc(persons.fullName));

  const linkedPersons = rawLinkedPersons.map((entry) => {
    const domain = normaliseCareDomain(entry.domains ?? []);

    return {
      ...entry,
      domains: entry.domains ?? [],
      domain,
      domainLabel: DOMAIN_CONFIG[domain].label,
    } satisfies FamilyPortalLinkedPerson;
  });

  const currentPerson =
    linkedPersons.find((entry) => entry.personId === selectedPersonId) ??
    linkedPersons[0] ??
    null;

  if (!currentPerson) {
    return {
      userId: session.user.id,
      linkedPersons: [],
      currentPerson: null,
      visibleSections: [...DEFAULT_VISIBLE_SECTIONS],
      messageApprovalRequired: false,
      updateApprovalRequired: false,
    };
  }

  const [settings] = await db
    .select({
      visibleSections: familyPortalSettings.visibleSections,
      messageApprovalRequired: familyPortalSettings.messageApprovalRequired,
      updateApprovalRequired: familyPortalSettings.updateApprovalRequired,
    })
    .from(familyPortalSettings)
    .where(eq(familyPortalSettings.organisationId, currentPerson.organisationId))
    .limit(1);

  return {
    userId: session.user.id,
    linkedPersons,
    currentPerson,
    visibleSections:
      (settings?.visibleSections as VisibleSection[] | undefined) ??
      [...DEFAULT_VISIBLE_SECTIONS],
    messageApprovalRequired: settings?.messageApprovalRequired ?? false,
    updateApprovalRequired: settings?.updateApprovalRequired ?? false,
  };
}

export async function getFamilyCareInformation(
  context: FamilyPortalContext,
): Promise<CareInformationView> {
  if (!context.currentPerson) {
    return {
      carePlans: [],
      recentCareNotes: [],
      medicationSummary: [],
      upcomingAppointments: [],
    };
  }

  const { organisationId, personId } = context.currentPerson;

  const [plans, notes, medicationRows] = await Promise.all([
    db
      .select({
        id: carePlans.id,
        title: carePlans.title,
        approvedAt: carePlans.approvedAt,
        nextReviewDate: carePlans.nextReviewDate,
      })
      .from(carePlans)
      .where(
        and(
          eq(carePlans.organisationId, organisationId),
          eq(carePlans.personId, personId),
          eq(carePlans.status, 'approved'),
          isNull(carePlans.deletedAt),
        ),
      )
      .orderBy(desc(carePlans.updatedAt))
      .limit(3),
    db
      .select({
        id: careNotes.id,
        createdAt: careNotes.createdAt,
        authorName: careNotes.authorName,
        noteType: careNotes.noteType,
        content: careNotes.content,
      })
      .from(careNotes)
      .where(
        and(
          eq(careNotes.organisationId, organisationId),
          eq(careNotes.personId, personId),
        ),
      )
      .orderBy(desc(careNotes.createdAt))
      .limit(5),
    db
      .select({
        id: medications.id,
        drugName: medications.drugName,
        dose: medications.dose,
        doseUnit: medications.doseUnit,
        frequency: medications.frequency,
        prescriberName: medications.prescriberName,
        prescribedDate: medications.prescribedDate,
      })
      .from(medications)
      .where(
        and(
          eq(medications.organisationId, organisationId),
          eq(medications.personId, personId),
          eq(medications.status, 'active'),
        ),
      )
      .orderBy(desc(medications.createdAt))
      .limit(5),
  ]);

  return {
    carePlans: plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      lastReviewDate: formatDate(plan.approvedAt),
      nextReviewDate: formatDate(plan.nextReviewDate),
      objectives: [],
    })),
    recentCareNotes: notes.map(
      (note) =>
        ({
          id: note.id,
          date: formatDateTime(note.createdAt),
          staffName: note.authorName ?? 'Care team',
          category: note.noteType,
          summary: summariseText(note.content),
        }) satisfies CareNote,
    ),
    medicationSummary: medicationRows.map(
      (medication) =>
        ({
          id: medication.id,
          medicationName: medication.drugName,
          dosage: `${medication.dose} ${medication.doseUnit}`.trim(),
          frequency: medication.frequency,
          prescribedBy: medication.prescriberName,
          startDate: formatDate(medication.prescribedDate),
        }) satisfies MedicationEntry,
    ),
    upcomingAppointments: [],
  };
}

export async function getFamilyDomainView(
  context: FamilyPortalContext,
): Promise<PortalView | null> {
  if (!context.currentPerson) {
    return null;
  }

  const { currentPerson } = context;

  if (currentPerson.domain !== 'childrens_homes') {
    return buildEmptyPortalView(currentPerson.domain);
  }

  const [sessions, scheduledContacts, highlights] = await Promise.all([
    db
      .select({
        id: keyworkerSessions.id,
        sessionDate: keyworkerSessions.sessionDate,
        keyWorkerName: users.name,
        checkIn: keyworkerSessions.checkIn,
        weekReview: keyworkerSessions.weekReview,
        family: keyworkerSessions.family,
        wishesAndFeelings: keyworkerSessions.wishesAndFeelings,
      })
      .from(keyworkerSessions)
      .innerJoin(users, eq(keyworkerSessions.keyworkerId, users.id))
      .where(
        and(
          eq(keyworkerSessions.organisationId, currentPerson.organisationId),
          eq(keyworkerSessions.personId, currentPerson.personId),
        ),
      )
      .orderBy(desc(keyworkerSessions.sessionDate))
      .limit(3),
    db
      .select({
        id: contactSchedules.id,
        scheduledAt: contactSchedules.scheduledAt,
        relationship: approvedContacts.relationship,
        contactName: approvedContacts.name,
        contactType: contactSchedules.contactType,
        status: contactSchedules.status,
      })
      .from(contactSchedules)
      .innerJoin(
        approvedContacts,
        eq(contactSchedules.approvedContactId, approvedContacts.id),
      )
      .where(
        and(
          eq(contactSchedules.organisationId, currentPerson.organisationId),
          eq(contactSchedules.personId, currentPerson.personId),
          gte(contactSchedules.scheduledAt, new Date()),
        ),
      )
      .orderBy(asc(contactSchedules.scheduledAt))
      .limit(5),
    db
      .select({
        id: careNotes.id,
        createdAt: careNotes.createdAt,
        content: careNotes.content,
        mood: careNotes.mood,
        authorName: careNotes.authorName,
      })
      .from(careNotes)
      .where(
        and(
          eq(careNotes.organisationId, currentPerson.organisationId),
          eq(careNotes.personId, currentPerson.personId),
        ),
      )
      .orderBy(desc(careNotes.createdAt))
      .limit(5),
  ]);

  return {
    domain: 'childrens_homes',
    keyWorkerSessions: sessions.map((session) => ({
      id: session.id,
      sessionDate: formatDate(session.sessionDate),
      keyWorkerName: session.keyWorkerName ?? 'Key worker',
      summary: summariseText(
        session.checkIn,
        session.weekReview,
        session.family,
        session.wishesAndFeelings,
      ),
      nextSessionDate: 'To be arranged',
    })),
    contactSchedule: scheduledContacts.map((contact) => ({
      id: contact.id,
      contactName: contact.contactName,
      relationship: contact.relationship,
      scheduledAt: formatDateTime(contact.scheduledAt),
      contactType: mapContactType(contact.contactType),
      status: mapContactStatus(contact.status),
    })),
    dailyLogHighlights: highlights.map((highlight) => ({
      id: highlight.id,
      date: formatDateTime(highlight.createdAt),
      summary: summariseText(highlight.content),
      mood: highlight.mood ?? 'Not recorded',
      staffName: highlight.authorName ?? 'Care team',
    })),
  };
}

export async function getPhotographyConsentStatus(
  organisationId: string,
  personId: string,
) {
  const records = await db
    .select({
      id: consentRecords.id,
      personId: consentRecords.personId,
      consentType: consentRecords.consentType,
      status: consentRecords.status,
      grantedDate: consentRecords.grantedDate,
      withdrawnDate: consentRecords.withdrawnDate,
      givenBy: consentRecords.givenBy,
      relationship: consentRecords.relationship,
      conditions: consentRecords.conditions,
      reviewDate: consentRecords.reviewDate,
    })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.organisationId, organisationId),
        eq(consentRecords.personId, personId),
        eq(consentRecords.consentType, 'photography'),
      ),
    )
    .orderBy(desc(consentRecords.grantedDate));

  return checkPhotoConsent(records.map(toConsentRecord), personId);
}
