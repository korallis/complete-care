import { describe, expect, it } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { complaints } from '@/lib/db/schema';
import { createComplaintSchema } from '@/features/complaints/schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('complaints schema', () => {
  it('has the expected table name', () => {
    expect(getTableName(complaints)).toBe('childrens_complaints');
  });

  it('accepts a valid complaint payload', () => {
    const result = createComplaintSchema.safeParse({
      personId: VALID_UUID,
      complaintDate: '2026-04-02',
      raisedBy: 'Child with support from key worker',
      nature: 'Concern about contact arrangements',
      desiredOutcome: 'Clear explanation and review',
      advocacyOffered: true,
      advocacyNotes: 'Advocate offered during intake',
      status: 'received',
    });

    expect(result.success).toBe(true);
  });
});
