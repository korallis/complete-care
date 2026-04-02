import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  DomainView,
  PortalContextBar,
  PortalHeader,
} from '@/features/family-portal';
import {
  getFamilyDomainView,
  getFamilyPortalContext,
} from '@/features/family-portal/server';

export const metadata: Metadata = {
  title: 'Portal Home',
};

interface FamilyPortalPageProps {
  searchParams: Promise<{ personId?: string }>;
}

export default async function FamilyPortalPage({
  searchParams,
}: FamilyPortalPageProps) {
  const { personId } = await searchParams;
  const context = await getFamilyPortalContext(personId);

  if (!context) {
    redirect('/login');
  }

  if (!context.currentPerson) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Portal</h1>
          <p className="text-sm text-muted-foreground">
            No approved family links are available on this account yet.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Your linked family members will appear here once the care team approves
          your access request.
        </div>
      </div>
    );
  }

  const view = await getFamilyDomainView(context);

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
        currentPath="/portal"
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Messages</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Securely message the care team about {context.currentPerson.personName}.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Updates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            See approved updates and photo-sharing decisions in one place.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Care Information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only care plans, notes, and medication summaries.
          </p>
        </div>
      </section>

      {view && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Current overview</h2>
            <p className="text-sm text-muted-foreground">
              Domain-specific highlights available to approved family members.
            </p>
          </div>

          <DomainView view={view} />
        </section>
      )}
    </div>
  );
}
