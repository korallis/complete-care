'use client';

import { NlQueryInput } from '@/features/ai-queries';
import { executeNlQuery, getSuggestedQueries } from '@/features/ai-queries/actions';
import { useState, useEffect } from 'react';
import type { SuggestedQuery } from '@/features/ai-queries/types';

export function AiQueriesClient() {
  const [suggestedQueries, setSuggestedQueries] = useState<SuggestedQuery[]>([]);

  useEffect(() => {
    getSuggestedQueries().then(setSuggestedQueries);
  }, []);

  return (
    <NlQueryInput
      suggestedQueries={suggestedQueries}
      onExecute={async (query) => {
        // TODO: Pass actual org ID from auth context
        const res = await executeNlQuery('placeholder-org-id', query);
        return { result: res.result, error: res.error };
      }}
    />
  );
}
