'use client';

import { PbsPlanForm } from '@/features/pbs/components';
import type { CreatePbsPlanInput } from '@/features/pbs/schema';

interface Props {
  personId: string;
}

export function PbsPlanPageClient({ personId }: Props) {
  async function handleSubmit(data: CreatePbsPlanInput) {
    // In production this calls the server action createPbsPlan / updatePbsPlan.
    // For now we demonstrate the form works client-side.
    console.log('PBS plan submitted:', data);
  }

  return <PbsPlanForm personId={personId} onSubmit={handleSubmit} />;
}
