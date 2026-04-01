import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getCarePlan } from '@/features/care-plans/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import type { CarePlanSection } from '@/lib/db/schema/care-plans';
import { APPROVAL_STATUS_LABELS, REVIEW_FREQUENCY_LABELS } from '@/features/care-plans/utils';
import { PrintCarePlanButton } from '@/components/care-plans/print-care-plan-button';

interface PrintCarePlanPageProps {
  params: Promise<{ orgSlug: string; personId: string; carePlanId: string }>;
}

/**
 * Printable care plan page — optimised for PDF export via browser print.
 * Users click "Export PDF" button, which triggers window.print().
 * Print CSS hides navigation and formats the page for PDF.
 */
export default async function PrintCarePlanPage({ params }: PrintCarePlanPageProps) {
  const { orgSlug, personId, carePlanId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/print`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  if (!hasPermission(role, 'read', 'care_plans')) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const [person, carePlan] = await Promise.all([
    getPerson(personId),
    getCarePlan(carePlanId),
  ]);

  if (!person || !carePlan) notFound();

  const sections = ((carePlan.sections ?? []) as CarePlanSection[])
    .sort((a, b) => a.order - b.order);

  const printDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* Print/export action bar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 border-b border-[oklch(0.91_0.005_160)] bg-white/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.45_0.05_160)] hover:text-[oklch(0.25_0.08_160)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to care plan
          </a>
        </div>
        <PrintCarePlanButton />
      </div>

      {/* Printable content */}
      <div
        className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0 print:max-w-none"
        id="printable-care-plan"
      >
        {/* Document header */}
        <div className="border-b-2 border-[oklch(0.3_0.08_160)] pb-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[oklch(0.3_0.08_160)] flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[oklch(0.3_0.08_160)] uppercase tracking-wide">
                Complete Care
              </span>
            </div>
            <span className="text-xs text-[oklch(0.6_0_0)]">Printed: {printDate}</span>
          </div>

          <h1 className="text-2xl font-bold text-[oklch(0.22_0.04_160)] mb-2">
            {carePlan.title}
          </h1>

          <div className="flex items-center gap-4 flex-wrap text-sm text-[oklch(0.45_0_0)]">
            <span className="font-mono font-medium">v{carePlan.version}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              carePlan.status === 'approved'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : carePlan.status === 'review'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {APPROVAL_STATUS_LABELS[carePlan.status] ?? carePlan.status}
            </span>
            {carePlan.nextReviewDate && (
              <span>
                Next review:{' '}
                <strong className="text-[oklch(0.22_0.04_160)]">
                  {new Date(carePlan.nextReviewDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </strong>
              </span>
            )}
            {carePlan.reviewFrequency && (
              <span>
                Frequency:{' '}
                <strong className="text-[oklch(0.22_0.04_160)]">
                  {REVIEW_FREQUENCY_LABELS[carePlan.reviewFrequency] ?? carePlan.reviewFrequency}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Person info */}
        <div className="rounded-xl border-l-4 border-[oklch(0.3_0.08_160)] bg-[oklch(0.97_0.005_160)] px-5 py-4 mb-6">
          <h2 className="text-sm font-bold text-[oklch(0.3_0.08_160)] uppercase tracking-wide mb-1">
            Care Recipient
          </h2>
          <p className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">{person.fullName}</p>
          <div className="mt-1 text-sm text-[oklch(0.5_0_0)]">
            {[
              person.dateOfBirth && `Date of Birth: ${person.dateOfBirth}`,
              person.nhsNumber && `NHS Number: ${person.nhsNumber}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>

        {/* Approval info */}
        {carePlan.approvedAt && carePlan.authorisedBy && (
          <div className="mb-6 text-sm text-[oklch(0.5_0_0)]">
            <span className="text-[oklch(0.35_0.06_160)] font-medium">✓ Approved</span>
            {' '}by{' '}
            <strong className="text-[oklch(0.22_0.04_160)]">{carePlan.authorisedBy}</strong>
            {' '}on{' '}
            {new Date(carePlan.approvedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
        )}

        {/* Sections */}
        {sections.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-sm font-bold text-[oklch(0.3_0.08_160)] uppercase tracking-widest border-t border-[oklch(0.88_0.005_160)] pt-6">
              Care Plan Sections
            </h2>
            {sections.map((section) => (
              <div key={section.id} className="break-inside-avoid">
                <h3 className="text-sm font-bold text-[oklch(0.3_0.08_160)] uppercase tracking-wide border-b border-[oklch(0.88_0.005_160)] pb-2 mb-3">
                  {section.title}
                </h3>
                {section.content ? (
                  <div className="whitespace-pre-wrap text-sm text-[oklch(0.22_0.04_160)] leading-relaxed">
                    {section.content}
                  </div>
                ) : (
                  <p className="text-sm text-[oklch(0.65_0_0)] italic">
                    No content recorded for this section.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[oklch(0.6_0_0)] italic">
            This care plan has no sections.
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-5 border-t border-[oklch(0.88_0.005_160)] flex items-center justify-between text-xs text-[oklch(0.6_0_0)]">
          <span>Care Plan ID: {carePlan.id.slice(0, 8).toUpperCase()}</span>
          <span>Complete Care · {printDate}</span>
        </div>
        <p className="mt-2 text-center text-[10px] text-[oklch(0.7_0_0)]">
          CONFIDENTIAL — Contains personal and sensitive information.
          Handle in accordance with your organisation&apos;s data protection policy.
        </p>
      </div>
    </>
  );
}
