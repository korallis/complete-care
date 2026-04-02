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
    const result = await createSdqAssessment(
      { organisationId: orgSlug, personId },
      formData,
    );
    return { success: result.success, error: result.error };
  }

  return <SdqForm onSubmit={handleSubmit} />;
}
