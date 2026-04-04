'use client';

import { useState } from 'react';
import type { Reg45Status } from '../types';

const STATUS_STYLES: Record<Reg45Status, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  pending_review: 'bg-blue-100 text-blue-800',
  signed_off: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

interface VersionEntry {
  version: number;
  createdAt: string;
  createdBy: string;
}

export function Reg45SignOff({
  reportId,
  currentStatus,
  versions,
}: {
  reportId: string;
  currentStatus: Reg45Status;
  versions: VersionEntry[];
}) {
  void reportId;
  const [notes, setNotes] = useState('');
  const [signing, setSigning] = useState(false);

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Current Status:</span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[currentStatus]}`}
        >
          {currentStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Version history */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Version History</h3>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.version}
                className="flex items-center justify-between rounded-md border px-4 py-2 text-sm"
              >
                <span className="font-medium">Version {v.version}</span>
                <span className="text-muted-foreground">
                  {v.createdBy} &mdash; {v.createdAt}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign-off form */}
      {currentStatus === 'pending_review' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Sign Off Report</h3>
          <div className="mb-3">
            <label htmlFor="signOffNotes" className="mb-1 block text-sm font-medium">
              Sign-off Notes
            </label>
            <textarea
              id="signOffNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Any notes or observations for sign-off..."
            />
          </div>
          <button
            type="button"
            disabled={signing}
            onClick={async () => {
              setSigning(true);
              // TODO: Wire to signOffReport server action
              setSigning(false);
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {signing ? 'Signing Off...' : 'Sign Off as Responsible Individual'}
          </button>
        </div>
      )}
    </div>
  );
}
