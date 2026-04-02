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
import { safeguardingConcerns, safeguardingReferrals } from './safeguarding';

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
  safeguardingReferrals: many(safeguardingReferrals),
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
  person: one(persons, {
    fields: [safeguardingConcerns.personId],
    references: [persons.id],
  }),
  raisedBy: one(users, {
    fields: [safeguardingConcerns.raisedById],
    references: [users.id],
  }),
  referrals: many(safeguardingReferrals),
}));

export const safeguardingReferralsRelations = relations(safeguardingReferrals, ({ one }) => ({
  organisation: one(organisations, {
    fields: [safeguardingReferrals.organisationId],
    references: [organisations.id],
  }),
  concern: one(safeguardingConcerns, {
    fields: [safeguardingReferrals.concernId],
    references: [safeguardingConcerns.id],
  }),
  madeBy: one(users, {
    fields: [safeguardingReferrals.madeById],
    references: [users.id],
  }),
}));
