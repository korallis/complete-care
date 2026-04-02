'use client';

/**
 * Approved Contacts Register table.
 * Shows all approved contacts for a child with restriction indicators
 * and court order details.
 *
 * VAL-CHILD-014: Visual indicators for restricted contacts.
 */

import type { ApprovedContact } from '@/lib/db/schema';

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: 'Mother',
  father: 'Father',
  sibling: 'Sibling',
  grandparent: 'Grandparent',
  aunt_uncle: 'Aunt/Uncle',
  social_worker: 'Social Worker',
  other: 'Other',
};

const SUPERVISION_LABELS: Record<string, string> = {
  unsupervised: 'Unsupervised',
  supervised_by_staff: 'Supervised by Staff',
  supervised_by_sw: 'Supervised by SW',
};

const CONTACT_TYPE_LABELS: Record<string, string> = {
  face_to_face: 'Face-to-Face',
  phone: 'Phone',
  video: 'Video',
  letter: 'Letter',
};

export function ApprovedContactsTable({
  contacts,
  onEdit,
  onSchedule,
}: {
  contacts: ApprovedContact[];
  onEdit?: (contact: ApprovedContact) => void;
  onSchedule?: (contact: ApprovedContact) => void;
}) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No approved contacts registered for this child.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add contacts from the care plan to the approved register.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Relationship</th>
            <th className="px-4 py-3 text-left font-medium">Contact Types</th>
            <th className="px-4 py-3 text-left font-medium">Frequency</th>
            <th className="px-4 py-3 text-left font-medium">Supervision</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className={`border-b transition-colors hover:bg-muted/30 ${
                contact.hasRestrictions
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium">{contact.name}</div>
                {contact.phone && (
                  <div className="text-xs text-muted-foreground">
                    {contact.phone}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {RELATIONSHIP_LABELS[contact.relationship] ??
                  contact.relationship}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {contact.allowedContactTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {CONTACT_TYPE_LABELS[type] ?? type}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {contact.frequency ?? '--'}
              </td>
              <td className="px-4 py-3">
                {SUPERVISION_LABELS[contact.supervisionLevel] ??
                  contact.supervisionLevel}
              </td>
              <td className="px-4 py-3">
                {contact.hasRestrictions ? (
                  <div>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Restricted
                    </span>
                    {contact.courtOrderReference && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Order: {contact.courtOrderReference}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Approved
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(contact)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Edit
                    </button>
                  )}
                  {onSchedule && (
                    <button
                      onClick={() => onSchedule(contact)}
                      className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Schedule
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
