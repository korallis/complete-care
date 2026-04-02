import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportPayrollCsvForPeriod } from '@/features/timesheets/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  const { orgSlug } = await context.params;
  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    return new NextResponse('Not found', { status: 404 });
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage =
    hasPermission(role, 'manage', 'rota') || hasPermission(role, 'update', 'rota');

  if (!canManage) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return new NextResponse('startDate and endDate are required', { status: 400 });
  }

  const result = await exportPayrollCsvForPeriod({ startDate, endDate });
  if (!result.success) {
    return new NextResponse(result.error, { status: 400 });
  }

  return new NextResponse(result.data.csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.data.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
