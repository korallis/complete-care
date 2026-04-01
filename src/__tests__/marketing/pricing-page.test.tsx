/**
 * Pricing Page Component Tests
 *
 * Tests the PricingContent interactive component:
 * - All three pricing tiers are rendered
 * - Monthly/annual toggle works and updates prices
 * - Annual shows savings indicator
 * - Feature comparison table renders all categories
 * - CTA links include plan parameter
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingContent } from '@/components/marketing/pricing-toggle';

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
// Pricing Content Tests
// ---------------------------------------------------------------------------

describe('PricingContent', () => {
  describe('billing toggle', () => {
    it('renders the monthly/annual toggle', () => {
      render(<PricingContent />);
      const toggle = screen.getByRole('switch', { name: /toggle annual billing/i });
      expect(toggle).toBeInTheDocument();
    });

    it('starts with monthly billing selected', () => {
      render(<PricingContent />);
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('switches to annual billing when toggled', () => {
      render(<PricingContent />);
      const toggle = screen.getByRole('switch');

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('shows Save 20% badge when annual billing is selected', () => {
      render(<PricingContent />);

      // Should not show badge initially
      expect(screen.queryByText(/save 20%/i)).not.toBeInTheDocument();

      // Toggle to annual
      fireEvent.click(screen.getByRole('switch'));

      // Should now show savings badge
      expect(screen.getByText(/save 20%/i)).toBeInTheDocument();
    });

    it('shows annual price for Professional plan when annual billing selected', () => {
      render(<PricingContent />);

      // Monthly price should be £149
      expect(screen.getByText('£149')).toBeInTheDocument();

      // Toggle to annual
      fireEvent.click(screen.getByRole('switch'));

      // Annual price should be £119
      expect(screen.getByText('£119')).toBeInTheDocument();
    });
  });

  describe('pricing tiers', () => {
    it('renders all three pricing tiers', () => {
      render(<PricingContent />);
      // Each tier is an article element - there should be at least 3
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThanOrEqual(3);

      // Check tier names appear as headings
      const headings = screen.getAllByRole('heading', { level: 3 });
      const headingTexts = headings.map((h) => h.textContent);
      expect(headingTexts).toContain('Free');
      expect(headingTexts).toContain('Professional');
      expect(headingTexts).toContain('Enterprise');
    });

    it('shows "Free" price for the Free tier', () => {
      render(<PricingContent />);
      // The free tier shows the text "Free" as price - check headings contain it
      const headings = screen.getAllByRole('heading', { level: 3 });
      const headingTexts = headings.map((h) => h.textContent);
      expect(headingTexts).toContain('Free');
    });

    it('shows "Custom" price for Enterprise tier', () => {
      render(<PricingContent />);
      // Multiple "Custom" texts may exist (tier card + comparison table)
      const customElements = screen.getAllByText('Custom');
      expect(customElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Most popular" badge on Professional tier', () => {
      render(<PricingContent />);
      expect(screen.getByText(/most popular/i)).toBeInTheDocument();
    });

    it('Free tier CTA links to /register?plan=free', () => {
      render(<PricingContent />);
      const links = screen.getAllByRole('link', { name: /get started free/i });
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute('href', '/register?plan=free');
    });

    it('Professional tier CTA links to /register?plan=professional', () => {
      render(<PricingContent />);
      const trialLinks = screen.getAllByRole('link', { name: /start free trial/i });
      expect(trialLinks.length).toBeGreaterThanOrEqual(1);
      expect(trialLinks[0]).toHaveAttribute('href', '/register?plan=professional');
    });

    it('Enterprise tier CTA links to /demo', () => {
      render(<PricingContent />);
      const demoLinks = screen.getAllByRole('link', { name: /contact sales/i });
      expect(demoLinks.length).toBeGreaterThanOrEqual(1);
      expect(demoLinks[0]).toHaveAttribute('href', '/demo');
    });
  });

  describe('feature comparison table', () => {
    it('renders the feature comparison table heading', () => {
      render(<PricingContent />);
      expect(screen.getByRole('heading', { name: /compare all features/i })).toBeInTheDocument();
    });

    it('renders care management features category', () => {
      render(<PricingContent />);
      expect(screen.getByText(/care management/i)).toBeInTheDocument();
    });

    it('renders EMAR & Clinical features category', () => {
      render(<PricingContent />);
      expect(screen.getByText(/emar & clinical/i)).toBeInTheDocument();
    });

    it('renders Staff Management features category', () => {
      render(<PricingContent />);
      expect(screen.getByText(/staff management/i)).toBeInTheDocument();
    });

    it('renders Compliance features category', () => {
      render(<PricingContent />);
      // The category header "Compliance" (exact text in table row)
      const complianceElements = screen.getAllByText(/compliance/i);
      expect(complianceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders AI Features category', () => {
      render(<PricingContent />);
      expect(screen.getByText(/ai features/i)).toBeInTheDocument();
    });

    it('renders Platform category', () => {
      render(<PricingContent />);
      expect(screen.getByText(/platform/i)).toBeInTheDocument();
    });

    it('shows EMAR feature in comparison table', () => {
      render(<PricingContent />);
      expect(screen.getByText(/digital mar chart/i)).toBeInTheDocument();
    });

    it('renders table with Free, Professional, Enterprise column headers', () => {
      render(<PricingContent />);
      // These headings appear in both the tier cards and table headers
      const freeHeadings = screen.getAllByText('Free');
      const professionalHeadings = screen.getAllByText('Professional');
      const enterpriseHeadings = screen.getAllByText('Enterprise');
      expect(freeHeadings.length).toBeGreaterThanOrEqual(2);
      expect(professionalHeadings.length).toBeGreaterThanOrEqual(2);
      expect(enterpriseHeadings.length).toBeGreaterThanOrEqual(2);
    });
  });
});
