'use client';

/**
 * Client wrapper for the CompleteSupervisionForm on the complete page.
 * Handles navigation after successful completion.
 */

import { useRouter } from 'next/navigation';
import { CompleteSupervisionForm } from '@/components/supervisions/supervision-form';
import type { CompleteSupervisionInput } from '@/features/supervisions/schema';
import type { StaffOption } from '@/features/supervisions/actions';

type FormWrapperProps = {
  supervisionId: string;
  staffOptions: StaffOption[];
  onComplete: (data: CompleteSupervisionInput) => Promise<{ success: boolean; error?: string }>;
  returnUrl: string;
};

export function CompleteSupervisionFormWrapper({
  supervisionId,
  staffOptions,
  onComplete,
  returnUrl,
}: FormWrapperProps) {
  const router = useRouter();

  const handleSubmit = async (data: CompleteSupervisionInput) => {
    const result = await onComplete(data);
    if (result.success) {
      router.push(returnUrl);
      router.refresh();
    }
    return result;
  };

  const handleCancel = () => {
    router.push(returnUrl);
  };

  return (
    <CompleteSupervisionForm
      supervisionId={supervisionId}
      staffOptions={staffOptions}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
