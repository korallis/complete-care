import type { Metadata } from 'next';
import { AiQueriesClient } from './client';

export const metadata: Metadata = {
  title: 'AI Data Queries',
};

export default function AiQueriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ask Your Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions in plain English and get instant answers from your care data.
        </p>
      </div>

      <AiQueriesClient />
    </div>
  );
}
