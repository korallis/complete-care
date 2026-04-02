/**
 * Family portal domain types and validation schemas.
 */
import { z } from 'zod';

// --- Care domains ---
export const CARE_DOMAINS = [
  'domiciliary_care',
  'supported_living',
  'childrens_homes',
] as const;

export type CareDomain = (typeof CARE_DOMAINS)[number];

// --- Invitation ---
export const invitationRelationships = [
  'parent',
  'sibling',
  'spouse',
  'child',
  'guardian',
  'other',
] as const;

export type InvitationRelationship = (typeof invitationRelationships)[number];

export const createInvitationSchema = z.object({
  personId: z.string().uuid(),
  email: z.string().email('A valid email address is required'),
  name: z.string().min(1, 'Name is required').max(200),
  relationship: z.enum(invitationRelationships),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

// --- Family member approval ---
export const familyMemberStatuses = [
  'pending_approval',
  'approved',
  'suspended',
  'revoked',
] as const;

export type FamilyMemberStatus = (typeof familyMemberStatuses)[number];

export const approveFamilyMemberSchema = z.object({
  familyMemberId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export type ApproveFamilyMemberInput = z.infer<
  typeof approveFamilyMemberSchema
>;

// --- Messaging ---
export const sendMessageSchema = z.object({
  personId: z.string().uuid(),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(5000, 'Message must be under 5000 characters'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const reviewMessageSchema = z.object({
  messageId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export type ReviewMessageInput = z.infer<typeof reviewMessageSchema>;

// --- Updates ---
export const updateTypes = [
  'general',
  'photo',
  'milestone',
  'activity',
] as const;

export type UpdateType = (typeof updateTypes)[number];

export const createUpdateSchema = z.object({
  personId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  updateType: z.enum(updateTypes).default('general'),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;

export const reviewUpdateSchema = z.object({
  updateId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

// --- Domain-specific view types ---

/** Domiciliary care portal view data */
export interface DomiciliaryPortalView {
  domain: 'domiciliary_care';
  visitSchedule: VisitScheduleEntry[];
  recentVisitNotes: VisitNote[];
  carePlanSummary: CarePlanSummary | null;
}

/** Supported living portal view data */
export interface SupportedLivingPortalView {
  domain: 'supported_living';
  goalsProgress: GoalProgress[];
  communityActivities: CommunityActivity[];
  supportHoursSummary: SupportHoursSummary;
}

/** Children's homes portal view data */
export interface ChildrensHomesPortalView {
  domain: 'childrens_homes';
  keyWorkerSessions: KeyWorkerSession[];
  contactSchedule: ContactScheduleEntry[];
  dailyLogHighlights: DailyLogHighlight[];
}

export type PortalView =
  | DomiciliaryPortalView
  | SupportedLivingPortalView
  | ChildrensHomesPortalView;

// --- Shared sub-types ---

export interface VisitScheduleEntry {
  id: string;
  scheduledAt: string;
  duration: number;
  carerName: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface VisitNote {
  id: string;
  visitDate: string;
  carerName: string;
  summary: string;
  createdAt: string;
}

export interface CarePlanSummary {
  id: string;
  title: string;
  lastReviewDate: string;
  nextReviewDate: string;
  objectives: string[];
}

export interface GoalProgress {
  id: string;
  goalTitle: string;
  targetDate: string;
  progressPercentage: number;
  lastUpdated: string;
  notes: string;
}

export interface CommunityActivity {
  id: string;
  activityName: string;
  scheduledAt: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface SupportHoursSummary {
  weeklyAllocated: number;
  weeklyUsed: number;
  periodStart: string;
  periodEnd: string;
}

export interface KeyWorkerSession {
  id: string;
  sessionDate: string;
  keyWorkerName: string;
  summary: string;
  nextSessionDate: string;
}

export interface ContactScheduleEntry {
  id: string;
  contactName: string;
  relationship: string;
  scheduledAt: string;
  contactType: 'visit' | 'phone' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface DailyLogHighlight {
  id: string;
  date: string;
  summary: string;
  mood: string;
  staffName: string;
}

// --- Read-only care information ---

export interface CareInformationView {
  carePlans: CarePlanSummary[];
  recentCareNotes: CareNote[];
  medicationSummary: MedicationEntry[];
  upcomingAppointments: AppointmentEntry[];
}

export interface CareNote {
  id: string;
  date: string;
  staffName: string;
  category: string;
  summary: string;
}

export interface MedicationEntry {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
}

export interface AppointmentEntry {
  id: string;
  title: string;
  scheduledAt: string;
  location: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
