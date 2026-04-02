import type { Metadata } from 'next';
import { RestrictivePracticesPageClient } from './rp-page-client';

export const metadata: Metadata = {
  title: 'Restrictive Practices Register',
};

interface Props {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export default async function RestrictivePracticesPage({ params }: Props) {
  const { orgSlug, personId } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <nav className="mb-4 text-sm text-slate-500">
          <span>{orgSlug}</span>
          <span className="mx-1.5">/</span>
          <span>Persons</span>
          <span className="mx-1.5">/</span>
          <span>PBS</span>
          <span className="mx-1.5">/</span>
          <span className="text-slate-900">Restrictive Practices</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Restrictive Practices Register
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Immutable record of all restrictive practice instances. Edits create new versions.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="mb-8 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <TabLink href={`/${orgSlug}/persons/${personId}/pbs`}>
          PBS Plan
        </TabLink>
        <TabLink href={`/${orgSlug}/persons/${personId}/pbs/abc`}>
          ABC Data
        </TabLink>
        <TabLink
          href={`/${orgSlug}/persons/${personId}/pbs/restrictive-practices`}
          active
        >
          Restrictive Practices
        </TabLink>
        <TabLink href={`/${orgSlug}/persons/${personId}/pbs/reduction`}>
          Reduction Tracking
        </TabLink>
      </div>

      <RestrictivePracticesPageClient personId={personId} />
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </a>
  );
}
