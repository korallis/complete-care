import type { Metadata } from 'next';
import { ReconciliationPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Stock Reconciliation | Controlled Drugs | EMAR',
  description:
    'Weekly CD stock reconciliation with discrepancy investigation and CDAO notification.',
};

/**
 * Stock Reconciliation page.
 * VAL-EMAR-008: CD stock reconciliation with dual-auth, discrepancy investigation, CDAO flag.
 */
export default function ReconciliationPage() {
  const mockStaff = [
    { id: 'user-1', name: 'Sarah Johnson (Senior Carer)' },
    { id: 'user-2', name: 'James Williams (Carer)' },
    { id: 'user-3', name: 'Emily Brown (Manager)' },
    { id: 'user-4', name: 'Michael Davis (CDAO)' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Stock Reconciliation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Weekly stock check: compare running balance to physical count.
          Discrepancies require investigation notes and CDAO notification.
        </p>
      </div>
      <ReconciliationPageClient
        currentUserId="user-1"
        staffMembers={mockStaff}
      />
    </div>
  );
}
