import { SchoolRecordForm } from '@/features/education/components/school-record-form';
import { createSchoolRecord } from '@/features/education/actions';

interface SchoolRecordFormWrapperProps {
  personId: string;
}

export function SchoolRecordFormWrapper({
  personId,
}: SchoolRecordFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createSchoolRecord(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <SchoolRecordForm onSubmit={handleSubmit} />;
}
