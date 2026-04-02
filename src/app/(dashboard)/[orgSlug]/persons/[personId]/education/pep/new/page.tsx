import type { Metadata } from 'next';
import { PepFormWrapper } from './pep-form-wrapper';

export const metadata: Metadata = {
  title: 'New PEP',
};

/**
 * Create a new Personal Education Plan.
 * VAL-EDU-002: PEP creation & versioning
 */
export default async function NewPepPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

  // TODO: Fetch schools for this person from DB
  const schools: { id: string; schoolName: string }[] = [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <a
          href={`/${orgSlug}/persons/${personId}/education`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to Education
        </a>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          New Personal Education Plan
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a termly PEP with targets, attainment, and meeting details.
        </p>
      </div>

      <PepFormWrapper
        orgSlug={orgSlug}
        personId={personId}
        schools={schools}
      />
    </div>
  );
}
