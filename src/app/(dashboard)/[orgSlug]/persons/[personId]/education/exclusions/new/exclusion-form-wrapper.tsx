'use client';

import { ExclusionForm } from '@/features/education/components/exclusion-form';
import { createExclusionRecord } from '@/features/education/actions';

interface ExclusionFormWrapperProps {
  orgSlug: string;
  personId: string;
  schoolRecordId: string;
}

export function ExclusionFormWrapper({
  orgSlug,
  personId,
  schoolRecordId,
}: ExclusionFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createExclusionRecord(
      { organisationId: orgSlug, personId },
      formData,
    );
    return { success: result.success, error: result.error };
  }

  return <ExclusionForm schoolRecordId={schoolRecordId} onSubmit={handleSubmit} />;
}
