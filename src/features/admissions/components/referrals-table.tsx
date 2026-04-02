'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReferralStatusBadge } from './referral-status-badge';
import type { Referral } from '@/lib/db/schema/admissions';

interface ReferralsTableProps {
  referrals: Referral[];
  orgSlug: string;
}

export function ReferralsTable({ referrals, orgSlug }: ReferralsTableProps) {
  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No referrals yet. Create your first referral to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Child name</TableHead>
            <TableHead>Placing authority</TableHead>
            <TableHead>Social worker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/${orgSlug}/admissions/${r.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {r.childFirstName} {r.childLastName}
                </Link>
              </TableCell>
              <TableCell>{r.placingAuthorityName}</TableCell>
              <TableCell>{r.socialWorkerName}</TableCell>
              <TableCell>
                <ReferralStatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString('en-GB')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
