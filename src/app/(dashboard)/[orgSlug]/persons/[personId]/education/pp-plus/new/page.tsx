import type { Metadata } from 'next';
import { PpPlusFormWrapper } from './pp-plus-form-wrapper';

export const metadata: Metadata = {
  title: 'New PP+ Record',
};

/**
 * Record Pupil Premium Plus allocation and spend.
 * VAL-EDU-006: Allocation amount, planned use, actual spend
 */
export default async function NewPpPlusPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

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
          New Pupil Premium Plus Record
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track PP+ allocation, planned use, and actual spend.
        </p>
      </div>

      <PpPlusFormWrapper orgSlug={orgSlug} personId={personId} />
    </div>
  );
}
