import type { Metadata } from 'next';
import { CdRegisterPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Controlled Drugs Register | EMAR',
  description:
    'Controlled drugs register with dual-witness recording, running balance, and transdermal patch tracking.',
};

/**
 * Controlled Drugs Register page.
 * VAL-EMAR-008 / VAL-EMAR-020
 *
 * In production, this server component would:
 * 1. Check auth + RBAC
 * 2. Fetch CD registers for the tenant
 * 3. Pass data to the client component
 */
export default function ControlledDrugsPage() {
  // Placeholder data — in production, fetched from DB with tenant isolation
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
          Controlled Drugs Register
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Per-person per-drug per-strength register with dual-witness recording
          and running balance. All CD operations require two staff members.
        </p>
      </div>
      <CdRegisterPageClient
        currentUserId="user-1"
        staffMembers={mockStaff}
      />
    </div>
  );
}
