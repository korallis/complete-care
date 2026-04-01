'use client';

/**
 * BowelChart — displays bowel records with Bristol type indicators
 * and constipation/diarrhoea alert banners.
 */

import {
  BRISTOL_TYPE_SHORT_LABELS,
  STOOL_COLOUR_LABELS,
  type BristolType,
  type StoolColour,
} from '@/features/bowel-sleep-pain/constants';
import type { BowelAlert } from '@/features/bowel-sleep-pain/scoring';

type BowelRecord = {
  id: string;
  bristolType: number;
  colour: string;
  bloodPresent: boolean;
  mucusPresent: boolean;
  laxativeGiven: boolean;
  laxativeName: string | null;
  notes: string | null;
  recordedByName: string | null;
  recordedAt: Date;
};

type BowelChartProps = {
  records: BowelRecord[];
  constipationAlert: BowelAlert;
  diarrhoeaAlert: BowelAlert;
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function BristolBadge({ type }: { type: number }) {
  const colours: Record<number, string> = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-emerald-100 text-emerald-800',
    4: 'bg-emerald-100 text-emerald-800',
    5: 'bg-yellow-100 text-yellow-800',
    6: 'bg-orange-100 text-orange-800',
    7: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colours[type] ?? 'bg-gray-100 text-gray-800'}`}
    >
      Type {type}: {BRISTOL_TYPE_SHORT_LABELS[type as BristolType] ?? 'Unknown'}
    </span>
  );
}

export function BowelChart({
  records,
  constipationAlert,
  diarrhoeaAlert,
}: BowelChartProps) {
  return (
    <div className="space-y-4">
      {/* Alert banners */}
      {constipationAlert.level !== 'none' && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            constipationAlert.level === 'red'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="font-medium">
            {constipationAlert.level === 'red' ? 'Red Alert' : 'Amber Alert'}:
          </span>{' '}
          {constipationAlert.message}
        </div>
      )}

      {diarrhoeaAlert.level !== 'none' && (
        <div
          role="alert"
          className="rounded-lg border bg-red-50 border-red-200 px-4 py-3 text-sm text-red-800"
        >
          <span className="font-medium">Diarrhoea Alert:</span>{' '}
          {diarrhoeaAlert.message}
        </div>
      )}

      {/* Records table */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white">
        <div className="px-4 py-3 border-b border-[oklch(0.91_0.005_160)]">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Bowel Records
          </h3>
        </div>

        {records.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No bowel records for this day.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.91_0.005_160)]">
            {records.map((record) => (
              <div key={record.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BristolBadge type={record.bristolType} />
                      <span className="text-xs text-[oklch(0.55_0_0)]">
                        {STOOL_COLOUR_LABELS[record.colour as StoolColour] ??
                          record.colour}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {record.bloodPresent && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Blood
                        </span>
                      )}
                      {record.mucusPresent && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Mucus
                        </span>
                      )}
                      {record.laxativeGiven && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Laxative{record.laxativeName ? `: ${record.laxativeName}` : ''}
                        </span>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {record.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-medium text-[oklch(0.35_0.04_160)]">
                      {formatTime(record.recordedAt)}
                    </p>
                    {record.recordedByName && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {record.recordedByName}
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
