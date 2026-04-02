'use client';

import type { PortalView } from '../types';
import { getDomainSectionTitles } from '../lib/domain-views';
import { DomiciliaryCareView } from './views/domiciliary-care-view';
import { SupportedLivingView } from './views/supported-living-view';
import { ChildrensHomesView } from './views/childrens-homes-view';

interface DomainViewProps {
  view: PortalView;
}

/**
 * Renders the appropriate domain-specific portal view based on care domain.
 */
export function DomainView({ view }: DomainViewProps) {
  const sections = getDomainSectionTitles(view.domain);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {view.domain === 'domiciliary_care' && (
          <DomiciliaryCareView view={view} sections={sections} />
        )}
        {view.domain === 'supported_living' && (
          <SupportedLivingView view={view} sections={sections} />
        )}
        {view.domain === 'childrens_homes' && (
          <ChildrensHomesView view={view} sections={sections} />
        )}
      </div>
    </div>
  );
}
