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
import { careNotes } from './care-notes';
import { documents } from './documents';

export const organisationsRelations = relations(organisations, ({ many }) => ({
  memberships: many(memberships),
  invitations: many(invitations),
  auditLogs: many(auditLogs),
  persons: many(persons),
  staffProfiles: many(staffProfiles),
  carePlans: many(carePlans),
  careNotes: many(careNotes),
  documents: many(documents),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  sentInvitations: many(invitations),
  auditLogs: many(auditLogs),
  emailVerificationTokens: many(emailVerificationTokens),
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

export const carePlansRelations = relations(carePlans, ({ one }) => ({
  organisation: one(organisations, {
    fields: [carePlans.organisationId],
    references: [organisations.id],
  }),
  person: one(persons, {
    fields: [carePlans.personId],
    references: [persons.id],
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
