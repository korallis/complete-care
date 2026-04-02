import type { Metadata } from 'next';
import { EducationOverview } from '@/features/education/components/education-overview';

export const metadata: Metadata = {
  title: 'Education',
};

/**
 * Education tracking landing page for a child.
 * Displays overview with current school, latest PEP, attendance,
 * exclusions, PP+ summary, and SDQ trend chart.
 *
 * Data fetching will be wired to Drizzle queries when the DB layer is connected.
 * For now, renders the overview component with empty/demo data.
 */
export default async function EducationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; personId: string }>;
}) {
  const { orgSlug, personId } = await params;

  // TODO: Replace with real DB queries scoped by organisationId
  // const org = await getOrgBySlug(orgSlug);
  // const schoolRecord = await getCurrentSchoolRecord(org.id, personId);
  // etc.

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Education</h1>
          <p className="mt-1 text-sm text-gray-500">
            PEP management, attendance, and education tracking
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/${orgSlug}/persons/${personId}/education/pep/new`}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            New PEP
          </a>
          <a
            href={`/${orgSlug}/persons/${personId}/education/sdq/new`}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            New SDQ
          </a>
        </div>
      </div>

      <EducationOverview
        currentSchool={null}
        latestPep={null}
        attendanceStats={[]}
        recentExclusions={[]}
        ppPlusSummary={null}
        sdqTrend={[]}
      />
    </div>
  );
}
