import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Family Portal',
    template: '%s | Family Portal | Complete Care',
  },
};

/**
 * Family portal layout — separate route group for family member access.
 * Auth checks and family-specific navigation will be added when Auth.js v5 is integrated.
 */
export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">
            Complete Care &mdash; Family Portal
          </span>
          {/* Auth controls will be added in auth integration */}
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
