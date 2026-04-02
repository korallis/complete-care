'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StaffComplianceDashboardData } from '../types';

interface StaffComplianceDashboardProps {
  data: StaffComplianceDashboardData;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500',
  due: 'bg-amber-400',
  overdue: 'bg-red-500',
  not_required: 'bg-muted',
};

const statusLabels: Record<string, string> = {
  completed: 'Completed',
  due: 'Due soon',
  overdue: 'Overdue',
  not_required: 'N/A',
};

export function StaffComplianceDashboard({ data }: StaffComplianceDashboardProps) {
  const courseNames = data.trainingMatrix.length > 0
    ? Object.keys(data.trainingMatrix[0].courses)
    : [];

  return (
    <div className="space-y-6">
      {/* Training Matrix Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium text-muted-foreground">Staff</th>
                  {courseNames.map((course) => (
                    <th
                      key={course}
                      className="p-2 text-center font-medium text-muted-foreground"
                    >
                      <span className="block max-w-[80px] truncate" title={course}>
                        {course}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.trainingMatrix.map((row) => (
                  <tr key={row.staffId} className="border-b last:border-0">
                    <td className="p-2 font-medium whitespace-nowrap">{row.staffName}</td>
                    {courseNames.map((course) => {
                      const status = row.courses[course];
                      return (
                        <td key={course} className="p-2 text-center">
                          <span
                            className={cn(
                              'inline-block h-6 w-6 rounded-sm',
                              statusColors[status],
                            )}
                            title={statusLabels[status]}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn('inline-block h-3 w-3 rounded-sm', statusColors[key])} />
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* DBS Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DBS Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <DbsRow label="Valid" count={data.dbsStatus.valid} color="bg-emerald-500" />
              <DbsRow
                label="Expiring soon"
                count={data.dbsStatus.expiringSoon}
                color="bg-amber-400"
              />
              <DbsRow label="Expired" count={data.dbsStatus.expired} color="bg-red-500" />
              <DbsRow
                label="Not recorded"
                count={data.dbsStatus.notRecorded}
                color="bg-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supervision Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supervision Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{data.supervision.compliancePercent}%</p>
                <p className="text-sm text-muted-foreground">compliance rate</p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${data.supervision.compliancePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{data.supervision.onTrack} on track</span>
                <span>{data.supervision.overdue} overdue</span>
                <span>{data.supervision.total} total</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DbsRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn('inline-block h-3 w-3 rounded-full', color)} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  );
}
