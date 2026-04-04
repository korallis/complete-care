import { NextResponse } from 'next/server';

interface ComplianceRedirectRouteProps {
  params: Promise<{ orgSlug: string }>;
}

export async function GET(
  request: Request,
  { params }: ComplianceRedirectRouteProps,
) {
  const { orgSlug } = await params;
  const url = new URL(`/${orgSlug}/staff/compliance`, request.url);

  return NextResponse.redirect(url);
}
