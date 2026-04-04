/**
 * Demo Page Component Tests
 *
 * Tests the DemoBookingForm component:
 * - Renders the form with all required fields
 * - Validates required fields before submission
 * - Shows success state after form submission
 * - Demo page is publicly accessible (no auth required)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DemoBookingForm } from '@/components/marketing/demo-booking-form';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// DemoBookingForm Tests
// ---------------------------------------------------------------------------

describe('DemoBookingForm', () => {
  it('renders the form heading', () => {
    render(<DemoBookingForm />);
    expect(screen.getByText(/request your demo/i)).toBeInTheDocument();
  });

  it('renders the full name field', () => {
    render(<DemoBookingForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('renders the work email field', () => {
    render(<DemoBookingForm />);
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
  });

  it('renders the organisation name field', () => {
    render(<DemoBookingForm />);
    expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
  });

  it('renders the phone number field', () => {
    render(<DemoBookingForm />);
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('renders the care domain selector', () => {
    render(<DemoBookingForm />);
    expect(screen.getByLabelText(/care domain/i)).toBeInTheDocument();
  });

  it('renders the optional message field', () => {
    render(<DemoBookingForm />);
    expect(screen.getByPlaceholderText(/particularly interested/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<DemoBookingForm />);
    expect(screen.getByRole('button', { name: /request demo/i })).toBeInTheDocument();
  });

  it('shows validation error when name is empty and form submitted', async () => {
    render(<DemoBookingForm />);
    const submitBtn = screen.getByRole('button', { name: /request demo/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(screen.getByText(/your name is required/i)).toBeInTheDocument();
  });

  it('shows validation error when email is empty', async () => {
    render(<DemoBookingForm />);
    // Fill name but leave email empty
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });
    expect(screen.getByText(/your email is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<DemoBookingForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'not-an-email' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });

  it('shows validation error when organisation is empty', async () => {
    render(<DemoBookingForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'jane@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });
    expect(screen.getByText(/organisation name is required/i)).toBeInTheDocument();
  });

  it('shows validation error when care domain not selected', async () => {
    render(<DemoBookingForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/organisation name/i), {
      target: { value: 'Sunrise Care' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });
    expect(screen.getByText(/please select a care domain/i)).toBeInTheDocument();
  });

  it('shows success state after valid form submission', async () => {
    render(<DemoBookingForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/organisation name/i), {
      target: { value: 'Sunrise Care' },
    });
    fireEvent.change(screen.getByLabelText(/care domain/i), {
      target: { value: 'domiciliary' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });

    await waitFor(
      () => {
        expect(screen.getByText(/demo request received/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  }, 10000);

  it('clears field error when field is corrected', async () => {
    render(<DemoBookingForm />);
    // Trigger validation error
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request demo/i }));
    });
    expect(screen.getByText(/your name is required/i)).toBeInTheDocument();

    // Fix the error
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Smith' },
    });
    expect(screen.queryByText(/your name is required/i)).not.toBeInTheDocument();
  });

  it('has privacy policy link', () => {
    render(<DemoBookingForm />);
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('includes all care domain options', () => {
    render(<DemoBookingForm />);
    const domainSelect = screen.getByLabelText(/care domain/i);
    expect(domainSelect).toBeInTheDocument();
    // Check all options are present
    const options = Array.from((domainSelect as HTMLSelectElement).options).map(
      (o) => o.text,
    );
    expect(options).toContain('Domiciliary Care');
    expect(options).toContain('Supported Living');
    expect(options).toContain('Complex Care');
    expect(options).toContain("Children's Residential Homes");
    expect(options).toContain('Multiple / All Domains');
  });
});
