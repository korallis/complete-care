'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { loginSchema, type LoginInput } from '@/lib/auth/validation';
import { OAuthButton } from './oauth-button';

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      setServerError(json.error ?? 'Sign in failed. Please try again.');
      return;
    }

    setIsSuccess(true);

    // Determine redirect destination:
    // 1. If an explicit callbackUrl was provided (e.g., from a protected page), honour it
    // 2. If user has an active org, go to the org-scoped dashboard
    // 3. If no org, go to onboarding
    let redirectUrl: string;
    if (callbackUrl) {
      redirectUrl = callbackUrl;
    } else if (json.orgSlug) {
      redirectUrl = `/${json.orgSlug}/dashboard`;
    } else {
      // No org yet — onboarding flow
      redirectUrl = '/onboarding';
    }

    window.location.href = redirectUrl;
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <OAuthButton
        label="Sign in with Google"
        callbackUrl={callbackUrl ?? '/dashboard'}
      />

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground shrink-0 select-none">
          or sign in with email
        </span>
        <Separator className="flex-1" />
      </div>

    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {isSuccess && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertDescription>Signed in! Redirecting…</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@organisation.co.uk"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.28_0.05_160)] text-white"
        disabled={isSubmitting || isSuccess}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground pt-2">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline"
        >
          Create account
        </Link>
      </p>
    </form>
    </div>
  );
}
