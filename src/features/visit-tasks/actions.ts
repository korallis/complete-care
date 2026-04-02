'use server';

/**
 * Visit Tasks server actions — template management, task list generation,
 * task completion and skip tracking.
 * All actions enforce multi-tenant isolation via organisationId.
 */

import { db } from '@/lib/db';
import {
  taskTemplates,
  templateTasks,
  visitTaskLists,
  visitTasks,
} from '@/lib/db/schema/visit-tasks';
import { eq, and, desc, asc } from 'drizzle-orm';
import {
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
  createTemplateTaskSchema,
  updateTemplateTaskSchema,
  generateVisitTaskListSchema,
  completeTaskSchema,
  skipTaskSchema,
  taskTemplateFilterSchema,
  type CreateTaskTemplateInput,
  type UpdateTaskTemplateInput,
  type CreateTemplateTaskInput,
  type UpdateTemplateTaskInput,
  type GenerateVisitTaskListInput,
  type CompleteTaskInput,
  type SkipTaskInput,
  type TaskTemplateFilterInput,
} from './schemas';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Task Template CRUD
// ---------------------------------------------------------------------------

export async function createTaskTemplate(
  input: CreateTaskTemplateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTaskTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [template] = await db
    .insert(taskTemplates)
    .values(parsed.data)
    .returning({ id: taskTemplates.id });

  return { success: true, data: { id: template.id } };
}

export async function updateTaskTemplate(
  input: UpdateTaskTemplateInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateTaskTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, ...updates } = parsed.data;

  const [template] = await db
    .update(taskTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(taskTemplates.id, id),
        eq(taskTemplates.organisationId, organisationId),
      ),
    )
    .returning({ id: taskTemplates.id });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  return { success: true, data: { id: template.id } };
}

export async function getTaskTemplates(
  input: TaskTemplateFilterInput,
): Promise<ActionResult<(typeof taskTemplates.$inferSelect)[]>> {
  const parsed = taskTemplateFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const filters = parsed.data;
  const conditions = [eq(taskTemplates.organisationId, filters.organisationId)];

  if (filters.visitType) {
    conditions.push(eq(taskTemplates.visitType, filters.visitType));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(taskTemplates.isActive, filters.isActive));
  }

  const results = await db
    .select()
    .from(taskTemplates)
    .where(and(...conditions))
    .orderBy(desc(taskTemplates.createdAt));

  return { success: true, data: results };
}

export async function getTaskTemplateById(
  organisationId: string,
  templateId: string,
): Promise<ActionResult<typeof taskTemplates.$inferSelect>> {
  const [template] = await db
    .select()
    .from(taskTemplates)
    .where(
      and(
        eq(taskTemplates.id, templateId),
        eq(taskTemplates.organisationId, organisationId),
      ),
    );

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  return { success: true, data: template };
}

// ---------------------------------------------------------------------------
// Template Task CRUD
// ---------------------------------------------------------------------------

export async function createTemplateTask(
  input: CreateTemplateTaskInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTemplateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [task] = await db
    .insert(templateTasks)
    .values(parsed.data)
    .returning({ id: templateTasks.id });

  return { success: true, data: { id: task.id } };
}

export async function updateTemplateTask(
  input: UpdateTemplateTaskInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateTemplateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, ...updates } = parsed.data;

  const [task] = await db
    .update(templateTasks)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(templateTasks.id, id),
        eq(templateTasks.organisationId, organisationId),
      ),
    )
    .returning({ id: templateTasks.id });

  if (!task) {
    return { success: false, error: 'Template task not found' };
  }

  return { success: true, data: { id: task.id } };
}

export async function getTemplateTasks(
  organisationId: string,
  templateId: string,
): Promise<ActionResult<(typeof templateTasks.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(templateTasks)
    .where(
      and(
        eq(templateTasks.organisationId, organisationId),
        eq(templateTasks.templateId, templateId),
      ),
    )
    .orderBy(asc(templateTasks.sortOrder));

  return { success: true, data: results };
}

export async function deleteTemplateTask(
  organisationId: string,
  taskId: string,
): Promise<ActionResult> {
  const [deleted] = await db
    .delete(templateTasks)
    .where(
      and(
        eq(templateTasks.id, taskId),
        eq(templateTasks.organisationId, organisationId),
      ),
    )
    .returning({ id: templateTasks.id });

  if (!deleted) {
    return { success: false, error: 'Template task not found' };
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Visit Task List — generate from template
// ---------------------------------------------------------------------------

export async function generateVisitTaskList(
  input: GenerateVisitTaskListInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = generateVisitTaskListSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { organisationId, visitId, templateId } = parsed.data;

  // Fetch template tasks
  const tasks = await db
    .select()
    .from(templateTasks)
    .where(
      and(
        eq(templateTasks.organisationId, organisationId),
        eq(templateTasks.templateId, templateId),
      ),
    )
    .orderBy(asc(templateTasks.sortOrder));

  if (tasks.length === 0) {
    return { success: false, error: 'Template has no tasks' };
  }

  // Create the task list
  const [taskList] = await db
    .insert(visitTaskLists)
    .values({
      organisationId,
      visitId,
      templateId,
      totalTasks: tasks.length,
      completedTasks: 0,
      skippedTasks: 0,
      completionPercentage: 0,
    })
    .returning({ id: visitTaskLists.id });

  // Create individual visit tasks from the template
  await db.insert(visitTasks).values(
    tasks.map((t) => ({
      organisationId,
      taskListId: taskList.id,
      templateTaskId: t.id,
      title: t.title,
      instructions: t.instructions,
      isMandatory: t.isMandatory,
      sortOrder: t.sortOrder,
      category: t.category,
      status: 'pending' as const,
    })),
  );

  return { success: true, data: { id: taskList.id } };
}

// ---------------------------------------------------------------------------
// Task completion / skip
// ---------------------------------------------------------------------------

export async function completeTask(
  input: CompleteTaskInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = completeTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { taskId, organisationId, completedBy, timeSpentMinutes, notes } =
    parsed.data;

  const [task] = await db
    .update(visitTasks)
    .set({
      status: 'completed',
      completedBy,
      completedAt: new Date(),
      timeSpentMinutes: timeSpentMinutes ?? null,
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(visitTasks.id, taskId),
        eq(visitTasks.organisationId, organisationId),
      ),
    )
    .returning({ id: visitTasks.id, taskListId: visitTasks.taskListId });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  // Update the task list completion stats
  await updateTaskListStats(organisationId, task.taskListId);

  return { success: true, data: { id: task.id } };
}

export async function skipTask(
  input: SkipTaskInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = skipTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { taskId, organisationId, completedBy, skipReason, notes } =
    parsed.data;

  // Check if task is mandatory
  const [existing] = await db
    .select({ isMandatory: visitTasks.isMandatory })
    .from(visitTasks)
    .where(
      and(
        eq(visitTasks.id, taskId),
        eq(visitTasks.organisationId, organisationId),
      ),
    );

  if (!existing) {
    return { success: false, error: 'Task not found' };
  }

  const [task] = await db
    .update(visitTasks)
    .set({
      status: 'skipped',
      skipReason,
      completedBy,
      completedAt: new Date(),
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(visitTasks.id, taskId),
        eq(visitTasks.organisationId, organisationId),
      ),
    )
    .returning({ id: visitTasks.id, taskListId: visitTasks.taskListId });

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  await updateTaskListStats(organisationId, task.taskListId);

  return { success: true, data: { id: task.id } };
}

// ---------------------------------------------------------------------------
// Query visit task lists & tasks
// ---------------------------------------------------------------------------

export async function getVisitTaskList(
  organisationId: string,
  visitId: string,
): Promise<ActionResult<typeof visitTaskLists.$inferSelect | null>> {
  const [taskList] = await db
    .select()
    .from(visitTaskLists)
    .where(
      and(
        eq(visitTaskLists.organisationId, organisationId),
        eq(visitTaskLists.visitId, visitId),
      ),
    );

  return { success: true, data: taskList ?? null };
}

export async function getVisitTasks(
  organisationId: string,
  taskListId: string,
): Promise<ActionResult<(typeof visitTasks.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(visitTasks)
    .where(
      and(
        eq(visitTasks.organisationId, organisationId),
        eq(visitTasks.taskListId, taskListId),
      ),
    )
    .orderBy(asc(visitTasks.sortOrder));

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function updateTaskListStats(
  organisationId: string,
  taskListId: string,
): Promise<void> {
  const tasks = await db
    .select({
      status: visitTasks.status,
    })
    .from(visitTasks)
    .where(
      and(
        eq(visitTasks.organisationId, organisationId),
        eq(visitTasks.taskListId, taskListId),
      ),
    );

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const skipped = tasks.filter((t) => t.status === 'skipped').length;
  const percentage = total > 0 ? Math.round(((completed + skipped) / total) * 100) : 0;

  await db
    .update(visitTaskLists)
    .set({
      totalTasks: total,
      completedTasks: completed,
      skippedTasks: skipped,
      completionPercentage: percentage,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(visitTaskLists.id, taskListId),
        eq(visitTaskLists.organisationId, organisationId),
      ),
    );
}
