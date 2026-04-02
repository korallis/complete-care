import { z } from 'zod';

export const meetingActionSchema = z.object({
  action: z.string().min(1, 'Action is required').max(500),
  owner: z.string().min(1, 'Owner is required').max(255),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  completed: z.boolean().default(false),
});

export const createMeetingSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Meeting date must be YYYY-MM-DD'),
  title: z.string().min(1, 'Title is required').max(255),
  childAttendees: z.array(z.string().min(1)).default([]),
  staffAttendees: z.array(z.string().min(1)).default([]),
  agendaItems: z.array(z.string().min(1)).default([]),
  discussionPoints: z.string().min(1, 'Discussion points are required').max(10000),
  decisions: z.string().min(1, 'Decisions are required').max(5000),
  actions: z.array(meetingActionSchema).default([]),
  sharedWithReg44: z.boolean().default(true),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
