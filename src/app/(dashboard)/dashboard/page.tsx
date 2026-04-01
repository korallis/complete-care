import type { Metadata } from 'next';
import { auth } from '@/auth';
import { LogoutButton } from '@/components/auth/logout-button';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {session?.user && (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{session.user.name}</span>!
            </p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Dashboard shell will be implemented in m1-dashboard-shell.
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
