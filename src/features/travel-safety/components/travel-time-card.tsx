'use client';

import type { TravelRecord } from '@/lib/db/schema/visit-tasks';

interface TravelTimeCardProps {
  records: TravelRecord[];
}

export function TravelTimeCard({ records }: TravelTimeCardProps) {
  const totalExpected = records.reduce(
    (acc, r) => acc + (r.expectedMinutes ?? 0),
    0,
  );
  const totalActual = records.reduce(
    (acc, r) => acc + (r.actualMinutes ?? 0),
    0,
  );
  const overdueCount = records.filter((r) => r.isOverdue).length;
  const totalDistanceMiles = records.reduce(
    (acc, r) => acc + (r.actualDistanceMiles ?? 0),
    0,
  );

  const variance =
    totalExpected > 0
      ? Math.round(((totalActual - totalExpected) / totalExpected) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Travel Summary</h3>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{records.length}</p>
          <p className="text-xs text-gray-500">Journeys</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">
            {totalActual} min
          </p>
          <p className="text-xs text-gray-500">Total Travel</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p
            className={`text-2xl font-bold ${
              variance > 10
                ? 'text-red-600'
                : variance < -10
                  ? 'text-green-600'
                  : 'text-gray-900'
            }`}
          >
            {variance > 0 ? '+' : ''}
            {variance}%
          </p>
          <p className="text-xs text-gray-500">vs Expected</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(totalDistanceMiles * 10) / 10} mi
          </p>
          <p className="text-xs text-gray-500">Total Distance</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            {overdueCount} journey(s) exceeded expected travel time
          </p>
        </div>
      )}

      {/* Journey list */}
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {records.map((record) => (
          <li key={record.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm text-gray-900">
                {record.travelMode === 'car' ? 'Drove' : record.travelMode}{' '}
                {record.actualDistanceMiles
                  ? `${Math.round(record.actualDistanceMiles * 10) / 10} miles`
                  : ''}
              </p>
              {record.notes && (
                <p className="text-xs text-gray-500">{record.notes}</p>
              )}
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  record.isOverdue ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {record.actualMinutes ?? '?'} min
              </p>
              {record.expectedMinutes != null && (
                <p className="text-xs text-gray-400">
                  Expected: {record.expectedMinutes} min
                </p>
              )}
            </div>
          </li>
        ))}
        {records.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            No travel records yet.
          </li>
        )}
      </ul>
    </div>
  );
}
