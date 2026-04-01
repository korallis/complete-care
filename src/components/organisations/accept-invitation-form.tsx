'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { acceptInvitation } from '@/features/organisations/actions';

interface AcceptInvitationFormProps {
  token: string;
  invitationEmail: string;
  isLoggedIn: boolean;
  currentUserEmail: string | null;
}

export function AcceptInvitationForm({
  token,
  invitationEmail,
  isLoggedIn,
  currentUserEmail,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>('');

  const emailMatches =
    currentUserEmail?.toLowerCase() === invitationEmail.toLowerCase();

  async function handleAccept() {
    setError('');
    startTransition(async () => {
      const result = await acceptInvitation(token);

      if (!result.success) {
        if (result.error === 'EXPIRED') {
          setError(
            'This invitation has expired. Please ask your organisation admin for a new invitation.',
          );
        } else if (result.error === 'REVOKED') {
          setError(
            'This invitation has been revoked. Please ask your organisation admin for a new invitation.',
          );
        } else {
          setError(result.error);
        }
        return;
      }

      // Refresh session to pick up the new org
      await updateSession({});

      router.push('/dashboard');
      router.refresh();
    });
  }

  // User is not logged in
  if (!isLoggedIn) {
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`;
    const registerUrl = `/register?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`;

    return (
      <div className="space-y-3">
        <p className="text-sm text-center text-[oklch(0.48_0_0)]">
          Sign in or create an account to accept this invitation.
        </p>
        <Button
          asChild
          className="w-full h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
        >
          <Link href={loginUrl}>Sign in to accept</Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-11">
          <Link href={registerUrl}>Create account &amp; accept</Link>
        </Button>
        <p className="text-xs text-center text-[oklch(0.55_0_0)]">
          The invitation was sent to{' '}
          <span className="font-medium text-[oklch(0.3_0.02_160)]">
            {invitationEmail}
          </span>
        </p>
      </div>
    );
  }

  // User is logged in but with a different email
  if (!emailMatches) {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <p className="font-medium mb-1">Wrong account</p>
          <p className="text-xs">
            This invitation was sent to{' '}
            <span className="font-semibold">{invitationEmail}</span>, but
            you&apos;re signed in as{' '}
            <span className="font-semibold">{currentUserEmail}</span>.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}>
            Sign in with the correct account
          </Link>
        </Button>
      </div>
    );
  }

  // User is logged in with the correct email — show accept button
  return (
    <div className="space-y-4">
      {error && (
        <div
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <Button
        type="button"
        onClick={handleAccept}
        disabled={isPending}
        className="w-full h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
        aria-label="Accept invitation and join organisation"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Accepting…
          </span>
        ) : (
          'Accept invitation'
        )}
      </Button>
      <p className="text-xs text-center text-[oklch(0.55_0_0)]">
        Signed in as{' '}
        <span className="font-medium text-[oklch(0.3_0.02_160)]">
          {currentUserEmail}
        </span>
      </p>
    </div>
  );
}
