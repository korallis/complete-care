/**
 * Person utilities — domain-aware terminology and display helpers.
 * These are pure functions with no database dependencies.
 */

// ---------------------------------------------------------------------------
// Domain-aware terminology
// ---------------------------------------------------------------------------

export type PersonTerminology = {
  singular: string;
  plural: string;
  singularLower: string;
  pluralLower: string;
};

/**
 * Returns the correct terminology for care recipients based on the org's
 * active care domains.
 *
 * Priority: childrens_residential > domiciliary > supported_living > default
 */
export function getPersonTerminology(domains: string[]): PersonTerminology {
  if (domains.includes('childrens_residential')) {
    return {
      singular: 'Young Person',
      plural: 'Young People',
      singularLower: 'young person',
      pluralLower: 'young people',
    };
  }
  if (domains.includes('domiciliary')) {
    return {
      singular: 'Client',
      plural: 'Clients',
      singularLower: 'client',
      pluralLower: 'clients',
    };
  }
  // supported_living or default
  return {
    singular: 'Person',
    plural: 'People',
    singularLower: 'person',
    pluralLower: 'people',
  };
}

/**
 * Returns the default person type for a given care domain config.
 */
export function getDefaultPersonType(
  domains: string[],
): 'resident' | 'client' | 'young_person' {
  if (domains.includes('childrens_residential')) return 'young_person';
  if (domains.includes('domiciliary')) return 'client';
  return 'resident';
}

/**
 * Calculates age in years from a date of birth string (YYYY-MM-DD).
 * Returns null if the date is invalid or not provided.
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Formats a date of birth string for display (e.g., "15 March 1985").
 */
export function formatDateOfBirth(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return '—';
  const date = new Date(dateOfBirth);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats an NHS number with spaces (e.g., "123 456 7890").
 */
export function formatNhsNumber(nhsNumber: string | null | undefined): string {
  if (!nhsNumber) return '—';
  const digits = nhsNumber.replace(/\D/g, '');
  if (digits.length !== 10) return nhsNumber;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Returns the display label for a person type.
 */
export function getPersonTypeLabel(type: string, terminology: PersonTerminology): string {
  return terminology.singular;
}

/**
 * Returns initials from a full name (up to 2 characters).
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0]!.charAt(0);
    return first ? first.toUpperCase() : '?';
  }
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}
