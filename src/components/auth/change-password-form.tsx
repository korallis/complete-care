'use client';

/**
 * ChangePasswordForm — allows a logged-in user to update their password.
 * Validates current password, enforces new password complexity,
 * and calls POST /api/auth/change-password.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { passwordSchema } from '@/lib/auth/validation';
import { PasswordStrengthIndicator } from './password-strength';

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setServerError(null);
    setIsSuccess(false);

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      if (json.errors?.currentPassword) {
        setServerError(json.errors.currentPassword);
      } else {
        setServerError(json.error ?? 'Failed to change password. Please try again.');
      }
      return;
    }

    setIsSuccess(true);
    reset();
  };

  if (isSuccess) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Password changed successfully</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Your password has been updated. Use your new password next time you sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Current password */}
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your current password"
            aria-invalid={!!errors.currentPassword}
            aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
            className="pr-10"
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p id="currentPassword-error" className="text-xs text-destructive" role="alert">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong new password"
            aria-invalid={!!errors.newPassword}
            aria-describedby="newPassword-hint"
            className="pr-10"
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <div id="newPassword-hint">
          <PasswordStrengthIndicator password={newPasswordValue} />
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive" role="alert">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm new password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.28_0.05_160)] text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Updating password…
          </>
        ) : (
          'Change password'
        )}
      </Button>
    </form>
  );
}
