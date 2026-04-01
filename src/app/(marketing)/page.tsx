import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Care — UK Care Management Platform',
  description:
    'The only platform purpose-built for domiciliary care, supported living, and children\'s residential homes with native Ofsted + CQC compliance.',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">Complete Care</h1>
        <p className="mt-6 text-xl text-muted-foreground">
          UK Care Management Platform
        </p>
        <p className="mt-4 text-muted-foreground">
          Built for domiciliary care, supported living, and children&apos;s
          residential homes — with native Ofsted + CQC compliance.
        </p>
      </div>
    </main>
  );
}
