'use client';

import { useState } from 'react';
import { RestrictivePracticesRegister } from '@/features/pbs/components';
import type { CreateRestrictivePracticeInput } from '@/features/pbs/schema';
import type { RestrictivePractice } from '@/lib/db/schema/pbs';

interface Props {
  personId: string;
}

export function RestrictivePracticesPageClient({ personId }: Props) {
  // In production, entries would come from server action / RSC.
  const [entries, setEntries] = useState<RestrictivePractice[]>([]);

  async function handleAdd(data: CreateRestrictivePracticeInput) {
    const newEntry: RestrictivePractice = {
      id: crypto.randomUUID(),
      organisationId: '',
      personId: data.personId,
      type: data.type,
      justification: data.justification,
      mcaLink: data.mcaLink ?? null,
      authorisedBy: data.authorisedBy,
      durationMinutes: data.durationMinutes,
      personResponse: data.personResponse,
      occurredAt: new Date(data.occurredAt),
      previousVersionId: null,
      isSuperseded: false,
      versionNumber: 1,
      recordedBy: null,
      createdAt: new Date(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  }

  function handleFilter() {
    // In production: call getRestrictivePractices server action with filters.
  }

  function handleEdit(originalId: string) {
    // In production: open edit form, call editRestrictivePractice server action.
    console.log('Edit (create new version) for:', originalId);
  }

  return (
    <RestrictivePracticesRegister
      entries={entries}
      personId={personId}
      onFilter={handleFilter}
      onAdd={handleAdd}
      onEdit={handleEdit}
    />
  );
}
