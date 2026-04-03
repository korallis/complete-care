import type { Metadata } from 'next';
import { ExclusionFormWrapper } from './exclusion-form-wrapper';

export const metadata: Metadata = {
  title: 'New Exclusion Record',
};

/**
 * Record a new exclusion.
 * VAL-EDU-005: Fixed-term/permanent with reasons, dates, duration
 */
export default async function NewExclusionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

  // TODO: Fetch current school record for this person
  const currentSchoolRecordId = '';

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
          Record Exclusion
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a fixed-term or permanent exclusion.
        </p>
      </div>

      <ExclusionFormWrapper
        personId={personId}
        schoolRecordId={currentSchoolRecordId}
      />
    </div>
  );
}
