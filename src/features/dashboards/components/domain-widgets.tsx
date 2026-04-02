'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from './kpi-card';
import type {
  DomiciliaryDashboardData,
  SupportedLivingDashboardData,
  ChildrensDashboardData,
} from '../types';

// ─── Domiciliary ─────────────────────────────────────────────────────────

interface DomiciliaryWidgetProps {
  data: DomiciliaryDashboardData;
}

export function DomiciliaryWidget({ data }: DomiciliaryWidgetProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Domiciliary Care
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard metric={data.visitCompletionRate} />
        <KpiCard metric={data.missedVisitsToday} />
        <KpiCard metric={data.travelTimeAverage} />
      </div>
    </div>
  );
}

// ─── Supported Living ────────────────────────────────────────────────────

interface SupportedLivingWidgetProps {
  data: SupportedLivingDashboardData;
}

export function SupportedLivingWidget({ data }: SupportedLivingWidgetProps) {
  const goalData = [
    { name: 'Red', value: data.goalProgress.red, fill: 'var(--color-destructive)' },
    { name: 'Amber', value: data.goalProgress.amber, fill: 'var(--color-chart-4)' },
    { name: 'Green', value: data.goalProgress.green, fill: '#22c55e' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Supported Living
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Progress (RAG)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={50}
                  />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restrictive Practice Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.restrictivePracticeTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-chart-3)"
                    fill="var(--color-chart-3)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Children's Homes ────────────────────────────────────────────────────

interface ChildrensWidgetProps {
  data: ChildrensDashboardData;
}

export function ChildrensWidget({ data }: ChildrensWidgetProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {"Children's Homes"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard metric={data.ofstedReadinessScore} />
        <KpiCard metric={data.missingEpisodes} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restraint Count Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.restraintCountTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="var(--color-chart-5)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
