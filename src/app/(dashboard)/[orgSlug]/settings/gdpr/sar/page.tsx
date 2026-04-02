import { redirect } from 'next/navigation';

interface GdprSarAliasPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function GdprSarAliasPage({ params }: GdprSarAliasPageProps) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/settings/gdpr/sars`);
}
