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
import { dbsChecks } from './dbs-checks';
import { trainingCourses, trainingRecords, qualifications } from './training';
import { supervisions } from './supervisions';

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
  dbsChecks: many(dbsChecks),
  trainingCourses: many(trainingCourses),
  trainingRecords: many(trainingRecords),
  qualifications: many(qualifications),
  supervisions: many(supervisions),
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
