import { redirect } from 'next/navigation';

interface OrgEmarLandingPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgEmarLandingPage({
  params,
}: OrgEmarLandingPageProps) {
  const { orgSlug } = await params;

  redirect(`/${orgSlug}/emar/stock`);
}
