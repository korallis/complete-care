import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NOTIFIABLE_EVENT_CATEGORY_LABELS,
  type NotifiableEventCategoryType,
} from '@/features/reg44';

export const metadata: Metadata = {
  title: 'Notifiable Events (Reg 40)',
};

interface NotifiableEventsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NotifiableEventsPage({
  params,
}: NotifiableEventsPageProps) {
  const { orgSlug } = await params;

  const categories = Object.entries(NOTIFIABLE_EVENT_CATEGORY_LABELS) as [
    NotifiableEventCategoryType,
    string,
  ][];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifiable Events (Regulation 40)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record events that must be reported to Ofsted. Track notification
            dates and Ofsted reference numbers.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/reg44`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to Reg 44
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Event Categories</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {categories.map(([key, label]) => (
            <div key={key} className="rounded-md border px-3 py-2 text-sm">
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          No notifiable events recorded. Events must be reported to Ofsted
          within required timescales.
        </p>
      </div>
    </div>
  );
}
