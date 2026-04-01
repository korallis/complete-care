'use client';

/**
 * Breadcrumbs — route-based breadcrumb navigation.
 *
 * Reads the current pathname and produces human-readable segment labels.
 * The org slug is omitted from display (replaced by org name context).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// ---------------------------------------------------------------------------
// Segment label map — maps URL segments to display names
// ---------------------------------------------------------------------------

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  persons: 'People',
  staff: 'Staff',
  'care-plans': 'Care Plans',
  notes: 'Daily Notes',
  assessments: 'Assessments',
  medications: 'Medications',
  incidents: 'Incidents',
  rostering: 'Rostering',
  'my-rota': 'My Rota',
  compliance: 'Compliance',
  reports: 'Reports',
  'audit-log': 'Audit Log',
  settings: 'Settings',
  organisation: 'Organisation',
  billing: 'Billing',
  team: 'Team',
  new: 'New',
  edit: 'Edit',
};

function toLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface BreadcrumbsProps {
  orgSlug: string;
  orgName: string;
}

export function Breadcrumbs({ orgSlug, orgName }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Parse path into breadcrumb segments
  // Example: /acme-care/settings/team → ['settings', 'team']
  const parts = pathname.split('/').filter(Boolean);
  // Remove the org slug from breadcrumb display
  const segments = parts.filter((p) => p !== orgSlug);

  // Build breadcrumb trail with hrefs
  const crumbs = segments.map((segment) => {
    // Reconstruct the path up to this segment
    const segmentIndex = parts.indexOf(segment, parts.indexOf(orgSlug) + 1);
    const href = '/' + parts.slice(0, segmentIndex + 1).join('/');
    // Check if segment is a UUID before converting to label
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const label = isUuid ? 'Detail' : toLabel(segment);
    return { label, href };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
      {/* Home / Org root */}
      <Link
        href={`/${orgSlug}/dashboard`}
        className="flex items-center text-[oklch(0.58_0_0)] hover:text-[oklch(0.22_0.04_160)] transition-colors flex-shrink-0"
        aria-label={`${orgName} dashboard`}
      >
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight
              className="h-3.5 w-3.5 flex-shrink-0 text-[oklch(0.75_0_0)]"
              aria-hidden="true"
            />
            {isLast ? (
              <span
                className="text-sm font-medium text-[oklch(0.22_0.04_160)] truncate max-w-[200px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-[oklch(0.5_0_0)] hover:text-[oklch(0.22_0.04_160)] transition-colors truncate max-w-[120px]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
