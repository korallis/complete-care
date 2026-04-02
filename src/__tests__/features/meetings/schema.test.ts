import { describe, expect, it } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { meetings } from '@/lib/db/schema';
import { createMeetingSchema } from '@/features/meetings/schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('meetings schema', () => {
  it('has the expected table name', () => {
    expect(getTableName(meetings)).toBe('childrens_meetings');
  });

  it('accepts a valid meeting payload', () => {
    const result = createMeetingSchema.safeParse({
      personId: VALID_UUID,
      meetingDate: '2026-04-02',
      title: 'Children’s house meeting',
      childAttendees: ['A Child'],
      staffAttendees: ['Jane Manager'],
      agendaItems: ['Activities'],
      discussionPoints: 'Children discussed activities and quiet hours.',
      decisions: 'Friday movie night agreed.',
      actions: [{ action: 'Book cinema trip', owner: 'Jane Manager', dueDate: '2026-04-10', completed: false }],
      sharedWithReg44: true,
    });

    expect(result.success).toBe(true);
  });
});
