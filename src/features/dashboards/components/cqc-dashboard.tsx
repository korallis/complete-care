'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CqcDashboardData, QualityStatement, CoverageLevel } from '../types';

interface CqcDashboardProps {
  data: CqcDashboardData;
}

const coverageConfig: Record<CoverageLevel, { label: string; className: string }> = {
  full: { label: 'Full', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  none: { label: 'Gap', className: 'bg-red-100 text-red-800 border-red-200' },
};

export function CqcDashboard({ data }: CqcDashboardProps) {
  const { overallCoverage, statements } = data;

  // Group statements by category
  const grouped = statements.reduce<Record<string, QualityStatement[]>>((acc, stmt) => {
    (acc[stmt.category] ??= []).push(stmt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Coverage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CQC Quality Statement Coverage</CardTitle>
          <CardDescription>
            Evidence mapping across {overallCoverage.totalStatements} quality statements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold">{overallCoverage.coveragePercent}%</p>
              <p className="text-sm text-muted-foreground">overall coverage</p>
            </div>
            <div className="flex gap-6">
              <CoverageCounter label="Full" count={overallCoverage.full} color="text-emerald-600" />
              <CoverageCounter label="Partial" count={overallCoverage.partial} color="text-amber-600" />
              <CoverageCounter label="Gaps" count={overallCoverage.none} color="text-red-600" />
            </div>
          </div>
          {/* Coverage bar */}
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
            <div
              className="bg-emerald-500 transition-all"
              style={{
                width: `${(overallCoverage.full / overallCoverage.totalStatements) * 100}%`,
              }}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{
                width: `${(overallCoverage.partial / overallCoverage.totalStatements) * 100}%`,
              }}
            />
            <div
              className="bg-red-400 transition-all"
              style={{
                width: `${(overallCoverage.none / overallCoverage.totalStatements) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statements by Category */}
      {Object.entries(grouped).map(([category, stmts]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
            <CardDescription>
              {stmts.filter((s) => s.coverageLevel === 'full').length}/{stmts.length} fully covered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stmts.map((stmt) => (
                <div
                  key={stmt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold text-muted-foreground">
                      {stmt.code}
                    </span>
                    <span className="text-sm">{stmt.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {stmt.evidenceCount} evidence{stmt.evidenceCount !== 1 ? 's' : ''}
                    </span>
                    <Badge
                      className={cn(
                        'text-xs',
                        coverageConfig[stmt.coverageLevel].className,
                      )}
                    >
                      {coverageConfig[stmt.coverageLevel].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CoverageCounter({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={cn('text-xl font-bold', color)}>{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
