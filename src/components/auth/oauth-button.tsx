'use client';

/**
 * OAuthButton — Social sign-in button for OAuth providers.
 * Currently supports Google. Triggers the Auth.js OAuth flow client-side.
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type OAuthButtonProps = {
  /** Text label for the button */
  label?: string;
  /** Where to redirect after successful sign-in */
  callbackUrl?: string;
};

/** Google "G" logo SVG — official brand colours */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * OAuthButton renders a "Continue with Google" button.
 * Clicking it triggers the Auth.js Google OAuth flow.
 */
export function OAuthButton({
  label = 'Continue with Google',
  callbackUrl = '/dashboard',
}: OAuthButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      // Auth.js redirect throws an error internally — safe to swallow
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-[oklch(0.97_0_0)] border border-[oklch(0.88_0.005_150)] text-[oklch(0.25_0.02_160)] font-medium transition-all duration-150"
      onClick={handleGoogleSignIn}
      disabled={isPending}
      aria-label="Sign in with Google"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : (
        <GoogleIcon className="h-4 w-4 shrink-0" />
      )}
      <span>{label}</span>
    </Button>
  );
}
