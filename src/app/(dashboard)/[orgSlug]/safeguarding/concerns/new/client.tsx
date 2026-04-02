'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConcernForm } from '@/features/safeguarding/components';
import { createConcern } from '@/features/safeguarding/actions';
import type { CreateConcernInput } from '@/features/safeguarding/schema';

type PersonOption = { id: string; name: string };

interface NewConcernPageClientProps {
  orgSlug: string;
  childId: string;
  childName: string;
  personOptions: PersonOption[];
}

export function NewConcernPageClient({
  orgSlug,
  childId: initialChildId,
  childName: initialChildName,
  personOptions,
}: NewConcernPageClientProps) {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState(initialChildId);
  const [selectedChildName, setSelectedChildName] = useState(initialChildName);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(!initialChildId);

  const filteredPersons = search.trim()
    ? personOptions.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : personOptions;

  async function handleSubmit(data: CreateConcernInput) {
    const result = await createConcern(data);
    if (result.success) {
      toast.success('Safeguarding concern recorded');
      router.push(`/${orgSlug}/safeguarding`);
    } else {
      toast.error(result.error ?? 'Failed to record concern');
    }
  }

  // If no child selected, show picker
  if (showPicker || !selectedChildId) {
    return (
      <div className="space-y-4">
        {/* Child picker */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-3">
            Select the child this concern relates to
          </h2>
          <input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors mb-3"
            autoFocus
          />
          {filteredPersons.length === 0 ? (
            <p className="py-4 text-center text-sm text-[oklch(0.55_0_0)]">
              {search ? 'No matching children found.' : 'No children found in this organisation.'}
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-[oklch(0.94_0.005_160)] rounded-lg border border-[oklch(0.91_0.005_160)]">
              {filteredPersons.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm font-medium text-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:bg-[oklch(0.95_0.01_160)]"
                    onClick={() => {
                      setSelectedChildId(p.id);
                      setSelectedChildName(p.name);
                      setShowPicker(false);
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-center text-[oklch(0.55_0_0)]">
          You can also navigate to a child&apos;s profile and raise the concern from there.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected child banner */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.97_0.005_160)] px-4 py-3">
        <div>
          <p className="text-xs text-[oklch(0.55_0_0)]">Recording concern for</p>
          <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            {selectedChildName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="text-xs text-[oklch(0.45_0.07_160)] hover:text-[oklch(0.35_0.06_160)] underline"
        >
          Change
        </button>
      </div>

      <ConcernForm
        childId={selectedChildId}
        childName={selectedChildName}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
