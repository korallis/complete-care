'use client';

/**
 * Skills progress chart — shows competency level trends over time per skill.
 * Uses recharts for the line chart visualisation.
 */

import {
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_LEVEL_VALUE,
  type CompetencyLevel,
} from '@/features/outcomes/schema';

interface SkillTrendPoint {
  date: string;
  level: CompetencyLevel;
}

interface SkillDomainGroup {
  domainName: string;
  skills: {
    skillName: string;
    latestLevel: CompetencyLevel;
    trend: SkillTrendPoint[];
  }[];
}

const levelBarWidth: Record<CompetencyLevel, string> = {
  physical_prompt: 'w-1/4',
  prompted: 'w-2/4',
  verbal_prompt: 'w-3/4',
  independent: 'w-full',
};

const levelBarColor: Record<CompetencyLevel, string> = {
  physical_prompt: 'bg-red-400',
  prompted: 'bg-amber-400',
  verbal_prompt: 'bg-blue-400',
  independent: 'bg-emerald-500',
};

const levelBadge: Record<CompetencyLevel, string> = {
  physical_prompt: 'text-red-700 bg-red-50 border-red-200',
  prompted: 'text-amber-700 bg-amber-50 border-amber-200',
  verbal_prompt: 'text-blue-700 bg-blue-50 border-blue-200',
  independent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

function TrendIndicator({ trend }: { trend: SkillTrendPoint[] }) {
  if (trend.length < 2) return null;

  const latest = COMPETENCY_LEVEL_VALUE[trend[trend.length - 1].level];
  const previous = COMPETENCY_LEVEL_VALUE[trend[trend.length - 2].level];
  const diff = latest - previous;

  if (diff > 0) {
    return (
      <span className="inline-flex items-center text-emerald-600" title="Improving">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (diff < 0) {
    return (
      <span className="inline-flex items-center text-red-500" title="Declining">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-slate-400" title="Stable">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function SkillsProgressChart({
  domains,
}: {
  domains: SkillDomainGroup[];
}) {
  if (domains.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
        <p className="text-sm text-slate-500">
          No skills data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competency level legend */}
      <div className="flex flex-wrap gap-3">
        {(
          ['physical_prompt', 'prompted', 'verbal_prompt', 'independent'] as const
        ).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-sm ${levelBarColor[level]}`}
            />
            <span className="text-xs text-slate-500">
              {COMPETENCY_LEVEL_LABELS[level]}
            </span>
          </div>
        ))}
      </div>

      {domains.map((domain) => (
        <div key={domain.domainName}>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {domain.domainName}
          </h4>
          <div className="space-y-2.5">
            {domain.skills.map((skill) => (
              <div
                key={skill.skillName}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {skill.skillName}
                    </span>
                    <TrendIndicator trend={skill.trend} />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${levelBadge[skill.latestLevel]}`}
                  >
                    {COMPETENCY_LEVEL_LABELS[skill.latestLevel]}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${levelBarColor[skill.latestLevel]} ${levelBarWidth[skill.latestLevel]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
