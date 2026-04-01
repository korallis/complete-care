'use client';

/**
 * LeaveCalendar -- month view showing team leave across the organisation.
 * Displays leave entries as coloured blocks on a calendar grid.
 */

import { useState, useMemo } from 'react';
import { LeaveTypeBadge, LeaveStatusBadge } from './leave-status-badge';
import { LEAVE_CALENDAR_COLORS } from '@/features/leave/constants';
import type { CalendarLeaveEntry } from '@/features/leave/actions';
import type { LeaveType } from '@/features/leave/schema';

type LeaveCalendarProps = {
  leaveEntries: CalendarLeaveEntry[];
  orgSlug: string;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDay.getDate();

  const days: Array<{ date: Date | null; dayOfMonth: number | null }> = [];

  // Fill leading empty cells
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, dayOfMonth: null });
  }

  // Fill actual days
  for (let d = 1; d <= totalDays; d++) {
    days.push({ date: new Date(year, month, d), dayOfMonth: d });
  }

  return days;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Check if a given date falls within a leave entry's date range.
 */
function isDateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}

export function LeaveCalendar({ leaveEntries, orgSlug }: LeaveCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // For each day, find leave entries that overlap
  const leaveByDate = useMemo(() => {
    const map = new Map<string, CalendarLeaveEntry[]>();
    for (const day of days) {
      if (!day.date) continue;
      const dateStr = day.date.toISOString().slice(0, 10);
      const entries = leaveEntries.filter((e) =>
        isDateInRange(dateStr, e.startDate, e.endDate),
      );
      if (entries.length > 0) {
        map.set(dateStr, entries);
      }
    }
    return map;
  }, [days, leaveEntries]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(null);
  };

  const todayStr = today.toISOString().slice(0, 10);
  const selectedLeave = selectedDate ? leaveByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          {formatMonthYear(currentYear, currentMonth)}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white p-1.5 text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            aria-label="Previous month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white p-1.5 text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            aria-label="Next month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[oklch(0.92_0.005_160)]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-[oklch(0.55_0_0)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day.date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-16 border-b border-r border-[oklch(0.96_0.003_160)] bg-[oklch(0.985_0.003_160)]"
                />
              );
            }

            const dateStr = day.date.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayLeave = leaveByDate.get(dateStr) ?? [];
            const hasLeave = dayLeave.length > 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`h-16 border-b border-r border-[oklch(0.96_0.003_160)] p-1 text-left transition-colors hover:bg-[oklch(0.97_0.01_160)] ${
                  isSelected ? 'bg-[oklch(0.94_0.015_160)]' : ''
                } ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? 'bg-[oklch(0.35_0.06_160)] text-white font-bold'
                      : 'text-[oklch(0.35_0.04_160)]'
                  }`}
                >
                  {day.dayOfMonth}
                </span>
                {hasLeave && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {dayLeave.slice(0, 3).map((entry) => (
                      <span
                        key={entry.id}
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          LEAVE_CALENDAR_COLORS[entry.type as LeaveType] ??
                          'bg-gray-400'
                        }`}
                        title={`${entry.staffName} - ${entry.type}`}
                      />
                    ))}
                    {dayLeave.length > 3 && (
                      <span className="text-[8px] text-[oklch(0.55_0_0)]">
                        +{dayLeave.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h4>
          {selectedLeave.length === 0 ? (
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No leave on this date.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedLeave.map((entry) => (
                <a
                  key={entry.id}
                  href={`/${orgSlug}/staff/${entry.staffProfileId}/leave`}
                  className="block rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3 hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                        {entry.staffName}
                      </p>
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {entry.totalDays} day{entry.totalDays !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeaveStatusBadge status={entry.status} />
                      <LeaveTypeBadge type={entry.type} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(LEAVE_CALENDAR_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
            <span className="text-xs text-[oklch(0.55_0_0)] capitalize">
              {type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
