import Link from 'next/link';

export type StaffDetailSection =
  | 'overview'
  | 'dbs'
  | 'training'
  | 'supervision'
  | 'leave';

type StaffDetailNavProps = {
  orgSlug: string;
  staffId: string;
  activeSection: StaffDetailSection;
};

const STAFF_DETAIL_NAV_ITEMS: ReadonlyArray<{
  id: StaffDetailSection;
  label: string;
  href: (orgSlug: string, staffId: string) => string;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    href: (orgSlug, staffId) => `/${orgSlug}/staff/${staffId}`,
  },
  {
    id: 'dbs',
    label: 'DBS checks',
    href: (orgSlug, staffId) => `/${orgSlug}/staff/${staffId}/dbs`,
  },
  {
    id: 'training',
    label: 'Training',
    href: (orgSlug, staffId) => `/${orgSlug}/staff/${staffId}/training`,
  },
  {
    id: 'supervision',
    label: 'Supervisions',
    href: (orgSlug, staffId) => `/${orgSlug}/staff/${staffId}/supervision`,
  },
  {
    id: 'leave',
    label: 'Leave',
    href: (orgSlug, staffId) => `/${orgSlug}/staff/${staffId}/leave`,
  },
] as const;

export function StaffDetailNav({
  orgSlug,
  staffId,
  activeSection,
}: StaffDetailNavProps) {
  return (
    <nav
      aria-label="Staff profile sections"
      className="border-t border-[oklch(0.91_0.005_160)] px-6 overflow-x-auto"
    >
      <div className="flex gap-0 -mb-px">
        {STAFF_DETAIL_NAV_ITEMS.map((item) => {
          const isActive = item.id === activeSection;

          return (
            <Link
              key={item.id}
              href={item.href(orgSlug, staffId)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[oklch(0.35_0.06_160)] ${
                isActive
                  ? 'border-[oklch(0.35_0.06_160)] text-[oklch(0.25_0.08_160)]'
                  : 'border-transparent text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:border-[oklch(0.85_0.01_160)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
