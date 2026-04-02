/**
 * Zod validation schemas for Visit Tasks feature — server actions and forms.
 */
import { z } from 'zod';
import { TASK_CATEGORIES, VISIT_TYPES } from './constants';

// ---------------------------------------------------------------------------
// Task template CRUD
// ---------------------------------------------------------------------------

export const createTaskTemplateSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  visitType: z.enum(VISIT_TYPES),
  description: z.string().max(1000).optional(),
});

export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;

export const updateTaskTemplateSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  visitType: z.enum(VISIT_TYPES).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;

// ---------------------------------------------------------------------------
// Template task items
// ---------------------------------------------------------------------------

export const createTemplateTaskSchema = z.object({
  organisationId: z.string().uuid(),
  templateId: z.string().uuid(),
  title: z.string().min(1).max(300),
  instructions: z.string().max(2000).optional(),
  isMandatory: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  category: z.enum(TASK_CATEGORIES).optional(),
});

export type CreateTemplateTaskInput = z.infer<typeof createTemplateTaskSchema>;

export const updateTemplateTaskSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  instructions: z.string().max(2000).optional(),
  isMandatory: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  category: z.enum(TASK_CATEGORIES).optional(),
});

export type UpdateTemplateTaskInput = z.infer<typeof updateTemplateTaskSchema>;

// ---------------------------------------------------------------------------
// Visit task list generation
// ---------------------------------------------------------------------------

export const generateVisitTaskListSchema = z.object({
  organisationId: z.string().uuid(),
  visitId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export type GenerateVisitTaskListInput = z.infer<typeof generateVisitTaskListSchema>;

// ---------------------------------------------------------------------------
// Task completion
// ---------------------------------------------------------------------------

export const completeTaskSchema = z.object({
  taskId: z.string().uuid(),
  organisationId: z.string().uuid(),
  completedBy: z.string().uuid(),
  timeSpentMinutes: z.number().int().min(0).max(480).optional(),
  notes: z.string().max(2000).optional(),
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export const skipTaskSchema = z.object({
  taskId: z.string().uuid(),
  organisationId: z.string().uuid(),
  completedBy: z.string().uuid(),
  skipReason: z.string().min(1).max(1000),
  notes: z.string().max(2000).optional(),
});

export type SkipTaskInput = z.infer<typeof skipTaskSchema>;

// ---------------------------------------------------------------------------
// Query filters
// ---------------------------------------------------------------------------

export const taskTemplateFilterSchema = z.object({
  organisationId: z.string().uuid(),
  visitType: z.enum(VISIT_TYPES).optional(),
  isActive: z.boolean().optional(),
});

export type TaskTemplateFilterInput = z.infer<typeof taskTemplateFilterSchema>;

export const visitTaskListFilterSchema = z.object({
  organisationId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
});

export type VisitTaskListFilterInput = z.infer<typeof visitTaskListFilterSchema>;
