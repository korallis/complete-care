/**
 * Billing component rendering tests.
 *
 * Covers:
 * - PlanBadge renders correct label and icon for each tier
 * - UpgradePrompt shows appropriate messaging
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanBadge } from '@/components/billing/plan-badge';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';

// ---------------------------------------------------------------------------
// PlanBadge
// ---------------------------------------------------------------------------

describe('PlanBadge', () => {
  it('renders "Free" for free plan', () => {
    render(<PlanBadge plan="free" />);
    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders "Pro" for professional plan', () => {
    render(<PlanBadge plan="professional" />);
    expect(screen.getByText('Pro')).toBeDefined();
  });

  it('renders "Enterprise" for enterprise plan', () => {
    render(<PlanBadge plan="enterprise" />);
    expect(screen.getByText('Enterprise')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<PlanBadge plan="free" className="custom-class" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('custom-class');
  });
});

// ---------------------------------------------------------------------------
// UpgradePrompt
// ---------------------------------------------------------------------------

describe('UpgradePrompt', () => {
  it('renders user limit message for free plan', () => {
    render(
      <UpgradePrompt
        orgSlug="test-org"
        currentPlan="free"
        limitType="user"
        maxUsers={5}
      />,
    );
    expect(screen.getByText('Plan limit reached')).toBeDefined();
    expect(screen.getByText(/supports up to 5 users/)).toBeDefined();
    expect(screen.getByText(/Upgrade to Professional/)).toBeDefined();
  });

  it('renders feature limit message', () => {
    render(
      <UpgradePrompt
        orgSlug="test-org"
        currentPlan="free"
        limitType="feature"
        featureName="Risk assessments"
      />,
    );
    expect(screen.getByText(/Risk assessments requires the Professional plan/)).toBeDefined();
  });

  it('suggests Enterprise when on professional plan', () => {
    render(
      <UpgradePrompt
        orgSlug="test-org"
        currentPlan="professional"
        limitType="user"
        maxUsers={25}
      />,
    );
    expect(screen.getByText(/Upgrade to Enterprise/)).toBeDefined();
  });

  it('renders a link to billing settings', () => {
    render(
      <UpgradePrompt
        orgSlug="test-org"
        currentPlan="free"
        limitType="user"
      />,
    );
    const link = screen.getByText('View plans');
    expect(link).toBeDefined();
    expect(link.closest('a')?.getAttribute('href')).toBe('/test-org/settings/billing');
  });
});
