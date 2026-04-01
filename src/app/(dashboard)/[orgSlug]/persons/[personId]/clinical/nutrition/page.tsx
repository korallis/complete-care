import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listMealEntries,
  getMustHistory,
  recordMealEntry,
  createMustAssessment,
} from '@/features/clinical-monitoring/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { FoodChart } from '@/components/clinical/food-chart';
import { MealEntryForm } from '@/components/clinical/meal-entry-form';
import { MustAssessmentForm } from '@/components/clinical/must-assessment-form';
import { MustScoreBadge } from '@/components/clinical/must-score-badge';
import {
  MUST_CARE_PATHWAY_LABELS,
  type MustCarePathway,
} from '@/features/clinical-monitoring/constants';

interface NutritionPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({
  params,
}: NutritionPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Nutrition -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Nutrition -- ${person.fullName} -- Complete Care`
      : 'Nutrition -- Complete Care',
  };
}

export default async function NutritionPage({
  params,
  searchParams,
}: NutritionPageProps) {
  const { orgSlug, personId } = await params;
  const { date: dateParam } = await searchParams;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/nutrition`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRecord = hasPermission(role, 'create', 'clinical');

  const person = await getPerson(personId);
  if (!person) notFound();

  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const [meals, mustHistory] = await Promise.all([
    listMealEntries({ personId, date }),
    getMustHistory({ personId, page: 1, pageSize: 5 }),
  ]);

  // Date navigation
  const prevDate = new Date(date + 'T12:00:00Z');
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(date + 'T12:00:00Z');
  nextDate.setDate(nextDate.getDate() + 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  const nextDateStr = nextDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  const latestMust =
    mustHistory.assessments.length > 0 ? mustHistory.assessments[0] : null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Nutrition
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Food chart and MUST screening for {person.fullName}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/fluids`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          Fluid Chart
        </Link>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/nutrition?date=${prevDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Previous day"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            aria-label="Select date"
          />
          <button
            type="submit"
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Go
          </button>
        </form>

        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/nutrition?date=${nextDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Next day"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>

        {!isToday && (
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/nutrition`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Today
          </Link>
        )}
      </div>

      {/* Latest MUST status */}
      {latestMust && (
        <div className="mb-6 rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[oklch(0.55_0_0)] mb-1">
                Latest MUST Assessment
              </p>
              <MustScoreBadge
                riskCategory={latestMust.riskCategory}
                totalScore={latestMust.totalScore}
                carePathway={latestMust.carePathway}
                showPathway
              />
            </div>
            <div className="text-right text-xs text-[oklch(0.55_0_0)]">
              <p>
                Assessed by: {latestMust.assessedByName ?? 'Unknown'}
              </p>
              <p>
                {latestMust.createdAt.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Food chart + form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <FoodChart entries={meals} />
        </div>
        {canRecord && (
          <div>
            <MealEntryForm personId={personId} onSubmit={recordMealEntry} />
          </div>
        )}
      </div>

      {/* MUST screening section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MUST history */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
            <div className="bg-[oklch(0.97_0.003_160)] px-4 py-2 border-b border-[oklch(0.91_0.005_160)]">
              <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                MUST Assessment History
              </h4>
            </div>
            {mustHistory.assessments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-[oklch(0.55_0_0)]">
                No MUST assessments recorded
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[oklch(0.91_0.005_160)]">
                      <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                        Date
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[oklch(0.55_0_0)]">
                        BMI
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[oklch(0.55_0_0)]">
                        Weight Loss
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[oklch(0.55_0_0)]">
                        Acute
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[oklch(0.55_0_0)]">
                        Total
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                        Risk
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                        Pathway
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                        Assessed By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mustHistory.assessments.map((assessment) => (
                      <tr
                        key={assessment.id}
                        className="border-b border-[oklch(0.95_0.003_160)] last:border-0"
                      >
                        <td className="px-4 py-2 text-[oklch(0.35_0.04_160)]">
                          {assessment.createdAt.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {assessment.bmiScore}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {assessment.weightLossScore}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {assessment.acuteDiseaseScore}
                        </td>
                        <td className="px-4 py-2 text-center font-bold">
                          {assessment.totalScore}
                        </td>
                        <td className="px-4 py-2">
                          <MustScoreBadge
                            riskCategory={assessment.riskCategory}
                            totalScore={assessment.totalScore}
                          />
                        </td>
                        <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                          {MUST_CARE_PATHWAY_LABELS[
                            assessment.carePathway as MustCarePathway
                          ] ?? assessment.carePathway}
                        </td>
                        <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                          {assessment.assessedByName ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MUST form */}
        {canRecord && (
          <div>
            <MustAssessmentForm
              personId={personId}
              onSubmit={createMustAssessment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
