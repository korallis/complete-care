import type { Metadata } from 'next';
import { CustomReportsClient } from './client';

export const metadata: Metadata = {
  title: 'Custom Reports',
};

export default function CustomReportsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Custom Report Builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build custom reports by selecting data sources, filters, columns, and grouping. Export as CSV or PDF.
        </p>
      </div>

      <CustomReportsClient />
    </div>
  );
}
