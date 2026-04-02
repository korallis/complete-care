import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GdprDashboard } from '@/features/gdpr/components/gdpr-dashboard';
import { SarRequestTable } from '@/features/gdpr/components/sar-request-table';
import { ErasureRequestTable } from '@/features/gdpr/components/erasure-request-table';
import { RetentionPolicyPanel } from '@/features/gdpr/components/retention-policy-panel';
import { ExportJobsTable } from '@/features/gdpr/components/export-jobs-table';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('GDPR dashboard components', () => {
  it('renders dashboard links and children retention evidence reminders', () => {
    render(
      <GdprDashboard
        orgSlug="acme-care"
        stats={{
          totalSars: 3,
          overdueSars: 1,
          erasureRequests: 2,
          retentionFlags: 4,
          expiringFlags: 2,
          exportJobs: 5,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: /privacy operations and data portability/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /subject access requests/i })).toHaveAttribute('href', '/acme-care/settings/gdpr/sars');
    expect(screen.getByText(/75-year rule/i)).toBeInTheDocument();
  });

  it('renders SAR and erasure workflow rows with status labels', () => {
    render(
      <>
        <SarRequestTable
          requests={[
            {
              id: 'sar-1',
              organisationId: 'org-1',
              subjectName: 'Jane Doe',
              subjectEmail: 'jane@example.com',
              personId: null,
              receivedAt: new Date('2026-04-01'),
              deadlineAt: new Date('2026-05-01'),
              status: 'in_progress',
              rejectionReason: null,
              exportFormat: 'json',
              exportPath: null,
              processedByUserId: null,
              notes: 'Verify identity before release',
              fulfilledAt: null,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
            },
          ]}
          canManage={true}
          createAction={async () => {}}
          statusAction={async () => {}}
        />
        <ErasureRequestTable
          requests={[
            {
              id: 'er-1',
              organisationId: 'org-1',
              subjectName: 'John Doe',
              subjectEmail: 'john@example.com',
              personId: null,
              receivedAt: new Date('2026-04-01'),
              deadlineAt: new Date('2026-05-01'),
              status: 'approved',
              rejectionReason: null,
              anonymisedFields: null,
              processedByUserId: null,
              notes: 'Children record statutory carve-out review',
              completedAt: null,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
            },
          ]}
          canManage={true}
          createAction={async () => {}}
          statusAction={async () => {}}
        />
      </>,
    );

    expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getAllByText(/in progress/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/children record statutory carve-out review/i)).toBeInTheDocument();
  });

  it('renders retention flags and export ledger evidence panels', () => {
    render(
      <>
        <RetentionPolicyPanel
          policies={[
            {
              id: 'policy-1',
              organisationId: 'org-1',
              dataType: 'children_case_record',
              retentionDays: 27375,
              isStatutory: true,
              legalBasis: 'legal_obligation',
              description: 'Children records stay for 75 years.',
              autoDeleteEnabled: false,
              warningDays: 365,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
            },
          ]}
          flags={[
            {
              id: 'flag-1',
              organisationId: 'org-1',
              policyId: 'policy-1',
              entityType: 'person',
              entityId: 'person-1',
              retentionExpiresAt: new Date('2026-06-01'),
              status: 'warning',
              reviewedByUserId: null,
              reviewedAt: null,
              retentionReason: null,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
            },
          ]}
          canManage={true}
          createPolicyAction={async () => {}}
          updatePolicyAction={async () => {}}
          reviewFlagAction={async () => {}}
        />
        <ExportJobsTable
          exports={[
            {
              id: 'exp-1',
              organisationId: 'org-1',
              exportType: 'sar',
              format: 'json',
              status: 'pending',
              personId: 'person-1',
              sarId: 'sar-1',
              filePath: null,
              fileSizeBytes: null,
              initiatedByUserId: 'user-1',
              errorMessage: null,
              completedAt: null,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
            },
          ]}
          canManage={true}
          createAction={async () => {}}
        />
      </>,
    );

    expect(screen.getAllByText(/children's case records/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/approve for deletion/i)).toBeInTheDocument();
    expect(screen.getAllByText(/export ledger/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/initiated export evidence/i)).toBeInTheDocument();
  });
});
