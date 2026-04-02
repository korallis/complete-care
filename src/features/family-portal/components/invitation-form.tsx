'use client';

import { cn } from '@/lib/utils';
import { invitationRelationships } from '../types';

interface InvitationFormProps {
  className?: string;
}

/**
 * Form for staff to invite family members.
 * Connected to the createInvitation server action.
 */
export function InvitationForm({ className }: InvitationFormProps) {
  return (
    <form className={cn('space-y-4', className)}>
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium"
        >
          Family member name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter the family member's full name"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="family.member@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="relationship"
          className="mb-1 block text-sm font-medium"
        >
          Relationship
        </label>
        <select
          id="relationship"
          name="relationship"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select relationship</option>
          {invitationRelationships.map((rel) => (
            <option key={rel} value={rel}>
              {rel.charAt(0).toUpperCase() + rel.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Send Invitation
      </button>
    </form>
  );
}
