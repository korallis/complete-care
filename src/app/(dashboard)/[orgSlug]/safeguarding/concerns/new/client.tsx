'use client';

import { useRouter } from 'next/navigation';
import { ConcernForm } from '@/features/safeguarding/components';
import { createConcern } from '@/features/safeguarding/actions';
import type { CreateConcernInput } from '@/features/safeguarding/schema';

interface NewConcernPageClientProps {
  orgSlug: string;
  childId: string;
  childName: string;
}

export function NewConcernPageClient({
  orgSlug,
  childId,
  childName,
}: NewConcernPageClientProps) {
  const router = useRouter();

  async function handleSubmit(data: CreateConcernInput) {
    const result = await createConcern(data);
    if (result.success) {
      router.push(`/${orgSlug}/safeguarding`);
    } else {
      // In production, show a toast notification
      console.error('Failed to create concern:', result.error);
    }
  }

  return (
    <ConcernForm
      childId={childId}
      childName={childName}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
