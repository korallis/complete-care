'use server';

import type { NewCustomReport } from '@/lib/db/schema';
import type { DataSourceSchema } from '../types';

export async function createReport(_data: NewCustomReport) {
  return { success: true, id: crypto.randomUUID() };
}

export async function updateReport(id: string, _data: Partial<NewCustomReport>) {
  return { success: true, id };
}

export async function deleteReport(_id: string) {
  return { success: true };
}

export async function executeReport(_reportId: string) {
  // TODO: Build query from report definition, execute, return results
  return { success: true, rows: [], columns: [] };
}

export async function exportReport(_reportId: string, _format: 'csv' | 'pdf') {
  // TODO: Generate CSV or PDF export
  return { success: true, downloadUrl: '' };
}

export async function getDataSources(): Promise<DataSourceSchema[]> {
  return [
    {
      name: 'persons',
      label: 'Service Users',
      availableColumns: [
        { field: 'name', label: 'Name', visible: true },
        { field: 'status', label: 'Status', visible: true },
        { field: 'keyWorker', label: 'Key Worker', visible: true },
        { field: 'admissionDate', label: 'Admission Date', visible: true },
        { field: 'lastReviewDate', label: 'Last Review', visible: true },
      ],
    },
    {
      name: 'visits',
      label: 'Care Visits',
      availableColumns: [
        { field: 'personName', label: 'Person', visible: true },
        { field: 'carerName', label: 'Carer', visible: true },
        { field: 'visitDate', label: 'Date', visible: true },
        { field: 'startTime', label: 'Start', visible: true },
        { field: 'endTime', label: 'End', visible: true },
        { field: 'status', label: 'Status', visible: true },
      ],
    },
    {
      name: 'budgets',
      label: 'Personal Budgets',
      availableColumns: [
        { field: 'personName', label: 'Person', visible: true },
        { field: 'budgetName', label: 'Budget', visible: true },
        { field: 'allocated', label: 'Allocated', visible: true },
        { field: 'spent', label: 'Spent', visible: true },
        { field: 'remaining', label: 'Remaining', visible: true },
      ],
    },
    {
      name: 'incidents',
      label: 'Incidents',
      availableColumns: [
        { field: 'title', label: 'Title', visible: true },
        { field: 'severity', label: 'Severity', visible: true },
        { field: 'date', label: 'Date', visible: true },
        { field: 'status', label: 'Status', visible: true },
        { field: 'personName', label: 'Person', visible: true },
      ],
    },
    {
      name: 'staff',
      label: 'Staff',
      availableColumns: [
        { field: 'name', label: 'Name', visible: true },
        { field: 'role', label: 'Role', visible: true },
        { field: 'email', label: 'Email', visible: true },
        { field: 'status', label: 'Status', visible: true },
      ],
    },
  ];
}
