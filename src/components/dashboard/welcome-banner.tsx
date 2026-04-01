'use client';

/**
 * WelcomeBanner — shown on the dashboard after a user completes onboarding.
 * Dismissible client component — clicking ✕ removes it from the page
 * (without server-side state, dismissal is client-only / session-scoped).
 */

import { useState } from 'react';

interface WelcomeBannerProps {
  userName?: string;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const firstName = userName?.split(' ')[0];

  return (
    <div
      role="status"
      aria-label="Welcome message"
      className="relative rounded-xl border border-[oklch(0.85_0.06_160)] bg-gradient-to-r from-[oklch(0.96_0.02_160)] to-[oklch(0.94_0.04_200/0.4)] p-5 flex items-start gap-4"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[oklch(0.35_0.08_160/0.15)] flex items-center justify-center text-xl">
        🎉
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-[oklch(0.18_0.04_160)]">
          {firstName
            ? `Welcome to Complete Care, ${firstName}!`
            : 'Welcome to Complete Care!'}
        </h2>
        <p className="mt-0.5 text-sm text-[oklch(0.45_0.02_160)]">
          Your organisation is set up and ready to go. Start by adding your
          first person or exploring the settings.
        </p>

        {/* Quick-start links */}
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.3_0.06_160)] hover:text-[oklch(0.2_0.05_160)] underline-offset-2 hover:underline transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Add your first person
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.3_0.06_160)] hover:text-[oklch(0.2_0.05_160)] underline-offset-2 hover:underline transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Invite team members
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.3_0.06_160)] hover:text-[oklch(0.2_0.05_160)] underline-offset-2 hover:underline transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Configure settings
          </a>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss welcome message"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[oklch(0.55_0.02_160)] hover:text-[oklch(0.3_0.04_160)] hover:bg-[oklch(0.9_0.03_160/0.5)] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
