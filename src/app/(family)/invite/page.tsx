import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accept Invitation',
};

/**
 * Invitation acceptance page.
 * Family members land here via the invitation link.
 * They create an account or sign in, then the invitation is accepted.
 * The token query parameter is used to look up the invitation.
 */
export default function AcceptInvitationPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Family Portal Invitation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have been invited to access the Complete Care Family Portal.
          Sign in or create an account to continue.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-sm text-muted-foreground">
          The invitation acceptance flow will be connected to Auth.js v5
          when authentication is integrated. Your access will require staff
          approval before you can view care information.
        </p>
      </div>
    </div>
  );
}
