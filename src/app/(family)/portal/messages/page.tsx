import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
};

/**
 * Family portal messages page.
 * Displays message thread with care team and allows sending new messages.
 * Will be connected to auth session to load messages for the logged-in family member.
 */
export default function FamilyMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate securely with the care team.
        </p>
      </div>

      {/* Message thread — rendered by MessageThread component when data is available */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            No messages yet. Start a conversation with the care team.
          </p>
        </div>
      </div>

      {/* Message input */}
      <form className="flex gap-2">
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
    </div>
  );
}
