import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getInvitationByToken } from '@/features/organisations/actions';
import { INVITATION_STATUS } from '@/lib/db/schema/invitations';
import { AcceptInvitationForm } from '@/components/organisations/accept-invitation-form';

export const metadata: Metadata = {
  title: 'Accept Invitation — Complete Care',
};

interface AcceptInvitationPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/login');
  }

  // Look up the invitation
  const invitation = await getInvitationByToken(token);

  // Check for invalid token
  if (!invitation) {
    return <InvitationError message="This invitation link is invalid or has already been used." />;
  }

  // Check for expired invitation
  const isExpired =
    invitation.status === INVITATION_STATUS.EXPIRED ||
    invitation.expiresAt < new Date();
  if (isExpired) {
    return (
      <InvitationError
        message="This invitation link has expired."
        detail="Invitations are valid for 7 days. Please ask your organisation admin to send a new invitation."
      />
    );
  }

  // Check for revoked invitation
  if (invitation.status === INVITATION_STATUS.REVOKED) {
    return (
      <InvitationError
        message="This invitation has been revoked."
        detail="Please ask your organisation admin to send a new invitation."
      />
    );
  }

  // Check for already-accepted invitation
  if (invitation.status === INVITATION_STATUS.ACCEPTED) {
    return (
      <InvitationError
        message="This invitation has already been accepted."
        detail={
          <>
            Already a member?{' '}
            <Link href="/login" className="text-[oklch(0.35_0.06_160)] hover:underline font-medium">
              Sign in
            </Link>
          </>
        }
      />
    );
  }

  // Check if the user is logged in
  const session = await auth();

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    senior_carer: 'Senior Carer',
    carer: 'Carer',
    viewer: 'Viewer',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[oklch(0.985_0.005_150)]">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.2 0 0) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'oklch(0.72 0.12 160)' }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="Complete Care home">
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.22_0.04_160)] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-[oklch(0.18_0.03_160)] font-semibold text-lg tracking-tight">
            Complete Care
          </span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="w-full rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_4px_24px_-4px_oklch(0.3_0.04_160/0.12),0_1px_4px_-1px_oklch(0.3_0.04_160/0.08)]">
          <div className="px-8 pt-8 pb-8">
            {/* Invitation header */}
            <div className="mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[oklch(0.94_0.01_160)] flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="oklch(0.35 0.06 160)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                  aria-hidden="true"
                >
                  <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
                  <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
                </svg>
              </div>
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                You&apos;re invited!
              </h1>
              <p className="mt-2 text-sm text-[oklch(0.48_0_0)]">
                <span className="font-medium text-[oklch(0.25_0.02_160)]">
                  {invitation.inviterName}
                </span>{' '}
                invited you to join
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-[oklch(0.96_0.01_160)] border border-[oklch(0.88_0.02_160)] rounded-lg px-3 py-1.5">
                <span className="text-sm font-semibold text-[oklch(0.2_0.03_160)]">
                  {invitation.orgName}
                </span>
                <span className="text-[oklch(0.6_0_0)] text-xs">·</span>
                <span className="text-xs text-[oklch(0.45_0.06_160)] font-medium">
                  {ROLE_LABELS[invitation.role] ?? invitation.role}
                </span>
              </div>
            </div>

            {/* Acceptance form */}
            <AcceptInvitationForm
              token={token}
              invitationEmail={invitation.email}
              isLoggedIn={!!session?.user?.id}
              currentUserEmail={session?.user?.email ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationError({
  message,
  detail,
}: {
  message: string;
  detail?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[oklch(0.985_0.005_150)]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(185 28 28)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[oklch(0.15_0.03_160)] mb-2">
            {message}
          </h1>
          {detail && (
            <p className="text-sm text-[oklch(0.48_0_0)]">{detail}</p>
          )}
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center h-10 px-4 rounded-md bg-[oklch(0.22_0.04_160)] text-white text-sm font-medium hover:bg-[oklch(0.18_0.04_160)] transition-colors"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
