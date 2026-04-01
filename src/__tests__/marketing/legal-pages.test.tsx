/**
 * Legal Pages Tests — Privacy Policy & Terms of Service
 *
 * Tests:
 * - Privacy policy page renders key sections
 * - Terms of service page renders key sections
 * - Both pages have accessible headings and links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage from '@/app/(marketing)/privacy/page';
import TermsOfServicePage from '@/app/(marketing)/terms/page';

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
// Privacy Policy Tests
// ---------------------------------------------------------------------------

describe('PrivacyPolicyPage', () => {
  it('renders the main heading', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /privacy policy/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders a "Last updated" date', () => {
    render(<PrivacyPolicyPage />);
    const matches = screen.getAllByText(/last updated/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a table of contents navigation', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('navigation', { name: /table of contents/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Who We Are" section', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /who we are/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Data We Collect" section', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /data we collect/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Your Rights Under UK GDPR" section', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /your rights under uk gdpr/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Cookies & Tracking" section', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /cookies & tracking/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Contact Us & Complaints" section', () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole('heading', { name: /contact us & complaints/i }),
    ).toBeInTheDocument();
  });

  it('includes a link to the Terms of Service', () => {
    render(<PrivacyPolicyPage />);
    const termsLinks = screen.getAllByRole('link', { name: /terms of service/i });
    expect(termsLinks.length).toBeGreaterThanOrEqual(1);
    expect(termsLinks[0]).toHaveAttribute('href', '/terms');
  });

  it('includes a back to home link', () => {
    render(<PrivacyPolicyPage />);
    const homeLinks = screen.getAllByRole('link', { name: /back to home/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(homeLinks[0]).toHaveAttribute('href', '/');
  });

  it('mentions ICO registration', () => {
    render(<PrivacyPolicyPage />);
    const matches = screen.getAllByText(/ico/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('mentions UK GDPR compliance', () => {
    render(<PrivacyPolicyPage />);
    const matches = screen.getAllByText(/uk gdpr/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Terms of Service Tests
// ---------------------------------------------------------------------------

describe('TermsOfServicePage', () => {
  it('renders the main heading', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /terms of service/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders a "Last updated" date', () => {
    render(<TermsOfServicePage />);
    const matches = screen.getAllByText(/last updated/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a table of contents navigation', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('navigation', { name: /table of contents/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Definitions" section', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /definitions/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Account Registration & Eligibility" section', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /account registration/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Subscription Plans & Billing" section', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /subscription plans/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Governing Law & Disputes" section', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /governing law/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Termination" section', () => {
    render(<TermsOfServicePage />);
    expect(
      screen.getByRole('heading', { name: /termination/i }),
    ).toBeInTheDocument();
  });

  it('includes a link to the Privacy Policy', () => {
    render(<TermsOfServicePage />);
    const privacyLinks = screen.getAllByRole('link', { name: /privacy policy/i });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
    expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
  });

  it('includes a back to home link', () => {
    render(<TermsOfServicePage />);
    const homeLinks = screen.getAllByRole('link', { name: /back to home/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(homeLinks[0]).toHaveAttribute('href', '/');
  });

  it('includes a link to pricing page', () => {
    render(<TermsOfServicePage />);
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    expect(pricingLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('mentions England and Wales jurisdiction', () => {
    render(<TermsOfServicePage />);
    const matches = screen.getAllByText(/england and wales/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
