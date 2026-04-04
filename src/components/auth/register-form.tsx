'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { registrationSchema, type RegistrationInput } from '@/lib/auth/validation';
import { buildVerifyEmailPath, normalizeCallbackUrl } from '@/lib/auth/callback-url';
import { PasswordStrengthIndicator } from './password-strength';
import { OAuthButton } from './oauth-button';

type RegisterFormProps = {
  callbackUrl?: string;
};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const safeCallbackUrl = normalizeCallbackUrl(callbackUrl);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegistrationInput) => {
    setServerError(null);

    const payload = safeCallbackUrl
      ? { ...data, callbackUrl: safeCallbackUrl }
      : data;

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      if (json.errors) {
        // Display the first validation error
        const firstError = Object.values(json.errors)[0];
        setServerError(firstError as string);
      } else {
        // Use the server's message (which is intentionally generic for 409 to prevent enumeration)
        setServerError(json.error ?? 'Registration failed. Please try again.');
      }
      return;
    }

    // Registration successful — prompt the user to verify their email
    // before trying to access authenticated onboarding/dashboard flows.
    router.push(buildVerifyEmailPath(safeCallbackUrl));
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <OAuthButton
        label="Continue with Google"
        callbackUrl={safeCallbackUrl ?? '/dashboard'}
      />

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground shrink-0 select-none">
          or register with email
        </span>
        <Separator className="flex-1" />
      </div>

    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
        {/* Always show the strength indicator so all unmet requirements are visible */}
        <PasswordStrengthIndicator password={passwordValue} />
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

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'confirmPassword-error' : undefined
            }
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={
              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p
            id="confirmPassword-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Separator className="my-1" />

      {/* Terms acceptance */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <input
            id="acceptTerms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-input accent-[oklch(0.22_0.04_160)]"
            aria-invalid={!!errors.acceptTerms}
            aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
            onChange={(e) => {
              setValue('acceptTerms', e.target.checked ? true : (false as unknown as true), {
                shouldValidate: true,
              });
            }}
            checked={watch('acceptTerms') === true}
          />
          <label
            htmlFor="acceptTerms"
            className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
          >
            I agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            . I understand that Complete Care processes personal data as described
            in the Privacy Policy.
          </label>
        </div>
        {errors.acceptTerms && (
          <p
            id="acceptTerms-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.28_0.05_160)] text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground pt-1">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
    </div>
  );
}
