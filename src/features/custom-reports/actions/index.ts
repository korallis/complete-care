'use server';

import { db } from '@/lib/db';
import { customReports, persons, incidents, staffProfiles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { DataSourceSchema } from '../types';

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createReport(data: {
  name: string;
  description?: string;
  dataSource: string;
  columns: { field: string; label: string; visible: boolean }[];
  filters?: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  exportFormat?: string;
}) {
  const { orgId, userId } = await requirePermission('create', 'reports');

  const [report] = await db
    .insert(customReports)
    .values({
      organisationId: orgId,
      name: data.name,
      description: data.description ?? null,
      dataSource: data.dataSource,
      columns: data.columns,
      filters: [],
      groupBy: [],
      sortBy: [],
      exportFormat: data.exportFormat ?? 'csv',
      createdBy: userId,
    })
    .returning();

  await auditLog('create', 'custom_report', report.id, { after: { name: data.name } });
  revalidatePath('/custom-reports');
  return { success: true, id: report.id };
}

export async function listReports() {
  const { orgId } = await requirePermission('read', 'reports');

  return db
    .select()
    .from(customReports)
    .where(eq(customReports.organisationId, orgId))
    .orderBy(desc(customReports.createdAt));
}

export async function getReport(id: string) {
  const { orgId } = await requirePermission('read', 'reports');

  const [report] = await db
    .select()
    .from(customReports)
    .where(and(eq(customReports.id, id), eq(customReports.organisationId, orgId)))
    .limit(1);

  return report ?? null;
}

export async function updateReport(id: string, data: {
  name?: string;
  description?: string;
  columns?: { field: string; label: string; visible: boolean }[];
  exportFormat?: string;
}) {
  const { orgId } = await requirePermission('update', 'reports');

  const [updated] = await db
    .update(customReports)
    .set({ ...data })
    .where(and(eq(customReports.id, id), eq(customReports.organisationId, orgId)))
    .returning();

  if (updated) {
    await auditLog('update', 'custom_report', id, { after: data });
    revalidatePath('/custom-reports');
  }
  return { success: true, id };
}

export async function deleteReport(id: string) {
  const { orgId } = await requirePermission('delete', 'reports');

  await db
    .delete(customReports)
    .where(and(eq(customReports.id, id), eq(customReports.organisationId, orgId)));

  await auditLog('delete', 'custom_report', id, {});
  revalidatePath('/custom-reports');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Execute report — runs a real query against the specified data source
// ---------------------------------------------------------------------------

export async function executeReport(reportId: string) {
  const { orgId } = await requirePermission('read', 'reports');

  const [report] = await db
    .select()
    .from(customReports)
    .where(and(eq(customReports.id, reportId), eq(customReports.organisationId, orgId)))
    .limit(1);

  if (!report) return { success: false, error: 'Report not found', rows: [], columns: [] };

  const visibleCols = (report.columns as { field: string; label: string; visible: boolean }[])
    .filter((c) => c.visible)
    .map((c) => c.field);

  // Execute query against the specified data source
  let rows: Record<string, unknown>[] = [];

  switch (report.dataSource) {
    case 'persons': {
      const data = await db
        .select()
        .from(persons)
        .where(eq(persons.organisationId, orgId))
        .limit(500);
      rows = data.map((r) => ({ ...r }));
      break;
    }
    case 'incidents': {
      const data = await db
        .select()
        .from(incidents)
        .where(eq(incidents.organisationId, orgId))
        .orderBy(desc(incidents.createdAt))
        .limit(500);
      rows = data.map((r) => ({ ...r }));
      break;
    }
    case 'staff': {
      const data = await db
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.organisationId, orgId))
        .limit(500);
      rows = data.map((r) => ({ ...r }));
      break;
    }
    default:
      return { success: false, error: `Unknown data source: ${report.dataSource}`, rows: [], columns: visibleCols };
  }

  return { success: true, rows, columns: visibleCols };
}

// ---------------------------------------------------------------------------
// Export — generate CSV from report results
// ---------------------------------------------------------------------------

export async function exportReport(reportId: string, format: 'csv' | 'pdf') {
  void format;
  const result = await executeReport(reportId);
  if (!result.success) return { success: false, error: result.error, data: '' };

  // CSV generation
  const header = result.columns.join(',');
  const csvRows = result.rows.map((row) =>
    result.columns.map((col) => {
      const val = row[col];
      const str = val == null ? '' : String(val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [header, ...csvRows].join('\n');

  return { success: true, data: csv };
}

// ---------------------------------------------------------------------------
// Data sources metadata
// ---------------------------------------------------------------------------

export async function getDataSources(): Promise<DataSourceSchema[]> {
  return [
    {
      name: 'persons',
      label: 'Service Users',
      availableColumns: [
        { field: 'name', label: 'Name', visible: true },
        { field: 'status', label: 'Status', visible: true },
        { field: 'type', label: 'Type', visible: true },
        { field: 'createdAt', label: 'Admission Date', visible: true },
      ],
    },
    {
      name: 'incidents',
      label: 'Incidents',
      availableColumns: [
        { field: 'title', label: 'Title', visible: true },
        { field: 'severity', label: 'Severity', visible: true },
        { field: 'createdAt', label: 'Date', visible: true },
        { field: 'status', label: 'Status', visible: true },
      ],
    },
    {
      name: 'staff',
      label: 'Staff',
      availableColumns: [
        { field: 'firstName', label: 'First Name', visible: true },
        { field: 'lastName', label: 'Last Name', visible: true },
        { field: 'role', label: 'Role', visible: true },
        { field: 'status', label: 'Status', visible: true },
      ],
    },
  ];
}
