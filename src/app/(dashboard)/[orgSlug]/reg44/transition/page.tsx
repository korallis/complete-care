import type { Metadata } from 'next';
import Link from 'next/link';
import {
  createIndependentLivingAssessment,
  createPathwayPlan,
  createTransitionMilestone,
  getTransitionDashboard,
  updatePathwayPlan,
  updateTransitionMilestone,
} from '@/features/reg44/actions';
import { requireReg44PageAccess } from '@/features/reg44/page-access';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_STATUSES,
  PATHWAY_PLAN_STATUSES,
  type MilestoneCategory,
  type MilestoneStatus,
  type PathwayPlanStatus,
} from '@/features/reg44';
import { TRANSITION_SKILL_DOMAIN_LABELS } from '@/features/reg44/helpers';

export const metadata: Metadata = {
  title: 'Transition & Leaving Care',
};

interface TransitionPageProps {
  params: Promise<{ orgSlug: string }>;
}

function makeSkillEntry(label: string, rating: number, notes: string) {
  return [{ skill: label, rating, notes }];
}

async function createPathwayPlanAction(formData: FormData) {
  'use server';

  const result = await createPathwayPlan({
    personId: String(formData.get('personId') ?? ''),
    personalAdviser: String(formData.get('personalAdviser') ?? '') || undefined,
    planStartDate: String(formData.get('planStartDate') ?? ''),
    planReviewDate: String(formData.get('planReviewDate') ?? '') || undefined,
    status: 'active',
    sections: {
      accommodation: String(formData.get('accommodation') ?? ''),
      education: String(formData.get('education') ?? ''),
      employment: String(formData.get('employment') ?? ''),
      health: String(formData.get('health') ?? ''),
      financialSupport: String(formData.get('financialSupport') ?? ''),
      relationships: String(formData.get('relationships') ?? ''),
      identity: String(formData.get('identity') ?? ''),
      practicalSkills: String(formData.get('practicalSkills') ?? ''),
    },
  });

  if (!result.success) throw new Error(result.error);
}

async function updatePlanStatusAction(formData: FormData) {
  'use server';

  const result = await updatePathwayPlan(String(formData.get('id') ?? ''), {
    status: String(formData.get('status') ?? 'draft') as PathwayPlanStatus,
  });
  if (!result.success) throw new Error(result.error);
}

async function createMilestoneAction(formData: FormData) {
  'use server';

  const result = await createTransitionMilestone({
    pathwayPlanId: String(formData.get('pathwayPlanId') ?? ''),
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    category: String(formData.get('category') ?? 'life_skills') as MilestoneCategory,
    targetDate: String(formData.get('targetDate') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined,
    status: 'not-started',
  });

  if (!result.success) throw new Error(result.error);
}

async function updateMilestoneStatusAction(formData: FormData) {
  'use server';

  const result = await updateTransitionMilestone(
    String(formData.get('id') ?? ''),
    {
      status: String(formData.get('status') ?? 'not-started') as MilestoneStatus,
    },
  );
  if (!result.success) throw new Error(result.error);
}

async function createAssessmentAction(formData: FormData) {
  'use server';

  const notes = String(formData.get('assessmentNotes') ?? '');
  const parseRating = (key: string) =>
    Number.parseInt(String(formData.get(key) ?? '0'), 10) || 1;

  const result = await createIndependentLivingAssessment({
    pathwayPlanId: String(formData.get('pathwayPlanId') ?? ''),
    assessmentDate: String(formData.get('assessmentDate') ?? ''),
    assessorName: String(formData.get('assessorName') ?? ''),
    comments: notes || undefined,
    isBaseline: String(formData.get('isBaseline') ?? '') === 'on',
    skills: {
      dailyLiving: makeSkillEntry('Cooking, cleaning, laundry', parseRating('dailyLiving'), notes),
      financialCapability: makeSkillEntry('Budgeting and banking', parseRating('financialCapability'), notes),
      healthAndWellbeing: makeSkillEntry('Health management', parseRating('healthAndWellbeing'), notes),
      socialAndRelationships: makeSkillEntry('Support networks', parseRating('socialAndRelationships'), notes),
      educationAndWork: makeSkillEntry('Education and work readiness', parseRating('educationAndWork'), notes),
      housingKnowledge: makeSkillEntry('Housing and tenancy readiness', parseRating('housingKnowledge'), notes),
    },
  });

  if (!result.success) throw new Error(result.error);
}

export default async function TransitionPage({ params }: TransitionPageProps) {
  const { orgSlug } = await params;
  const access = await requireReg44PageAccess(orgSlug);
  const dashboard = await getTransitionDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Transition &amp; leaving care
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pathway plans, readiness scoring, milestones, checklist prompts, and
            chronology for 16+ young people.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      {access.canCreatePlans && (
        <form
          action={createPathwayPlanAction}
          className="rounded-xl border bg-white p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="font-medium">Young person</span>
              <select
                required
                name="personId"
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select young person aged 16+</option>
                {dashboard.eligiblePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                    {person.dateOfBirth ? ` · DOB ${person.dateOfBirth}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Personal adviser</span>
              <input
                name="personalAdviser"
                placeholder="Allocated adviser"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Plan start date</span>
              <input
                required
                type="date"
                name="planStartDate"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Review date</span>
              <input
                type="date"
                name="planReviewDate"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Accommodation plan</span>
              <textarea
                required
                name="accommodation"
                rows={4}
                placeholder="Current accommodation, options, status, move target…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Education / EET plan</span>
              <textarea
                required
                name="education"
                rows={4}
                placeholder="Current EET status, goals, barriers, NEET risks…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Employment / career actions</span>
              <textarea
                name="employment"
                rows={4}
                placeholder="Employment, training, volunteering actions…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Health passport / health planning</span>
              <textarea
                required
                name="health"
                rows={4}
                placeholder="GP, dentist, medication, wellbeing, appointments…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Financial capability</span>
              <textarea
                required
                name="financialSupport"
                rows={4}
                placeholder="Budgeting, benefits, bills, banking, exploitation risks…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Relationships / support network</span>
              <textarea
                required
                name="relationships"
                rows={4}
                placeholder="Key contacts, support network, adviser / SW / family…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Identity / emotional wellbeing</span>
              <textarea
                required
                name="identity"
                rows={4}
                placeholder="Identity documents, emotional wellbeing, life story work…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Practical / life skills</span>
              <textarea
                required
                name="practicalSkills"
                rows={4}
                placeholder="Cooking, cleaning, laundry, travel, tenancy readiness…"
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            Create active pathway plan
          </button>
        </form>
      )}

      <div className="space-y-6">
        {dashboard.plans.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            No pathway plans created yet. Start with an eligible young person
            aged 16+.
          </div>
        ) : (
          dashboard.plans.map((summary) => (
            <article key={summary.plan.id} className="rounded-xl border bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {summary.plan.youngPersonName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Started {String(summary.plan.planStartDate)}
                    {summary.plan.planReviewDate
                      ? ` · Review ${summary.plan.planReviewDate}`
                      : ''}
                    {summary.plan.personalAdviser
                      ? ` · Adviser ${summary.plan.personalAdviser}`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    Readiness {summary.readiness.overall}%
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {summary.plan.status}
                  </span>
                </div>
              </div>

              {summary.alerts.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-medium">Active alerts</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {summary.alerts.map((alert) => (
                      <li key={alert}>{alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-muted/40 p-4">
                      <h3 className="font-semibold">Pathway plan domains</h3>
                      <dl className="mt-3 space-y-3 text-sm">
                        <div>
                          <dt className="font-medium">Accommodation</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.accommodation}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Education / EET</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.education}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Employment</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.employment}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Health</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.health}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Financial support</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.financialSupport}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Relationships</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.relationships}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Identity</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.identity}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">Practical skills</dt>
                          <dd className="text-muted-foreground">
                            {summary.plan.sections.practicalSkills}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl bg-muted/40 p-4">
                        <h3 className="font-semibold">Readiness dashboard</h3>
                        <div className="mt-3 space-y-3">
                          {summary.readiness.domains.map((domain) => (
                            <div key={domain.key}>
                              <div className="flex justify-between text-sm">
                                <span>{domain.label}</span>
                                <span>{domain.score}%</span>
                              </div>
                              <div className="mt-1 h-2 rounded-full bg-white">
                                <div
                                  className="h-2 rounded-full bg-[oklch(0.3_0.08_160)]"
                                  style={{ width: `${domain.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-4">
                        <h3 className="font-semibold">Health passport snapshot</h3>
                        {summary.healthPassport ? (
                          <dl className="mt-3 space-y-2 text-sm">
                            <div>
                              <dt className="font-medium">GP</dt>
                              <dd className="text-muted-foreground">
                                {summary.healthPassport.gp}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium">Allergies</dt>
                              <dd className="text-muted-foreground">
                                {summary.healthPassport.allergies}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium">Medical conditions</dt>
                              <dd className="text-muted-foreground">
                                {summary.healthPassport.medicalConditions}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium">NHS number</dt>
                              <dd className="text-muted-foreground">
                                {summary.healthPassport.nhsNumber}
                              </dd>
                            </div>
                          </dl>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">
                            Link a person record to generate the health passport
                            summary.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Transition milestones</h3>
                      {access.canUpdatePlans && (
                        <div className="flex flex-wrap gap-2">
                          {PATHWAY_PLAN_STATUSES.filter(
                            (status) => status !== summary.plan.status,
                          ).map((status) => (
                            <form key={status} action={updatePlanStatusAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={summary.plan.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value={status}
                              />
                              <button
                                type="submit"
                                className="rounded-md border px-3 py-1 text-xs font-medium"
                              >
                                Mark {status}
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {summary.milestones.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No milestones added yet.
                        </p>
                      ) : (
                        summary.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="rounded-lg bg-muted/40 p-4 text-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-muted-foreground">
                                  {milestone.category.replaceAll('_', ' ')}
                                  {milestone.targetDate
                                    ? ` · Target ${milestone.targetDate}`
                                    : ''}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize">
                                {milestone.status.replaceAll('-', ' ')}
                              </span>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                              {milestone.notes ||
                                milestone.description ||
                                'No additional milestone notes'}
                            </p>
                            {access.canUpdatePlans && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {MILESTONE_STATUSES.filter(
                                  (status) => status !== milestone.status,
                                ).map((status) => (
                                  <form
                                    key={status}
                                    action={updateMilestoneStatusAction}
                                  >
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={milestone.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="status"
                                      value={status}
                                    />
                                    <button
                                      type="submit"
                                      className="rounded-md border px-3 py-1 text-xs font-medium"
                                    >
                                      Mark {status.replaceAll('-', ' ')}
                                    </button>
                                  </form>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {access.canCreatePlans && (
                      <form
                        action={createMilestoneAction}
                        className="mt-4 grid gap-4 rounded-xl border border-dashed p-4 md:grid-cols-2"
                      >
                        <input
                          type="hidden"
                          name="pathwayPlanId"
                          value={summary.plan.id}
                        />
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Milestone title</span>
                          <input
                            required
                            name="title"
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </label>
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Category</span>
                          <select
                            name="category"
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            {MILESTONE_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category.replaceAll('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Target date</span>
                          <input
                            type="date"
                            name="targetDate"
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </label>
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Notes</span>
                          <input
                            name="notes"
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </label>
                        <label className="space-y-2 text-sm md:col-span-2">
                          <span className="font-medium">Description</span>
                          <textarea
                            name="description"
                            rows={2}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white md:col-span-2 md:justify-self-start"
                        >
                          Add milestone
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border p-4">
                    <h3 className="font-semibold">Leaving care checklist</h3>
                    <div className="mt-3 space-y-3">
                      {summary.checklist.map((item) => (
                        <div key={item.key} className="rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-sm">{item.label}</p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium capitalize">
                              {item.status.replaceAll('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <h3 className="font-semibold">Independent living assessments</h3>
                    <div className="mt-3 space-y-3">
                      {summary.assessments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No assessments recorded yet.
                        </p>
                      ) : (
                        summary.assessments.map((assessment) => (
                          <div key={assessment.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                            <p className="font-medium">
                              {assessment.assessmentDate} · {assessment.assessorName}
                            </p>
                            <p className="text-muted-foreground">
                              Readiness {assessment.overallScore ?? 0}%
                              {assessment.isBaseline ? ' · Baseline' : ''}
                            </p>
                            {assessment.comments && (
                              <p className="mt-1 text-muted-foreground">
                                {assessment.comments}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {access.canCreateAssessments && (
                      <form
                        action={createAssessmentAction}
                        className="mt-4 space-y-4 rounded-xl border border-dashed p-4"
                      >
                        <input
                          type="hidden"
                          name="pathwayPlanId"
                          value={summary.plan.id}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium">Assessment date</span>
                            <input
                              required
                              type="date"
                              name="assessmentDate"
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium">Assessor</span>
                            <input
                              required
                              name="assessorName"
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {Object.entries(TRANSITION_SKILL_DOMAIN_LABELS).map(
                            ([key, label]) => (
                              <label key={key} className="space-y-2 text-sm">
                                <span className="font-medium">{label}</span>
                                <select
                                  name={key}
                                  defaultValue="3"
                                  className="w-full rounded-lg border px-3 py-2"
                                >
                                  {[1, 2, 3, 4, 5].map((value) => (
                                    <option key={value} value={value}>
                                      {value} / 5
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ),
                          )}
                        </div>
                        <label className="space-y-2 text-sm">
                          <span className="font-medium">Assessment notes</span>
                          <textarea
                            name="assessmentNotes"
                            rows={3}
                            className="w-full rounded-lg border px-3 py-2"
                          />
                        </label>
                        <label className="flex items-start gap-3 text-sm">
                          <input type="checkbox" name="isBaseline" className="mt-1" />
                          <span>Mark as baseline assessment</span>
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
                        >
                          Record assessment
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="rounded-xl border p-4">
                    <h3 className="font-semibold">Chronology</h3>
                    <div className="mt-3 space-y-3">
                      {summary.chronology.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No chronology entries available yet.
                        </p>
                      ) : (
                        summary.chronology.slice(0, 12).map((entry) => (
                          <div key={`${entry.source}-${entry.id}`} className="rounded-lg bg-muted/40 p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{entry.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {entry.date}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {entry.description}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                              {entry.source.replaceAll('_', ' ')}
                              {entry.isManual ? ' · Manual entry' : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
