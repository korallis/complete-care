'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Meeting } from '@/lib/db/schema/meetings';
import type { createMeeting, updateMeeting } from '../actions';

type MeetingsPanelProps = {
  initialMeetings: Meeting[];
  personId: string;
  canCreate: boolean;
  canUpdate: boolean;
  onCreate: typeof createMeeting;
  onUpdate: typeof updateMeeting;
};

export function MeetingsPanel({
  initialMeetings,
  personId,
  canCreate,
  canUpdate,
  onCreate,
  onUpdate,
}: MeetingsPanelProps) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [form, setForm] = useState({
    meetingDate: new Date().toISOString().slice(0, 10),
    title: 'Children’s house meeting',
    childAttendees: '',
    staffAttendees: '',
    agendaItems: '',
    discussionPoints: '',
    decisions: '',
    actionOwner: '',
    actionText: '',
    actionDueDate: new Date().toISOString().slice(0, 10),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onCreate({
      personId,
      meetingDate: form.meetingDate,
      title: form.title,
      childAttendees: form.childAttendees
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      staffAttendees: form.staffAttendees
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      agendaItems: form.agendaItems
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      discussionPoints: form.discussionPoints,
      decisions: form.decisions,
      actions: form.actionText
        ? [
            {
              action: form.actionText,
              owner: form.actionOwner || 'Manager',
              dueDate: form.actionDueDate,
              completed: false,
            },
          ]
        : [],
      sharedWithReg44: true,
    });
    setIsSubmitting(false);
    if (!result.success || !result.data) {
      toast.error(
        !result.success ? result.error ?? 'Failed to save meeting' : 'Failed to save meeting',
      );
      return;
    }
    setMeetings([result.data, ...meetings]);
    toast.success('Meeting recorded');
  }

  async function completeAction(meeting: Meeting) {
    if (!canUpdate) return;
    const actions = Array.isArray(meeting.actions)
      ? meeting.actions.map((action, index) =>
          index === 0 ? { ...action, completed: true } : action,
        )
      : [];
    const result = await onUpdate(meeting.id, { actions });
    if (!result.success || !result.data) {
      toast.error(
        !result.success ? result.error ?? 'Failed to update meeting' : 'Failed to update meeting',
      );
      return;
    }
    setMeetings((current) =>
      current.map((item) => (item.id === meeting.id ? result.data! : item)),
    );
    toast.success('Meeting action marked complete');
  }

  return (
    <div className="space-y-6">
      {canCreate && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={form.meetingDate}
              onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Meeting title"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.childAttendees}
              onChange={(e) => setForm({ ...form, childAttendees: e.target.value })}
              placeholder="Child attendees, comma separated"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
            <input
              value={form.staffAttendees}
              onChange={(e) => setForm({ ...form, staffAttendees: e.target.value })}
              placeholder="Staff attendees, comma separated"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={form.agendaItems}
            onChange={(e) => setForm({ ...form, agendaItems: e.target.value })}
            rows={3}
            placeholder="Agenda items, one per line"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <textarea
            value={form.discussionPoints}
            onChange={(e) => setForm({ ...form, discussionPoints: e.target.value })}
            rows={3}
            placeholder="Discussion points"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <textarea
            value={form.decisions}
            onChange={(e) => setForm({ ...form, decisions: e.target.value })}
            rows={2}
            placeholder="Decisions agreed"
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              value={form.actionText}
              onChange={(e) => setForm({ ...form, actionText: e.target.value })}
              placeholder="Tracked action"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
            <input
              value={form.actionOwner}
              onChange={(e) => setForm({ ...form, actionOwner: e.target.value })}
              placeholder="Action owner"
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.actionDueDate}
              onChange={(e) => setForm({ ...form, actionDueDate: e.target.value })}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white"
          >
            {isSubmitting ? 'Saving…' : 'Record meeting'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {meetings.map((meeting) => {
          const firstAction = Array.isArray(meeting.actions) ? meeting.actions[0] : null;
          return (
            <article key={meeting.id} className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">{meeting.title}</h3>
                  <p className="text-xs text-[oklch(0.55_0_0)]">{meeting.meetingDate}</p>
                </div>
                {meeting.sharedWithReg44 && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    Reg 44 evidence
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-[oklch(0.35_0_0)]">{meeting.discussionPoints}</p>
              <p className="mt-2 text-sm text-[oklch(0.5_0_0)]">
                <span className="font-medium text-[oklch(0.35_0_0)]">Decisions:</span> {meeting.decisions}
              </p>
              {firstAction && (
                <div className="mt-3 rounded-lg bg-[oklch(0.985_0.003_160)] p-3 text-sm">
                  <p>
                    <span className="font-medium">Tracked action:</span> {firstAction.action}
                  </p>
                  <p className="text-[oklch(0.55_0_0)]">
                    Owner: {firstAction.owner} · Due {firstAction.dueDate}
                  </p>
                  {!firstAction.completed && canUpdate && (
                    <button
                      type="button"
                      onClick={() => completeAction(meeting)}
                      className="mt-2 rounded-md border border-[oklch(0.88_0.005_160)] px-3 py-1 text-xs font-medium"
                    >
                      Mark action complete
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
