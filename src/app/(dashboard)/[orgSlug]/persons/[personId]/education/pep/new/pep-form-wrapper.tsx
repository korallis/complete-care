'use client';

import { PepForm } from '@/features/education/components/pep-form';
import { createPep } from '@/features/education/actions';

interface PepFormWrapperProps {
  orgSlug: string;
  personId: string;
  schools: { id: string; schoolName: string }[];
}

export function PepFormWrapper({ orgSlug, personId, schools }: PepFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createPep(
      { organisationId: orgSlug, personId },
      formData,
    );
    return { success: result.success, error: result.error };
  }

  return <PepForm schools={schools} onSubmit={handleSubmit} />;
}
