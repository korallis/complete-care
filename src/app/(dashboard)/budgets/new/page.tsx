import type { Metadata } from 'next';
import Link from 'next/link';
import { BudgetDraftForm } from './budget-draft-form';

export const metadata: Metadata = {
  title: 'New Personal Budget',
};

export default function NewBudgetPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[oklch(0.55_0.06_232)]">
            Personal budgets
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Start a new budget outline
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
            Capture commissioner, value, and review-window details without
            dropping back to a 404. This keeps the browser workflow intact while
            the full persistence path is finished.
          </p>
        </div>

        <Link
          href="/budgets"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to budgets
        </Link>
      </div>

      <BudgetDraftForm />
    </div>
  );
}
