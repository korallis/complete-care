import { PpPlusForm } from '@/features/education/components/pp-plus-form';
import { createPupilPremiumPlusRecord } from '@/features/education/actions';

interface PpPlusFormWrapperProps {
  personId: string;
}

export function PpPlusFormWrapper({ personId }: PpPlusFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createPupilPremiumPlusRecord(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <PpPlusForm onSubmit={handleSubmit} />;
}
