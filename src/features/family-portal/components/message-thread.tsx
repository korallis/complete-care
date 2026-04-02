'use client';

import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderName: string;
  senderType: 'family' | 'staff';
  content: string;
  approvalStatus: string;
  createdAt: Date | string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  currentSenderId?: string;
  className?: string;
}

/**
 * Displays a thread of messages between family members and care team.
 */
export function MessageThread({
  messages,
  className,
}: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <p className="text-sm text-muted-foreground">
          No messages yet. Start a conversation with the care team.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {messages.map((message) => {
        const isFamily = message.senderType === 'family';
        const isPending = message.approvalStatus === 'pending';

        return (
          <div
            key={message.id}
            className={cn(
              'max-w-[80%] rounded-lg p-3 text-sm',
              isFamily
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted',
              isPending && 'opacity-60',
            )}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={cn('font-medium', isFamily ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {message.senderName}
              </span>
              {isPending && (
                <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800">
                  Pending approval
                </span>
              )}
            </div>
            <p>{message.content}</p>
            <span
              className={cn(
                'mt-1 block text-[10px]',
                isFamily
                  ? 'text-primary-foreground/60'
                  : 'text-muted-foreground',
              )}
            >
              {new Date(message.createdAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
