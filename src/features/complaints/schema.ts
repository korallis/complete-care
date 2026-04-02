import { z } from 'zod';

export const COMPLAINT_STATUSES = [
  'received',
  'investigated',
  'outcome_communicated',
  'closed',
] as const;

export const SATISFACTION_OPTIONS = [
  'satisfied',
  'partly_satisfied',
  'dissatisfied',
] as const;

export const createComplaintSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  complaintDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Complaint date must be YYYY-MM-DD'),
  raisedBy: z.string().min(1, 'Who raised the complaint is required').max(255),
  nature: z.string().min(1, 'Nature of complaint is required').max(10000),
  desiredOutcome: z.string().max(5000).optional(),
  status: z.enum(COMPLAINT_STATUSES).default('received'),
  advocacyOffered: z.boolean().default(false),
  advocacyNotes: z.string().max(2000).optional(),
  investigationNotes: z.string().max(5000).optional(),
  outcomeSummary: z.string().max(5000).optional(),
  satisfaction: z.enum(SATISFACTION_OPTIONS).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
