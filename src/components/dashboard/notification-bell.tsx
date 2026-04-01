'use client';

/**
 * NotificationBell — notification centre icon with unread badge and dropdown panel.
 *
 * Features:
 * - Bell icon with unread count badge (hidden when 0)
 * - Dropdown panel listing recent notifications
 * - Click notification to mark as read and navigate
 * - "Mark all as read" button
 * - Closes on click outside or Escape
 */

import { useState, useRef, useEffect, useTransition, useOptimistic } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, AlertCircle, FileText, Users, Calendar, Info, X } from 'lucide-react';
import { markNotificationRead, markAllNotificationsRead } from '@/features/notifications/actions';
import type { Notification } from '@/lib/db/schema/notifications';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Notification type → icon + colour
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  care_plan_review: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  risk_alert: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  dbs_expiry: {
    icon: Users,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  training_expiry: {
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  supervision_due: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  invite_accepted: {
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  general: {
    icon: Info,
    color: 'text-[oklch(0.22_0.04_160)]',
    bgColor: 'bg-[oklch(0.97_0.005_160)]',
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationBellProps {
  initialNotifications: Notification[];
  /** Initial unread count passed from server — used as accessible label on first render */
  initialUnreadCount?: number;
}

export function NotificationBell({
  initialNotifications,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Optimistic state for unread count and read status
  const [optimisticNotifications, setOptimisticNotifications] = useOptimistic(
    initialNotifications,
    (state, update: { type: 'markRead'; id: string } | { type: 'markAllRead' }) => {
      if (update.type === 'markRead') {
        return state.map((n) =>
          n.id === update.id ? { ...n, readAt: new Date() } : n,
        );
      }
      return state.map((n) => ({ ...n, readAt: n.readAt ?? new Date() }));
    },
  );

  const unreadCount = optimisticNotifications.filter((n) => !n.readAt).length;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      setOptimisticNotifications({ type: 'markRead', id });
      await markNotificationRead(id);
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      setOptimisticNotifications({ type: 'markAllRead' });
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[oklch(0.5_0_0)] hover:bg-[oklch(0.96_0.005_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.35_0.06_160)]"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.55_0.22_27)] text-[9px] font-bold text-white leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="region"
          aria-label="Notifications"
          className="
            absolute right-0 top-full mt-2 z-50
            w-[360px] max-h-[520px] flex flex-col
            rounded-xl border border-[oklch(0.91_0.005_160)]
            bg-white shadow-[0_16px_40px_-8px_oklch(0.3_0.04_160/0.18)]
            overflow-hidden
          "
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.93_0.005_160)]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[oklch(0.18_0.02_160)]">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[oklch(0.22_0.04_160)] text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[oklch(0.38_0.05_160)] hover:bg-[oklch(0.96_0.005_160)] transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[oklch(0.6_0_0)] hover:bg-[oklch(0.96_0.005_160)] transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {optimisticNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.005_160)] flex items-center justify-center">
                  <Bell
                    className="h-6 w-6 text-[oklch(0.7_0_0)]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[oklch(0.35_0_0)]">
                    No notifications yet
                  </p>
                  <p className="text-xs text-[oklch(0.6_0_0)] mt-0.5">
                    We&apos;ll notify you about important care updates
                  </p>
                </div>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-[oklch(0.96_0.005_160)]">
                {optimisticNotifications.map((notification) => {
                  const { icon: Icon, color, bgColor } = getTypeConfig(
                    notification.type,
                  );
                  const isUnread = !notification.readAt;

                  const content = (
                    <>
                      {/* Type icon */}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                          bgColor,
                        )}
                        aria-hidden="true"
                      >
                        <Icon className={cn('h-4 w-4', color)} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm leading-snug line-clamp-2',
                            isUnread
                              ? 'font-medium text-[oklch(0.18_0.02_160)]'
                              : 'text-[oklch(0.4_0_0)]',
                          )}
                        >
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-[oklch(0.6_0_0)] mt-0.5 line-clamp-1">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-[10px] text-[oklch(0.7_0_0)] mt-1">
                          {timeAgo(new Date(notification.createdAt))}
                        </p>
                      </div>

                      {/* Unread dot / mark read */}
                      <div className="flex-shrink-0 flex items-center">
                        {isUnread ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkRead(notification.id);
                            }}
                            aria-label="Mark as read"
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[oklch(0.94_0.005_160)] transition-colors group"
                          >
                            <span
                              className="w-2 h-2 rounded-full bg-[oklch(0.22_0.04_160)] group-hover:hidden"
                              aria-hidden="true"
                            />
                            <Check
                              className="h-3 w-3 text-[oklch(0.22_0.04_160)] hidden group-hover:block"
                              aria-hidden="true"
                            />
                          </button>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full bg-transparent"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </>
                  );

                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors',
                        isUnread
                          ? 'bg-[oklch(0.985_0.004_160)]'
                          : 'bg-white',
                      )}
                    >
                      {notification.actionUrl ? (
                        <Link
                          href={notification.actionUrl}
                          onClick={() => handleMarkRead(notification.id)}
                          className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
