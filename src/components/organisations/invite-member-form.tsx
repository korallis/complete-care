'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { inviteMember } from '@/features/organisations/actions';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior_carer', label: 'Senior Carer' },
  { value: 'carer', label: 'Carer' },
  { value: 'viewer', label: 'Viewer' },
];

interface InviteMemberFormProps {
  orgId: string;
  orgSlug: string;
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('carer');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{
    email?: string;
    role?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState('');

  async function handleInvite() {
    setError('');
    setFieldError({});
    setSuccessMessage('');

    if (!email.trim()) {
      setFieldError({ email: 'Email address is required' });
      return;
    }

    startTransition(async () => {
      const result = await inviteMember(orgId, { email, role });

      if (!result.success) {
        if (result.field) {
          setFieldError({ [result.field]: result.error });
        } else {
          setError(result.error);
        }
        return;
      }

      setSuccessMessage(`Invitation sent to ${email}`);
      setEmail('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label
            htmlFor="invite-email"
            className="text-xs font-medium text-[oklch(0.38_0.02_160)]"
          >
            Email address
          </Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError((prev) => ({ ...prev, email: undefined }));
              setSuccessMessage('');
            }}
            aria-invalid={!!fieldError.email}
            aria-describedby={fieldError.email ? 'invite-email-error' : undefined}
            className="h-10"
          />
          {fieldError.email && (
            <p
              id="invite-email-error"
              className="text-xs text-red-600"
              role="alert"
            >
              {fieldError.email}
            </p>
          )}
        </div>

        <div className="w-40 space-y-1.5">
          <Label
            htmlFor="invite-role"
            className="text-xs font-medium text-[oklch(0.38_0.02_160)]"
          >
            Role
          </Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Select role for invitee"
            className="h-10"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="self-end">
          <Button
            type="button"
            onClick={handleInvite}
            disabled={isPending}
            className="bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold h-10 px-4"
            aria-label="Send invitation"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-3.5 h-3.5"
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
                Sending…
              </span>
            ) : (
              <>
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
                  <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
                Invite
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {successMessage}
        </div>
      )}
    </div>
  );
}
