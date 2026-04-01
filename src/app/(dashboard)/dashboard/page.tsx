import type { Metadata } from 'next';
import { auth } from '@/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const isNewUser = params.welcome === 'true';

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner for newly onboarded users */}
      {isNewUser && (
        <WelcomeBanner
          userName={session?.user?.name ?? undefined}
        />
      )}

      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          {session?.user?.name
            ? `Welcome back, ${session.user.name.split(' ')[0]}`
            : 'Welcome'}
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Here&apos;s an overview of your organisation today.
        </p>
      </div>

      {/* Placeholder content — will be replaced in future milestones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'People in care', value: '—', icon: '👤' },
          { label: 'Staff on duty', value: '—', icon: '👥' },
          { label: 'Active care plans', value: '—', icon: '📋' },
          { label: 'Compliance items', value: '—', icon: '✅' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="text-lg" aria-hidden="true">
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder notice */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Dashboard widgets will be populated as features are added in upcoming
          milestones.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
