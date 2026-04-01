'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key used to persist consent choice */
export const COOKIE_CONSENT_KEY = 'cc_consent';

/** Consent values */
export type CookieConsent = 'accepted' | 'rejected';

// ---------------------------------------------------------------------------
// Hook — useCookieConsent
// ---------------------------------------------------------------------------

/**
 * Returns the current cookie consent status and a setter.
 * Reads from localStorage on mount; persists changes to localStorage.
 *
 * Returns `null` while reading (banner should not yet be shown).
 */
export function useCookieConsent(): {
  consent: CookieConsent | null;
  setConsent: (value: CookieConsent) => void;
  hasAnswered: boolean;
} {
  const [consent, setConsentState] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent | null;
    if (stored === 'accepted' || stored === 'rejected') {
      setConsentState(stored);
    }
    setHydrated(true);
  }, []);

  const setConsent = (value: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setConsentState(value);
  };

  return {
    consent,
    setConsent,
    hasAnswered: hydrated && consent !== null,
  };
}

// ---------------------------------------------------------------------------
// CookieConsentBanner component
// ---------------------------------------------------------------------------

/**
 * Floating cookie consent banner shown on first visit to any public page.
 * Dismissed once the user accepts or rejects cookies.
 * Their preference is persisted to localStorage (key: cc_consent).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const { consent, setConsent, hasAnswered } = useCookieConsent();

  // Show the banner only after client-side hydration and if not answered yet
  useEffect(() => {
    if (hasAnswered === false) {
      // Short delay so it doesn't flash in on initial render
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
    if (consent !== null) {
      setVisible(false);
    }
  }, [hasAnswered, consent]);

  const handleAccept = () => {
    setConsent('accepted');
    setVisible(false);
  };

  const handleReject = () => {
    setConsent('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-3xl mx-auto">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-[oklch(0.11_0.025_160)] border border-[oklch(0.22_0.04_160)]/60 rounded-2xl px-5 py-5 shadow-2xl shadow-black/40 backdrop-blur-md">
          {/* Icon */}
          <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-[oklch(0.22_0.04_160)]/30 border border-[oklch(0.22_0.04_160)]/50">
            <Cookie className="w-5 h-5 text-[oklch(0.78_0.06_160)]" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-white leading-tight">
                Cookie preferences
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[oklch(0.72_0.08_160)] bg-[oklch(0.22_0.04_160)]/30 px-1.5 py-0.5 rounded-full">
                <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
                UK GDPR
              </span>
            </div>
            <p className="text-xs text-[oklch(0.65_0.01_160)] leading-relaxed">
              We use essential cookies to run the platform. With your consent,
              we also use analytics cookies to improve our service.{' '}
              <Link
                href="/privacy#section-8"
                className="text-[oklch(0.72_0.04_160)] hover:text-white underline decoration-[oklch(0.72_0.04_160)]/50 hover:decoration-white/50 transition-colors"
              >
                Learn more
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="h-8 px-4 text-xs font-medium border-[oklch(0.28_0.03_160)] bg-transparent text-[oklch(0.72_0.02_160)] hover:bg-[oklch(0.18_0.02_160)] hover:text-white hover:border-[oklch(0.38_0.04_160)] transition-all"
              data-testid="cookie-reject-button"
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="h-8 px-4 text-xs font-semibold bg-[oklch(0.72_0.15_160)] hover:bg-[oklch(0.78_0.16_160)] text-[oklch(0.08_0.02_160)] border-0 transition-all"
              data-testid="cookie-accept-button"
            >
              Accept all
            </Button>
          </div>

          {/* Dismiss (reject) via X */}
          <button
            type="button"
            onClick={handleReject}
            className="absolute top-3 right-3 p-1 rounded-lg text-[oklch(0.52_0.01_160)] hover:text-[oklch(0.78_0.02_160)] hover:bg-[oklch(0.18_0.02_160)] transition-all"
            aria-label="Dismiss cookie banner"
            data-testid="cookie-dismiss-button"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
