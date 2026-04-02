import type { Metadata } from 'next';
import { ContactsPageClient } from './contacts-page-client';

export const metadata: Metadata = {
  title: 'Contact Management',
  description: 'Manage approved contacts, schedule visits, and record contact events',
};

/**
 * Contact Management page — Server Component entry point.
 *
 * Data fetching will be done here once the auth module provides session context.
 * For now this renders the client shell with placeholder data hooks.
 *
 * Route: /[orgSlug]/persons/[personId]/contacts
 */
export default async function ContactsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Contact Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved contacts register, scheduling, recording, and compliance
          tracking for this child.
        </p>
      </div>

      <ContactsPageClient orgSlug={orgSlug} personId={personId} />
    </div>
  );
}
