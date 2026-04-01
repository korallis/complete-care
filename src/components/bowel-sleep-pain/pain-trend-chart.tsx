'use client';

/**
 * PainTrendChart — displays pain assessment history with severity trends.
 */

import {
  PAIN_TOOL_LABELS,
  PAIN_TYPE_LABELS,
  type PainTool,
  type PainType,
} from '@/features/bowel-sleep-pain/constants';

type PainAssessmentItem = {
  id: string;
  toolUsed: string;
  nrsScore: number | null;
  location: string | null;
  painType: string | null;
  totalScore: number;
  notes: string | null;
  recordedByName: string | null;
  recordedAt: Date;
};

type PainTrendPoint = {
  recordedAt: Date;
  toolUsed: string;
  totalScore: number;
};

type PainTrendChartProps = {
  assessments: PainAssessmentItem[];
  trendData: PainTrendPoint[];
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function ScoreBadge({
  score,
  tool,
}: {
  score: number;
  tool: string;
}) {
  // Determine severity colour based on tool and score
  let colour = 'bg-emerald-100 text-emerald-800';
  if (tool === 'nrs' || tool === 'painad') {
    if (score >= 7) colour = 'bg-red-100 text-red-800';
    else if (score >= 4) colour = 'bg-orange-100 text-orange-800';
    else if (score >= 1) colour = 'bg-yellow-100 text-yellow-800';
  } else if (tool === 'abbey') {
    if (score >= 14) colour = 'bg-red-100 text-red-800';
    else if (score >= 8) colour = 'bg-orange-100 text-orange-800';
    else if (score >= 1) colour = 'bg-yellow-100 text-yellow-800';
  }

  const maxScore = tool === 'abbey' ? 18 : 10;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colour}`}
    >
      {score}/{maxScore}
    </span>
  );
}

export function PainTrendChart({
  assessments,
  trendData,
}: PainTrendChartProps) {
  return (
    <div className="space-y-4">
      {/* Simple trend visualization */}
      {trendData.length > 1 && (
        <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-3">
            Pain Trend
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.91_0.005_160)]">
                  <th className="px-2 py-1.5 text-left text-[oklch(0.55_0_0)] font-medium">
                    Date
                  </th>
                  <th className="px-2 py-1.5 text-left text-[oklch(0.55_0_0)] font-medium">
                    Tool
                  </th>
                  <th className="px-2 py-1.5 text-left text-[oklch(0.55_0_0)] font-medium">
                    Score
                  </th>
                  <th className="px-2 py-1.5 text-left text-[oklch(0.55_0_0)] font-medium">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((point, i) => {
                  const maxScore = point.toolUsed === 'abbey' ? 18 : 10;
                  const pct = Math.round((point.totalScore / maxScore) * 100);
                  return (
                    <tr
                      key={i}
                      className="border-b border-[oklch(0.95_0.003_160)]"
                    >
                      <td className="px-2 py-1.5 text-[oklch(0.35_0.04_160)]">
                        {formatDate(point.recordedAt)}
                      </td>
                      <td className="px-2 py-1.5 text-[oklch(0.55_0_0)]">
                        {PAIN_TOOL_LABELS[point.toolUsed as PainTool] ??
                          point.toolUsed}
                      </td>
                      <td className="px-2 py-1.5">
                        <ScoreBadge
                          score={point.totalScore}
                          tool={point.toolUsed}
                        />
                      </td>
                      <td className="px-2 py-1.5 w-32">
                        <div className="h-2 rounded-full bg-[oklch(0.93_0.003_160)]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pct >= 70
                                ? 'bg-red-400'
                                : pct >= 40
                                  ? 'bg-orange-400'
                                  : pct >= 10
                                    ? 'bg-yellow-400'
                                    : 'bg-emerald-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assessment list */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white">
        <div className="px-4 py-3 border-b border-[oklch(0.91_0.005_160)]">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Pain Assessments
          </h3>
        </div>

        {assessments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No pain assessments recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.91_0.005_160)]">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[oklch(0.35_0.04_160)]">
                        {PAIN_TOOL_LABELS[assessment.toolUsed as PainTool] ??
                          assessment.toolUsed}
                      </span>
                      <ScoreBadge
                        score={assessment.totalScore}
                        tool={assessment.toolUsed}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[oklch(0.55_0_0)]">
                      {assessment.location && (
                        <span>Location: {assessment.location}</span>
                      )}
                      {assessment.painType && (
                        <span>
                          Type:{' '}
                          {PAIN_TYPE_LABELS[assessment.painType as PainType] ??
                            assessment.painType}
                        </span>
                      )}
                    </div>
                    {assessment.notes && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {assessment.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-medium text-[oklch(0.35_0.04_160)]">
                      {formatDate(assessment.recordedAt)}{' '}
                      {formatTime(assessment.recordedAt)}
                    </p>
                    {assessment.recordedByName && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {assessment.recordedByName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
