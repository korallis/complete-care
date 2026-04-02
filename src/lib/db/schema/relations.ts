/**
 * Drizzle ORM relation definitions.
 * Kept in a single file to avoid circular import issues between schema modules.
 */
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { users } from './users';
import { memberships } from './memberships';
import { invitations } from './invitations';
import { auditLogs } from './audit-logs';
import { emailVerificationTokens } from './email-verification-tokens';
import { persons } from './persons';
import { staffProfiles } from './staff-profiles';
import { carePlans } from './care-plans';
import { carePlanVersions } from './care-plan-versions';
import { careNotes } from './care-notes';
import { documents, bodyMapEntries } from './documents';
import { notifications } from './notifications';
import { riskAssessments } from './risk-assessments';
import { incidents } from './incidents';
import { medications, medicationAdministrations } from './medications';
import { prnProtocols, prnAdministrations } from './prn-protocols';
import { fluidEntries, mealEntries, mustAssessments } from './clinical-monitoring';
import { vitalSigns } from './vital-signs';
import { bowelRecords, sleepChecks, painAssessments } from './bowel-sleep-pain';
import { dbsChecks } from './dbs-checks';
import { trainingCourses, trainingRecords, qualifications } from './training';
import { supervisions } from './supervisions';
import { agencyRegister, agencyWorkers, recruitmentRecords } from './compliance';
import { leaveRequests, leaveBalances } from './leave';
import { properties, tenancies, propertyDocuments, maintenanceRequests } from './properties';
import { ofstedStandards, ofstedEvidence, childrensRegister, statementOfPurpose } from './ofsted';
import { carePackages, visitTypes, scheduledVisits } from './care-packages';
import { clinicalAlerts, personAlertThresholds } from './clinical-alerts';
import { lacRecords, placementPlans, lacStatusChanges } from './lac';
import { hospitalAdmissions, visitCancellations } from './rota';
import { safeguardingConcerns, concernCorrections, dslReviews, ladoReferrals, section47Investigations, mashReferrals, safeguardingChronology } from './safeguarding';
import { allergies, drugInteractions, allergyAlertOverrides } from './medications';
import { cdRegisters, cdRegisterEntries, transdermalPatches, cdStockReconciliations } from './controlled-drugs';
import { pbsPlans, abcIncidents, restrictivePractices } from './pbs';
import { mcaAssessments, bestInterestDecisions, lpaAdrtRecords, dolsApplications, dolsRestrictions } from './mca-dols';
import { shiftPatterns, rotaPeriods, shiftAssignments, conflictOverrides } from './shift-patterns';
import { referrals, referralTransitions, matchingAssessments, admissionChecklistItems } from './admissions';
import { philomenaProfiles, missingEpisodes, missingEpisodeTimeline, returnHomeInterviews } from './missing-from-care';
import { approvedContacts, contactSchedules, contactRecords } from './contacts';
import { goals, goalReviews, skillDomains, skills, skillAssessments, communityAccess, supportHours } from './outcomes';
import { weightSchedules, weightRecords, waterlowAssessments, wounds, woundAssessments } from './weight-wounds';
import { medicationStock, stockBatches, stockTransactions, reorderRequests, medicationErrors, handoverReports, topicalMar, topicalMarAdministrations, homelyRemedyProtocols, homelyRemedyAdministrations } from './stock-management';
import { schoolRecords, personalEducationPlans, pepAttendees, educationAttendance, exclusionRecords, pupilPremiumPlusRecords, sdqAssessments } from './education';

export const organisationsRelations = relations(organisations, ({ many }) => ({
  memberships: many(memberships),
  invitations: many(invitations),
  auditLogs: many(auditLogs),
  persons: many(persons),
  staffProfiles: many(staffProfiles),
  carePlans: many(carePlans),
  carePlanVersions: many(carePlanVersions),
  careNotes: many(careNotes),
  documents: many(documents),
  notifications: many(notifications),
  riskAssessments: many(riskAssessments),
  bodyMapEntries: many(bodyMapEntries),
  incidents: many(incidents),
  medications: many(medications),
  medicationAdministrations: many(medicationAdministrations),
  prnProtocols: many(prnProtocols),
  prnAdministrations: many(prnAdministrations),
  fluidEntries: many(fluidEntries),
  mealEntries: many(mealEntries),
  mustAssessments: many(mustAssessments),
  vitalSigns: many(vitalSigns),
  bowelRecords: many(bowelRecords),
  sleepChecks: many(sleepChecks),
  painAssessments: many(painAssessments),
  dbsChecks: many(dbsChecks),
  trainingCourses: many(trainingCourses),
  trainingRecords: many(trainingRecords),
  qualifications: many(qualifications),
  supervisions: many(supervisions),
  agencyRegister: many(agencyRegister),
  agencyWorkers: many(agencyWorkers),
  recruitmentRecords: many(recruitmentRecords),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
  properties: many(properties),
  tenancies: many(tenancies),
  propertyDocuments: many(propertyDocuments),
  maintenanceRequests: many(maintenanceRequests),
  ofstedStandards: many(ofstedStandards),
  ofstedEvidence: many(ofstedEvidence),
  childrensRegister: many(childrensRegister),
  statementOfPurpose: many(statementOfPurpose),
  carePackages: many(carePackages),
  visitTypes: many(visitTypes),
  scheduledVisits: many(scheduledVisits),
  clinicalAlerts: many(clinicalAlerts),
  personAlertThresholds: many(personAlertThresholds),
  lacRecords: many(lacRecords),
  placementPlans: many(placementPlans),
  lacStatusChanges: many(lacStatusChanges),
  hospitalAdmissions: many(hospitalAdmissions),
  visitCancellations: many(visitCancellations),
  safeguardingConcerns: many(safeguardingConcerns),
  concernCorrections: many(concernCorrections),
  dslReviews: many(dslReviews),
  ladoReferrals: many(ladoReferrals),
  section47Investigations: many(section47Investigations),
  mashReferrals: many(mashReferrals),
  safeguardingChronology: many(safeguardingChronology),
  allergies: many(allergies),
  drugInteractions: many(drugInteractions),
  allergyAlertOverrides: many(allergyAlertOverrides),
  cdRegisters: many(cdRegisters),
  cdRegisterEntries: many(cdRegisterEntries),
  transdermalPatches: many(transdermalPatches),
  cdStockReconciliations: many(cdStockReconciliations),
  pbsPlans: many(pbsPlans),
  abcIncidents: many(abcIncidents),
  restrictivePractices: many(restrictivePractices),
  mcaAssessments: many(mcaAssessments),
  bestInterestDecisions: many(bestInterestDecisions),
  lpaAdrtRecords: many(lpaAdrtRecords),
  dolsApplications: many(dolsApplications),
  dolsRestrictions: many(dolsRestrictions),
  shiftPatterns: many(shiftPatterns),
  rotaPeriods: many(rotaPeriods),
  shiftAssignments: many(shiftAssignments),
  conflictOverrides: many(conflictOverrides),
  referrals: many(referrals),
  referralTransitions: many(referralTransitions),
  matchingAssessments: many(matchingAssessments),
  admissionChecklistItems: many(admissionChecklistItems),
  philomenaProfiles: many(philomenaProfiles),
  missingEpisodes: many(missingEpisodes),
  returnHomeInterviews: many(returnHomeInterviews),
  approvedContacts: many(approvedContacts),
  contactSchedules: many(contactSchedules),
  contactRecords: many(contactRecords),
  goals: many(goals),
  goalReviews: many(goalReviews),
  skillDomains: many(skillDomains),
  skills: many(skills),
  skillAssessments: many(skillAssessments),
  communityAccess: many(communityAccess),
  supportHours: many(supportHours),
  weightSchedules: many(weightSchedules),
  weightRecords: many(weightRecords),
  waterlowAssessments: many(waterlowAssessments),
  wounds: many(wounds),
  woundAssessments: many(woundAssessments),
  medicationStock: many(medicationStock),
  stockBatches: many(stockBatches),
  stockTransactions: many(stockTransactions),
  reorderRequests: many(reorderRequests),
  medicationErrors: many(medicationErrors),
  handoverReports: many(handoverReports),
  topicalMar: many(topicalMar),
  topicalMarAdministrations: many(topicalMarAdministrations),
  homelyRemedyProtocols: many(homelyRemedyProtocols),
  homelyRemedyAdministrations: many(homelyRemedyAdministrations),
  schoolRecords: many(schoolRecords),
  personalEducationPlans: many(personalEducationPlans),
  pepAttendees: many(pepAttendees),
  educationAttendance: many(educationAttendance),
  exclusionRecords: many(exclusionRecords),
  pupilPremiumPlusRecords: many(pupilPremiumPlusRecords),
  sdqAssessments: many(sdqAssessments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  sentInvitations: many(invitations),
  auditLogs: many(auditLogs),
  emailVerificationTokens: many(emailVerificationTokens),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organisation: one(organisations, {
    fields: [notifications.organisationId],
    references: [organisations.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organisation: one(organisations, {
    fields: [memberships.organisationId],
    references: [organisations.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  organisation: one(organisations, {
    fields: [auditLogs.organisationId],
    references: [organisations.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [invitations.organisationId],
    references: [organisations.id],
  }),
  invitedByUser: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationTokens.userId],
      references: [users.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Tenant-scoped entity relations
// ---------------------------------------------------------------------------

export const personsRelations = relations(persons, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [persons.organisationId],
    references: [organisations.id],
  }),
  carePlans: many(carePlans),
  careNotes: many(careNotes),
  documents: many(documents),
  riskAssessments: many(riskAssessments),
  bodyMapEntries: many(bodyMapEntries),
  incidents: many(incidents),
  medications: many(medications),
  medicationAdministrations: many(medicationAdministrations),
  prnAdministrations: many(prnAdministrations),
  fluidEntries: many(fluidEntries),
  mealEntries: many(mealEntries),
  mustAssessments: many(mustAssessments),
  vitalSigns: many(vitalSigns),
  bowelRecords: many(bowelRecords),
  sleepChecks: many(sleepChecks),
  painAssessments: many(painAssessments),
  tenancies: many(tenancies),
  childrensRegister: many(childrensRegister),
  carePackages: many(carePackages),
  scheduledVisits: many(scheduledVisits),
  clinicalAlerts: many(clinicalAlerts),
  personAlertThresholds: many(personAlertThresholds),
  lacRecords: many(lacRecords),
  placementPlans: many(placementPlans),
  hospitalAdmissions: many(hospitalAdmissions),
  safeguardingConcerns: many(safeguardingConcerns),
  pbsPlans: many(pbsPlans),
  abcIncidents: many(abcIncidents),
  restrictivePractices: many(restrictivePractices),
  mcaAssessments: many(mcaAssessments),
  bestInterestDecisions: many(bestInterestDecisions),
  lpaAdrtRecords: many(lpaAdrtRecords),
  dolsApplications: many(dolsApplications),
  dolsRestrictions: many(dolsRestrictions),
  philomenaProfiles: many(philomenaProfiles),
  missingEpisodes: many(missingEpisodes),
  returnHomeInterviews: many(returnHomeInterviews),
  approvedContacts: many(approvedContacts),
  contactRecords: many(contactRecords),
  goals: many(goals),
  skillAssessments: many(skillAssessments),
  communityAccess: many(communityAccess),
  supportHours: many(supportHours),
  weightSchedules: many(weightSchedules),
  weightRecords: many(weightRecords),
  waterlowAssessments: many(waterlowAssessments),
  wounds: many(wounds),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [staffProfiles.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [staffProfiles.userId],
    references: [users.id],
  }),
  dbsChecks: many(dbsChecks),
  trainingRecords: many(trainingRecords),
  qualifications: many(qualifications),
  supervisions: many(supervisions),
  recruitmentRecords: many(recruitmentRecords),
  leaveRequests: many(leaveRequests),
  leaveBalances: many(leaveBalances),
  scheduledVisits: many(scheduledVisits),
}));

export const carePlansRelations = relations(carePlans, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [carePlans.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [carePlans.personId],
    references: [persons.id],
  }),
  approvedBy: one(users, {
    fields: [carePlans.approvedById],
    references: [users.id],
  }),
  versions: many(carePlanVersions),
}));

export const carePlanVersionsRelations = relations(carePlanVersions, ({ one }) => ({
  carePlan: one(carePlans, {
    fields: [carePlanVersions.carePlanId],
    references: [carePlans.id],
  }),
  organisation: one(organisations, {
    fields: [carePlanVersions.organisationId],
    references: [organisations.id],
  }),
  createdBy: one(users, {
    fields: [carePlanVersions.createdById],
    references: [users.id],
  }),
}));

export const careNotesRelations = relations(careNotes, ({ one }) => ({
  organisation: one(organisations, {
    fields: [careNotes.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [careNotes.personId],
    references: [persons.id],
  }),
  author: one(users, {
    fields: [careNotes.authorId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  organisation: one(organisations, {
    fields: [documents.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [documents.personId],
    references: [persons.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
}));

export const bodyMapEntriesRelations = relations(bodyMapEntries, ({ one }) => ({
  organisation: one(organisations, {
    fields: [bodyMapEntries.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [bodyMapEntries.personId],
    references: [persons.id],
  }),
  createdBy: one(users, {
    fields: [bodyMapEntries.createdById],
    references: [users.id],
  }),
}));

export const riskAssessmentsRelations = relations(riskAssessments, ({ one }) => ({
  organisation: one(organisations, {
    fields: [riskAssessments.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [riskAssessments.personId],
    references: [persons.id],
  }),
  completedBy: one(users, {
    fields: [riskAssessments.completedById],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  organisation: one(organisations, {
    fields: [incidents.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [incidents.personId],
    references: [persons.id],
  }),
  reportedBy: one(users, {
    fields: [incidents.reportedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Medication / EMAR relations
// ---------------------------------------------------------------------------

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [medications.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [medications.personId],
    references: [persons.id],
  }),
  administrations: many(medicationAdministrations),
  prnProtocols: many(prnProtocols),
  prnAdministrations: many(prnAdministrations),
}));

export const medicationAdministrationsRelations = relations(
  medicationAdministrations,
  ({ one }) => ({
    organisation: one(organisations, {
      fields: [medicationAdministrations.organisationId],
      references: [organisations.id],
    }),
    person: one(persons, {
      fields: [medicationAdministrations.personId],
      references: [persons.id],
    }),
    medication: one(medications, {
      fields: [medicationAdministrations.medicationId],
      references: [medications.id],
    }),
    administeredBy: one(users, {
      fields: [medicationAdministrations.administeredById],
      references: [users.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// PRN Protocol / Administration relations
// ---------------------------------------------------------------------------

export const prnProtocolsRelations = relations(prnProtocols, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [prnProtocols.organisationId],
    references: [organisations.id],
  }),
  medication: one(medications, {
    fields: [prnProtocols.medicationId],
    references: [medications.id],
  }),
  administrations: many(prnAdministrations),
}));

export const prnAdministrationsRelations = relations(
  prnAdministrations,
  ({ one }) => ({
    organisation: one(organisations, {
      fields: [prnAdministrations.organisationId],
      references: [organisations.id],
    }),
    prnProtocol: one(prnProtocols, {
      fields: [prnAdministrations.prnProtocolId],
      references: [prnProtocols.id],
    }),
    medication: one(medications, {
      fields: [prnAdministrations.medicationId],
      references: [medications.id],
    }),
    person: one(persons, {
      fields: [prnAdministrations.personId],
      references: [persons.id],
    }),
    administeredBy: one(users, {
      fields: [prnAdministrations.administeredById],
      references: [users.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Clinical Monitoring relations (fluid, meal, MUST)
// ---------------------------------------------------------------------------

export const fluidEntriesRelations = relations(fluidEntries, ({ one }) => ({
  organisation: one(organisations, {
    fields: [fluidEntries.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [fluidEntries.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [fluidEntries.recordedById],
    references: [users.id],
  }),
}));

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  organisation: one(organisations, {
    fields: [mealEntries.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [mealEntries.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [mealEntries.recordedById],
    references: [users.id],
  }),
}));

export const mustAssessmentsRelations = relations(mustAssessments, ({ one }) => ({
  organisation: one(organisations, {
    fields: [mustAssessments.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [mustAssessments.personId],
    references: [persons.id],
  }),
  assessedBy: one(users, {
    fields: [mustAssessments.assessedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Vital Signs relations
// ---------------------------------------------------------------------------

export const vitalSignsRelations = relations(vitalSigns, ({ one }) => ({
  organisation: one(organisations, {
    fields: [vitalSigns.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [vitalSigns.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [vitalSigns.recordedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// DBS Check relations
// ---------------------------------------------------------------------------

export const dbsChecksRelations = relations(dbsChecks, ({ one }) => ({
  organisation: one(organisations, {
    fields: [dbsChecks.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [dbsChecks.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Training relations
// ---------------------------------------------------------------------------

export const trainingCoursesRelations = relations(trainingCourses, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [trainingCourses.organisationId],
    references: [organisations.id],
  }),
  trainingRecords: many(trainingRecords),
}));

export const trainingRecordsRelations = relations(trainingRecords, ({ one }) => ({
  organisation: one(organisations, {
    fields: [trainingRecords.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [trainingRecords.staffProfileId],
    references: [staffProfiles.id],
  }),
  course: one(trainingCourses, {
    fields: [trainingRecords.courseId],
    references: [trainingCourses.id],
  }),
}));

export const qualificationsRelations = relations(qualifications, ({ one }) => ({
  organisation: one(organisations, {
    fields: [qualifications.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [qualifications.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Supervision relations
// ---------------------------------------------------------------------------

export const supervisionsRelations = relations(supervisions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [supervisions.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [supervisions.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Leave relations
// ---------------------------------------------------------------------------

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  organisation: one(organisations, {
    fields: [leaveRequests.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [leaveRequests.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  organisation: one(organisations, {
    fields: [leaveBalances.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [leaveBalances.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Agency Register relations
// ---------------------------------------------------------------------------

export const agencyRegisterRelations = relations(agencyRegister, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [agencyRegister.organisationId],
    references: [organisations.id],
  }),
  workers: many(agencyWorkers),
}));

export const agencyWorkersRelations = relations(agencyWorkers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [agencyWorkers.organisationId],
    references: [organisations.id],
  }),
  agency: one(agencyRegister, {
    fields: [agencyWorkers.agencyId],
    references: [agencyRegister.id],
  }),
}));

// ---------------------------------------------------------------------------
// Recruitment Records relations
// ---------------------------------------------------------------------------

export const recruitmentRecordsRelations = relations(recruitmentRecords, ({ one }) => ({
  organisation: one(organisations, {
    fields: [recruitmentRecords.organisationId],
    references: [organisations.id],
  }),
  staffProfile: one(staffProfiles, {
    fields: [recruitmentRecords.staffProfileId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Bowel, Sleep & Pain relations
// ---------------------------------------------------------------------------

export const bowelRecordsRelations = relations(bowelRecords, ({ one }) => ({
  organisation: one(organisations, {
    fields: [bowelRecords.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [bowelRecords.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [bowelRecords.recordedById],
    references: [users.id],
  }),
}));

export const sleepChecksRelations = relations(sleepChecks, ({ one }) => ({
  organisation: one(organisations, {
    fields: [sleepChecks.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [sleepChecks.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [sleepChecks.recordedById],
    references: [users.id],
  }),
}));

export const painAssessmentsRelations = relations(painAssessments, ({ one }) => ({
  organisation: one(organisations, {
    fields: [painAssessments.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [painAssessments.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [painAssessments.recordedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Ofsted Compliance relations
// ---------------------------------------------------------------------------

export const ofstedStandardsRelations = relations(ofstedStandards, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [ofstedStandards.organisationId],
    references: [organisations.id],
  }),
  evidence: many(ofstedEvidence),
}));

export const ofstedEvidenceRelations = relations(ofstedEvidence, ({ one }) => ({
  organisation: one(organisations, {
    fields: [ofstedEvidence.organisationId],
    references: [organisations.id],
  }),
  standard: one(ofstedStandards, {
    fields: [ofstedEvidence.standardId],
    references: [ofstedStandards.id],
  }),
  reviewedBy: one(users, {
    fields: [ofstedEvidence.reviewedById],
    references: [users.id],
  }),
}));

export const childrensRegisterRelations = relations(childrensRegister, ({ one }) => ({
  organisation: one(organisations, {
    fields: [childrensRegister.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [childrensRegister.personId],
    references: [persons.id],
  }),
}));

export const statementOfPurposeRelations = relations(statementOfPurpose, ({ one }) => ({
  organisation: one(organisations, {
    fields: [statementOfPurpose.organisationId],
    references: [organisations.id],
  }),
  approvedBy: one(users, {
    fields: [statementOfPurpose.approvedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Property & Tenancy relations
// ---------------------------------------------------------------------------

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [properties.organisationId],
    references: [organisations.id],
  }),
  tenancies: many(tenancies),
  propertyDocuments: many(propertyDocuments),
  maintenanceRequests: many(maintenanceRequests),
}));

export const tenanciesRelations = relations(tenancies, ({ one }) => ({
  organisation: one(organisations, {
    fields: [tenancies.organisationId],
    references: [organisations.id],
  }),
  property: one(properties, {
    fields: [tenancies.propertyId],
    references: [properties.id],
  }),
  person: one(persons, {
    fields: [tenancies.personId],
    references: [persons.id],
  }),
}));

export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  organisation: one(organisations, {
    fields: [propertyDocuments.organisationId],
    references: [organisations.id],
  }),
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
  uploadedBy: one(users, {
    fields: [propertyDocuments.uploadedById],
    references: [users.id],
  }),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  organisation: one(organisations, {
    fields: [maintenanceRequests.organisationId],
    references: [organisations.id],
  }),
  property: one(properties, {
    fields: [maintenanceRequests.propertyId],
    references: [properties.id],
  }),
  reportedBy: one(users, {
    fields: [maintenanceRequests.reportedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Clinical Alert relations
// ---------------------------------------------------------------------------

export const clinicalAlertsRelations = relations(clinicalAlerts, ({ one }) => ({
  organisation: one(organisations, {
    fields: [clinicalAlerts.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [clinicalAlerts.personId],
    references: [persons.id],
  }),
  acknowledgedBy: one(users, {
    fields: [clinicalAlerts.acknowledgedById],
    references: [users.id],
  }),
}));

export const personAlertThresholdsRelations = relations(personAlertThresholds, ({ one }) => ({
  organisation: one(organisations, {
    fields: [personAlertThresholds.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [personAlertThresholds.personId],
    references: [persons.id],
  }),
  setBy: one(users, {
    fields: [personAlertThresholds.setById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Care Package relations
// ---------------------------------------------------------------------------

export const carePackagesRelations = relations(carePackages, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [carePackages.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [carePackages.personId],
    references: [persons.id],
  }),
  visitTypes: many(visitTypes),
  scheduledVisits: many(scheduledVisits),
}));

export const visitTypesRelations = relations(visitTypes, ({ one, many }) => ({
  carePackage: one(carePackages, {
    fields: [visitTypes.carePackageId],
    references: [carePackages.id],
  }),
  organisation: one(organisations, {
    fields: [visitTypes.organisationId],
    references: [organisations.id],
  }),
  scheduledVisits: many(scheduledVisits),
}));

export const scheduledVisitsRelations = relations(scheduledVisits, ({ one }) => ({
  visitType: one(visitTypes, {
    fields: [scheduledVisits.visitTypeId],
    references: [visitTypes.id],
  }),
  carePackage: one(carePackages, {
    fields: [scheduledVisits.carePackageId],
    references: [carePackages.id],
  }),
  person: one(persons, {
    fields: [scheduledVisits.personId],
    references: [persons.id],
  }),
  organisation: one(organisations, {
    fields: [scheduledVisits.organisationId],
    references: [organisations.id],
  }),
  assignedStaff: one(staffProfiles, {
    fields: [scheduledVisits.assignedStaffId],
    references: [staffProfiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// LAC (Looked After Children) relations
// ---------------------------------------------------------------------------

export const lacRecordsRelations = relations(lacRecords, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [lacRecords.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [lacRecords.personId],
    references: [persons.id],
  }),
  placementPlans: many(placementPlans),
  statusChanges: many(lacStatusChanges),
}));

export const placementPlansRelations = relations(placementPlans, ({ one }) => ({
  organisation: one(organisations, {
    fields: [placementPlans.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [placementPlans.personId],
    references: [persons.id],
  }),
  lacRecord: one(lacRecords, {
    fields: [placementPlans.lacRecordId],
    references: [lacRecords.id],
  }),
  reviewedBy: one(users, {
    fields: [placementPlans.reviewedById],
    references: [users.id],
  }),
}));

export const lacStatusChangesRelations = relations(lacStatusChanges, ({ one }) => ({
  organisation: one(organisations, {
    fields: [lacStatusChanges.organisationId],
    references: [organisations.id],
  }),
  lacRecord: one(lacRecords, {
    fields: [lacStatusChanges.lacRecordId],
    references: [lacRecords.id],
  }),
  changedBy: one(users, {
    fields: [lacStatusChanges.changedById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Hospital Admission & Visit Cancellation relations
// ---------------------------------------------------------------------------

export const hospitalAdmissionsRelations = relations(hospitalAdmissions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [hospitalAdmissions.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [hospitalAdmissions.personId],
    references: [persons.id],
  }),
  recordedBy: one(users, {
    fields: [hospitalAdmissions.recordedById],
    references: [users.id],
  }),
  dischargedBy: one(users, {
    fields: [hospitalAdmissions.dischargedById],
    references: [users.id],
  }),
}));

export const visitCancellationsRelations = relations(visitCancellations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [visitCancellations.organisationId],
    references: [organisations.id],
  }),
  cancelledBy: one(users, {
    fields: [visitCancellations.cancelledById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Safeguarding relations
// ---------------------------------------------------------------------------

export const safeguardingConcernsRelations = relations(safeguardingConcerns, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [safeguardingConcerns.organisationId],
    references: [organisations.id],
  }),
  child: one(persons, {
    fields: [safeguardingConcerns.childId],
    references: [persons.id],
  }),
  reportedBy: one(users, {
    fields: [safeguardingConcerns.reportedById],
    references: [users.id],
  }),
  corrections: many(concernCorrections),
  dslReviews: many(dslReviews),
}));

export const concernCorrectionsRelations = relations(concernCorrections, ({ one }) => ({
  organisation: one(organisations, {
    fields: [concernCorrections.organisationId],
    references: [organisations.id],
  }),
  concern: one(safeguardingConcerns, {
    fields: [concernCorrections.concernId],
    references: [safeguardingConcerns.id],
  }),
  correctedBy: one(users, {
    fields: [concernCorrections.correctedById],
    references: [users.id],
  }),
}));

export const dslReviewsRelations = relations(dslReviews, ({ one }) => ({
  organisation: one(organisations, {
    fields: [dslReviews.organisationId],
    references: [organisations.id],
  }),
  concern: one(safeguardingConcerns, {
    fields: [dslReviews.concernId],
    references: [safeguardingConcerns.id],
  }),
  reviewer: one(users, {
    fields: [dslReviews.reviewerId],
    references: [users.id],
  }),
}));

export const ladoReferralsRelations = relations(ladoReferrals, ({ one }) => ({
  organisation: one(organisations, {
    fields: [ladoReferrals.organisationId],
    references: [organisations.id],
  }),
  child: one(persons, {
    fields: [ladoReferrals.childId],
    references: [persons.id],
  }),
  createdBy: one(users, {
    fields: [ladoReferrals.createdById],
    references: [users.id],
  }),
}));

export const section47InvestigationsRelations = relations(section47Investigations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [section47Investigations.organisationId],
    references: [organisations.id],
  }),
  child: one(persons, {
    fields: [section47Investigations.childId],
    references: [persons.id],
  }),
}));

export const mashReferralsRelations = relations(mashReferrals, ({ one }) => ({
  organisation: one(organisations, {
    fields: [mashReferrals.organisationId],
    references: [organisations.id],
  }),
  concern: one(safeguardingConcerns, {
    fields: [mashReferrals.concernId],
    references: [safeguardingConcerns.id],
  }),
}));

export const safeguardingChronologyRelations = relations(safeguardingChronology, ({ one }) => ({
  organisation: one(organisations, {
    fields: [safeguardingChronology.organisationId],
    references: [organisations.id],
  }),
  child: one(persons, {
    fields: [safeguardingChronology.childId],
    references: [persons.id],
  }),
}));

// ---------------------------------------------------------------------------
// Allergy & Drug Interaction relations
// ---------------------------------------------------------------------------

export const allergiesRelations = relations(allergies, ({ one }) => ({
  organisation: one(organisations, {
    fields: [allergies.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [allergies.personId],
    references: [persons.id],
  }),
}));

export const allergyAlertOverridesRelations = relations(allergyAlertOverrides, ({ one }) => ({
  organisation: one(organisations, {
    fields: [allergyAlertOverrides.organisationId],
    references: [organisations.id],
  }),
  medication: one(medications, {
    fields: [allergyAlertOverrides.medicationId],
    references: [medications.id],
  }),
  allergy: one(allergies, {
    fields: [allergyAlertOverrides.allergyId],
    references: [allergies.id],
  }),
}));

export const drugInteractionsRelations = relations(drugInteractions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [drugInteractions.organisationId],
    references: [organisations.id],
  }),
}));

// ---------------------------------------------------------------------------
// Controlled Drugs relations
// ---------------------------------------------------------------------------

export const cdRegistersRelations = relations(cdRegisters, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [cdRegisters.organisationId],
    references: [organisations.id],
  }),
  medication: one(medications, {
    fields: [cdRegisters.medicationId],
    references: [medications.id],
  }),
  entries: many(cdRegisterEntries),
}));

export const cdRegisterEntriesRelations = relations(cdRegisterEntries, ({ one }) => ({
  organisation: one(organisations, {
    fields: [cdRegisterEntries.organisationId],
    references: [organisations.id],
  }),
  register: one(cdRegisters, {
    fields: [cdRegisterEntries.registerId],
    references: [cdRegisters.id],
  }),
}));

export const transdermalPatchesRelations = relations(transdermalPatches, ({ one }) => ({
  organisation: one(organisations, {
    fields: [transdermalPatches.organisationId],
    references: [organisations.id],
  }),
  medication: one(medications, {
    fields: [transdermalPatches.medicationId],
    references: [medications.id],
  }),
}));

export const cdStockReconciliationsRelations = relations(cdStockReconciliations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [cdStockReconciliations.organisationId],
    references: [organisations.id],
  }),
  register: one(cdRegisters, {
    fields: [cdStockReconciliations.registerId],
    references: [cdRegisters.id],
  }),
}));

// ---------------------------------------------------------------------------
// PBS (Positive Behaviour Support) relations
// ---------------------------------------------------------------------------

export const pbsPlansRelations = relations(pbsPlans, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [pbsPlans.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [pbsPlans.personId],
    references: [persons.id],
  }),
  createdByUser: one(users, {
    fields: [pbsPlans.createdBy],
    references: [users.id],
  }),
  abcIncidents: many(abcIncidents),
}));

export const abcIncidentsRelations = relations(abcIncidents, ({ one }) => ({
  organisation: one(organisations, {
    fields: [abcIncidents.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [abcIncidents.personId],
    references: [persons.id],
  }),
  pbsPlan: one(pbsPlans, {
    fields: [abcIncidents.pbsPlanId],
    references: [pbsPlans.id],
  }),
  recordedByUser: one(users, {
    fields: [abcIncidents.recordedBy],
    references: [users.id],
  }),
}));

export const restrictivePracticesRelations = relations(
  restrictivePractices,
  ({ one }) => ({
    organisation: one(organisations, {
      fields: [restrictivePractices.organisationId],
      references: [organisations.id],
    }),
    person: one(persons, {
      fields: [restrictivePractices.personId],
      references: [persons.id],
    }),
    recordedByUser: one(users, {
      fields: [restrictivePractices.recordedBy],
      references: [users.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// MCA / DoLS relations
// ---------------------------------------------------------------------------

export const mcaAssessmentsRelations = relations(mcaAssessments, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [mcaAssessments.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [mcaAssessments.personId],
    references: [persons.id],
  }),
  assessor: one(users, {
    fields: [mcaAssessments.assessorId],
    references: [users.id],
  }),
  bestInterestDecisions: many(bestInterestDecisions),
}));

export const bestInterestDecisionsRelations = relations(bestInterestDecisions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [bestInterestDecisions.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [bestInterestDecisions.personId],
    references: [persons.id],
  }),
  mcaAssessment: one(mcaAssessments, {
    fields: [bestInterestDecisions.mcaAssessmentId],
    references: [mcaAssessments.id],
  }),
}));

export const lpaAdrtRecordsRelations = relations(lpaAdrtRecords, ({ one }) => ({
  organisation: one(organisations, {
    fields: [lpaAdrtRecords.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [lpaAdrtRecords.personId],
    references: [persons.id],
  }),
}));

export const dolsApplicationsRelations = relations(dolsApplications, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [dolsApplications.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [dolsApplications.personId],
    references: [persons.id],
  }),
  restrictions: many(dolsRestrictions),
}));

export const dolsRestrictionsRelations = relations(dolsRestrictions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [dolsRestrictions.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [dolsRestrictions.personId],
    references: [persons.id],
  }),
  dolsApplication: one(dolsApplications, {
    fields: [dolsRestrictions.dolsApplicationId],
    references: [dolsApplications.id],
  }),
}));

// ---------------------------------------------------------------------------
// Shift Patterns / Rota relations
// ---------------------------------------------------------------------------

export const shiftPatternsRelations = relations(shiftPatterns, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [shiftPatterns.organisationId],
    references: [organisations.id],
  }),
  assignments: many(shiftAssignments),
}));

export const rotaPeriodsRelations = relations(rotaPeriods, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [rotaPeriods.organisationId],
    references: [organisations.id],
  }),
  assignments: many(shiftAssignments),
}));

export const shiftAssignmentsRelations = relations(shiftAssignments, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [shiftAssignments.organisationId],
    references: [organisations.id],
  }),
  rotaPeriod: one(rotaPeriods, {
    fields: [shiftAssignments.rotaPeriodId],
    references: [rotaPeriods.id],
  }),
  shiftPattern: one(shiftPatterns, {
    fields: [shiftAssignments.shiftPatternId],
    references: [shiftPatterns.id],
  }),
  overrides: many(conflictOverrides),
}));

export const conflictOverridesRelations = relations(conflictOverrides, ({ one }) => ({
  organisation: one(organisations, {
    fields: [conflictOverrides.organisationId],
    references: [organisations.id],
  }),
  shiftAssignment: one(shiftAssignments, {
    fields: [conflictOverrides.shiftAssignmentId],
    references: [shiftAssignments.id],
  }),
  overriddenByUser: one(users, {
    fields: [conflictOverrides.overriddenBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Admissions/Referrals relations
// ---------------------------------------------------------------------------

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  organisation: one(organisations, { fields: [referrals.organisationId], references: [organisations.id] }),
  transitions: many(referralTransitions),
  assessments: many(matchingAssessments),
  checklistItems: many(admissionChecklistItems),
}));

export const referralTransitionsRelations = relations(referralTransitions, ({ one }) => ({
  organisation: one(organisations, { fields: [referralTransitions.organisationId], references: [organisations.id] }),
  referral: one(referrals, { fields: [referralTransitions.referralId], references: [referrals.id] }),
}));

export const matchingAssessmentsRelations = relations(matchingAssessments, ({ one }) => ({
  organisation: one(organisations, { fields: [matchingAssessments.organisationId], references: [organisations.id] }),
  referral: one(referrals, { fields: [matchingAssessments.referralId], references: [referrals.id] }),
}));

export const admissionChecklistItemsRelations = relations(admissionChecklistItems, ({ one }) => ({
  organisation: one(organisations, { fields: [admissionChecklistItems.organisationId], references: [organisations.id] }),
  referral: one(referrals, { fields: [admissionChecklistItems.referralId], references: [referrals.id] }),
}));

// ---------------------------------------------------------------------------
// Missing from Care relations
// ---------------------------------------------------------------------------

export const philomenaProfilesRelations = relations(philomenaProfiles, ({ one }) => ({
  organisation: one(organisations, { fields: [philomenaProfiles.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [philomenaProfiles.personId], references: [persons.id] }),
}));

export const missingEpisodesRelations = relations(missingEpisodes, ({ one, many }) => ({
  organisation: one(organisations, { fields: [missingEpisodes.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [missingEpisodes.personId], references: [persons.id] }),
  timeline: many(missingEpisodeTimeline),
  rhi: many(returnHomeInterviews),
}));

export const missingEpisodeTimelineRelations = relations(missingEpisodeTimeline, ({ one }) => ({
  organisation: one(organisations, { fields: [missingEpisodeTimeline.organisationId], references: [organisations.id] }),
  episode: one(missingEpisodes, { fields: [missingEpisodeTimeline.episodeId], references: [missingEpisodes.id] }),
}));

export const returnHomeInterviewsRelations = relations(returnHomeInterviews, ({ one }) => ({
  organisation: one(organisations, { fields: [returnHomeInterviews.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [returnHomeInterviews.personId], references: [persons.id] }),
  episode: one(missingEpisodes, { fields: [returnHomeInterviews.episodeId], references: [missingEpisodes.id] }),
}));

// ---------------------------------------------------------------------------
// Contact Management relations
// ---------------------------------------------------------------------------

export const approvedContactsRelations = relations(approvedContacts, ({ one }) => ({
  organisation: one(organisations, { fields: [approvedContacts.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [approvedContacts.personId], references: [persons.id] }),
}));

export const contactSchedulesRelations = relations(contactSchedules, ({ one }) => ({
  organisation: one(organisations, { fields: [contactSchedules.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [contactSchedules.personId], references: [persons.id] }),
}));

export const contactRecordsRelations = relations(contactRecords, ({ one }) => ({
  organisation: one(organisations, { fields: [contactRecords.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [contactRecords.personId], references: [persons.id] }),
}));

// ---------------------------------------------------------------------------
// Outcomes / Skills / Goals relations
// ---------------------------------------------------------------------------

export const goalsRelations = relations(goals, ({ one, many }) => ({
  organisation: one(organisations, { fields: [goals.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [goals.personId], references: [persons.id] }),
  reviews: many(goalReviews),
}));

export const goalReviewsRelations = relations(goalReviews, ({ one }) => ({
  organisation: one(organisations, { fields: [goalReviews.organisationId], references: [organisations.id] }),
  goal: one(goals, { fields: [goalReviews.goalId], references: [goals.id] }),
}));

export const skillDomainsRelations = relations(skillDomains, ({ one, many }) => ({
  organisation: one(organisations, { fields: [skillDomains.organisationId], references: [organisations.id] }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  domain: one(skillDomains, { fields: [skills.domainId], references: [skillDomains.id] }),
  assessments: many(skillAssessments),
}));

export const skillAssessmentsRelations = relations(skillAssessments, ({ one }) => ({
  organisation: one(organisations, { fields: [skillAssessments.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [skillAssessments.personId], references: [persons.id] }),
  skill: one(skills, { fields: [skillAssessments.skillId], references: [skills.id] }),
}));

export const communityAccessRelations = relations(communityAccess, ({ one }) => ({
  organisation: one(organisations, { fields: [communityAccess.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [communityAccess.personId], references: [persons.id] }),
}));

export const supportHoursRelations = relations(supportHours, ({ one }) => ({
  organisation: one(organisations, { fields: [supportHours.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [supportHours.personId], references: [persons.id] }),
}));

// ---------------------------------------------------------------------------
// Weight / Wound relations
// ---------------------------------------------------------------------------

export const weightSchedulesRelations = relations(weightSchedules, ({ one }) => ({
  organisation: one(organisations, { fields: [weightSchedules.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [weightSchedules.personId], references: [persons.id] }),
}));

export const weightRecordsRelations = relations(weightRecords, ({ one }) => ({
  organisation: one(organisations, { fields: [weightRecords.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [weightRecords.personId], references: [persons.id] }),
}));

export const waterlowAssessmentsRelations = relations(waterlowAssessments, ({ one }) => ({
  organisation: one(organisations, { fields: [waterlowAssessments.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [waterlowAssessments.personId], references: [persons.id] }),
}));

export const woundsRelations = relations(wounds, ({ one, many }) => ({
  organisation: one(organisations, { fields: [wounds.organisationId], references: [organisations.id] }),
  person: one(persons, { fields: [wounds.personId], references: [persons.id] }),
  assessments: many(woundAssessments),
}));

export const woundAssessmentsRelations = relations(woundAssessments, ({ one }) => ({
  organisation: one(organisations, { fields: [woundAssessments.organisationId], references: [organisations.id] }),
  wound: one(wounds, { fields: [woundAssessments.woundId], references: [wounds.id] }),
}));
