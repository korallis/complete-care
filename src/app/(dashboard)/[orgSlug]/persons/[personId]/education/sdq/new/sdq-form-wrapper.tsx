'use client';

import { SdqForm } from '@/features/education/components/sdq-form';
import { createSdqAssessment } from '@/features/education/actions';

interface SdqFormWrapperProps {
  orgSlug: string;
  personId: string;
}

export function SdqFormWrapper({ orgSlug, personId }: SdqFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createSdqAssessment(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <SdqForm onSubmit={handleSubmit} />;
}
