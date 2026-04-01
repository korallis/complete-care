'use client';

/**
 * TrainingMatrix — RAG grid showing staff x courses with colour-coded cells.
 *
 * Red = expired/missing, Amber = expiring soon, Green = current, Grey = not required.
 */

import { useState } from 'react';
import type { TrainingMatrixData } from '@/features/training/actions';
import { RAG_CELL_STYLES } from '@/features/training/constants';
import type { RagColour } from '@/features/training/constants';
import { TRAINING_CATEGORY_LABELS } from '@/features/training/schema';
import type { TrainingCategory } from '@/features/training/schema';

type TrainingMatrixProps = {
  data: TrainingMatrixData;
  orgSlug: string;
};

export function TrainingMatrix({ data, orgSlug }: TrainingMatrixProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredCourses = filterCategory === 'all'
    ? data.courses
    : data.courses.filter((c) => c.category === filterCategory);

  // Get unique categories
  const categories = Array.from(new Set(data.courses.map((c) => c.category)));

  if (data.courses.length === 0) {
    return (
      <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No training courses configured. Set up your training catalogue to see the matrix.
        </p>
      </div>
    );
  }

  if (data.rows.length === 0) {
    return (
      <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No active staff found. Add staff members to see the training matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total Staff"
          value={data.summary.totalStaff}
          colour="text-[oklch(0.35_0.04_160)]"
        />
        <SummaryCard
          label="Compliant"
          value={data.summary.compliant}
          colour="text-emerald-700"
        />
        <SummaryCard
          label="Expiring Soon"
          value={data.summary.expiringSoon}
          colour="text-amber-700"
        />
        <SummaryCard
          label="Gaps"
          value={data.summary.gaps}
          colour="text-red-700"
        />
      </div>

      {/* RAG Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-[oklch(0.4_0.02_160)]">Legend:</span>
        {(Object.entries(RAG_CELL_STYLES) as [RagColour, typeof RAG_CELL_STYLES[RagColour]][]).map(
          ([key, style]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-3 rounded border ${style.bg} ${style.border}`}
              />
              <span className="text-[oklch(0.45_0.02_160)]">{style.label}</span>
            </span>
          ),
        )}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[oklch(0.4_0.02_160)]">
            Filter:
          </span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-[oklch(0.35_0.06_160)] text-white'
                : 'bg-[oklch(0.95_0.003_160)] text-[oklch(0.4_0.02_160)] hover:bg-[oklch(0.92_0.005_160)]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-[oklch(0.35_0.06_160)] text-white'
                  : 'bg-[oklch(0.95_0.003_160)] text-[oklch(0.4_0.02_160)] hover:bg-[oklch(0.92_0.005_160)]'
              }`}
            >
              {TRAINING_CATEGORY_LABELS[cat as TrainingCategory] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Matrix grid */}
      <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[oklch(0.92_0.005_160)]">
              <th className="sticky left-0 z-10 bg-[oklch(0.98_0.002_160)] px-3 py-2.5 text-left font-medium text-[oklch(0.4_0.02_160)] min-w-[180px]">
                Staff Member
              </th>
              {filteredCourses.map((course) => (
                <th
                  key={course.id}
                  className="bg-[oklch(0.98_0.002_160)] px-2 py-2.5 text-center font-medium text-[oklch(0.4_0.02_160)] min-w-[90px]"
                >
                  <div
                    className="truncate max-w-[80px]"
                    title={course.name}
                  >
                    {course.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              // Filter cells to match filtered courses
              const filteredCells = row.cells.filter((cell) =>
                filteredCourses.some((c) => c.id === cell.courseId),
              );

              return (
                <tr
                  key={row.staffId}
                  className="border-b border-[oklch(0.95_0.003_160)] last:border-b-0"
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-[oklch(0.95_0.003_160)]">
                    <a
                      href={`/${orgSlug}/staff/${row.staffId}/training`}
                      className="font-medium text-[oklch(0.22_0.04_160)] hover:text-[oklch(0.35_0.06_160)] hover:underline transition-colors"
                    >
                      {row.staffName}
                    </a>
                    <div className="text-[oklch(0.55_0_0)] truncate max-w-[160px]">
                      {row.jobTitle}
                    </div>
                  </td>
                  {filteredCells.map((cell) => {
                    const style = RAG_CELL_STYLES[cell.status];
                    return (
                      <td
                        key={cell.courseId}
                        className="px-1 py-1 text-center"
                      >
                        <div
                          className={`mx-auto h-8 w-full rounded border ${style.bg} ${style.border} flex items-center justify-center`}
                          title={`${style.label}${cell.completedDate ? ` - Completed: ${cell.completedDate}` : ''}${cell.expiryDate ? ` - Expires: ${cell.expiryDate}` : ''}`}
                        >
                          <span className={`text-[10px] font-medium ${style.text}`}>
                            {cell.status === 'green' && cell.expiryDate
                              ? cell.expiryDate.slice(5)
                              : cell.status === 'amber' && cell.expiryDate
                                ? cell.expiryDate.slice(5)
                                : cell.status === 'red'
                                  ? '!'
                                  : cell.status === 'grey'
                                    ? '-'
                                    : ''}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card sub-component
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <div className="rounded-lg border border-[oklch(0.92_0.005_160)] bg-white p-3">
      <p className="text-xs text-[oklch(0.55_0_0)]">{label}</p>
      <p className={`text-2xl font-bold ${colour}`}>{value}</p>
    </div>
  );
}
