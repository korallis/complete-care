import { PepForm } from '@/features/education/components/pep-form';
import { createPep } from '@/features/education/actions';

interface PepFormWrapperProps {
  personId: string;
  schools: { id: string; schoolName: string }[];
}

export function PepFormWrapper({ personId, schools }: PepFormWrapperProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData,
  ) {
    'use server';
    const result = await createPep(personId, formData);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  return <PepForm schools={schools} onSubmit={handleSubmit} />;
}
