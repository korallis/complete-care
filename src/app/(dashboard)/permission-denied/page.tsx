import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/auth';
import { BackButton } from '@/components/ui/back-button';

export const metadata: Metadata = {
  title: 'Access Denied — Complete Care',
  description: 'You do not have permission to access this resource.',
};

export default async function PermissionDeniedPage() {
  const session = await auth();
  const role = session?.user?.role;

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    manager: 'Manager',
    senior_carer: 'Senior Carer',
    carer: 'Carer',
    viewer: 'Viewer',
  };

  const roleLabel = role ? (roleLabels[role] ?? role) : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(251,146,60,0.4) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

          <div className="p-10">
            {/* Shield icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10 text-amber-400"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                {/* Error badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">!</span>
                </div>
              </div>
            </div>

            {/* Status code */}
            <p className="text-center text-amber-400/60 text-xs font-mono tracking-[0.25em] uppercase mb-2">
              Error 403
            </p>

            {/* Heading */}
            <h1 className="text-center text-2xl font-bold text-white tracking-tight mb-3">
              Access Denied
            </h1>

            {/* Description */}
            <p className="text-center text-slate-400 text-sm leading-relaxed mb-8">
              You don&apos;t have permission to access this resource. This area
              requires a higher privilege level than your current role.
            </p>

            {/* Role pill */}
            {roleLabel && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="text-slate-300 text-xs font-medium">
                    Your role:{' '}
                    <span className="text-white font-semibold">{roleLabel}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-800 mb-8" />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to Dashboard
              </Link>

              <BackButton className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800/50 hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Go Back
              </BackButton>
            </div>

            {/* Help text */}
            <p className="text-center text-slate-600 text-xs mt-6">
              If you believe this is a mistake, contact your organisation
              administrator to request access.
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-slate-700 text-xs mt-6">
          Complete Care · Role-Based Access Control
        </p>
      </div>
    </div>
  );
}
