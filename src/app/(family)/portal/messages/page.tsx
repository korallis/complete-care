import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  MessageThread,
  PortalContextBar,
  PortalHeader,
} from '@/features/family-portal';
import { getMessages, sendMessage } from '@/features/family-portal/actions/messages';
import { getFamilyPortalContext } from '@/features/family-portal/server';

export const metadata: Metadata = {
  title: 'Messages',
};

interface FamilyMessagesPageProps {
  searchParams: Promise<{ personId?: string; status?: string; error?: string }>;
}

function buildPath(
  personId: string,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams({ personId });

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return `/portal/messages?${search.toString()}`;
}

export default async function FamilyMessagesPage({
  searchParams,
}: FamilyMessagesPageProps) {
  const { personId, status, error } = await searchParams;
  const context = await getFamilyPortalContext(personId);

  if (!context) {
    redirect('/login');
  }

  if (!context.currentPerson) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No approved family links are available yet.
      </div>
    );
  }

  const currentPerson = context.currentPerson;

  const messagesResult = await getMessages(
    currentPerson.organisationId,
    currentPerson.personId,
    'family',
  );

  async function handleSendMessage(formData: FormData) {
    'use server';

    const freshContext = await getFamilyPortalContext(currentPerson.personId);
    if (!freshContext?.currentPerson) {
      redirect('/login');
    }

    const result = await sendMessage(
      freshContext.currentPerson.organisationId,
      freshContext.userId,
      'family',
      {
        personId: freshContext.currentPerson.personId,
        content: String(formData.get('message') ?? ''),
      },
    );

    const failedResult = result as { success: false; error?: unknown };
    const errorMessage =
      !result.success && typeof failedResult.error === 'string'
        ? failedResult.error
        : 'Unable to send message';

    redirect(
      buildPath(freshContext.currentPerson.personId, {
        status: result.success ? 'message-sent' : undefined,
        error: result.success ? undefined : errorMessage,
      }),
    );
  }

  return (
    <div className="space-y-6">
      <PortalHeader
        personName={currentPerson.personName}
        relationship={currentPerson.relationship}
        domainLabel={currentPerson.domainLabel}
      />

      <PortalContextBar
        linkedPersons={context.linkedPersons}
        currentPersonId={currentPerson.personId}
        currentPath="/portal/messages"
      />

      {(status || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {(typeof error === 'string' && error) || status?.replace(/-/g, ' ')}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Communicate securely with the care team about{' '}
            {currentPerson.personName}.
          </p>
        </div>

        <MessageThread
          messages={messagesResult.success ? messagesResult.data : []}
          currentUserId={context.userId}
        />
      </div>

      <form action={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          name="message"
          placeholder="Type a message..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Send
        </button>
      </form>

      {context.messageApprovalRequired && (
        <p className="text-sm text-muted-foreground">
          Family messages require staff approval before they are visible in the
          shared thread.
        </p>
      )}
    </div>
  );
}
