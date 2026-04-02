'use client';

import { AttendanceForm } from '@/features/education/components/attendance-form';
import { recordAttendance } from '@/features/education/actions';

interface AttendanceFormWrapperProps {
  orgSlug: string;
  personId: string;
  schoolRecordId: string;
}

export function AttendanceFormWrapper({
  orgSlug,
  personId,
  schoolRecordId,
}: AttendanceFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await recordAttendance(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <AttendanceForm schoolRecordId={schoolRecordId} onSubmit={handleSubmit} />;
}
