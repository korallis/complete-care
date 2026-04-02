import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  CareInformation,
  PortalContextBar,
  PortalHeader,
} from '@/features/family-portal';
import {
  getFamilyCareInformation,
  getFamilyPortalContext,
} from '@/features/family-portal/server';

export const metadata: Metadata = {
  title: 'Care Information',
};

interface FamilyCareInfoPageProps {
  searchParams: Promise<{ personId?: string }>;
}

export default async function FamilyCareInfoPage({
  searchParams,
}: FamilyCareInfoPageProps) {
  const { personId } = await searchParams;
  const context = await getFamilyPortalContext(personId);

  if (!context) {
    redirect('/login');
  }

  if (!context.currentPerson) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No approved family links are available yet.
      </div>
    );
  }

  const careInformation = await getFamilyCareInformation(context);

  return (
    <div className="space-y-6">
      <PortalHeader
        personName={context.currentPerson.personName}
        relationship={context.currentPerson.relationship}
        domainLabel={context.currentPerson.domainLabel}
      />

      <PortalContextBar
        linkedPersons={context.linkedPersons}
        currentPersonId={context.currentPerson.personId}
        currentPath="/portal/care-info"
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Care Information</h1>
        <p className="text-sm text-muted-foreground">
          Read-only access to care plans, notes, medications, and appointments.
        </p>
      </div>

      <CareInformation
        data={careInformation}
        visibleSections={context.visibleSections}
      />
    </div>
  );
}
