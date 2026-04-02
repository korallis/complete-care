'use client';

/**
 * Contact Management client page — orchestrates the contact UI tabs:
 * 1. Approved Contacts Register
 * 2. Scheduled Contacts
 * 3. Contact Records
 * 4. Compliance Tracker
 *
 * Data fetching is stubbed until the auth module is wired up.
 */

import { useState } from 'react';
import { ApprovedContactsTable } from '@/features/contacts/components/approved-contacts-table';
import { ComplianceTracker } from '@/features/contacts/components/compliance-tracker';
import type { ApprovedContact } from '@/lib/db/schema';
import type { ComplianceSummary } from '@/features/contacts/actions';

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
}: {
  orgSlug: string;
  personId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('register');

  // Placeholder data — will be replaced with server action calls once auth is wired
  const contacts: ApprovedContact[] = [];
  const complianceSummaries: ComplianceSummary[] = [];

  return (
    <div className="space-y-6">
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
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Add Contact
            </button>
          </div>
          <ApprovedContactsTable contacts={contacts} />
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Scheduled Contacts</h2>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Schedule Visit
            </button>
          </div>
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No scheduled contacts. Schedule visits from the approved contacts
            register.
          </div>
        </section>
      )}

      {activeTab === 'records' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contact Records</h2>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Record Contact
            </button>
          </div>
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No contact records. Record a contact event to track interactions.
          </div>
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

      {/* Hidden reference for routing — ensures orgSlug and personId are used */}
      <input type="hidden" value={orgSlug} />
      <input type="hidden" value={personId} />
    </div>
  );
}
