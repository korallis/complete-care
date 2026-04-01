/**
 * NotificationBell Component Tests
 *
 * Covers:
 * - Renders bell icon
 * - Shows unread badge when there are unread notifications
 * - Hides badge when no unread notifications
 * - Opens dropdown on bell click
 * - Shows empty state when no notifications
 * - Lists notifications when present
 * - Mark all read button visible only when unread notifications exist
 * - Close button closes dropdown
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import type { Notification } from '@/lib/db/schema/notifications';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/notifications/actions', () => ({
  markNotificationRead: vi.fn().mockResolvedValue({ success: true }),
  markAllNotificationsRead: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

// useOptimistic mock for React 19 (not yet available in jsdom test env — use state fallback)
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useOptimistic: (state: unknown) => {
      // Simplified: just return state and a no-op dispatch for testing
      return [state, vi.fn()];
    },
  };
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  userId: 'user-1',
  organisationId: 'org-1',
  type: 'general',
  title: 'Test notification',
  body: 'This is a test notification',
  entityType: null,
  entityId: null,
  actionUrl: null,
  readAt: null,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  ...overrides,
});

const readNotification = makeNotification({
  id: 'notif-2',
  title: 'Already read notification',
  readAt: new Date('2026-01-01T11:00:00Z'),
});

const unreadNotification = makeNotification({
  id: 'notif-1',
  title: 'Unread notification',
  readAt: null,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationBell', () => {
  describe('bell button', () => {
    it('renders the bell button', () => {
      render(
        <NotificationBell initialNotifications={[]} initialUnreadCount={0} />,
      );
      expect(
        screen.getByRole('button', { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it('shows unread badge when unread count > 0', () => {
      render(
        <NotificationBell
          initialNotifications={[unreadNotification]}
          initialUnreadCount={1}
        />,
      );
      // Badge should display "1"
      const button = screen.getByRole('button', { name: /1 unread/i });
      expect(button).toBeInTheDocument();
    });

    it('does not show unread badge when count is 0', () => {
      render(
        <NotificationBell
          initialNotifications={[readNotification]}
          initialUnreadCount={0}
        />,
      );
      // Badge span should not be in the DOM (it's conditionally rendered)
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  describe('dropdown', () => {
    it('opens dropdown when bell is clicked', () => {
      render(
        <NotificationBell initialNotifications={[]} initialUnreadCount={0} />,
      );
      const bell = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bell);
      expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
    });

    it('closes dropdown when close button is clicked', () => {
      render(
        <NotificationBell initialNotifications={[]} initialUnreadCount={0} />,
      );
      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      // Close it
      const closeBtn = screen.getByRole('button', { name: /close notifications/i });
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('region', { name: /notifications/i })).not.toBeInTheDocument();
    });

    it('shows empty state when no notifications', () => {
      render(
        <NotificationBell initialNotifications={[]} initialUnreadCount={0} />,
      );
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
    });

    it('lists notifications when present', () => {
      const notifications = [unreadNotification, readNotification];
      render(
        <NotificationBell
          initialNotifications={notifications}
          initialUnreadCount={1}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /1 unread/i }));
      expect(screen.getByText('Unread notification')).toBeInTheDocument();
      expect(screen.getByText('Already read notification')).toBeInTheDocument();
    });

    it('shows "Mark all read" button only when there are unread notifications', () => {
      render(
        <NotificationBell
          initialNotifications={[unreadNotification]}
          initialUnreadCount={1}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      expect(
        screen.getByRole('button', { name: /mark all notifications as read/i }),
      ).toBeInTheDocument();
    });

    it('does not show "Mark all read" button when all are read', () => {
      render(
        <NotificationBell
          initialNotifications={[readNotification]}
          initialUnreadCount={0}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      expect(
        screen.queryByRole('button', { name: /mark all notifications as read/i }),
      ).not.toBeInTheDocument();
    });

    it('shows notification panel heading', () => {
      render(
        <NotificationBell initialNotifications={[]} initialUnreadCount={0} />,
      );
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument();
    });
  });
});
