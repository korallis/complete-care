'use client';

/**
 * DSL Review Dashboard — Client Component
 *
 * Manages concern selection and DSL review form state.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConcernList } from '@/features/safeguarding/components/concern-list';
import { DslReviewForm } from '@/features/safeguarding/components/dsl-review-form';
import { createDslReview } from '@/features/safeguarding/actions';
import type { SafeguardingConcern } from '@/lib/db/schema/safeguarding';
import type { CreateDslReviewInput } from '@/features/safeguarding/schema';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DslReviewClientProps {
  concerns: SafeguardingConcern[];
}

export function DslReviewClient({ concerns }: DslReviewClientProps) {
  const router = useRouter();
  const [selectedConcern, setSelectedConcern] =
    useState<SafeguardingConcern | null>(null);

  async function handleReviewSubmit(data: CreateDslReviewInput) {
    const result = await createDslReview(data);
    if (result.success) {
      toast.success('DSL review recorded successfully');
      setSelectedConcern(null);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed to record review');
    }
  }

  if (selectedConcern) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedConcern(null)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to concerns
        </Button>
        <DslReviewForm
          concern={selectedConcern}
          onSubmit={handleReviewSubmit}
          onCancel={() => setSelectedConcern(null)}
        />
      </div>
    );
  }

  return (
    <ConcernList
      concerns={concerns}
      onSelectConcern={setSelectedConcern}
      showChildColumn
      emptyMessage="No open safeguarding concerns. All concerns have been reviewed or there are none to review."
    />
  );
}
