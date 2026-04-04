import { redirect } from 'next/navigation';

interface SafeguardingConcernsLandingPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function SafeguardingConcernsLandingPage({
  params,
}: SafeguardingConcernsLandingPageProps) {
  const { orgSlug } = await params;

  redirect(`/${orgSlug}/safeguarding/concerns/new`);
}
