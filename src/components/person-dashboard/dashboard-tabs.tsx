'use client';

/**
 * DashboardTabs — client component for tab navigation.
 * Uses URL-based navigation (links) rather than client state
 * so each tab is a shareable route.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = {
  id: string;
  label: string;
  href: string;
};

type DashboardTabsProps = {
  orgSlug: string;
  personId: string;
};

export function DashboardTabs({ orgSlug, personId }: DashboardTabsProps) {
  const pathname = usePathname();
  const basePath = `/${orgSlug}/persons/${personId}`;

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', href: basePath },
    { id: 'care-plans', label: 'Care Plans', href: `${basePath}/care-plans` },
    { id: 'care-notes', label: 'Care Notes', href: `${basePath}/care-notes` },
    { id: 'risk-assessments', label: 'Risk Assessments', href: `${basePath}/risk-assessments` },
    { id: 'documents', label: 'Documents', href: `${basePath}/documents` },
    { id: 'body-map', label: 'Body Map', href: `${basePath}/body-map` },
    { id: 'care-package', label: 'Care Package', href: `${basePath}/care-package` },
    { id: 'clinical', label: 'Clinical', href: `${basePath}/clinical/fluids` },
    { id: 'emar', label: 'EMAR', href: `${basePath}/emar` },
    { id: 'incidents', label: 'Incidents', href: `${basePath}/incidents` },
    { id: 'keyworker', label: 'Keyworker', href: `${basePath}/keyworker` },
    { id: 'lac', label: 'LAC', href: `${basePath}/lac` },
    { id: 'contacts', label: 'Contacts', href: `${basePath}/contacts` },
    { id: 'missing', label: 'Missing', href: `${basePath}/missing` },
    { id: 'timeline', label: 'Timeline', href: `${basePath}/timeline` },
  ];

  function isActive(tab: Tab): boolean {
    if (tab.id === 'overview') {
      return pathname === basePath;
    }
    return pathname.startsWith(tab.href);
  }

  return (
    <div
      className="border-t border-[oklch(0.91_0.005_160)] px-6 overflow-x-auto"
      role="tablist"
      aria-label="Person record sections"
    >
      <div className="flex gap-0 -mb-px">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`flex-shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[oklch(0.35_0.06_160)] whitespace-nowrap ${
                active
                  ? 'border-[oklch(0.35_0.06_160)] text-[oklch(0.25_0.08_160)]'
                  : 'border-transparent text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:border-[oklch(0.85_0.01_160)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
