import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import {
  approveTimesheetsForPeriod,
  generateTimesheetsForPeriod,
  getPayrollSummaryForPeriod,
  listTimesheetsForPeriod,
} from '@/features/timesheets/actions';

interface RosteringPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ date?: string; status?: string; error?: string }>;
}

export const metadata: Metadata = {
  title: 'Rostering & Payroll -- Complete Care',
};

function getWeekRange(dateParam?: string) {
  const today = dateParam ? new Date(dateParam) : new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function buildPagePath(
  orgSlug: string,
  startDate: string,
  params: { status?: string; error?: string } = {},
) {
  const search = new URLSearchParams({ date: startDate });

  if (params.status) search.set('status', params.status);
  if (params.error) search.set('error', params.error);

  return `/${orgSlug}/rostering?${search.toString()}`;
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'default' as const;
    case 'submitted':
      return 'secondary' as const;
    case 'rejected':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export default async function RosteringPage({
  params,
  searchParams,
}: RosteringPageProps) {
  const { orgSlug } = await params;
  const { date: dateParam, status, error } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((membership) => membership.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/${orgSlug}/dashboard`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage =
    hasPermission(role, 'manage', 'rota') || hasPermission(role, 'update', 'rota');
  const { startDate, endDate } = getWeekRange(dateParam);

  async function handleGenerateTimesheets() {
    'use server';

    const result = await generateTimesheetsForPeriod({ startDate, endDate });
    redirect(
      buildPagePath(orgSlug, startDate, result.success
        ? { status: `generated-${result.data.created}-timesheets` }
        : { error: result.error }),
    );
  }

  async function handleApproveTimesheets() {
    'use server';

    const result = await approveTimesheetsForPeriod({ startDate, endDate });
    redirect(
      buildPagePath(orgSlug, startDate, result.success
        ? { status: `approved-${result.data.approved}-timesheets` }
        : { error: result.error }),
    );
  }

  const [timesheetRows, payrollSummary] = await Promise.all([
    listTimesheetsForPeriod({ startDate, endDate }),
    getPayrollSummaryForPeriod({ startDate, endDate }),
  ]);

  const statusCounts = timesheetRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[oklch(0.9_0.01_160)] bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[oklch(0.55_0.02_160)]">
            Lane 3 · rota → timesheets → payroll
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[oklch(0.18_0.03_160)]">
              Rostering & payroll
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[oklch(0.48_0_0)]">
              Review generated timesheets, approve weekly entries, and export payroll-ready CSV for {formatWeekLabel(startDate, endDate)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[oklch(0.45_0.01_160)]">
            <Link className="underline underline-offset-4" href={`/${orgSlug}/scheduling?date=${startDate}`}>
              Open rota week
            </Link>
            <span>•</span>
            <span>Payroll totals currently derive from the shift multiplier against the default £12 base rate until staff-specific rate cards land.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <>
              <form action={handleGenerateTimesheets}>
                <Button type="submit" variant="outline">Generate timesheets</Button>
              </form>
              <form action={handleApproveTimesheets}>
                <Button type="submit">Approve ready entries</Button>
              </form>
              <Button asChild variant="secondary">
                <Link href={`/${orgSlug}/rostering/payroll?startDate=${startDate}&endDate=${endDate}`}>
                  Export payroll CSV
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {(status || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {(typeof error === 'string' && error) || status?.replace(/-/g, ' ')}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Timesheet rows</CardDescription>
            <CardTitle>{timesheetRows.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Draft {statusCounts.draft ?? 0} · Submitted {statusCounts.submitted ?? 0} · Approved {statusCounts.approved ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payroll staff</CardDescription>
            <CardTitle>{payrollSummary.staffCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Approved or paid staff included in this export window.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total approved hours</CardDescription>
            <CardTitle>{payrollSummary.totalHours.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Overtime {payrollSummary.totalOvertimeHours.toFixed(2)} hours.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payroll value</CardDescription>
            <CardTitle>£{payrollSummary.totalAmount.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Generated from approved entries for this week.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly timesheets</CardTitle>
          <CardDescription>
            Generated from assigned rota shifts inside the selected week. Managers can approve directly once entries are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheetRows.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No timesheets exist for this week yet. Generate them from assigned rota shifts to start the approval and payroll export flow.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Total hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheetRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{String(row.shiftDate).slice(0, 10)}</TableCell>
                    <TableCell>{row.staffName ?? 'Unknown staff'}</TableCell>
                    <TableCell>{row.scheduledStart.slice(0, 5)} - {row.scheduledEnd.slice(0, 5)}</TableCell>
                    <TableCell>{(row.totalHours ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll preview</CardTitle>
          <CardDescription>
            Approved entries only. Use the CSV export button to create an auditable export record and download the payroll file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollSummary.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No approved entries are available yet. Approve weekly timesheets to populate the payroll export.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollSummary.rows.map((row) => (
                  <TableRow key={row.staffId}>
                    <TableCell>{row.staffName}</TableCell>
                    <TableCell>{row.hoursWorked.toFixed(2)}</TableCell>
                    <TableCell>{row.overtimeHours.toFixed(2)}</TableCell>
                    <TableCell>£{row.payRate.toFixed(2)}</TableCell>
                    <TableCell>£{row.totalPay.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
