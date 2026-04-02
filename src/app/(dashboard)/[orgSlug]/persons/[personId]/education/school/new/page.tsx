import type { Metadata } from 'next';
import { SchoolRecordFormWrapper } from './school-record-form-wrapper';

export const metadata: Metadata = {
  title: 'New School Record',
};

/**
 * Add a new school record for a child.
 * VAL-EDU-001: School record per child
 */
export default async function NewSchoolRecordPage({
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
          New School Record
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a school placement including SEN status and designated teacher.
        </p>
      </div>

      <SchoolRecordFormWrapper orgSlug={orgSlug} personId={personId} />
    </div>
  );
}
