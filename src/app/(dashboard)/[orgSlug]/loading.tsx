/**
 * Org-scoped route loading state.
 *
 * Shown while any org-scoped page is loading.
 */

import { PageSkeleton } from '@/components/dashboard/page-skeleton';

export default function OrgSlugLoading() {
  return <PageSkeleton />;
}
