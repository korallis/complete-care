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
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  organisation: one(organisations, {
    fields: [staffProfiles.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [staffProfiles.userId],
    references: [users.id],
  }),
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
