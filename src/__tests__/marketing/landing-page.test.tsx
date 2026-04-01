/**
 * Landing Page Component Tests
 *
 * Tests the marketing landing page components:
 * - MarketingNav renders correctly with all navigation links
 * - MarketingNav mobile menu toggle works
 * - MarketingFooter renders with all required links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// MarketingNav Tests
// ---------------------------------------------------------------------------

describe('MarketingNav', () => {
  it('renders the brand logo link', () => {
    render(<MarketingNav />);
    const logoLink = screen.getByRole('link', { name: /complete care/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders desktop navigation links', () => {
    render(<MarketingNav />);
    // Features link
    const featuresLinks = screen.getAllByRole('link', { name: /features/i });
    expect(featuresLinks.length).toBeGreaterThanOrEqual(1);

    // Pricing link
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    expect(pricingLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Get Started Free CTA link pointing to /register', () => {
    render(<MarketingNav />);
    const ctaLinks = screen.getAllByRole('link', { name: /get started free/i });
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    expect(ctaLinks[0]).toHaveAttribute('href', '/register');
  });

  it('renders Sign in link pointing to /login', () => {
    render(<MarketingNav />);
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThanOrEqual(1);
    expect(signInLinks[0]).toHaveAttribute('href', '/login');
  });

  it('renders hamburger menu button for mobile', () => {
    render(<MarketingNav />);
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu open on button click', () => {
    render(<MarketingNav />);
    const menuButton = screen.getByRole('button', { name: /open menu/i });

    // Close button should not be present initially
    expect(screen.queryByRole('button', { name: /close menu/i })).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(menuButton);

    // Mobile menu should appear (close button now visible)
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });

  it('closes mobile menu when close button is clicked', () => {
    render(<MarketingNav />);

    // Open menu
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    // Close menu
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));

    // Should show open button again
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('nav element has accessible label', () => {
    render(<MarketingNav />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MarketingFooter Tests
// ---------------------------------------------------------------------------

describe('MarketingFooter', () => {
  it('renders the brand logo link', () => {
    render(<MarketingFooter />);
    const logoLinks = screen.getAllByRole('link', { name: /complete care/i });
    expect(logoLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pricing link in footer', () => {
    render(<MarketingFooter />);
    const pricingLink = screen.getByRole('link', { name: /pricing/i });
    expect(pricingLink).toBeInTheDocument();
    expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  it('renders privacy policy link', () => {
    render(<MarketingFooter />);
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('renders terms of service link', () => {
    render(<MarketingFooter />);
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('renders Book a Demo link', () => {
    render(<MarketingFooter />);
    const demoLink = screen.getByRole('link', { name: /book a demo/i });
    expect(demoLink).toBeInTheDocument();
    expect(demoLink).toHaveAttribute('href', '/demo');
  });

  it('renders CQC compliance badge', () => {
    render(<MarketingFooter />);
    expect(screen.getByText(/cqc compliant/i)).toBeInTheDocument();
  });

  it('renders Ofsted Ready badge', () => {
    render(<MarketingFooter />);
    expect(screen.getByText(/ofsted ready/i)).toBeInTheDocument();
  });

  it('renders all three care domain links', () => {
    render(<MarketingFooter />);
    expect(screen.getByRole('link', { name: /domiciliary care/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /supported living/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /children's homes/i })).toBeInTheDocument();
  });

  it('includes copyright text', () => {
    render(<MarketingFooter />);
    expect(screen.getByText(/complete care ltd/i)).toBeInTheDocument();
  });
});
