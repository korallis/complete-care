'use client';

import type { VarianceReport } from '../types';

export function VarianceReportTable({ data }: { data: VarianceReport[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No variance data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-4 py-3 font-medium">Person</th>
            <th className="px-4 py-3 font-medium">Week</th>
            <th className="px-4 py-3 font-medium text-right">Planned Hrs</th>
            <th className="px-4 py-3 font-medium text-right">Actual Hrs</th>
            <th className="px-4 py-3 font-medium text-right">Variance</th>
            <th className="px-4 py-3 font-medium text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const isNegative = parseFloat(row.varianceHours) < 0;
            const isSignificant = Math.abs(row.variancePercent) > 10;
            return (
              <tr key={idx} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{row.personName}</td>
                <td className="px-4 py-3">
                  W{row.weekNumber} {row.year}
                </td>
                <td className="px-4 py-3 text-right">{row.plannedHours}</td>
                <td className="px-4 py-3 text-right">{row.actualHours}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    isNegative ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {row.varianceHours}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    isSignificant
                      ? isNegative
                        ? 'font-bold text-red-600'
                        : 'font-bold text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {row.variancePercent > 0 ? '+' : ''}
                  {row.variancePercent.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
