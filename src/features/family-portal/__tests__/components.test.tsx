import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalHeader } from '../components/portal-header';
import { MessageThread } from '../components/message-thread';
import { UpdateCard } from '../components/update-card';

describe('Family Portal components', () => {
  describe('PortalHeader', () => {
    it('renders person name, relationship, and domain label', () => {
      render(
        <PortalHeader
          personName="John Smith"
          relationship="Parent"
          domainLabel="Domiciliary Care"
        />,
      );

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText(/Parent/)).toBeInTheDocument();
      expect(screen.getByText(/Domiciliary Care/)).toBeInTheDocument();
    });
  });

  describe('MessageThread', () => {
    it('renders empty state when no messages', () => {
      render(
        <MessageThread
          messages={[]}
          currentUserId="user-1"
        />,
      );

      expect(
        screen.getByText(/No messages yet/),
      ).toBeInTheDocument();
    });

    it('renders messages with sender names', () => {
      const messages = [
        {
          id: '1',
          senderName: 'Jane Doe',
          senderType: 'family' as const,
          content: 'How is my mother doing?',
          approvalStatus: 'approved',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          senderName: 'Nurse Smith',
          senderType: 'staff' as const,
          content: 'She is doing well today.',
          approvalStatus: 'approved',
          createdAt: new Date().toISOString(),
        },
      ];

      render(
        <MessageThread
          messages={messages}
          currentUserId="user-1"
        />,
      );

      expect(screen.getByText('How is my mother doing?')).toBeInTheDocument();
      expect(screen.getByText('She is doing well today.')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Nurse Smith')).toBeInTheDocument();
    });

    it('shows pending approval badge for pending messages', () => {
      const messages = [
        {
          id: '1',
          senderName: 'Jane Doe',
          senderType: 'family' as const,
          content: 'Pending message',
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      render(
        <MessageThread
          messages={messages}
          currentUserId="user-1"
        />,
      );

      expect(screen.getByText('Pending approval')).toBeInTheDocument();
    });
  });

  describe('UpdateCard', () => {
    it('renders update title, content, and creator', () => {
      render(
        <UpdateCard
          title="Activity Day"
          content="We had a wonderful day."
          updateType="activity"
          createdByName="Staff Member"
          publishedAt={new Date().toISOString()}
        />,
      );

      expect(screen.getByText('Activity Day')).toBeInTheDocument();
      expect(screen.getByText('We had a wonderful day.')).toBeInTheDocument();
      expect(screen.getByText(/Staff Member/)).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('renders photo placeholders when mediaUrls provided', () => {
      render(
        <UpdateCard
          title="Photos"
          content="Some photos from today."
          updateType="photo"
          createdByName="Staff"
          publishedAt={new Date().toISOString()}
          mediaUrls={['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']}
        />,
      );

      const photoElements = screen.getAllByText('Photo');
      // One for the type badge + two photo placeholders
      expect(photoElements.length).toBe(3);
    });
  });
});
