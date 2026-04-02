'use client';

import { isPhotoStale, PHOTO_STALENESS_DAYS } from '../schema';
import type { PhilomenaProfile } from '@/lib/db/schema';

/**
 * Single-page printable Philomena Protocol profile card.
 * Designed for print media — use `print:` Tailwind utilities.
 */
export function PhilomenaProfileCard({
  profile,
  childName,
  dateOfBirth,
}: {
  profile: PhilomenaProfile;
  childName: string;
  dateOfBirth?: string;
}) {
  const photoStale = isPhotoStale(profile.photoUpdatedAt);
  const riskFlags = [
    profile.riskCse && 'CSE',
    profile.riskCce && 'CCE',
    profile.riskCountyLines && 'County Lines',
    profile.riskTrafficking && 'Trafficking',
  ].filter(Boolean);

  const knownAssociates =
    (profile.knownAssociates as { name: string; relationship: string; notes?: string }[]) ?? [];
  const likelyLocations =
    (profile.likelyLocations as { location: string; address?: string; notes?: string }[]) ?? [];
  const socialMedia =
    (profile.socialMedia as { platform: string; handle: string }[]) ?? [];

  return (
    <div className="print:break-inside-avoid mx-auto max-w-[210mm] border border-gray-200 bg-white p-6 print:border-none print:p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between border-b border-red-600 pb-3">
        <div>
          <h1 className="text-xl font-bold text-red-700 uppercase tracking-wide">
            Philomena Protocol
          </h1>
          <p className="text-xs text-gray-500">
            Missing from Care — Confidential
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>
            Profile updated:{' '}
            {profile.updatedAt.toLocaleDateString('en-GB')}
          </p>
          <p>Print date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Photo + basic details row */}
      <div className="mb-4 grid grid-cols-[120px_1fr] gap-4">
        <div className="relative">
          {profile.photoUrl ? (
            <div className="h-[150px] w-[120px] overflow-hidden rounded border border-gray-300 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.photoUrl}
                alt={`Photo of ${childName}`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[150px] w-[120px] items-center justify-center rounded border border-gray-300 bg-gray-50 text-center text-xs text-gray-400">
              No photo
              <br />
              available
            </div>
          )}
          {photoStale && (
            <span className="mt-1 block rounded bg-amber-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-amber-800">
              Photo over {PHOTO_STALENESS_DAYS} days old
            </span>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">{childName}</h2>
          {dateOfBirth && (
            <p className="text-sm text-gray-600">DOB: {dateOfBirth}</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Detail label="Height" value={profile.heightCm ? `${profile.heightCm}cm` : null} />
            <Detail label="Build" value={profile.build} />
            <Detail label="Hair" value={profile.hairDescription} />
            <Detail label="Eyes" value={profile.eyeColour} />
            <Detail label="Ethnicity" value={profile.ethnicity} />
          </div>
          {profile.distinguishingFeatures && (
            <p className="mt-1 text-sm">
              <span className="font-medium text-gray-700">
                Distinguishing features:{' '}
              </span>
              {profile.distinguishingFeatures}
            </p>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2">
          <h3 className="text-xs font-semibold text-red-800 uppercase">
            Risk Flags
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {riskFlags.map((flag) => (
              <span
                key={flag as string}
                className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white"
              >
                {flag}
              </span>
            ))}
          </div>
          {profile.riskNotes && (
            <p className="mt-1 text-xs text-red-700">{profile.riskNotes}</p>
          )}
        </div>
      )}

      {/* Three column info grid */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        {/* Known associates */}
        <Section title="Known Associates">
          {knownAssociates.length > 0 ? (
            <ul className="space-y-1">
              {knownAssociates.map((a, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">{a.name}</span> ({a.relationship})
                  {a.notes && (
                    <span className="text-gray-500"> — {a.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">None recorded</p>
          )}
        </Section>

        {/* Likely locations */}
        <Section title="Likely Locations">
          {likelyLocations.length > 0 ? (
            <ul className="space-y-1">
              {likelyLocations.map((l, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">{l.location}</span>
                  {l.address && <span className="text-gray-500"> — {l.address}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">None recorded</p>
          )}
        </Section>

        {/* Contact / Social Media */}
        <Section title="Contact / Social Media">
          {profile.phoneNumbers && profile.phoneNumbers.length > 0 && (
            <div className="mb-1">
              {profile.phoneNumbers.map((num, i) => (
                <p key={i} className="text-xs">
                  {num}
                </p>
              ))}
            </div>
          )}
          {socialMedia.length > 0 ? (
            <ul className="space-y-0.5">
              {socialMedia.map((s, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">{s.platform}:</span> {s.handle}
                </li>
              ))}
            </ul>
          ) : (
            !profile.phoneNumbers?.length && (
              <p className="text-xs text-gray-400 italic">None recorded</p>
            )
          )}
        </Section>
      </div>

      {/* Medical needs */}
      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2">
        <h3 className="text-xs font-semibold text-blue-800 uppercase">
          Medical Needs
        </h3>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <Detail label="Conditions" value={profile.medicalNeeds} />
          <Detail label="Allergies" value={profile.allergies} />
          <Detail label="Medications" value={profile.medications} />
          <Detail label="GP" value={profile.gpDetails} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <p>
      <span className="font-medium text-gray-700">{label}: </span>
      <span className="text-gray-900">{value ?? '—'}</span>
    </p>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5">
      <h3 className="mb-1 text-xs font-semibold text-gray-700 uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
