import { redirect } from 'next/navigation';

interface ComplianceAliasPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ComplianceAliasPage({
  params,
}: ComplianceAliasPageProps) {
  const { orgSlug } = await params;

  redirect(`/${orgSlug}/staff/compliance`);
}
