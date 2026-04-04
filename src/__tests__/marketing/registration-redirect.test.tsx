/**
 * Tests for RegisterForm — redirect to /verify-email after successful registration.
 *
 * Validates:
 * - After successful registration API response (201), the user is redirected
 *   to /verify-email
 * - Error cases still show inline error messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '@/components/auth/register-form';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RegisterForm — successful registration redirects to /verify-email', () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = vi.fn();
  });

  it('redirects to /verify-email after successful registration', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Account created. Please check your email.',
        userId: 'new-user-id',
      }),
    });

    render(<RegisterForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'SecurePass123!' },
    });

    // Accept terms
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });
  });

  it('shows error message when registration fails with 409', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'We could not complete your registration. Please check your details or sign in if you already have an account.',
      }),
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'SecurePass123!' },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Should NOT redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not show a success screen — redirects instead', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Account created.',
        userId: 'new-user-id',
      }),
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'SecurePass123!' },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });

    // Should not render an "Account created" heading (no success screen)
    expect(screen.queryByText('Account created!')).not.toBeInTheDocument();
  });
});
