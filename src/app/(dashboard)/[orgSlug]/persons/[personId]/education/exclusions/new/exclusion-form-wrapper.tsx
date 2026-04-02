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
    const result = await createExclusionRecord(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <ExclusionForm schoolRecordId={schoolRecordId} onSubmit={handleSubmit} />;
}
