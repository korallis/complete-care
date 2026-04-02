'use client';

import { SchoolRecordForm } from '@/features/education/components/school-record-form';
import { createSchoolRecord } from '@/features/education/actions';

interface SchoolRecordFormWrapperProps {
  orgSlug: string;
  personId: string;
}

export function SchoolRecordFormWrapper({
  orgSlug,
  personId,
}: SchoolRecordFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createSchoolRecord(
      { organisationId: orgSlug, personId },
      formData,
    );
    return { success: result.success, error: result.error };
  }

  return <SchoolRecordForm onSubmit={handleSubmit} />;
}
