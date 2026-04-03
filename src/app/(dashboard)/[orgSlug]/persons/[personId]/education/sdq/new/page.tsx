import type { Metadata } from 'next';
import { SdqFormWrapper } from './sdq-form-wrapper';

export const metadata: Metadata = {
  title: 'New SDQ Assessment',
};

/**
 * Create a new SDQ (Strengths & Difficulties Questionnaire) assessment.
 * VAL-EDU-007: SDQ scoring with 5 subscales and total difficulties
 */
export default async function NewSdqPage({
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
          New SDQ Assessment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record Strengths & Difficulties Questionnaire scores across 5 subscales.
        </p>
      </div>

      <SdqFormWrapper personId={personId} />
    </div>
  );
}
