import { PersonAvatar } from '@/components/persons/person-avatar';
import { PersonTypeBadge, PersonStatusBadge } from '@/components/persons/person-type-badge';
import { calculateAge, formatDateOfBirth, formatNhsNumber } from '@/features/persons/utils';
import type { Person } from '@/lib/db/schema/persons';

type PersonSummaryCardProps = {
  person: Person;
};

export function PersonSummaryCard({ person }: PersonSummaryCardProps) {
  const age = calculateAge(person.dateOfBirth);
  const hasAllergies = person.allergies.length > 0;

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <PersonAvatar
          fullName={person.fullName}
          photoUrl={person.photoUrl}
          size="xl"
          hasAllergies={hasAllergies}
        />
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-[oklch(0.18_0.02_160)]">
              {person.fullName}
              {person.preferredName && person.preferredName !== person.fullName && (
                <span className="ml-2 text-base font-normal text-[oklch(0.55_0_0)]">
                  ({person.preferredName})
                </span>
              )}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <PersonTypeBadge type={person.type} />
              <PersonStatusBadge status={person.status} />
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {person.dateOfBirth && (
              <div>
                <dt className="text-xs text-[oklch(0.55_0_0)]">Date of birth</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">
                  {formatDateOfBirth(person.dateOfBirth)}
                  {age !== null && <span className="text-[oklch(0.55_0_0)] font-normal ml-1">({age}y)</span>}
                </dd>
              </div>
            )}
            {person.nhsNumber && (
              <div>
                <dt className="text-xs text-[oklch(0.55_0_0)]">NHS number</dt>
                <dd className="font-mono font-medium text-[oklch(0.22_0.04_160)]">
                  {formatNhsNumber(person.nhsNumber)}
                </dd>
              </div>
            )}
            {person.gender && (
              <div>
                <dt className="text-xs text-[oklch(0.55_0_0)]">Gender</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)] capitalize">{person.gender}</dd>
              </div>
            )}
            {person.gpName && (
              <div>
                <dt className="text-xs text-[oklch(0.55_0_0)]">GP</dt>
                <dd className="font-medium text-[oklch(0.22_0.04_160)]">{person.gpName}</dd>
              </div>
            )}
          </dl>

          {hasAllergies && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5"
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-red-600 flex-shrink-0"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span className="text-xs font-medium text-red-800">
                Allergies: {person.allergies.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
