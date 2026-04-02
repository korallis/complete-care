import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  PortalContextBar,
  PortalHeader,
  UpdateCard,
} from '@/features/family-portal';
import { getPublishedUpdates } from '@/features/family-portal/actions/updates';
import {
  getFamilyPortalContext,
  getPhotographyConsentStatus,
} from '@/features/family-portal/server';

export const metadata: Metadata = {
  title: 'Updates',
};

interface FamilyUpdatesPageProps {
  searchParams: Promise<{ personId?: string }>;
}

export default async function FamilyUpdatesPage({
  searchParams,
}: FamilyUpdatesPageProps) {
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

  const [updatesResult, photoConsent] = await Promise.all([
    getPublishedUpdates(
      context.currentPerson.organisationId,
      context.currentPerson.personId,
    ),
    getPhotographyConsentStatus(
      context.currentPerson.organisationId,
      context.currentPerson.personId,
    ),
  ]);

  const updates = updatesResult.success ? updatesResult.data : [];

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
        currentPath="/portal/updates"
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
        <p className="text-sm text-muted-foreground">
          Photos and updates shared by the care team.
        </p>
      </div>

      {!photoConsent.allowed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {photoConsent.reason} Photo-based updates stay hidden until active
          photography consent is restored.
        </div>
      )}

      {updates.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          <p>No updates shared yet. Check back soon for photos and news.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {updates.map((update) => (
            <UpdateCard
              key={update.id}
              title={update.title}
              content={update.content}
              updateType={update.updateType}
              createdByName={update.createdByName ?? 'Care team'}
              publishedAt={update.publishedAt}
              mediaUrls={update.mediaUrls ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
