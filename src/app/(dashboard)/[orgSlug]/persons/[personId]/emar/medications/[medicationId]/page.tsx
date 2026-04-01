import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getMedication, discontinueMedication } from '@/features/emar/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { MedicationStatusBadge } from '@/components/emar/medication-status-badge';
import {
  MEDICATION_ROUTE_LABELS,
  MEDICATION_FREQUENCY_LABELS,
} from '@/features/emar/constants';
import { formatDate } from '@/features/emar/utils';
import type { FrequencyDetail } from '@/lib/db/schema/medications';
import { MedicationDetailActions } from '@/components/emar/medication-detail-actions';

interface MedicationDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string; medicationId: string }>;
}

export async function generateMetadata({
  params,
}: MedicationDetailPageProps): Promise<Metadata> {
  const { medicationId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Medication -- Complete Care' };
  }
  const medication = await getMedication(medicationId).catch(() => null);
  return {
    title: medication
      ? `${medication.drugName} -- Complete Care`
      : 'Medication -- Complete Care',
  };
}

export default async function MedicationDetailPage({
  params,
}: MedicationDetailPageProps) {
  const { orgSlug, personId, medicationId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/medications/${medicationId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canUpdate = hasPermission(role, 'update', 'medications');

  const person = await getPerson(personId);
  if (!person) notFound();

  const medication = await getMedication(medicationId);
  if (!medication) notFound();

  const routeLabel = MEDICATION_ROUTE_LABELS[medication.route as keyof typeof MEDICATION_ROUTE_LABELS] ?? medication.route;
  const frequencyLabel = MEDICATION_FREQUENCY_LABELS[medication.frequency as keyof typeof MEDICATION_FREQUENCY_LABELS] ?? medication.frequency;
  const detail = medication.frequencyDetail as FrequencyDetail | null;

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/${orgSlug}/persons/${personId}/emar/medications`}
          className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.06_160)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Medications
        </Link>
      </div>

      {/* Medication detail card */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-[oklch(0.95_0.003_160)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-[oklch(0.18_0.02_160)]">
                  {medication.drugName}
                </h2>
                <MedicationStatusBadge status={medication.status} />
              </div>
              <p className="text-sm text-[oklch(0.45_0.03_160)]">
                {medication.dose} {medication.doseUnit} &mdash; {routeLabel} &mdash; {frequencyLabel}
              </p>
            </div>

            {canUpdate && medication.status === 'active' && (
              <MedicationDetailActions
                medicationId={medicationId}
                onDiscontinue={discontinueMedication}
                orgSlug={orgSlug}
                personId={personId}
              />
            )}
          </div>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
              Prescription Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[oklch(0.55_0_0)]">Prescribed Date</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                  {formatDate(medication.prescribedDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[oklch(0.55_0_0)]">Prescriber</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                  {medication.prescriberName}
                </dd>
              </div>
              {medication.pharmacy && (
                <div className="flex justify-between">
                  <dt className="text-[oklch(0.55_0_0)]">Pharmacy</dt>
                  <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                    {medication.pharmacy}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
              Schedule
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[oklch(0.55_0_0)]">Route</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">{routeLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[oklch(0.55_0_0)]">Frequency</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">{frequencyLabel}</dd>
              </div>
              {detail?.timesOfDay && detail.timesOfDay.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[oklch(0.55_0_0)]">Times</dt>
                  <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                    {detail.timesOfDay.join(', ')}
                  </dd>
                </div>
              )}
              {detail?.daysOfWeek && detail.daysOfWeek.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[oklch(0.55_0_0)]">Days</dt>
                  <dd className="font-medium text-[oklch(0.22_0.04_160)] capitalize">
                    {detail.daysOfWeek.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {medication.specialInstructions && (
            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
                Special Instructions
              </h3>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                {medication.specialInstructions}
              </p>
            </div>
          )}

          {medication.status !== 'active' && (
            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
                Discontinuation
              </h3>
              <dl className="space-y-2 text-sm">
                {medication.discontinuedDate && (
                  <div className="flex justify-between">
                    <dt className="text-[oklch(0.55_0_0)]">Date</dt>
                    <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                      {formatDate(medication.discontinuedDate)}
                    </dd>
                  </div>
                )}
                {medication.discontinuedReason && (
                  <div className="flex justify-between">
                    <dt className="text-[oklch(0.55_0_0)]">Reason</dt>
                    <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                      {medication.discontinuedReason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Link to MAR chart */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/persons/${personId}/emar`}
          className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          View MAR Chart
        </Link>
      </div>
    </div>
  );
}
