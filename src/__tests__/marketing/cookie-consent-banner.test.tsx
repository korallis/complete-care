/**
 * CookieConsentBanner Component Tests
 *
 * Tests:
 * - Banner renders when no consent is stored
 * - Accept button persists 'accepted' to localStorage
 * - Reject button persists 'rejected' to localStorage
 * - Dismiss (X) button persists 'rejected' to localStorage
 * - Banner does not render if consent is already stored
 * - useCookieConsent hook reads from localStorage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  CookieConsentBanner,
  useCookieConsent,
  COOKIE_CONSENT_KEY,
} from '@/components/marketing/cookie-consent-banner';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    target,
    rel,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <a href={href} className={className} target={target} rel={rel} onClick={onClick}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearConsentStorage() {
  localStorageMock.removeItem(COOKIE_CONSENT_KEY);
}

// ---------------------------------------------------------------------------
// CookieConsentBanner Tests
// ---------------------------------------------------------------------------

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    clearConsentStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearConsentStorage();
    vi.useRealTimers();
  });

  it('renders the cookie banner after delay when no consent is stored', async () => {
    render(<CookieConsentBanner />);

    // Banner is not yet visible (delayed 600ms)
    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();

    // Advance timers past the 600ms delay
    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument();
  });

  it('does not render when consent is already accepted in localStorage', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');

    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();
  });

  it('does not render when consent is already rejected in localStorage', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');

    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();
  });

  it('shows Accept and Reject buttons', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-accept-button')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-reject-button')).toBeInTheDocument();
  });

  it('shows a dismiss (X) button', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-dismiss-button')).toBeInTheDocument();
  });

  it('persists "accepted" to localStorage when Accept is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByTestId('cookie-accept-button'));

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');
  });

  it('hides banner after Accept is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cookie-accept-button'));

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();
  });

  it('persists "rejected" to localStorage when Reject is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByTestId('cookie-reject-button'));

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('rejected');
  });

  it('hides banner after Reject is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cookie-reject-button'));

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();
  });

  it('persists "rejected" to localStorage when dismiss (X) is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByTestId('cookie-dismiss-button'));

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('rejected');
  });

  it('hides banner after dismiss (X) is clicked', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cookie-dismiss-button'));

    expect(screen.queryByTestId('cookie-consent-banner')).not.toBeInTheDocument();
  });

  it('banner has accessible dialog role and label', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    const banner = screen.getByRole('dialog', { name: /cookie consent/i });
    expect(banner).toBeInTheDocument();
  });

  it('includes a link to the privacy policy', async () => {
    render(<CookieConsentBanner />);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    const link = screen.getByRole('link', { name: /learn more/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/privacy#section-8');
  });
});

// ---------------------------------------------------------------------------
// useCookieConsent Hook Tests
// ---------------------------------------------------------------------------

describe('useCookieConsent', () => {
  beforeEach(() => {
    clearConsentStorage();
  });

  afterEach(() => {
    clearConsentStorage();
  });

  it('returns null consent when nothing is stored', async () => {
    const { result } = renderHook(() => useCookieConsent());

    // After useEffect runs (hydration)
    await act(async () => {});

    expect(result.current.consent).toBeNull();
    expect(result.current.hasAnswered).toBe(false);
  });

  it('reads "accepted" from localStorage on mount', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');

    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {});

    expect(result.current.consent).toBe('accepted');
    expect(result.current.hasAnswered).toBe(true);
  });

  it('reads "rejected" from localStorage on mount', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');

    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {});

    expect(result.current.consent).toBe('rejected');
    expect(result.current.hasAnswered).toBe(true);
  });

  it('setConsent persists to localStorage and updates state', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {});

    act(() => {
      result.current.setConsent('accepted');
    });

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');
    expect(result.current.consent).toBe('accepted');
  });

  it('setConsent can set rejected', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {});

    act(() => {
      result.current.setConsent('rejected');
    });

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('rejected');
    expect(result.current.consent).toBe('rejected');
  });

  it('ignores invalid values stored in localStorage', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'invalid-value');

    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {});

    // Invalid value should not be read as a valid consent
    expect(result.current.consent).toBeNull();
    expect(result.current.hasAnswered).toBe(false);
  });
});
