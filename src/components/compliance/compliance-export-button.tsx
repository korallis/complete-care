'use client';

/**
 * ComplianceExportButton -- Exports compliance report as CSV.
 */

import { useState, useTransition } from 'react';
import { exportComplianceReport } from '@/features/compliance/actions';

export function ComplianceExportButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const rows = await exportComplianceReport();

        if (rows.length === 0) {
          setError('No data to export.');
          return;
        }

        // Build CSV content
        const headers = [
          'Staff Name',
          'Job Title',
          'Overall Status',
          'DBS Status',
          'DBS Detail',
          'Training Status',
          'Training Detail',
          'Supervision Status',
          'Supervision Detail',
          'Qualifications Status',
          'Qualifications Detail',
        ];

        const csvRows = [
          headers.join(','),
          ...rows.map((row) =>
            [
              `"${row.staffName}"`,
              `"${row.jobTitle}"`,
              row.overallStatus,
              row.dbsStatus,
              `"${row.dbsDetail}"`,
              row.trainingStatus,
              `"${row.trainingDetail}"`,
              row.supervisionStatus,
              `"${row.supervisionDetail}"`,
              row.qualificationsStatus,
              `"${row.qualificationsDetail}"`,
            ].join(','),
          ),
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `compliance-report-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        setError('Failed to export report. Please try again.');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {isPending ? 'Exporting...' : 'Export CSV'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
