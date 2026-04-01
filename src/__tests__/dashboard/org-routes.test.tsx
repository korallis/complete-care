/**
 * Org-Scoped Route Tests
 *
 * Covers routing fixes for org-scoped dashboard navigation:
 * - Onboarding wizard redirects to /[orgSlug]/dashboard after completion
 * - Login form redirects to /[orgSlug]/dashboard when user has an org
 * - Login form redirects to /onboarding when user has no org
 * - Login form respects explicit callbackUrl
 * - Password reset form auto-redirects to /login after success
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OnboardingWizard } from '@/components/organisations/onboarding-wizard';
import { LoginForm } from '@/components/auth/login-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockUpdateSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => ({ update: mockUpdateSession }),
}));

// Mock server actions for onboarding wizard
vi.mock('@/features/organisations/actions', () => ({
  createOrganisationWithInvites: vi.fn().mockResolvedValue({
    success: true,
    data: { orgId: 'test-org-id', orgSlug: 'sunrise-care' },
  }),
  generateOrgSlug: vi.fn().mockResolvedValue('sunrise-care'),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock fetch for login and reset password forms
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location.href
let mockLocationHref = '';
Object.defineProperty(window, 'location', {
  value: {
    get href() {
      return mockLocationHref;
    },
    set href(value: string) {
      mockLocationHref = value;
    },
  },
  writable: true,
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function completeOnboarding() {
  render(<OnboardingWizard userName="Jane Smith" />);
  mockUpdateSession.mockResolvedValue(undefined);

  // Step 1: fill org details
  fireEvent.change(screen.getByLabelText(/organisation name/i), {
    target: { value: 'Sunrise Care' },
  });
  fireEvent.change(screen.getByLabelText(/url slug/i), {
    target: { value: 'sunrise-care' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  });

  // Step 2: select domain
  await act(async () => {
    fireEvent.click(
      screen.getByRole('checkbox', { name: /domiciliary care/i }),
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  });

  // Step 3: skip
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
  });
}

// ---------------------------------------------------------------------------
// Onboarding wizard — org-scoped redirect
// ---------------------------------------------------------------------------

describe('Onboarding wizard — org-scoped redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref = '';
    mockUpdateSession.mockResolvedValue(undefined);
  });

  it('redirects to /[orgSlug]/dashboard?welcome=true after completion', async () => {
    await completeOnboarding();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sunrise-care/dashboard?welcome=true');
    });
  });

  it('includes ?welcome=true in the redirect URL', async () => {
    await completeOnboarding();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('?welcome=true'),
      );
    });
  });

  it('includes the org slug in the redirect URL', async () => {
    await completeOnboarding();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('sunrise-care'),
      );
    });
  });

  it('falls back to /dashboard?welcome=true when orgSlug is not in result', async () => {
    const { createOrganisationWithInvites } = await import(
      '@/features/organisations/actions'
    );
    (createOrganisationWithInvites as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { orgId: 'test-org-id', orgSlug: '' },
    });

    await completeOnboarding();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard?welcome=true');
    });
  });
});

// ---------------------------------------------------------------------------
// Login form — org-scoped redirect
// ---------------------------------------------------------------------------

describe('Login form — redirect behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref = '';
  });

  it('redirects to /[orgSlug]/dashboard when login response includes orgSlug', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Logged in successfully',
        orgSlug: 'acme-care',
        hasOrg: true,
      }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123!' },
    });

    // Submit the form (use querySelector since <form> doesn't have an ARIA role by default)
    await act(async () => {
      fireEvent.submit(document.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockLocationHref).toBe('/acme-care/dashboard');
    });
  });

  it('redirects to /onboarding when login response has no orgSlug', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Logged in successfully',
        orgSlug: null,
        hasOrg: false,
      }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123!' },
    });

    await act(async () => {
      fireEvent.submit(document.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockLocationHref).toBe('/onboarding');
    });
  });

  it('respects explicit callbackUrl over org-scoped redirect', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Logged in successfully',
        orgSlug: 'acme-care',
        hasOrg: true,
      }),
    });

    render(<LoginForm callbackUrl="/acme-care/settings" />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'Password123!' },
    });

    await act(async () => {
      fireEvent.submit(document.querySelector('form')!);
    });

    await waitFor(() => {
      expect(mockLocationHref).toBe('/acme-care/settings');
    });
  });

  it('shows error when login fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email or password' }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' },
    });

    await act(async () => {
      fireEvent.submit(document.querySelector('form')!);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Reset password form — auto-redirect
// ---------------------------------------------------------------------------

async function submitResetPasswordForm() {
  fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
    target: { value: 'NewPassword123!' },
  });
  fireEvent.change(screen.getByPlaceholderText('Repeat your new password'), {
    target: { value: 'NewPassword123!' },
  });
  await act(async () => {
    fireEvent.submit(document.querySelector('form')!);
  });
}

describe('Reset password form — auto-redirect to login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref = '';
  });

  it('shows a countdown message after successful password reset', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successfully' }),
    });

    render(<ResetPasswordForm token="valid-token" />);
    await submitResetPasswordForm();

    await waitFor(() => {
      expect(screen.getByText(/redirecting to sign in/i)).toBeInTheDocument();
    });
  });

  it('shows "Sign in now" link for immediate navigation after success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successfully' }),
    });

    render(<ResetPasswordForm token="valid-token" />);
    await submitResetPasswordForm();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign in now/i })).toBeInTheDocument();
    });
  });

  it('shows "Password reset" heading after success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successfully' }),
    });

    render(<ResetPasswordForm token="valid-token" />);
    await submitResetPasswordForm();

    await waitFor(() => {
      expect(screen.getByText(/password reset/i)).toBeInTheDocument();
    });
  });
});
