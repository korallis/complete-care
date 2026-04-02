'use client';

import { useState, useEffect, useCallback } from 'react';
import { KpiCard } from './kpi-card';
import { TrendChart } from './trend-chart';
import { DomiciliaryWidget, SupportedLivingWidget, ChildrensWidget } from './domain-widgets';
import { StaffComplianceDashboard } from './staff-compliance-dashboard';
import { CqcDashboard } from './cqc-dashboard';
import { DateRangePicker } from './date-range-picker';
import {
  buildDateRange,
  getOperationalDashboard,
  getDomiciliaryDashboard,
  getSupportedLivingDashboard,
  getChildrensDashboard,
  getTrendData,
  getStaffComplianceDashboard,
  getCqcDashboard,
} from '../actions';
import type {
  DateRangePreset,
  OperationalDashboardData,
  DomiciliaryDashboardData,
  SupportedLivingDashboardData,
  ChildrensDashboardData,
  TrendSeries,
  StaffComplianceDashboardData,
  CqcDashboardData,
} from '../types';

type TabId = 'overview' | 'staff' | 'cqc';

interface OperationalDashboardProps {
  organisationId: string;
  /** Which care domains the org has active */
  domains: string[];
}

export function OperationalDashboard({ organisationId, domains }: OperationalDashboardProps) {
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);

  // Data state
  const [operational, setOperational] = useState<OperationalDashboardData | null>(null);
  const [domiciliary, setDomiciliary] = useState<DomiciliaryDashboardData | null>(null);
  const [supportedLiving, setSupportedLiving] = useState<SupportedLivingDashboardData | null>(null);
  const [childrens, setChildrens] = useState<ChildrensDashboardData | null>(null);
  const [trends, setTrends] = useState<TrendSeries[]>([]);
  const [staffCompliance, setStaffCompliance] = useState<StaffComplianceDashboardData | null>(null);
  const [cqc, setCqc] = useState<CqcDashboardData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const range = buildDateRange(preset);

    const promises: Promise<void>[] = [
      getOperationalDashboard(organisationId, range).then(setOperational),
      getTrendData(organisationId, range).then(setTrends),
    ];

    if (domains.includes('domiciliary_care')) {
      promises.push(getDomiciliaryDashboard(organisationId, range).then(setDomiciliary));
    }
    if (domains.includes('supported_living')) {
      promises.push(getSupportedLivingDashboard(organisationId, range).then(setSupportedLiving));
    }
    if (domains.includes('childrens_homes')) {
      promises.push(getChildrensDashboard(organisationId, range).then(setChildrens));
    }

    if (activeTab === 'staff') {
      promises.push(getStaffComplianceDashboard(organisationId, range).then(setStaffCompliance));
    }
    if (activeTab === 'cqc') {
      promises.push(getCqcDashboard(organisationId, range).then(setCqc));
    }

    await Promise.all(promises);
    setLoading(false);
  }, [organisationId, preset, activeTab, domains]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'staff', label: 'Staff Compliance' },
    { id: 'cqc', label: 'CQC Evidence' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operational Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Key performance indicators and trends across your organisation
          </p>
        </div>
        <DateRangePicker value={preset} onChange={setPreset} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {!loading && activeTab === 'overview' && operational && (
        <div className="space-y-8">
          {/* Main KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard metric={operational.activePersons} />
            <KpiCard metric={operational.staffComplianceRate} />
            <KpiCard metric={operational.overdueCarePlanReviews} />
            <KpiCard metric={operational.medicationIncidents} />
            <KpiCard metric={operational.upcomingDbsRenewals} />
            <KpiCard metric={operational.trainingCompliance} />
            <KpiCard metric={operational.openSafeguardingConcerns} />
          </div>

          {/* Trend Charts */}
          <TrendChart title="Key Metrics Over Time" series={trends} />

          {/* Domain Widgets */}
          {domiciliary && <DomiciliaryWidget data={domiciliary} />}
          {supportedLiving && <SupportedLivingWidget data={supportedLiving} />}
          {childrens && <ChildrensWidget data={childrens} />}
        </div>
      )}

      {!loading && activeTab === 'staff' && staffCompliance && (
        <StaffComplianceDashboard data={staffCompliance} />
      )}

      {!loading && activeTab === 'cqc' && cqc && (
        <CqcDashboard data={cqc} />
      )}
    </div>
  );
}
