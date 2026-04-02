'use client';

/**
 * Contact Management client page — orchestrates the contact UI tabs:
 * 1. Approved Contacts Register
 * 2. Scheduled Contacts
 * 3. Contact Records
 * 4. Compliance Tracker
 */

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApprovedContactsTable } from '@/features/contacts/components/approved-contacts-table';
import { ComplianceTracker } from '@/features/contacts/components/compliance-tracker';
import { ApprovedContactForm } from '@/features/contacts/components/approved-contact-form';
import { ContactScheduleForm } from '@/features/contacts/components/contact-schedule-form';
import { ContactRecordForm } from '@/features/contacts/components/contact-record-form';
import {
  createApprovedContact,
  createContactRecord,
  createContactSchedule,
  getComplianceSummary,
  updateContactScheduleStatus,
  type ComplianceSummary,
} from '@/features/contacts/actions';
import type {
  ApprovedContact,
  ContactRecord,
  ContactSchedule,
} from '@/lib/db/schema';

type Tab = 'register' | 'schedule' | 'records' | 'compliance';

const TABS: { id: Tab; label: string }[] = [
  { id: 'register', label: 'Approved Contacts' },
  { id: 'schedule', label: 'Scheduled Visits' },
  { id: 'records', label: 'Contact Records' },
  { id: 'compliance', label: 'Compliance' },
];

export function ContactsPageClient({
  orgSlug,
  personId,
  canManage,
  initialContacts,
  initialSchedules,
  initialRecords,
  initialComplianceSummaries,
}: {
  orgSlug: string;
  personId: string;
  canManage: boolean;
  initialContacts: ApprovedContact[];
  initialSchedules: ContactSchedule[];
  initialRecords: ContactRecord[];
  initialComplianceSummaries: ComplianceSummary[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [contacts, setContacts] = useState(initialContacts);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [records, setRecords] = useState(initialRecords);
  const [complianceSummaries, setComplianceSummaries] = useState(
    initialComplianceSummaries,
  );
  const [showAddContact, setShowAddContact] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [scheduleContactId, setScheduleContactId] = useState<string>();
  const [recordContext, setRecordContext] = useState<{
    contactId?: string;
    scheduleId?: string;
  }>({});

  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );

  async function refreshCompliance() {
    const result = await getComplianceSummary(personId);
    if (result.success) {
      setComplianceSummaries(result.data);
    }
  }

  async function handleCreateApprovedContact(
    data: Parameters<typeof createApprovedContact>[0],
  ) {
    const result = await createApprovedContact(data);
    if (!result.success) {
      throw new Error(result.error);
    }

    setContacts((current) => [result.data, ...current]);
    setShowAddContact(false);
    await refreshCompliance();
    toast.success('Approved contact added.');
  }

  async function handleCreateSchedule(
    data: Parameters<typeof createContactSchedule>[0],
  ) {
    const result = await createContactSchedule(data);
    if (!result.success) {
      throw new Error(result.error);
    }

    setSchedules((current) =>
      [result.data, ...current].sort(
        (left, right) =>
          new Date(right.scheduledAt).getTime() -
          new Date(left.scheduledAt).getTime(),
      ),
    );
    setShowScheduleForm(false);
    setScheduleContactId(undefined);
    await refreshCompliance();
    setActiveTab('schedule');
    toast.success('Contact scheduled.');
  }

  async function handleCreateRecord(
    data: Parameters<typeof createContactRecord>[0],
  ) {
    const result = await createContactRecord(data);
    if (!result.success) {
      throw new Error(result.error);
    }

    setRecords((current) =>
      [result.data, ...current].sort(
        (left, right) =>
          new Date(right.contactDate).getTime() -
          new Date(left.contactDate).getTime(),
      ),
    );

    if (
      typeof data === 'object' &&
      data &&
      'contactScheduleId' in data &&
      data.contactScheduleId
    ) {
      setSchedules((current) =>
        current.map((schedule) =>
          schedule.id === data.contactScheduleId
            ? { ...schedule, status: 'completed' }
            : schedule,
        ),
      );
    }

    setShowRecordForm(false);
    setRecordContext({});
    await refreshCompliance();
    setActiveTab('records');
    toast.success('Contact record saved.');
  }

  async function handleUpdateScheduleStatus(
    scheduleId: string,
    status: 'cancelled' | 'no_show',
  ) {
    const result = await updateContactScheduleStatus({ id: scheduleId, status });
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === scheduleId ? result.data : schedule,
      ),
    );
    await refreshCompliance();
    toast.success(
      status === 'cancelled'
        ? 'Scheduled contact cancelled.'
        : 'Scheduled contact marked as no-show.',
    );
  }

  function openScheduleForm(contactId?: string) {
    setScheduleContactId(contactId);
    setShowScheduleForm(true);
    setActiveTab('schedule');
  }

  function openRecordForm(contactId?: string, scheduleId?: string) {
    setRecordContext({ contactId, scheduleId });
    setShowRecordForm(true);
    setActiveTab('records');
  }

  function formatDateTime(value: string | Date | null | undefined) {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  function formatStatus(value: string) {
    return value
      .split('_')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-sm text-[oklch(0.55_0_0)]">Approved contacts</p>
          <p className="mt-1 text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {contacts.length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-sm text-[oklch(0.55_0_0)]">Scheduled contacts</p>
          <p className="mt-1 text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {schedules.length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-sm text-[oklch(0.55_0_0)]">Recorded contacts</p>
          <p className="mt-1 text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {records.length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-sm text-[oklch(0.55_0_0)]">Tracked plans</p>
          <p className="mt-1 text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {complianceSummaries.length}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'register' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Approved Contacts Register</h2>
            {canManage && (
              <button
                onClick={() => setShowAddContact((current) => !current)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {showAddContact ? 'Close form' : 'Add contact'}
              </button>
            )}
          </div>
          {showAddContact && canManage && (
            <ApprovedContactForm
              personId={personId}
              onSubmit={handleCreateApprovedContact}
              onCancel={() => setShowAddContact(false)}
            />
          )}
          <ApprovedContactsTable contacts={contacts} />
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scheduled Contacts</h2>
            {canManage && (
              <button
                onClick={() => openScheduleForm()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {showScheduleForm ? 'Close form' : 'Schedule visit'}
              </button>
            )}
          </div>
          {showScheduleForm && canManage && (
            <ContactScheduleForm
              personId={personId}
              approvedContacts={contacts}
              defaultContactId={scheduleContactId}
              onSubmit={handleCreateSchedule}
              onCancel={() => {
                setShowScheduleForm(false);
                setScheduleContactId(undefined);
              }}
            />
          )}

          {schedules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No scheduled contacts. Schedule visits from the approved contacts
              register.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Scheduled</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => {
                    const contact = contactMap.get(schedule.approvedContactId);
                    return (
                      <tr key={schedule.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {contact?.name ?? 'Unknown contact'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contact?.relationship ?? 'Relationship unavailable'}
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatStatus(schedule.contactType)}</td>
                        <td className="px-4 py-3">
                          {formatDateTime(schedule.scheduledAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {formatStatus(schedule.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {schedule.status === 'scheduled' && canManage && (
                              <>
                                <button
                                  onClick={() =>
                                    openRecordForm(
                                      schedule.approvedContactId,
                                      schedule.id,
                                    )
                                  }
                                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                  Record
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateScheduleStatus(
                                      schedule.id,
                                      'no_show',
                                    )
                                  }
                                  className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                  No-show
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateScheduleStatus(
                                      schedule.id,
                                      'cancelled',
                                    )
                                  }
                                  className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'records' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contact Records</h2>
            {canManage && (
              <button
                onClick={() => openRecordForm()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {showRecordForm ? 'Close form' : 'Record contact'}
              </button>
            )}
          </div>
          {showRecordForm && canManage && (
            <ContactRecordForm
              personId={personId}
              approvedContacts={contacts}
              defaultContactId={recordContext.contactId}
              scheduleId={recordContext.scheduleId}
              onSubmit={handleCreateRecord}
              onCancel={() => {
                setShowRecordForm(false);
                setRecordContext({});
              }}
            />
          )}
          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No contact records. Record a contact event to track interactions.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const contact = contactMap.get(record.approvedContactId);
                return (
                  <article
                    key={record.id}
                    className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-[oklch(0.22_0.04_160)]">
                          {contact?.name ?? 'Unknown contact'}
                        </h3>
                        <p className="text-sm text-[oklch(0.55_0_0)]">
                          {formatStatus(record.contactType)} · {formatDateTime(record.contactDate)}
                        </p>
                      </div>
                      <span className="inline-flex self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {formatStatus(record.supervisionLevel)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Before
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {record.emotionalBefore ?? '—'}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          During
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {record.emotionalDuring ?? '—'}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          After
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900">
                          {record.emotionalAfter ?? '—'}
                        </dd>
                      </div>
                    </dl>

                    {(record.notes || record.concerns || record.disclosures) && (
                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.55_0_0)]">
                            Notes
                          </p>
                          <p className="mt-1 text-sm text-[oklch(0.24_0.03_160)]">
                            {record.notes ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.55_0_0)]">
                            Concerns
                          </p>
                          <p className="mt-1 text-sm text-[oklch(0.24_0.03_160)]">
                            {record.concerns ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.55_0_0)]">
                            Disclosures
                          </p>
                          <p className="mt-1 text-sm text-[oklch(0.24_0.03_160)]">
                            {record.disclosures ?? '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'compliance' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Contact Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Tracks whether contact frequency matches the care plan requirements.
          </p>
          <ComplianceTracker summaries={complianceSummaries} />
        </section>
      )}

      <div className="hidden">
        <input type="hidden" value={orgSlug} readOnly />
        <input type="hidden" value={personId} readOnly />
      </div>
    </div>
  );
}
