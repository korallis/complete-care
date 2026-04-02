import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { checkPhotoConsent } from '@/features/consent/manager';
import type { Consent } from '@/features/consent/types';
import {
  createConsentRecord,
  createPhoto,
  listConsentRecords,
  listPhotos,
  withdrawConsent,
} from '@/features/consent/actions';
import { getPerson } from '@/features/persons/actions';

interface ConsentPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ status?: string; error?: string }>;
}

function buildRedirectPath(
  orgSlug: string,
  personId: string,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const qs = search.toString();
  return `/${orgSlug}/persons/${personId}/consent${qs ? `?${qs}` : ''}`;
}


function toConsentInput(record: {
  id: string;
  personId: string;
  consentType: string;
  status: string;
  grantedDate: string;
  withdrawnDate: string | null;
  givenBy: string;
  relationship: string;
  conditions: string | null;
  reviewDate: string | null;
}): Consent {
  return {
    id: record.id,
    personId: record.personId,
    consentType: record.consentType as Consent['consentType'],
    status: record.status as Consent['status'],
    grantedDate: record.grantedDate,
    withdrawnDate: record.withdrawnDate,
    givenBy: record.givenBy,
    relationship: record.relationship as Consent['relationship'],
    conditions: record.conditions,
    reviewDate: record.reviewDate,
  };
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return 'Not recorded';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export async function generateMetadata({
  params,
}: ConsentPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);

  return {
    title: person
      ? `Consent & photos — ${person.fullName} — Complete Care`
      : 'Consent & photos — Complete Care',
  };
}

export default async function ConsentPage({
  params,
  searchParams,
}: ConsentPageProps) {
  const { orgSlug, personId } = await params;
  const { status, error } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const person = await getPerson(personId);
  if (!person) {
    redirect(`/${orgSlug}/persons`);
  }

  const [consentResult, photoResult] = await Promise.all([
    listConsentRecords({ personId, pageSize: 50 }),
    listPhotos({ personId, pageSize: 50 }),
  ]);

  const consentRecords = consentResult.records;
  const photos = photoResult.photos;
  const photographyConsent = checkPhotoConsent(consentRecords.map(toConsentInput), personId);
  const today = new Date().toISOString().slice(0, 10);
  const activePhotographyRecord =
    consentRecords.find(
      (record) =>
        record.consentType === 'photography' && record.status === 'granted',
    ) ?? null;

  async function handleCreateConsent(formData: FormData) {
    'use server';

    const result = await createConsentRecord({
      personId,
      consentType: String(formData.get('consentType') ?? ''),
      grantedDate: String(formData.get('grantedDate') ?? ''),
      givenBy: String(formData.get('givenBy') ?? ''),
      relationship: String(formData.get('relationship') ?? 'other'),
      conditions: String(formData.get('conditions') ?? '') || undefined,
      reviewDate: String(formData.get('reviewDate') ?? '') || undefined,
      status: 'granted',
    });

    redirect(
      buildRedirectPath(orgSlug, personId, {
        status: result.success ? 'consent-created' : undefined,
        error: result.success ? undefined : result.error,
      }),
    );
  }

  async function handleWithdrawConsent(formData: FormData) {
    'use server';

    const consentId = String(formData.get('consentId') ?? '');
    const result = await withdrawConsent(consentId, today);

    redirect(
      buildRedirectPath(orgSlug, personId, {
        status: result.success ? 'consent-withdrawn' : undefined,
        error: result.success ? undefined : result.error,
      }),
    );
  }

  async function handleCreatePhoto(formData: FormData) {
    'use server';

    const latestConsentResult = await listConsentRecords({
      personId,
      pageSize: 50,
      consentType: 'photography',
    });
    const currentConsent = checkPhotoConsent(latestConsentResult.records.map(toConsentInput), personId);

    if (!currentConsent.allowed || !currentConsent.consentRecordId) {
      redirect(
        buildRedirectPath(orgSlug, personId, {
          error: currentConsent.reason,
        }),
      );
    }

    const tags = String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const result = await createPhoto({
      personId,
      imageUrl: String(formData.get('imageUrl') ?? ''),
      thumbnailUrl: String(formData.get('thumbnailUrl') ?? '') || undefined,
      caption: String(formData.get('caption') ?? '') || undefined,
      takenDate: String(formData.get('takenDate') ?? '') || undefined,
      tags,
      consentVerified: true,
      consentRecordId: currentConsent.consentRecordId,
    });

    redirect(
      buildRedirectPath(orgSlug, personId, {
        status: result.success ? 'photo-created' : undefined,
        error: result.success ? undefined : result.error,
      }),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Consent &amp; photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record consent decisions for {person.fullName}, confirm whether
          photography can be shared with family, and maintain the approved photo
          gallery.
        </p>
      </div>

      {(status || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ? error : status?.replace(/-/g, ' ')}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">Photography status</p>
          <p className="mt-2 text-lg font-semibold">
            {photographyConsent.allowed ? 'Share permitted' : 'Share blocked'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {photographyConsent.reason}
          </p>
        </article>

        <article className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">Consent records</p>
          <p className="mt-2 text-lg font-semibold">{consentRecords.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activePhotographyRecord
              ? `Latest photography consent granted on ${formatDate(activePhotographyRecord.grantedDate)}`
              : 'No active photography consent on file.'}
          </p>
        </article>

        <article className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">Approved photos</p>
          <p className="mt-2 text-lg font-semibold">
            {photos.filter((photo) => photo.consentVerified).length}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only consent-verified photos are eligible for family sharing.
          </p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Consent history</h2>
                <p className="text-sm text-muted-foreground">
                  Latest records appear first. Withdraw active consent from the
                  record once it no longer applies.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {consentRecords.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  No consent records have been recorded yet.
                </p>
              ) : (
                consentRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium capitalize">
                            {record.consentType.replace(/_/g, ' ')}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              record.status === 'granted'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Given by {record.givenBy} ({record.relationship}) on{' '}
                          {formatDate(record.grantedDate)}
                        </p>
                        {record.withdrawnDate && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Withdrawn on {formatDate(record.withdrawnDate)}
                          </p>
                        )}
                        {record.conditions && (
                          <p className="mt-2 text-sm text-slate-700">
                            {record.conditions}
                          </p>
                        )}
                      </div>

                      {record.status === 'granted' && (
                        <form action={handleWithdrawConsent}>
                          <input type="hidden" name="consentId" value={record.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
                          >
                            Withdraw consent
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Approved photo gallery</h2>
              <p className="text-sm text-muted-foreground">
                Photos stay eligible for family sharing only while photography
                consent remains active.
              </p>
            </div>

            {photos.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No photos have been added yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {photos.map((photo) => (
                  <article
                    key={photo.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbnailUrl ?? photo.imageUrl}
                        alt={photo.caption ?? `Photo for ${person.fullName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="font-medium">
                        {photo.caption ?? 'Untitled photo'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Taken {formatDate(photo.takenDate)} ·{' '}
                        {photo.consentVerified
                          ? 'Consent verified'
                          : 'Not shareable'}
                      </p>
                      {(photo.tags?.length ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Tags: {photo.tags?.join(', ')}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <form action={handleCreateConsent} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Record new consent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a fresh consent decision or update the sharing basis before new
              photos are added.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Consent type</span>
                <select
                  name="consentType"
                  defaultValue="photography"
                  className="rounded-lg border px-3 py-2"
                >
                  {[
                    'photography',
                    'data_sharing',
                    'medical_treatment',
                    'outings',
                    'social_media',
                    'research',
                    'third_party_sharing',
                  ].map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Granted date</span>
                <input
                  type="date"
                  name="grantedDate"
                  defaultValue={today}
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Given by</span>
                <input
                  type="text"
                  name="givenBy"
                  placeholder="Parent / young person / guardian"
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Relationship</span>
                <select name="relationship" defaultValue="parent" className="rounded-lg border px-3 py-2">
                  {['self', 'parent', 'guardian', 'social_worker', 'other'].map((value) => (
                    <option key={value} value={value}>
                      {value.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Conditions</span>
                <textarea
                  name="conditions"
                  rows={3}
                  placeholder="Any restrictions or notes for sharing"
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Review date</span>
                <input type="date" name="reviewDate" className="rounded-lg border px-3 py-2" />
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Save consent record
            </button>
          </form>

          <form action={handleCreatePhoto} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Add shareable photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload by URL once active photography consent is recorded.
            </p>

            {!photographyConsent.allowed && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {photographyConsent.reason}
              </div>
            )}

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Image URL</span>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://..."
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Thumbnail URL</span>
                <input
                  type="url"
                  name="thumbnailUrl"
                  placeholder="Optional thumbnail"
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Caption</span>
                <input
                  type="text"
                  name="caption"
                  placeholder="What does this photo show?"
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Taken date</span>
                <input
                  type="date"
                  name="takenDate"
                  defaultValue={today}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Tags</span>
                <input
                  type="text"
                  name="tags"
                  placeholder="activity, family-time, outing"
                  className="rounded-lg border px-3 py-2"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!photographyConsent.allowed}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save photo
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
