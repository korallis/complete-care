'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { ShieldAlert, Siren, CarFront, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ClientEnvironmentForm,
  SosButton,
  TravelTimeCard,
  WelfareCheckPanel,
} from '@/features/travel-safety/components';
import type { Role } from '@/lib/rbac/permissions';
import { hasPermission } from '@/lib/rbac/permissions';
import type {
  ClientEnvironment,
  LoneWorkerConfig,
  SosAlert,
  TravelRecord,
  WelfareCheck,
} from '@/lib/db/schema/visit-tasks';

type StaffMember = {
  id: string;
  name: string | null;
};

type ClientOption = {
  id: string;
  fullName: string;
};

type PageActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface TravelSafetyPageClientProps {
  orgId: string;
  orgSlug: string;
  currentUserId: string;
  role: Role;
  staffMembers: StaffMember[];
  clientOptions: ClientOption[];
  travelRecords: TravelRecord[];
  welfareChecks: WelfareCheck[];
  sosAlerts: SosAlert[];
  clientEnvironments: ClientEnvironment[];
  loneWorkerConfig: LoneWorkerConfig | null;
  onCreateSosAlert: (input: {
    organisationId: string;
    carerId: string;
    latitude?: number;
    longitude?: number;
    accuracyMetres?: number;
    message?: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onAcknowledgeSosAlert: (input: {
    id: string;
    organisationId: string;
    acknowledgedBy: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onResolveSosAlert: (input: {
    id: string;
    organisationId: string;
    resolvedBy: string;
    status: 'resolved' | 'false_alarm';
    resolutionNotes?: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onCheckInWelfare: (input: {
    id: string;
    organisationId: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onResolveWelfareCheck: (input: {
    id: string;
    organisationId: string;
    respondedBy: string;
    resolution: 'safe' | 'false_alarm' | 'emergency_services_contacted' | 'unable_to_contact';
    resolutionNotes?: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onUpsertClientEnvironment: (input: {
    organisationId: string;
    clientId: string;
    clientName: string;
    keySafeCodeEncrypted?: string;
    keySafeLocation?: string;
    accessInstructions?: string;
    riskNotes?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    parkingInfo?: string;
    environmentNotes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    mobilityConsiderations?: string;
  }) => Promise<PageActionResult<{ id: string }>>;
  onUpsertLoneWorkerConfig: (input: {
    organisationId: string;
    welfareCheckBufferMinutes: number;
    escalationDelayMinutes: number;
    gpsTrackingEnabled: boolean;
    gpsPingIntervalSeconds: number;
    sosEnabled: boolean;
    autoEmergencyCallEnabled: boolean;
    autoEmergencyCallDelayMinutes: number;
  }) => Promise<PageActionResult<{ id: string }>>;
}

const DEFAULT_CONFIG = {
  welfareCheckBufferMinutes: 15,
  escalationDelayMinutes: 15,
  gpsTrackingEnabled: true,
  gpsPingIntervalSeconds: 60,
  sosEnabled: true,
  autoEmergencyCallEnabled: false,
  autoEmergencyCallDelayMinutes: 60,
};

function maskSecret(value: string | null) {
  if (!value) {
    return '—';
  }

  return '•'.repeat(Math.max(4, Math.min(value.length, 8)));
}

function formatTimestamp(value: Date | string | null) {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function TravelSafetyPageClient({
  orgId,
  orgSlug,
  currentUserId,
  role,
  staffMembers,
  clientOptions,
  travelRecords,
  welfareChecks,
  sosAlerts,
  clientEnvironments,
  loneWorkerConfig,
  onCreateSosAlert,
  onAcknowledgeSosAlert,
  onResolveSosAlert,
  onCheckInWelfare,
  onResolveWelfareCheck,
  onUpsertClientEnvironment,
  onUpsertLoneWorkerConfig,
}: TravelSafetyPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeChecks, setActiveChecks] = useState(welfareChecks);
  const [activeAlerts, setActiveAlerts] = useState(sosAlerts);
  const [environmentRecords, setEnvironmentRecords] = useState(clientEnvironments);
  const [selectedClientId, setSelectedClientId] = useState(clientOptions[0]?.id ?? '');
  const [configDraft, setConfigDraft] = useState({
    welfareCheckBufferMinutes:
      loneWorkerConfig?.welfareCheckBufferMinutes ?? DEFAULT_CONFIG.welfareCheckBufferMinutes,
    escalationDelayMinutes:
      loneWorkerConfig?.escalationDelayMinutes ?? DEFAULT_CONFIG.escalationDelayMinutes,
    gpsTrackingEnabled:
      loneWorkerConfig?.gpsTrackingEnabled ?? DEFAULT_CONFIG.gpsTrackingEnabled,
    gpsPingIntervalSeconds:
      loneWorkerConfig?.gpsPingIntervalSeconds ?? DEFAULT_CONFIG.gpsPingIntervalSeconds,
    sosEnabled: loneWorkerConfig?.sosEnabled ?? DEFAULT_CONFIG.sosEnabled,
    autoEmergencyCallEnabled:
      loneWorkerConfig?.autoEmergencyCallEnabled ?? DEFAULT_CONFIG.autoEmergencyCallEnabled,
    autoEmergencyCallDelayMinutes:
      loneWorkerConfig?.autoEmergencyCallDelayMinutes ??
      DEFAULT_CONFIG.autoEmergencyCallDelayMinutes,
  });

  const canManageRota = hasPermission(role, 'manage', 'rota');
  const canUpdateRota = hasPermission(role, 'update', 'rota');
  const canUpdatePersons = hasPermission(role, 'update', 'persons');

  const selectedClient = useMemo(
    () => clientOptions.find((client) => client.id === selectedClientId) ?? null,
    [clientOptions, selectedClientId],
  );

  const selectedEnvironment = useMemo(
    () =>
      environmentRecords.find((record) => record.clientId === selectedClientId) ?? null,
    [environmentRecords, selectedClientId],
  );

  const overdueJourneys = travelRecords.filter((record) => record.isOverdue).length;

  const summaryCards = [
    {
      label: 'Journeys logged',
      value: travelRecords.length,
      icon: CarFront,
      tone: 'text-sky-700 bg-sky-50 border-sky-100',
    },
    {
      label: 'Active welfare checks',
      value: activeChecks.length,
      icon: ShieldAlert,
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      label: 'Active SOS alerts',
      value: activeAlerts.length,
      icon: Siren,
      tone: 'text-rose-700 bg-rose-50 border-rose-100',
    },
    {
      label: 'Environment records',
      value: environmentRecords.length,
      icon: Settings2,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
  ];

  function runAction(work: () => Promise<void>) {
    startTransition(() => {
      void work();
    });
  }

  function handleTriggerSos(position?: {
    latitude: number;
    longitude: number;
    accuracyMetres?: number;
  }) {
    runAction(async () => {
      const result = await onCreateSosAlert({
        organisationId: orgId,
        carerId: currentUserId,
        latitude: position?.latitude,
        longitude: position?.longitude,
        accuracyMetres: position?.accuracyMetres,
        message: 'Emergency assistance requested from the travel safety dashboard',
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to send SOS alert');
        return;
      }

      setActiveAlerts((current) => [
        {
          id: result.data.id,
          organisationId: orgId,
          carerId: currentUserId,
          visitId: null,
          latitude: position?.latitude ?? null,
          longitude: position?.longitude ?? null,
          accuracyMetres: position?.accuracyMetres ?? null,
          message: 'Emergency assistance requested from the travel safety dashboard',
          status: 'active',
          acknowledgedBy: null,
          acknowledgedAt: null,
          resolvedBy: null,
          resolvedAt: null,
          resolutionNotes: null,
          createdAt: new Date(),
        },
        ...current,
      ]);
      toast.success('SOS alert sent');
    });
  }

  function handleAcknowledgeAlert(id: string) {
    runAction(async () => {
      const result = await onAcknowledgeSosAlert({
        id,
        organisationId: orgId,
        acknowledgedBy: currentUserId,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to acknowledge SOS alert');
        return;
      }

      setActiveAlerts((current) => current.filter((alert) => alert.id !== id));
      toast.success('SOS alert acknowledged');
    });
  }

  function handleResolveAlert(id: string) {
    runAction(async () => {
      const result = await onResolveSosAlert({
        id,
        organisationId: orgId,
        resolvedBy: currentUserId,
        status: 'resolved',
        resolutionNotes: 'Resolved from the travel safety dashboard',
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to resolve SOS alert');
        return;
      }

      setActiveAlerts((current) => current.filter((alert) => alert.id !== id));
      toast.success('SOS alert resolved');
    });
  }

  function handleCheckInWelfare(id: string) {
    runAction(async () => {
      const result = await onCheckInWelfare({
        id,
        organisationId: orgId,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to check in welfare alert');
        return;
      }

      setActiveChecks((current) => current.filter((check) => check.id !== id));
      toast.success('Welfare check confirmed safe');
    });
  }

  function handleResolveWelfare(
    id: string,
    resolution: string,
    resolutionNotes?: string,
  ) {
    runAction(async () => {
      const result = await onResolveWelfareCheck({
        id,
        organisationId: orgId,
        respondedBy: currentUserId,
        resolution:
          resolution === 'false_alarm'
            ? 'false_alarm'
            : 'safe',
        resolutionNotes,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to resolve welfare check');
        return;
      }

      setActiveChecks((current) => current.filter((check) => check.id !== id));
      toast.success('Welfare check resolved');
    });
  }

  function handleSaveEnvironment(data: {
    clientName: string;
    keySafeCodeEncrypted?: string;
    keySafeLocation?: string;
    accessInstructions?: string;
    riskNotes?: string;
    riskLevel: string;
    parkingInfo?: string;
    environmentNotes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    mobilityConsiderations?: string;
  }) {
    if (!selectedClient) {
      toast.error('Select a client before saving an environment record');
      return;
    }

    runAction(async () => {
      const result = await onUpsertClientEnvironment({
        organisationId: orgId,
        clientId: selectedClient.id,
        clientName: data.clientName,
        keySafeCodeEncrypted: data.keySafeCodeEncrypted,
        keySafeLocation: data.keySafeLocation,
        accessInstructions: data.accessInstructions,
        riskNotes: data.riskNotes,
        riskLevel: data.riskLevel as 'low' | 'medium' | 'high' | 'critical',
        parkingInfo: data.parkingInfo,
        environmentNotes: data.environmentNotes,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        mobilityConsiderations: data.mobilityConsiderations,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to save environment record');
        return;
      }

      setEnvironmentRecords((current) => {
        const nextRecord: ClientEnvironment = {
          id: result.data.id,
          organisationId: orgId,
          clientId: selectedClient.id,
          clientName: data.clientName,
          keySafeCodeEncrypted: data.keySafeCodeEncrypted ?? null,
          keySafeLocation: data.keySafeLocation ?? null,
          accessInstructions: data.accessInstructions ?? null,
          riskNotes: data.riskNotes ?? null,
          riskLevel: data.riskLevel as ClientEnvironment['riskLevel'],
          parkingInfo: data.parkingInfo ?? null,
          environmentNotes: data.environmentNotes ?? null,
          emergencyContactName: data.emergencyContactName ?? null,
          emergencyContactPhone: data.emergencyContactPhone ?? null,
          mobilityConsiderations: data.mobilityConsiderations ?? null,
          lastVerifiedAt: new Date(),
          lastVerifiedBy: currentUserId,
          createdAt: selectedEnvironment?.createdAt ?? new Date(),
          updatedAt: new Date(),
        };

        const existingIndex = current.findIndex(
          (record) => record.clientId === selectedClient.id,
        );

        if (existingIndex === -1) {
          return [...current, nextRecord].sort((a, b) =>
            a.clientName.localeCompare(b.clientName),
          );
        }

        const updated = [...current];
        updated[existingIndex] = nextRecord;
        return updated;
      });

      toast.success('Environment record saved');
    });
  }

  function handleSaveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    runAction(async () => {
      const result = await onUpsertLoneWorkerConfig({
        organisationId: orgId,
        welfareCheckBufferMinutes: configDraft.welfareCheckBufferMinutes,
        escalationDelayMinutes: configDraft.escalationDelayMinutes,
        gpsTrackingEnabled: configDraft.gpsTrackingEnabled,
        gpsPingIntervalSeconds: configDraft.gpsPingIntervalSeconds,
        sosEnabled: configDraft.sosEnabled,
        autoEmergencyCallEnabled: configDraft.autoEmergencyCallEnabled,
        autoEmergencyCallDelayMinutes: configDraft.autoEmergencyCallDelayMinutes,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to save lone-worker settings');
        return;
      }

      toast.success('Lone-worker settings saved');
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.97_0.01_200)] px-3 py-1 text-xs font-medium text-[oklch(0.34_0.07_220)]">
            <ShieldAlert className="h-3.5 w-3.5" />
            Domiciliary travel & lone-worker controls
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[oklch(0.2_0.03_200)]">
            Travel & safety operations
          </h1>
          <p className="max-w-3xl text-sm text-[oklch(0.45_0.01_200)]">
            Review real travel-time variance, respond to welfare and SOS events,
            and keep client access details current for field teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${orgSlug}/visits`}
            className="inline-flex items-center rounded-xl border border-[oklch(0.88_0.01_200)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.28_0.03_200)] transition hover:bg-[oklch(0.98_0.004_200)]"
          >
            EVV dashboard
          </Link>
          <Link
            href={`/${orgSlug}/scheduling`}
            className="inline-flex items-center rounded-xl border border-[oklch(0.88_0.01_200)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.28_0.03_200)] transition hover:bg-[oklch(0.98_0.004_200)]"
          >
            Scheduling
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 shadow-sm ${card.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{card.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-4 text-3xl font-semibold tabular-nums">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
                Travel performance
              </h2>
              <p className="text-sm text-[oklch(0.48_0.01_200)]">
                Last 30 days of logged journeys and travel variance.
              </p>
            </div>
            {overdueJourneys > 0 && (
              <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {overdueJourneys} overdue journey{overdueJourneys === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <TravelTimeCard records={travelRecords} />
        </section>

        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
                SOS control
              </h2>
              <p className="text-sm text-[oklch(0.48_0.01_200)]">
                Persistent panic alert for carers, with live active-alert tracking.
              </p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              High priority
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <SosButton
                onTrigger={handleTriggerSos}
                disabled={isPending || !configDraft.sosEnabled}
              />
            </div>

            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[oklch(0.9_0.008_200)] bg-[oklch(0.985_0.003_200)] p-5 text-sm text-[oklch(0.48_0.01_200)]">
                  No active SOS alerts.
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-rose-900">
                          SOS alert raised {formatTimestamp(alert.createdAt)}
                        </div>
                        <p className="text-sm text-rose-800">
                          {alert.message ?? 'Emergency assistance requested'}
                        </p>
                        <p className="text-xs text-rose-700">
                          Coordinates:{' '}
                          {alert.latitude != null && alert.longitude != null
                            ? `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`
                            : 'Unavailable'}
                        </p>
                      </div>
                      {canUpdateRota && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            disabled={isPending}
                          >
                            Acknowledge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="rounded-xl bg-rose-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-800"
                            disabled={isPending}
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
              Welfare escalations
            </h2>
            <p className="text-sm text-[oklch(0.48_0.01_200)]">
              Outstanding lone-worker checks that require check-in or manager triage.
            </p>
          </div>
          <WelfareCheckPanel
            checks={activeChecks}
            onCheckIn={handleCheckInWelfare}
            onResolve={handleResolveWelfare}
            canResolve={canUpdateRota}
          />
        </section>

        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
              Lone-worker settings
            </h2>
            <p className="text-sm text-[oklch(0.48_0.01_200)]">
              Configure buffers, escalation timing, GPS, and emergency automation.
            </p>
          </div>

          {canManageRota ? (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-[oklch(0.32_0.02_200)]">
                  <span className="font-medium">Buffer after planned visit (mins)</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={configDraft.welfareCheckBufferMinutes}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        welfareCheckBufferMinutes: Number(event.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-xl border border-[oklch(0.88_0.008_200)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-[oklch(0.32_0.02_200)]">
                  <span className="font-medium">Escalation delay (mins)</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={configDraft.escalationDelayMinutes}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        escalationDelayMinutes: Number(event.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-xl border border-[oklch(0.88_0.008_200)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-[oklch(0.32_0.02_200)]">
                  <span className="font-medium">GPS ping interval (secs)</span>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={configDraft.gpsPingIntervalSeconds}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        gpsPingIntervalSeconds: Number(event.target.value) || 10,
                      }))
                    }
                    className="w-full rounded-xl border border-[oklch(0.88_0.008_200)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-[oklch(0.32_0.02_200)]">
                  <span className="font-medium">Emergency call delay (mins)</span>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={configDraft.autoEmergencyCallDelayMinutes}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        autoEmergencyCallDelayMinutes: Number(event.target.value) || 15,
                      }))
                    }
                    className="w-full rounded-xl border border-[oklch(0.88_0.008_200)] px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    key: 'gpsTrackingEnabled' as const,
                    label: 'GPS tracking enabled',
                    description: 'Capture live location pings for lone-worker monitoring.',
                  },
                  {
                    key: 'sosEnabled' as const,
                    label: 'SOS button enabled',
                    description: 'Allow carers to trigger emergency alerts instantly.',
                  },
                  {
                    key: 'autoEmergencyCallEnabled' as const,
                    label: 'Automatic emergency escalation',
                    description: 'Escalate unresolved incidents after the configured delay.',
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-start gap-3 rounded-2xl border border-[oklch(0.9_0.008_200)] bg-[oklch(0.985_0.003_200)] px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={configDraft[toggle.key]}
                      onChange={(event) =>
                        setConfigDraft((current) => ({
                          ...current,
                          [toggle.key]: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-[oklch(0.22_0.03_200)]">
                        {toggle.label}
                      </span>
                      <span className="block text-xs text-[oklch(0.48_0.01_200)]">
                        {toggle.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[oklch(0.26_0.08_160)] disabled:opacity-50"
                >
                  Save settings
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-[oklch(0.9_0.008_200)] bg-[oklch(0.985_0.003_200)] p-4 text-sm text-[oklch(0.48_0.01_200)]">
              You can view safety status here, but only managers, admins, and owners can
              update lone-worker settings.
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
                Client access details
              </h2>
              <p className="text-sm text-[oklch(0.48_0.01_200)]">
                Encrypted key safe, access, parking, and risk notes for field visits.
              </p>
            </div>
            {clientOptions.length > 0 && (
              <select
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="rounded-xl border border-[oklch(0.88_0.008_200)] px-3 py-2 text-sm"
              >
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {canUpdatePersons && selectedClient ? (
            <ClientEnvironmentForm
              key={`${selectedClient.id}:${selectedEnvironment?.id ?? 'new'}`}
              existing={selectedEnvironment}
              onSubmit={handleSaveEnvironment}
              disabled={isPending}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[oklch(0.9_0.008_200)] bg-[oklch(0.985_0.003_200)] p-4 text-sm text-[oklch(0.48_0.01_200)]">
              {clientOptions.length === 0
                ? 'No clients available yet.'
                : 'You can view environment details below, but only authorised staff can edit them.'}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[oklch(0.92_0.008_160)] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[oklch(0.22_0.03_200)]">
              Current environment records
            </h2>
            <p className="text-sm text-[oklch(0.48_0.01_200)]">
              Stored records remain masked on-screen while preserving key access context.
            </p>
          </div>

          <div className="space-y-3">
            {environmentRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[oklch(0.9_0.008_200)] bg-[oklch(0.985_0.003_200)] p-4 text-sm text-[oklch(0.48_0.01_200)]">
                No client environment records captured yet.
              </div>
            ) : (
              environmentRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-[oklch(0.9_0.008_200)] bg-[oklch(0.99_0.002_200)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[oklch(0.22_0.03_200)]">
                        {record.clientName}
                      </h3>
                      <p className="text-xs text-[oklch(0.48_0.01_200)]">
                        Last verified {formatTimestamp(record.lastVerifiedAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[oklch(0.96_0.01_120)] px-3 py-1 text-xs font-medium text-[oklch(0.38_0.08_120)]">
                      {record.riskLevel}
                    </span>
                  </div>

                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[oklch(0.48_0.01_200)]">Key safe</dt>
                      <dd className="font-medium text-[oklch(0.22_0.03_200)]">
                        {maskSecret(record.keySafeCodeEncrypted)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[oklch(0.48_0.01_200)]">Location</dt>
                      <dd className="font-medium text-[oklch(0.22_0.03_200)]">
                        {record.keySafeLocation ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[oklch(0.48_0.01_200)]">Parking</dt>
                      <dd className="font-medium text-[oklch(0.22_0.03_200)]">
                        {record.parkingInfo ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[oklch(0.48_0.01_200)]">Emergency contact</dt>
                      <dd className="font-medium text-[oklch(0.22_0.03_200)]">
                        {record.emergencyContactName ?? '—'}
                      </dd>
                    </div>
                  </dl>

                  {(record.accessInstructions || record.riskNotes || record.environmentNotes) && (
                    <div className="mt-3 space-y-2 text-sm text-[oklch(0.35_0.02_200)]">
                      {record.accessInstructions && (
                        <p>
                          <span className="font-medium">Access:</span>{' '}
                          {record.accessInstructions}
                        </p>
                      )}
                      {record.riskNotes && (
                        <p>
                          <span className="font-medium">Risk:</span> {record.riskNotes}
                        </p>
                      )}
                      {record.environmentNotes && (
                        <p>
                          <span className="font-medium">Notes:</span>{' '}
                          {record.environmentNotes}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
