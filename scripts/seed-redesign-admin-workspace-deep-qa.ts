import { and, eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import {
  organisations,
  users,
  memberships,
  staffProfiles,
  persons,
  medications,
  medicationAdministrations,
  prnProtocols,
  prnAdministrations,
  medicationStock,
  stockBatches,
  stockTransactions,
  reorderRequests,
  medicationErrors,
  handoverReports,
  topicalMar,
  topicalMarAdministrations,
  homelyRemedyProtocols,
  homelyRemedyAdministrations,
  cdRegisters,
  cdRegisterEntries,
  transdermalPatches,
  cdStockReconciliations,
  carePackages,
  visitTypes,
  scheduledVisits,
  meetings,
  approvedContacts,
  contactSchedules,
  contactRecords,
  lacRecords,
  placementPlans,
  lacStatusChanges,
  philomenaProfiles,
  missingEpisodes,
  missingEpisodeTimeline,
  returnHomeInterviews,
} from '../src/lib/db/schema';
import { hospitalAdmissions, visitCancellations } from '../src/lib/db/schema/rota';

const TARGET_ORG_SLUG = process.env.SEED_ORG_SLUG ?? 'redesign-admin-workspace';
const TARGET_PERSON_NAME = 'Amelia Hart';
const LEE_EMAIL = 'lee@completecare.test';

const IDS = {
  users: {
    jordan: '11111111-1111-4111-8111-111111111111',
    priya: '22222222-2222-4222-8222-222222222222',
  },
  memberships: {
    jordan: '11111111-1111-4111-8111-111111111112',
    priya: '22222222-2222-4222-8222-222222222223',
  },
  staff: {
    jordan: '11111111-1111-4111-8111-111111111113',
    priya: '22222222-2222-4222-8222-222222222224',
  },
  medications: {
    sertraline: '31000000-0000-4100-8100-000000000001',
    paracetamol: '31000000-0000-4100-8100-000000000002',
    buprenorphinePatch: '31000000-0000-4100-8100-000000000003',
  },
  medAdministrations: {
    sertralineToday: '32000000-0000-4200-8200-000000000001',
    sertralineYesterdayRefused: '32000000-0000-4200-8200-000000000002',
    buprenorphineToday: '32000000-0000-4200-8200-000000000003',
  },
  prn: {
    protocol: '33000000-0000-4300-8300-000000000001',
    adminCompleted: '33000000-0000-4300-8300-000000000002',
    adminPending: '33000000-0000-4300-8300-000000000003',
  },
  stock: {
    paracetamol: '34000000-0000-4400-8400-000000000001',
    buprenorphinePatch: '34000000-0000-4400-8400-000000000002',
    epimax: '34000000-0000-4400-8400-000000000003',
    batchParacetamol: '34000000-0000-4400-8400-000000000011',
    batchBuprenorphine: '34000000-0000-4400-8400-000000000012',
    batchEpimax: '34000000-0000-4400-8400-000000000013',
    txnParacetamolReceipt: '34000000-0000-4400-8400-000000000021',
    txnParacetamolIssue: '34000000-0000-4400-8400-000000000022',
    txnBuprenorphineReceipt: '34000000-0000-4400-8400-000000000023',
    txnBuprenorphineIssue: '34000000-0000-4400-8400-000000000024',
    txnEpimaxReceipt: '34000000-0000-4400-8400-000000000025',
    txnEpimaxIssue: '34000000-0000-4400-8400-000000000026',
    reorderEpimax: '34000000-0000-4400-8400-000000000031',
    medicationError: '34000000-0000-4400-8400-000000000032',
    handover: '34000000-0000-4400-8400-000000000033',
    topicalMar: '34000000-0000-4400-8400-000000000034',
    topicalAdmin: '34000000-0000-4400-8400-000000000035',
    homelyProtocol: '34000000-0000-4400-8400-000000000036',
    homelyAdmin: '34000000-0000-4400-8400-000000000037',
  },
  controlledDrugs: {
    register: '35000000-0000-4500-8500-000000000001',
    entryReceipt: '35000000-0000-4500-8500-000000000002',
    entryPatchLastWeek: '35000000-0000-4500-8500-000000000003',
    entryPatchToday: '35000000-0000-4500-8500-000000000004',
    oldPatch: '35000000-0000-4500-8500-000000000005',
    activePatch: '35000000-0000-4500-8500-000000000006',
    reconciliation: '35000000-0000-4500-8500-000000000007',
  },
  visits: {
    carePackage: '36000000-0000-4600-8600-000000000001',
    morningSupport: '36000000-0000-4600-8600-000000000002',
    schoolTransition: '36000000-0000-4600-8600-000000000003',
    visitCompleted: '36000000-0000-4600-8600-000000000011',
    visitScheduled: '36000000-0000-4600-8600-000000000012',
    visitMissed: '36000000-0000-4600-8600-000000000013',
    visitCancelled: '36000000-0000-4600-8600-000000000014',
    hospitalAdmission: '36000000-0000-4600-8600-000000000015',
    visitCancellation: '36000000-0000-4600-8600-000000000016',
  },
  meetings: {
    houseMeeting: '37000000-0000-4700-8700-000000000001',
    placementReview: '37000000-0000-4700-8700-000000000002',
  },
  contacts: {
    karen: '38000000-0000-4800-8800-000000000001',
    daniel: '38000000-0000-4800-8800-000000000002',
    lucy: '38000000-0000-4800-8800-000000000003',
    karenSchedule: '38000000-0000-4800-8800-000000000011',
    danielSchedule: '38000000-0000-4800-8800-000000000012',
    lucySchedule: '38000000-0000-4800-8800-000000000013',
    danielRecord: '38000000-0000-4800-8800-000000000021',
    lucyRecord: '38000000-0000-4800-8800-000000000022',
  },
  lac: {
    record: '39000000-0000-4900-8900-000000000001',
    placementPlan: '39000000-0000-4900-8900-000000000002',
    statusChange: '39000000-0000-4900-8900-000000000003',
  },
  missing: {
    philomena: '3a000000-0000-4a00-8a00-000000000001',
    openEpisode: '3a000000-0000-4a00-8a00-000000000002',
    returnedEpisode: '3a000000-0000-4a00-8a00-000000000003',
    openTimeline1: '3a000000-0000-4a00-8a00-000000000011',
    openTimeline2: '3a000000-0000-4a00-8a00-000000000012',
    openTimeline3: '3a000000-0000-4a00-8a00-000000000013',
    openTimeline4: '3a000000-0000-4a00-8a00-000000000014',
    returnedTimeline1: '3a000000-0000-4a00-8a00-000000000015',
    returnedTimeline2: '3a000000-0000-4a00-8a00-000000000016',
    returnedTimeline3: '3a000000-0000-4a00-8a00-000000000017',
    returnedTimeline4: '3a000000-0000-4a00-8a00-000000000018',
    rhi: '3a000000-0000-4a00-8a00-000000000019',
  },
} as const;

function dayOffset(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function atUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`);
}

function avatarDataUri(initials: string, background = '#dbeafe', foreground = '#1e3a8a') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150"><rect width="100%" height="100%" fill="${background}"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="${foreground}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Load .env.local before running this script.');
  }

  const now = new Date();
  const today = formatDate(now);
  const yesterday = formatDate(dayOffset(now, -1));
  const twoDaysAgo = formatDate(dayOffset(now, -2));
  const threeDaysAgo = formatDate(dayOffset(now, -3));
  const oneWeekAgo = formatDate(dayOffset(now, -7));
  const oneMonthAgo = formatDate(dayOffset(now, -30));
  const fourMonthsAgo = formatDate(dayOffset(now, -120));
  const twoMonthsFromNow = formatDate(dayOffset(now, 60));
  const threeDaysFromNow = formatDate(dayOffset(now, 3));
  const fourDaysFromNow = formatDate(dayOffset(now, 4));

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.slug, TARGET_ORG_SLUG))
    .limit(1);

  if (!org) {
    throw new Error(`Organisation ${TARGET_ORG_SLUG} was not found.`);
  }

  const [person] = await db
    .select()
    .from(persons)
    .where(
      and(
        eq(persons.organisationId, org.id),
        eq(persons.fullName, TARGET_PERSON_NAME),
      ),
    )
    .limit(1);

  if (!person) {
    throw new Error(`Person ${TARGET_PERSON_NAME} was not found in ${TARGET_ORG_SLUG}.`);
  }

  const [leeUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, LEE_EMAIL))
    .limit(1);

  if (!leeUser) {
    throw new Error(`Expected user ${LEE_EMAIL} was not found.`);
  }

  const [leeMembership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organisationId, org.id),
        eq(memberships.userId, leeUser.id),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  if (!leeMembership) {
    throw new Error(`Expected ${LEE_EMAIL} to have an active membership in ${TARGET_ORG_SLUG}.`);
  }

  const [leeStaffProfile] = await db
    .select()
    .from(staffProfiles)
    .where(
      and(
        eq(staffProfiles.organisationId, org.id),
        eq(staffProfiles.userId, leeUser.id),
      ),
    )
    .limit(1);

  if (!leeStaffProfile) {
    throw new Error(`Expected ${LEE_EMAIL} to have a staff profile in ${TARGET_ORG_SLUG}.`);
  }

  await db
    .update(persons)
    .set({
      preferredName: 'Millie',
      gender: 'female',
      ethnicity: 'White British',
      religion: 'None',
      firstLanguage: 'English',
      nhsNumber: '943 476 5919',
      gpName: 'Dr Eleanor Finch',
      gpPractice: 'Harbourside Family Practice',
      allergies: ['Penicillin'],
      medicalConditions: ['Asthma', 'Migraines'],
      contactPhone: '07700 900451',
      contactEmail: 'amelia.hart@placing-authority.test',
      address: 'Rosewood House, 14 Marsh Lane, Bristol BS5 0RT',
      emergencyContacts: [
        {
          id: 'amelia-emergency-1',
          name: 'Karen Hart',
          relationship: 'Mother',
          phone: '07700 900200',
          priority: 1,
          email: 'karen.hart@example.test',
        },
        {
          id: 'amelia-emergency-2',
          name: 'Lucy Morgan',
          relationship: 'Social worker',
          phone: '0117 900 4455',
          priority: 2,
          email: 'lucy.morgan@bristol.gov.uk',
        },
      ],
      photoUrl: avatarDataUri('AH'),
      updatedAt: new Date(),
    })
    .where(eq(persons.id, person.id));

  await db
    .insert(users)
    .values([
      {
        id: IDS.users.jordan,
        email: 'jordan.evans@completecare.test',
        name: 'Jordan Evans',
        emailVerified: true,
      },
      {
        id: IDS.users.priya,
        email: 'priya.shah@completecare.test',
        name: 'Priya Shah',
        emailVerified: true,
      },
    ])
    .onConflictDoUpdate({
      target: users.id,
      set: {
        emailVerified: true,
      },
    });

  await db
    .insert(memberships)
    .values({
      id: IDS.memberships.jordan,
      userId: IDS.users.jordan,
      organisationId: org.id,
      role: 'manager',
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [memberships.userId, memberships.organisationId],
      set: {
        role: 'manager',
        status: 'active',
      },
    });

  await db
    .insert(memberships)
    .values({
      id: IDS.memberships.priya,
      userId: IDS.users.priya,
      organisationId: org.id,
      role: 'senior_carer',
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [memberships.userId, memberships.organisationId],
      set: {
        role: 'senior_carer',
        status: 'active',
      },
    });

  await db
    .insert(staffProfiles)
    .values([
      {
        id: IDS.staff.jordan,
        organisationId: org.id,
        userId: IDS.users.jordan,
        fullName: 'Jordan Evans',
        firstName: 'Jordan',
        lastName: 'Evans',
        jobTitle: 'Registered Manager',
        contractType: 'full_time',
        startDate: '2025-11-03',
        email: 'jordan.evans@completecare.test',
        phone: '07700 900310',
        status: 'active',
      },
      {
        id: IDS.staff.priya,
        organisationId: org.id,
        userId: IDS.users.priya,
        fullName: 'Priya Shah',
        firstName: 'Priya',
        lastName: 'Shah',
        jobTitle: 'Senior Residential Support Worker',
        contractType: 'full_time',
        startDate: '2026-01-12',
        email: 'priya.shah@completecare.test',
        phone: '07700 900311',
        status: 'active',
      },
    ])
    .onConflictDoUpdate({
      target: staffProfiles.id,
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

  await db
    .insert(medications)
    .values([
      {
        id: IDS.medications.sertraline,
        organisationId: org.id,
        personId: person.id,
        drugName: 'Sertraline',
        dose: '50',
        doseUnit: 'mg',
        route: 'oral',
        frequency: 'regular',
        frequencyDetail: { timesOfDay: ['08:00'] },
        prescribedDate: '2026-03-15',
        prescriberName: 'Dr Eleanor Finch',
        pharmacy: 'Harbourside Pharmacy',
        specialInstructions: 'Administer with breakfast and record mood on refusal.',
        status: 'active',
        therapeuticClass: 'SSRI',
        activeIngredients: ['Sertraline hydrochloride'],
      },
      {
        id: IDS.medications.paracetamol,
        organisationId: org.id,
        personId: person.id,
        drugName: 'Paracetamol',
        dose: '500',
        doseUnit: 'mg',
        route: 'oral',
        frequency: 'prn',
        frequencyDetail: {
          timesOfDay: [],
          maxDosesPerDay: 4,
          minHoursBetweenDoses: 4,
        },
        prescribedDate: '2026-03-20',
        prescriberName: 'Dr Eleanor Finch',
        pharmacy: 'Harbourside Pharmacy',
        specialInstructions: 'Offer fluids, quiet rest, and darkened room before PRN dose.',
        status: 'active',
        therapeuticClass: 'Analgesic',
        activeIngredients: ['Paracetamol'],
      },
      {
        id: IDS.medications.buprenorphinePatch,
        organisationId: org.id,
        personId: person.id,
        drugName: 'Buprenorphine Patch',
        dose: '10',
        doseUnit: 'mcg/hr',
        route: 'patch',
        frequency: 'regular',
        frequencyDetail: { timesOfDay: ['09:00'] },
        prescribedDate: '2026-03-10',
        prescriberName: 'Dr Eleanor Finch',
        pharmacy: 'Boots Care Services',
        specialInstructions:
          'Change every 7 days and rotate upper-arm / upper-back sites.',
        status: 'active',
        isControlledDrug: true,
        cdSchedule: '3',
        therapeuticClass: 'Opioid analgesic',
        activeIngredients: ['Buprenorphine'],
      },
    ])
    .onConflictDoUpdate({
      target: medications.id,
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

  await db
    .insert(medicationAdministrations)
    .values([
      {
        id: IDS.medAdministrations.sertralineToday,
        medicationId: IDS.medications.sertraline,
        personId: person.id,
        organisationId: org.id,
        scheduledTime: atUtc(today, '08:00'),
        administeredAt: atUtc(today, '08:05'),
        status: 'given',
        administeredById: leeUser.id,
        administeredByName: leeUser.name,
        notes: 'Taken with toast and orange juice before school.',
      },
      {
        id: IDS.medAdministrations.sertralineYesterdayRefused,
        medicationId: IDS.medications.sertraline,
        personId: person.id,
        organisationId: org.id,
        scheduledTime: atUtc(yesterday, '08:00'),
        administeredAt: null,
        status: 'refused',
        reason: 'Reported feeling nauseous before breakfast; re-offered after 20 minutes.',
        administeredById: IDS.users.priya,
        administeredByName: 'Priya Shah',
        notes: 'Followed up with hydration and reassurance.',
      },
      {
        id: IDS.medAdministrations.buprenorphineToday,
        medicationId: IDS.medications.buprenorphinePatch,
        personId: person.id,
        organisationId: org.id,
        scheduledTime: atUtc(today, '09:00'),
        administeredAt: atUtc(today, '09:08'),
        status: 'given',
        administeredById: IDS.users.priya,
        administeredByName: 'Priya Shah',
        witnessId: IDS.users.jordan,
        witnessName: 'Jordan Evans',
        notes: 'Patch changed to right upper arm after skin check.',
      },
    ])
    .onConflictDoUpdate({
      target: medicationAdministrations.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(prnProtocols)
    .values({
      id: IDS.prn.protocol,
      medicationId: IDS.medications.paracetamol,
      organisationId: org.id,
      indication: 'Headache, menstrual discomfort, or muscle aches after activity.',
      signsSymptoms: [
        { description: 'Pain score 5/10 or above' },
        { description: 'Visible discomfort or retreating to bedroom' },
        { description: 'Headache not relieved by fluids or quiet rest' },
      ],
      doseRange: '500mg to 1g',
      maxDose24hr: '4g',
      minInterval: 240,
      nonPharmAlternatives: 'Encourage hydration, quiet rest, and warm compress first.',
      expectedEffect: 'Pain reduced to below 4/10 within one hour.',
      escalationCriteria:
        'Escalate to on-call nurse or GP if pain score remains above 6/10 after two doses in 24 hours.',
      followUpMinutes: 60,
    })
    .onConflictDoUpdate({
      target: prnProtocols.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(prnAdministrations)
    .values([
      {
        id: IDS.prn.adminCompleted,
        prnProtocolId: IDS.prn.protocol,
        medicationId: IDS.medications.paracetamol,
        personId: person.id,
        organisationId: org.id,
        preDoseAssessment: {
          painScore: 7,
          symptoms: ['Frontal headache', 'Light sensitivity'],
          notes: 'Started after school transport and noisy corridor period.',
        },
        administeredAt: atUtc(yesterday, '16:20'),
        administeredById: IDS.users.priya,
        administeredByName: 'Priya Shah',
        postDoseAssessment: {
          painScore: 3,
          effectAchieved: 'yes',
          notes: 'Returned to arts activity after snack and rest.',
        },
        postDoseAssessedAt: atUtc(yesterday, '17:20'),
        followUpActions: 'Encouraged fluids and reduced screen time for the evening.',
      },
      {
        id: IDS.prn.adminPending,
        prnProtocolId: IDS.prn.protocol,
        medicationId: IDS.medications.paracetamol,
        personId: person.id,
        organisationId: org.id,
        preDoseAssessment: {
          painScore: 6,
          symptoms: ['Lower-abdominal cramping', 'Restlessness'],
          notes: 'Requested PRN after PE lesson and warm shower.',
        },
        administeredAt: atUtc(today, '10:15'),
        administeredById: leeUser.id,
        administeredByName: leeUser.name,
      },
    ])
    .onConflictDoUpdate({
      target: prnAdministrations.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(medicationStock)
    .values([
      {
        id: IDS.stock.paracetamol,
        organisationId: org.id,
        medicationName: 'Paracetamol 500mg tablets',
        medicationCode: 'PARA500TAB',
        form: 'tablet',
        strength: '500mg',
        currentQuantity: 96,
        minimumThreshold: 40,
        reorderPoint: 36,
        reorderQuantity: 120,
        unit: 'tablets',
        storageRequirement: 'room_temp',
        isControlledDrug: false,
        pharmacySupplier: 'Harbourside Pharmacy',
      },
      {
        id: IDS.stock.buprenorphinePatch,
        organisationId: org.id,
        medicationName: 'Buprenorphine 10mcg/hr patch',
        medicationCode: 'BUP10PATCH',
        form: 'patch',
        strength: '10mcg/hr',
        currentQuantity: 8,
        minimumThreshold: 4,
        reorderPoint: 6,
        reorderQuantity: 14,
        unit: 'patches',
        storageRequirement: 'controlled_drug_cabinet',
        isControlledDrug: true,
        controlledDrugSchedule: 'schedule_3',
        pharmacySupplier: 'Boots Care Services',
      },
      {
        id: IDS.stock.epimax,
        organisationId: org.id,
        medicationName: 'Epimax cream',
        medicationCode: 'EPIMAX500',
        form: 'cream',
        strength: '500g',
        currentQuantity: 2,
        minimumThreshold: 2,
        reorderPoint: 3,
        reorderQuantity: 6,
        unit: 'applications',
        storageRequirement: 'room_temp',
        isControlledDrug: false,
        pharmacySupplier: 'Harbourside Pharmacy',
      },
    ])
    .onConflictDoUpdate({
      target: medicationStock.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(stockBatches)
    .values([
      {
        id: IDS.stock.batchParacetamol,
        organisationId: org.id,
        medicationStockId: IDS.stock.paracetamol,
        batchNumber: 'PX24061',
        expiryDate: twoMonthsFromNow,
        quantity: 96,
        originalQuantity: 120,
      },
      {
        id: IDS.stock.batchBuprenorphine,
        organisationId: org.id,
        medicationStockId: IDS.stock.buprenorphinePatch,
        batchNumber: 'BP24033',
        expiryDate: formatDate(dayOffset(now, 120)),
        quantity: 8,
        originalQuantity: 10,
      },
      {
        id: IDS.stock.batchEpimax,
        organisationId: org.id,
        medicationStockId: IDS.stock.epimax,
        batchNumber: 'EX24012',
        expiryDate: formatDate(dayOffset(now, 18)),
        quantity: 2,
        originalQuantity: 4,
      },
    ])
    .onConflictDoUpdate({
      target: stockBatches.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(stockTransactions)
    .values([
      {
        id: IDS.stock.txnParacetamolReceipt,
        organisationId: org.id,
        medicationStockId: IDS.stock.paracetamol,
        stockBatchId: IDS.stock.batchParacetamol,
        transactionType: 'receipt',
        quantity: 120,
        balanceAfter: 120,
        performedById: leeUser.id,
        reason: 'Monthly cycle delivery',
        sourceDestination: 'pharmacy',
        createdAt: atUtc(oneMonthAgo, '11:15'),
      },
      {
        id: IDS.stock.txnParacetamolIssue,
        organisationId: org.id,
        medicationStockId: IDS.stock.paracetamol,
        stockBatchId: IDS.stock.batchParacetamol,
        transactionType: 'issue',
        quantity: -24,
        balanceAfter: 96,
        performedById: IDS.users.priya,
        reason: 'Current cycle administrations',
        sourceDestination: 'patient',
        createdAt: atUtc(yesterday, '16:30'),
      },
      {
        id: IDS.stock.txnBuprenorphineReceipt,
        organisationId: org.id,
        medicationStockId: IDS.stock.buprenorphinePatch,
        stockBatchId: IDS.stock.batchBuprenorphine,
        transactionType: 'receipt',
        quantity: 10,
        balanceAfter: 10,
        performedById: IDS.users.jordan,
        witnessedById: leeUser.id,
        reason: 'Controlled-drug delivery checked against order',
        sourceDestination: 'pharmacy',
        createdAt: atUtc(oneWeekAgo, '09:30'),
      },
      {
        id: IDS.stock.txnBuprenorphineIssue,
        organisationId: org.id,
        medicationStockId: IDS.stock.buprenorphinePatch,
        stockBatchId: IDS.stock.batchBuprenorphine,
        transactionType: 'issue',
        quantity: -2,
        balanceAfter: 8,
        performedById: IDS.users.priya,
        witnessedById: IDS.users.jordan,
        reason: 'Weekly patch changes',
        sourceDestination: 'patient',
        createdAt: atUtc(today, '09:10'),
      },
      {
        id: IDS.stock.txnEpimaxReceipt,
        organisationId: org.id,
        medicationStockId: IDS.stock.epimax,
        stockBatchId: IDS.stock.batchEpimax,
        transactionType: 'receipt',
        quantity: 4,
        balanceAfter: 4,
        performedById: leeUser.id,
        reason: 'Topical stock top-up',
        sourceDestination: 'pharmacy',
        createdAt: atUtc(oneMonthAgo, '14:00'),
      },
      {
        id: IDS.stock.txnEpimaxIssue,
        organisationId: org.id,
        medicationStockId: IDS.stock.epimax,
        stockBatchId: IDS.stock.batchEpimax,
        transactionType: 'issue',
        quantity: -2,
        balanceAfter: 2,
        performedById: IDS.users.priya,
        reason: 'Daily skin-care applications',
        sourceDestination: 'patient',
        createdAt: atUtc(yesterday, '20:15'),
      },
    ])
    .onConflictDoUpdate({
      target: stockTransactions.id,
      set: {
        reason: 'Seeded deep-QA transaction',
      },
    });

  await db
    .insert(reorderRequests)
    .values({
      id: IDS.stock.reorderEpimax,
      organisationId: org.id,
      medicationStockId: IDS.stock.epimax,
      quantityRequested: 6,
      status: 'ordered',
      isAutoGenerated: true,
      requestedById: leeUser.id,
      approvedById: IDS.users.jordan,
      approvedAt: atUtc(yesterday, '09:20'),
      pharmacyNotified: true,
      pharmacyNotifiedAt: atUtc(yesterday, '09:35'),
      pharmacyReference: 'HC-APR-1184',
      expectedDeliveryDate: threeDaysFromNow,
      notes: 'Low stock after eczema flare-up treatment plan.',
    })
    .onConflictDoUpdate({
      target: reorderRequests.id,
      set: {
        status: 'ordered',
        updatedAt: new Date(),
      },
    });

  await db
    .insert(medicationErrors)
    .values({
      id: IDS.stock.medicationError,
      organisationId: org.id,
      errorType: 'wrong_time',
      severity: 'moderate',
      occurredAt: atUtc(yesterday, '08:20'),
      discoveredAt: atUtc(yesterday, '08:34'),
      personId: person.id,
      medicationStockId: IDS.stock.paracetamol,
      involvedStaffId: leeUser.id,
      reportedById: IDS.users.priya,
      description:
        'Morning paracetamol dose was documented after Amelia had already left for transport, creating a duplicate administration risk.',
      immediateActions:
        'Medication was withheld, MAR entry corrected, and transport escort alerted.',
      investigationStatus: 'under_investigation',
      investigatorId: IDS.users.jordan,
      investigationFindings:
        'Handwritten handover note was not transferred into the digital task list before shift swap.',
      rootCause: 'Handover gap during early-shift crossover.',
      correctiveActions:
        'Added shift-board prompt and retrained staff on live MAR reconciliation before departures.',
      externallyReported: false,
      personInformed: true,
      personInformedAt: atUtc(yesterday, '09:05'),
      gpNotified: true,
      gpNotifiedAt: atUtc(yesterday, '09:25'),
      lessonsLearned: 'Double-check live MAR entries before school runs and appointments.',
    })
    .onConflictDoUpdate({
      target: medicationErrors.id,
      set: {
        investigationStatus: 'under_investigation',
        updatedAt: new Date(),
      },
    });

  await db
    .insert(handoverReports)
    .values({
      id: IDS.stock.handover,
      organisationId: org.id,
      shiftType: 'night',
      shiftStartAt: atUtc(yesterday, '20:00'),
      shiftEndAt: atUtc(today, '08:00'),
      generatedById: leeUser.id,
      summary: {
        administrations: {
          total: 3,
          onTime: 2,
          late: 1,
          missed: 0,
        },
        refusals: [
          {
            personId: person.id,
            medicationName: 'Sertraline',
            time: atUtc(yesterday, '08:00').toISOString(),
            reason: 'Nausea before breakfast',
          },
        ],
        prnUsage: [
          {
            personId: person.id,
            medicationName: 'Paracetamol',
            time: atUtc(yesterday, '16:20').toISOString(),
            reason: 'Headache after school transport',
            effectiveness: 'Resolved within 60 minutes',
          },
        ],
        errors: [
          {
            errorId: IDS.stock.medicationError,
            type: 'wrong_time',
            severity: 'moderate',
            personId: person.id,
          },
        ],
        notes:
          'Monitor patch site redness on next shift and complete PRN follow-up entered at 10:15.',
      },
      outgoingStaffId: leeUser.id,
      outgoingSignedAt: atUtc(today, '07:55'),
      incomingStaffId: IDS.users.priya,
      incomingSignedAt: atUtc(today, '08:02'),
      isCompleted: true,
      handoverNotes:
        'Amelia requested a quieter breakfast table and wants social-worker call confirmed before Friday.',
    })
    .onConflictDoUpdate({
      target: handoverReports.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(topicalMar)
    .values({
      id: IDS.stock.topicalMar,
      organisationId: org.id,
      personId: person.id,
      medicationStockId: IDS.stock.epimax,
      medicationName: 'Epimax cream',
      instructions: 'Apply thin layer to both forearms after showering and before bed.',
      frequency: 'twice_daily',
      prescriber: 'Dr Eleanor Finch',
      startDate: '2026-03-28',
      isActive: true,
    })
    .onConflictDoUpdate({
      target: topicalMar.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(topicalMarAdministrations)
    .values({
      id: IDS.stock.topicalAdmin,
      organisationId: org.id,
      topicalMarId: IDS.stock.topicalMar,
      administeredById: IDS.users.priya,
      administeredAt: atUtc(yesterday, '20:10'),
      status: 'applied',
      bodyMapData: {
        sites: [
          { region: 'left_forearm', x: 34, y: 61, description: 'Dry patch near wrist' },
          { region: 'right_forearm', x: 72, y: 63, description: 'Mild eczema flare' },
        ],
      },
      applicationSite: 'Both forearms',
      skinCondition: 'Dry and mildly reddened',
      notes: 'No broken skin; reviewed again after evening shower.',
    })
    .onConflictDoNothing({
      target: topicalMarAdministrations.id,
    });

  await db
    .insert(homelyRemedyProtocols)
    .values({
      id: IDS.stock.homelyProtocol,
      organisationId: org.id,
      medicationName: 'Simple linctus',
      form: 'liquid',
      strength: '5ml',
      indication: 'Dry tickly cough at bedtime',
      dosageInstructions: '5ml up to four times daily after warm fluids.',
      maxDose24Hours: '20ml',
      contraindications: 'Do not use if productive cough or wheeze increases.',
      sideEffects: 'Drowsiness, mild stomach upset.',
      interactions: 'Review if taking other sedating medication.',
      maxDurationDays: 3,
      approvedBy: 'Karen Holt, Pharmacist',
      approvedDate: oneMonthAgo,
      reviewDate: twoMonthsFromNow,
      isActive: true,
      recordedById: IDS.users.jordan,
    })
    .onConflictDoUpdate({
      target: homelyRemedyProtocols.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(homelyRemedyAdministrations)
    .values({
      id: IDS.stock.homelyAdmin,
      organisationId: org.id,
      protocolId: IDS.stock.homelyProtocol,
      personId: person.id,
      administeredById: IDS.users.priya,
      administeredAt: atUtc(twoDaysAgo, '21:15'),
      doseGiven: '5ml',
      reason: 'Reported dry throat and cough before bed.',
      outcome: 'Settled within 30 minutes and slept through night checks.',
      gpInformed: false,
      notes: 'Used humidifier overnight and advised warm water at wake-up.',
    })
    .onConflictDoNothing({
      target: homelyRemedyAdministrations.id,
    });

  await db
    .insert(cdRegisters)
    .values({
      id: IDS.controlledDrugs.register,
      organisationId: org.id,
      personId: person.id,
      medicationId: IDS.medications.buprenorphinePatch,
      name: 'Buprenorphine Patch',
      strength: '10mcg/hr',
      form: 'patch',
      schedule: '3',
      currentBalance: 8,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: cdRegisters.id,
      set: {
        currentBalance: 8,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(cdRegisterEntries)
    .values([
      {
        id: IDS.controlledDrugs.entryReceipt,
        organisationId: org.id,
        registerId: IDS.controlledDrugs.register,
        transactionType: 'receipt',
        quantityIn: 10,
        quantityOut: 0,
        balanceAfter: 10,
        transactionDate: atUtc(oneWeekAgo, '09:32'),
        performedBy: IDS.users.jordan,
        witnessedBy: leeUser.id,
        sourceOrDestination: 'Boots Care Services',
        batchNumber: 'BP24033',
        notes: 'Weekly controlled-drug delivery checked against order sheet.',
      },
      {
        id: IDS.controlledDrugs.entryPatchLastWeek,
        organisationId: org.id,
        registerId: IDS.controlledDrugs.register,
        transactionType: 'administration',
        quantityIn: 0,
        quantityOut: 1,
        balanceAfter: 9,
        transactionDate: atUtc(yesterday, '09:10'),
        performedBy: IDS.users.priya,
        witnessedBy: leeUser.id,
        sourceOrDestination: 'Applied to person',
        batchNumber: 'BP24033',
        administeredToPersonId: person.id,
        notes: 'Weekly patch change completed after skin integrity check.',
      },
      {
        id: IDS.controlledDrugs.entryPatchToday,
        organisationId: org.id,
        registerId: IDS.controlledDrugs.register,
        transactionType: 'administration',
        quantityIn: 0,
        quantityOut: 1,
        balanceAfter: 8,
        transactionDate: atUtc(today, '09:08'),
        performedBy: leeUser.id,
        witnessedBy: IDS.users.jordan,
        sourceOrDestination: 'Applied to person',
        batchNumber: 'BP24033',
        administeredToPersonId: person.id,
        notes: 'Patch rotated to right upper arm with no residue remaining.',
      },
    ])
    .onConflictDoNothing({
      target: cdRegisterEntries.id,
    });

  await db
    .insert(transdermalPatches)
    .values([
      {
        id: IDS.controlledDrugs.oldPatch,
        organisationId: org.id,
        registerId: IDS.controlledDrugs.register,
        medicationId: IDS.medications.buprenorphinePatch,
        personId: person.id,
        applicationSite: 'left_upper_arm',
        appliedAt: atUtc(oneWeekAgo, '09:40'),
        removedAt: atUtc(yesterday, '09:05'),
        scheduledRemovalAt: atUtc(yesterday, '09:00'),
        appliedBy: IDS.users.priya,
        applicationWitnessedBy: leeUser.id,
        removedBy: leeUser.id,
        removalWitnessedBy: IDS.users.jordan,
        disposalMethod: 'clinical_waste',
        disposalWitnessed: true,
        rotationHistory: ['left_upper_arm'],
        status: 'removed',
        notes: 'Removed intact and folded before disposal.',
      },
      {
        id: IDS.controlledDrugs.activePatch,
        organisationId: org.id,
        registerId: IDS.controlledDrugs.register,
        medicationId: IDS.medications.buprenorphinePatch,
        personId: person.id,
        applicationSite: 'right_upper_arm',
        appliedAt: atUtc(today, '09:08'),
        scheduledRemovalAt: atUtc(fourDaysFromNow, '09:00'),
        appliedBy: leeUser.id,
        applicationWitnessedBy: IDS.users.jordan,
        rotationHistory: ['left_upper_arm', 'right_upper_arm'],
        status: 'active',
        notes: 'Skin intact; monitor mild redness near prior site.',
      },
    ])
    .onConflictDoNothing({
      target: transdermalPatches.id,
    });

  await db
    .insert(cdStockReconciliations)
    .values({
      id: IDS.controlledDrugs.reconciliation,
      organisationId: org.id,
      registerId: IDS.controlledDrugs.register,
      expectedBalance: 9,
      actualCount: 9,
      hasDiscrepancy: false,
      discrepancyAmount: 0,
      reconciliationDate: atUtc(yesterday, '20:30'),
      performedBy: IDS.users.jordan,
      witnessedBy: leeUser.id,
      status: 'completed',
      outcome: 'resolved',
      resolutionNotes: 'Weekly count matched register balance before handover.',
    })
    .onConflictDoUpdate({
      target: cdStockReconciliations.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(carePackages)
    .values({
      id: IDS.visits.carePackage,
      organisationId: org.id,
      personId: person.id,
      status: 'active',
      startDate: '2026-02-10',
      reviewDate: '2026-05-10',
      fundingType: 'local_authority',
      commissioners: [
        {
          id: 'commissioner-1',
          name: 'Bristol City Council',
          type: 'local_authority',
          reference: 'BCC-PLAC-44219',
          contactName: 'Lucy Morgan',
          contactEmail: 'lucy.morgan@bristol.gov.uk',
          contactPhone: '0117 900 4455',
        },
      ],
      environmentNotes: {
        entryInstructions: 'Complete room and belongings check before education transport.',
        hazards: 'Monitor absconding risk around front gate after school.',
      },
      weeklyHours: '14',
      notes:
        'Structured support around school transitions, medication prompts, and evening settling routine.',
    })
    .onConflictDoUpdate({
      target: carePackages.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(visitTypes)
    .values([
      {
        id: IDS.visits.morningSupport,
        carePackageId: IDS.visits.carePackage,
        organisationId: org.id,
        name: 'Morning support',
        duration: 45,
        timeWindowStart: '07:00',
        timeWindowEnd: '07:45',
        taskList: [
          { id: 'visit-task-1', description: 'Wake-up and emotional check-in', required: true, order: 1 },
          { id: 'visit-task-2', description: 'Medication prompt and breakfast support', required: true, order: 2 },
          { id: 'visit-task-3', description: 'School transport handover', required: false, order: 3 },
        ],
        frequency: 'daily',
      },
      {
        id: IDS.visits.schoolTransition,
        carePackageId: IDS.visits.carePackage,
        organisationId: org.id,
        name: 'Evening settling visit',
        duration: 60,
        timeWindowStart: '18:00',
        timeWindowEnd: '19:00',
        taskList: [
          { id: 'visit-task-4', description: 'Debrief school day and check contact schedule', required: true, order: 1 },
          { id: 'visit-task-5', description: 'Prepare room and wind-down routine', required: true, order: 2 },
        ],
        frequency: 'daily',
      },
    ])
    .onConflictDoUpdate({
      target: visitTypes.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(scheduledVisits)
    .values([
      {
        id: IDS.visits.visitCompleted,
        visitTypeId: IDS.visits.morningSupport,
        carePackageId: IDS.visits.carePackage,
        personId: person.id,
        organisationId: org.id,
        assignedStaffId: IDS.staff.priya,
        date: today,
        scheduledStart: '07:15',
        scheduledEnd: '08:00',
        status: 'completed',
        notes: 'Left for school calmer after music and breakfast support.',
      },
      {
        id: IDS.visits.visitScheduled,
        visitTypeId: IDS.visits.schoolTransition,
        carePackageId: IDS.visits.carePackage,
        personId: person.id,
        organisationId: org.id,
        assignedStaffId: leeStaffProfile.id,
        date: today,
        scheduledStart: '18:00',
        scheduledEnd: '19:00',
        status: 'scheduled',
        notes: 'Family-call preparation and weekend-contact planning.',
      },
      {
        id: IDS.visits.visitMissed,
        visitTypeId: IDS.visits.morningSupport,
        carePackageId: IDS.visits.carePackage,
        personId: person.id,
        organisationId: org.id,
        assignedStaffId: leeStaffProfile.id,
        date: yesterday,
        scheduledStart: '07:10',
        scheduledEnd: '07:55',
        status: 'missed',
        notes: 'Missed after emergency school safeguarding call delayed handover.',
      },
      {
        id: IDS.visits.visitCancelled,
        visitTypeId: IDS.visits.schoolTransition,
        carePackageId: IDS.visits.carePackage,
        personId: person.id,
        organisationId: org.id,
        assignedStaffId: IDS.staff.jordan,
        date: threeDaysFromNow,
        scheduledStart: '18:15',
        scheduledEnd: '19:15',
        status: 'cancelled',
        notes: 'Cancelled after court-directed family contact moved off site.',
      },
    ])
    .onConflictDoUpdate({
      target: scheduledVisits.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(hospitalAdmissions)
    .values({
      id: IDS.visits.hospitalAdmission,
      organisationId: org.id,
      personId: person.id,
      admittedDate: threeDaysAgo,
      hospital: 'Bristol Royal Infirmary',
      ward: 'Paediatric Assessment Unit',
      expectedDischarge: twoDaysAgo,
      dischargedDate: twoDaysAgo,
      status: 'discharged',
      reason: 'Short observation stay after asthma flare-up.',
      notes: 'Returned with inhaler spacer review and GP follow-up booked.',
      recordedById: leeUser.id,
      dischargedById: IDS.users.jordan,
    })
    .onConflictDoUpdate({
      target: hospitalAdmissions.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(visitCancellations)
    .values({
      id: IDS.visits.visitCancellation,
      organisationId: org.id,
      visitId: IDS.visits.visitCancelled,
      reasonCode: 'family_contact_moved',
      reasonNotes: 'Local authority moved the visit to the civic office after legal review.',
      billingExcluded: true,
      carerNotified: true,
      cancelledById: IDS.users.jordan,
      cancelledAt: atUtc(yesterday, '15:10'),
    })
    .onConflictDoNothing({
      target: visitCancellations.id,
    });

  await db
    .insert(meetings)
    .values([
      {
        id: IDS.meetings.houseMeeting,
        organisationId: org.id,
        personId: person.id,
        meetingDate: yesterday,
        title: 'Weekly house meeting',
        childAttendees: ['Amelia Hart', 'Zoe Carter', 'Mason Doyle'],
        staffAttendees: ['Priya Shah', 'Jordan Evans'],
        agendaItems: [
          'Weekend contact plans',
          'Kitchen tidy rota',
          'Quiet space after school',
        ],
        discussionPoints:
          'Amelia asked for clearer notice before contact changes and quieter access to the study room after school.',
        decisions:
          'Staff will post contact updates by 16:00 and reserve the study room between 16:30 and 17:30.',
        actions: [
          {
            action: 'Update contact-board template with same-day changes',
            owner: 'Jordan Evans',
            dueDate: threeDaysFromNow,
            completed: false,
          },
          {
            action: 'Check study-room rota with education lead',
            owner: 'Priya Shah',
            dueDate: today,
            completed: true,
          },
        ],
        sharedWithReg44: true,
        createdById: IDS.users.priya,
      },
      {
        id: IDS.meetings.placementReview,
        organisationId: org.id,
        personId: person.id,
        meetingDate: today,
        title: 'Placement stability review',
        childAttendees: ['Amelia Hart'],
        staffAttendees: ['Jordan Evans', 'Lee Barry', 'Lucy Morgan'],
        agendaItems: [
          'School attendance',
          'Contact restrictions review',
          'Missing-from-care risk reduction plan',
        ],
        discussionPoints:
          'Reviewed recent school attendance improvement, discussed supervised family contact, and refreshed missing-risk triggers.',
        decisions:
          'Retain supervised father contact, keep Friday social-worker call, and update Philomena associates list after next review.',
        actions: [
          {
            action: 'Share updated risk-reduction plan with night team',
            owner: 'Lee Barry',
            dueDate: fourDaysFromNow,
            completed: false,
          },
        ],
        sharedWithReg44: true,
        createdById: IDS.users.jordan,
      },
    ])
    .onConflictDoUpdate({
      target: meetings.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(approvedContacts)
    .values([
      {
        id: IDS.contacts.karen,
        organisationId: org.id,
        personId: person.id,
        name: 'Karen Hart',
        relationship: 'mother',
        phone: '07700 900200',
        email: 'karen.hart@example.test',
        address: '21 Sandringham Road, Bristol BS4 2ND',
        allowedContactTypes: ['face_to_face', 'phone', 'video'],
        frequency: 'Weekly',
        supervisionLevel: 'supervised_by_staff',
        hasRestrictions: false,
        isActive: true,
        approvedById: leeUser.id,
        approvedAt: atUtc(oneMonthAgo, '14:30'),
      },
      {
        id: IDS.contacts.daniel,
        organisationId: org.id,
        personId: person.id,
        name: 'Daniel Hart',
        relationship: 'father',
        phone: '07700 900201',
        email: 'daniel.hart@example.test',
        address: '3 Rookery Lane, Bath BA1 6JP',
        allowedContactTypes: ['phone', 'video'],
        frequency: 'Fortnightly',
        supervisionLevel: 'supervised_by_staff',
        hasRestrictions: true,
        courtOrderReference: 'BRS/FC/2026/144',
        courtOrderDate: '2026-01-18',
        courtOrderConditions:
          'Phone or video only unless manager approves direct supervision and risk plan is active.',
        isActive: true,
        approvedById: IDS.users.jordan,
        approvedAt: atUtc(oneMonthAgo, '15:15'),
      },
      {
        id: IDS.contacts.lucy,
        organisationId: org.id,
        personId: person.id,
        name: 'Lucy Morgan',
        relationship: 'social_worker',
        phone: '0117 900 4455',
        email: 'lucy.morgan@bristol.gov.uk',
        address: 'Bristol City Council, City Hall, College Green, Bristol',
        allowedContactTypes: ['face_to_face', 'phone', 'letter'],
        frequency: 'Monthly',
        supervisionLevel: 'unsupervised',
        hasRestrictions: false,
        isActive: true,
        approvedById: IDS.users.jordan,
        approvedAt: atUtc(oneMonthAgo, '16:00'),
      },
    ])
    .onConflictDoUpdate({
      target: approvedContacts.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(contactSchedules)
    .values([
      {
        id: IDS.contacts.karenSchedule,
        organisationId: org.id,
        personId: person.id,
        approvedContactId: IDS.contacts.karen,
        contactType: 'face_to_face',
        scheduledAt: atUtc(threeDaysFromNow, '14:00'),
        durationMinutes: 90,
        supervisionLevel: 'supervised_by_staff',
        location: 'Family room 2',
        status: 'scheduled',
        managerOverride: false,
        createdById: leeUser.id,
      },
      {
        id: IDS.contacts.danielSchedule,
        organisationId: org.id,
        personId: person.id,
        approvedContactId: IDS.contacts.daniel,
        contactType: 'video',
        scheduledAt: atUtc(yesterday, '18:30'),
        durationMinutes: 30,
        supervisionLevel: 'supervised_by_staff',
        location: 'Contact room tablet',
        status: 'completed',
        managerOverride: true,
        overrideById: IDS.users.jordan,
        overrideJustification:
          'Reviewed alongside updated risk plan and staff availability.',
        createdById: IDS.users.jordan,
      },
      {
        id: IDS.contacts.lucySchedule,
        organisationId: org.id,
        personId: person.id,
        approvedContactId: IDS.contacts.lucy,
        contactType: 'phone',
        scheduledAt: atUtc(today, '15:30'),
        durationMinutes: 20,
        supervisionLevel: 'unsupervised',
        location: 'Office speakerphone',
        status: 'scheduled',
        managerOverride: false,
        createdById: leeUser.id,
      },
    ])
    .onConflictDoUpdate({
      target: contactSchedules.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(contactRecords)
    .values([
      {
        id: IDS.contacts.danielRecord,
        organisationId: org.id,
        personId: person.id,
        approvedContactId: IDS.contacts.daniel,
        contactScheduleId: IDS.contacts.danielSchedule,
        contactType: 'video',
        contactDate: atUtc(yesterday, '18:35'),
        durationMinutes: 28,
        supervisionLevel: 'supervised_by_staff',
        whoPresent: 'Amelia Hart, Priya Shah',
        location: 'Contact room tablet',
        emotionalBefore: 'Anxious but willing to try after grounding exercise.',
        emotionalDuring: 'Engaged for first 15 minutes, then became guarded.',
        emotionalAfter: 'Quiet and tearful for ten minutes, then requested tea.',
        notes:
          'Call ended early when conversation moved toward unsupervised leave plans.',
        concerns:
          'Father pushed for off-site meet despite current restriction wording.',
        disclosures:
          'Amelia said she wants shorter calls until review meeting next week.',
        recordedById: IDS.users.priya,
      },
      {
        id: IDS.contacts.lucyRecord,
        organisationId: org.id,
        personId: person.id,
        approvedContactId: IDS.contacts.lucy,
        contactType: 'phone',
        contactDate: atUtc(twoDaysAgo, '11:10'),
        durationMinutes: 18,
        supervisionLevel: 'unsupervised',
        whoPresent: 'Amelia Hart',
        location: 'Keyworker office',
        emotionalBefore: 'Settled after school transport discussion.',
        emotionalDuring: 'Open and future-focused.',
        emotionalAfter: 'More reassured and asked for call summary in writing.',
        notes:
          'Confirmed education meeting date and reviewed upcoming placement review agenda.',
        concerns: null,
        disclosures: null,
        recordedById: leeUser.id,
      },
    ])
    .onConflictDoUpdate({
      target: contactRecords.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(lacRecords)
    .values({
      id: IDS.lac.record,
      organisationId: org.id,
      personId: person.id,
      legalStatus: 'section31',
      legalStatusDate: '2026-02-12',
      placingAuthority: 'Bristol City Council',
      socialWorkerName: 'Lucy Morgan',
      socialWorkerEmail: 'lucy.morgan@bristol.gov.uk',
      socialWorkerPhone: '0117 900 4455',
      iroName: 'Helen Jarvis',
      iroEmail: 'helen.jarvis@bristol.gov.uk',
      iroPhone: '0117 900 4456',
      admissionDate: '2026-02-10',
    })
    .onConflictDoUpdate({
      target: lacRecords.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(placementPlans)
    .values({
      id: IDS.lac.placementPlan,
      organisationId: org.id,
      personId: person.id,
      lacRecordId: IDS.lac.record,
      dueDate: '2026-02-17',
      completedDate: '2026-02-15',
      content: {
        objectives:
          'Improve school attendance, reduce missing triggers linked to abrupt contact changes, and stabilise night routine.',
        arrangements:
          'Keyworker check-in after school, supervised father contact, and Friday social-worker call.',
        educationPlan:
          'Daily tutor handover and twice-weekly study-room access after school.',
        healthPlan:
          'Asthma management plan reviewed monthly; migraine triggers logged on PRN chart.',
        contactArrangements:
          'Weekly supervised contact with mother, fortnightly managed video contact with father, monthly social-worker meeting.',
        notes:
          'Young person responds best to advance notice and predictable changes.',
      },
      status: 'completed',
      reviewDate: '2026-05-15',
      reviewedById: IDS.users.jordan,
    })
    .onConflictDoUpdate({
      target: placementPlans.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(lacStatusChanges)
    .values({
      id: IDS.lac.statusChange,
      organisationId: org.id,
      lacRecordId: IDS.lac.record,
      previousStatus: 'section20',
      newStatus: 'section31',
      changedDate: '2026-02-12',
      reason: 'Interim voluntary placement moved to care order after court hearing.',
      changedById: IDS.users.jordan,
      changedByName: 'Jordan Evans',
    })
    .onConflictDoUpdate({
      target: lacStatusChanges.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(philomenaProfiles)
    .values({
      id: IDS.missing.philomena,
      organisationId: org.id,
      personId: person.id,
      photoUrl: avatarDataUri('AH', '#fee2e2', '#991b1b'),
      photoUpdatedAt: atUtc(fourMonthsAgo, '12:00'),
      heightCm: 162,
      build: 'slim',
      hairDescription: 'Shoulder-length brown hair, usually tied back',
      eyeColour: 'Hazel',
      distinguishingFeatures: 'Small silver nose stud and faint scar above left eyebrow',
      ethnicity: 'White British',
      knownAssociates: [
        {
          name: 'Kira James',
          relationship: 'School friend',
          notes: 'Often meets at Eastville Park after school.',
        },
        {
          name: '“Jay”',
          relationship: 'Older peer',
          notes: 'Known to offer lifts in a dark blue Ford Fiesta.',
        },
      ],
      likelyLocations: [
        {
          location: 'Eastville Park',
          address: 'Fishponds Rd, Bristol',
          notes: 'Usually goes near the basketball courts.',
        },
        {
          location: 'Broadmead Bus Station',
          address: 'Marlborough St, Bristol',
          notes: 'Known waiting point if planning to meet peers.',
        },
      ],
      phoneNumbers: ['07700 900451'],
      socialMedia: [
        { platform: 'Instagram', handle: '@millie.hxrt' },
        { platform: 'Snapchat', handle: 'milliehart14' },
      ],
      riskCse: true,
      riskCce: false,
      riskCountyLines: true,
      riskTrafficking: false,
      riskNotes:
        'Trigger points include unexpected family-contact changes and conflict after school transport.',
      medicalNeeds: 'Salbutamol inhaler carried in school bag; migraines more likely after missed meals.',
      allergies: 'Penicillin',
      medications: 'Sertraline 50mg daily; PRN paracetamol; weekly buprenorphine patch',
      gpDetails: 'Dr Eleanor Finch, Harbourside Family Practice, 0117 555 1940',
      updatedById: leeUser.id,
    })
    .onConflictDoUpdate({
      target: philomenaProfiles.id,
      set: {
        updatedAt: new Date(),
        photoUpdatedAt: atUtc(fourMonthsAgo, '12:00'),
      },
    });

  await db
    .insert(missingEpisodes)
    .values([
      {
        id: IDS.missing.openEpisode,
        organisationId: org.id,
        personId: person.id,
        philomenaProfileId: IDS.missing.philomena,
        status: 'open',
        absenceNoticedAt: atUtc(yesterday, '21:10'),
        lastSeenAt: atUtc(yesterday, '20:40'),
        lastSeenLocation: 'Rosewood House front gate',
        lastSeenClothing: 'Black hoodie, grey joggers, white trainers',
        initialActionsTaken:
          'Immediate bedroom and grounds search, called known associates, and checked Eastville Park route.',
        riskLevel: 'high',
        riskAssessmentNotes:
          'Escalated due to history of meeting older peers after sudden contact changes.',
        previousEpisodeCount: 3,
        escalationThresholdMinutes: 30,
        policeNotified: true,
        policeNotifiedAt: atUtc(yesterday, '21:32'),
        policeReference: 'BRI-20451-26',
        placingAuthorityNotified: true,
        placingAuthorityNotifiedAt: atUtc(yesterday, '21:38'),
        placingAuthorityContact: 'Lucy Morgan',
        responsibleIndividualNotified: true,
        responsibleIndividualNotifiedAt: atUtc(yesterday, '21:45'),
        wellbeingCheckCompleted: false,
        reportedById: leeUser.id,
      },
      {
        id: IDS.missing.returnedEpisode,
        organisationId: org.id,
        personId: person.id,
        philomenaProfileId: IDS.missing.philomena,
        status: 'returned',
        absenceNoticedAt: atUtc(threeDaysAgo, '18:45'),
        lastSeenAt: atUtc(threeDaysAgo, '18:10'),
        lastSeenLocation: 'College Green bus stop',
        lastSeenClothing: 'School blazer over green jumper, black jeans',
        initialActionsTaken:
          'Called mother and social worker, checked bus station and local park, reviewed Philomena profile.',
        riskLevel: 'medium',
        riskAssessmentNotes:
          'Returned pattern suggested peer contact rather than immediate exploitation indicators.',
        previousEpisodeCount: 2,
        escalationThresholdMinutes: 45,
        policeNotified: true,
        policeNotifiedAt: atUtc(threeDaysAgo, '19:30'),
        policeReference: 'BRI-20312-26',
        placingAuthorityNotified: true,
        placingAuthorityNotifiedAt: atUtc(threeDaysAgo, '19:40'),
        placingAuthorityContact: 'Lucy Morgan',
        responsibleIndividualNotified: false,
        returnedAt: atUtc(twoDaysAgo, '01:35'),
        returnMethod: 'found_by_police',
        wellbeingCheckCompleted: true,
        wellbeingCheckNotes:
          'Tired but physically well; accepted food, shower, and debrief before sleep.',
        reportedById: IDS.users.priya,
      },
    ])
    .onConflictDoUpdate({
      target: missingEpisodes.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(missingEpisodeTimeline)
    .values([
      {
        id: IDS.missing.openTimeline1,
        organisationId: org.id,
        episodeId: IDS.missing.openEpisode,
        actionType: 'absence_noticed',
        description: 'Night staff noticed Amelia missing during room check.',
        occurredAt: atUtc(yesterday, '21:10'),
        recordedById: leeUser.id,
        metadata: { roomCheck: true },
      },
      {
        id: IDS.missing.openTimeline2,
        organisationId: org.id,
        episodeId: IDS.missing.openEpisode,
        actionType: 'search_conducted',
        description: 'Grounds search completed and Eastville Park route checked.',
        occurredAt: atUtc(yesterday, '21:22'),
        recordedById: leeUser.id,
        metadata: { areas: ['grounds', 'front gate', 'Eastville Park'] },
      },
      {
        id: IDS.missing.openTimeline3,
        organisationId: org.id,
        episodeId: IDS.missing.openEpisode,
        actionType: 'police_notified',
        description: 'Police informed and Philomena profile shared.',
        occurredAt: atUtc(yesterday, '21:32'),
        recordedById: leeUser.id,
        metadata: { reference: 'BRI-20451-26' },
      },
      {
        id: IDS.missing.openTimeline4,
        organisationId: org.id,
        episodeId: IDS.missing.openEpisode,
        actionType: 'authority_notified',
        description: 'Placing authority and on-call manager updated.',
        occurredAt: atUtc(yesterday, '21:38'),
        recordedById: leeUser.id,
        metadata: { contact: 'Lucy Morgan' },
      },
      {
        id: IDS.missing.returnedTimeline1,
        organisationId: org.id,
        episodeId: IDS.missing.returnedEpisode,
        actionType: 'absence_noticed',
        description: 'Amelia did not arrive back from planned community activity.',
        occurredAt: atUtc(threeDaysAgo, '18:45'),
        recordedById: IDS.users.priya,
      },
      {
        id: IDS.missing.returnedTimeline2,
        organisationId: org.id,
        episodeId: IDS.missing.returnedEpisode,
        actionType: 'police_notified',
        description: 'Police notified after local search and bus-station check.',
        occurredAt: atUtc(threeDaysAgo, '19:30'),
        recordedById: IDS.users.priya,
        metadata: { reference: 'BRI-20312-26' },
      },
      {
        id: IDS.missing.returnedTimeline3,
        organisationId: org.id,
        episodeId: IDS.missing.returnedEpisode,
        actionType: 'child_returned',
        description: 'Police brought Amelia back to the home.',
        occurredAt: atUtc(twoDaysAgo, '01:35'),
        recordedById: leeUser.id,
      },
      {
        id: IDS.missing.returnedTimeline4,
        organisationId: org.id,
        episodeId: IDS.missing.returnedEpisode,
        actionType: 'rhi_created',
        description: 'Return Home Interview created with 72-hour deadline.',
        occurredAt: atUtc(twoDaysAgo, '08:15'),
        recordedById: IDS.users.jordan,
      },
    ])
    .onConflictDoNothing({
      target: missingEpisodeTimeline.id,
    });

  await db
    .insert(returnHomeInterviews)
    .values({
      id: IDS.missing.rhi,
      organisationId: org.id,
      personId: person.id,
      episodeId: IDS.missing.returnedEpisode,
      status: 'pending',
      deadlineAt: atUtc(threeDaysFromNow, '01:35'),
      deadlineBreached: false,
      whereChildWas: 'Stayed between a friend’s flat and the bus station overnight.',
      whoChildWasWith: 'Kira James and an older peer known as “Jay”.',
      whatHappened:
        'Child reported wanting space after argument about contact restrictions.',
      childAccount:
        '“I knew people would worry, but I did not want another call cancelled without me knowing.”',
      risksIdentified:
        'Impulsive absconding after emotional triggers and vulnerability to older peers offering lifts.',
      exploitationConcerns: ['county_lines'],
      exploitationDetails:
        'Older peer offered late-night lift and access to cash, which needs further exploration.',
      safeguardingReferralNeeded: true,
      actionsRecommended:
        'Complete interview with independent worker, refresh trigger plan, and review transport supervision.',
      childDeclined: false,
      escalatedToRi: false,
    })
    .onConflictDoUpdate({
      target: returnHomeInterviews.id,
      set: {
        updatedAt: new Date(),
      },
    });

  const summaryTables = [
    ['medications', medications],
    ['medication_administrations', medicationAdministrations],
    ['prn_protocols', prnProtocols],
    ['prn_administrations', prnAdministrations],
    ['medication_stock', medicationStock],
    ['cd_registers', cdRegisters],
    ['scheduled_visits', scheduledVisits],
    ['childrens_meetings', meetings],
    ['approved_contacts', approvedContacts],
    ['contact_records', contactRecords],
    ['lac_records', lacRecords],
    ['placement_plans', placementPlans],
    ['philomena_profiles', philomenaProfiles],
    ['missing_episodes', missingEpisodes],
    ['return_home_interviews', returnHomeInterviews],
  ] as const;

  const counts = await Promise.all(
    summaryTables.map(async ([label, table]) => {
      const rows = await db.select().from(table).where(eq(table.organisationId, org.id));
      return [label, rows.length] as const;
    }),
  );

  console.log(`Seeded deep-QA data for ${TARGET_ORG_SLUG} / ${TARGET_PERSON_NAME}`);
  for (const [label, count] of counts) {
    console.log(`- ${label}: ${count}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
