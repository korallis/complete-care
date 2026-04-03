import type { Metadata } from 'next';
import { AttendanceFormWrapper } from './attendance-form-wrapper';

export const metadata: Metadata = {
  title: 'Education Attendance',
};

/**
 * Daily education attendance page.
 * VAL-EDU-004: On-time/late/absent/excluded tracking per day
 */
export default async function AttendancePage({
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
          Record Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track daily AM/PM session attendance marks.
        </p>
      </div>

      <AttendanceFormWrapper
        personId={personId}
        schoolRecordId={currentSchoolRecordId}
      />
    </div>
  );
}
