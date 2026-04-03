import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '@/app/(marketing)/page';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

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

describe('MarketingNav', () => {
  it('renders the redesigned brand lockup link', () => {
    render(<MarketingNav />);
    const logoLink = screen.getByRole('link', {
      name: /complete care care operations system/i,
    });

    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders the current desktop navigation structure', () => {
    render(<MarketingNav />);

    expect(screen.getByRole('link', { name: 'Domains' })).toHaveAttribute(
      'href',
      '/#domains',
    );
    expect(screen.getByRole('link', { name: 'Workflow' })).toHaveAttribute(
      'href',
      '/#workflow',
    );
    expect(screen.getByRole('link', { name: 'Why it lands' })).toHaveAttribute(
      'href',
      '/#evidence',
    );
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      '/pricing',
    );
  });

  it('renders the redesigned primary CTA and sign-in link', () => {
    render(<MarketingNav />);

    expect(screen.getByRole('link', { name: /start with one service/i })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('opens and closes the mobile menu', () => {
    render(<MarketingNav />);

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Why it lands' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('exposes the main navigation landmark', () => {
    render(<MarketingNav />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});

describe('MarketingFooter', () => {
  it('renders the redesigned brand statement and badges', () => {
    render(<MarketingFooter />);

    expect(screen.getByRole('link', { name: /complete care built for real care work/i })).toBeInTheDocument();
    expect(screen.getByText(/one operating system for domiciliary care, supported living/i)).toBeInTheDocument();
    expect(screen.getByText(/cqc aware/i)).toBeInTheDocument();
    expect(screen.getByText(/ofsted ready/i)).toBeInTheDocument();
    expect(screen.getByText(/multi-service teams/i)).toBeInTheDocument();
  });

  it('renders the footer navigation groups and key links', () => {
    render(<MarketingFooter />);

    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Use cases')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      'mailto:hello@completecare.co.uk',
    );
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('keeps all three care-domain anchors in the footer', () => {
    render(<MarketingFooter />);

    expect(screen.getByRole('link', { name: /domiciliary care/i })).toHaveAttribute(
      'href',
      '/#domains',
    );
    expect(screen.getByRole('link', { name: /supported living/i })).toHaveAttribute(
      'href',
      '/#domains',
    );
    expect(screen.getByRole('link', { name: /children\'s homes/i })).toHaveAttribute(
      'href',
      '/#domains',
    );
  });

  it('includes the updated closing note', () => {
    render(<MarketingFooter />);

    expect(screen.getByText(/complete care ltd\. registered in england & wales/i)).toBeInTheDocument();
    expect(screen.getByText(/designed for calm operations, inspection confidence, and better daily handover/i)).toBeInTheDocument();
  });
});

describe('HomePage redesign', () => {
  it('renders the new hero thesis and top-level CTAs', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /a calmer system for care teams who carry serious work/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start with one service/i })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: /book a guided walkthrough/i })).toHaveAttribute(
      'href',
      '/demo',
    );
  });

  it('renders the redesigned narrative sections instead of a stock feature grid cadence', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /three care domains, one shared operating language/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /from first referral to inspection day, the interface should lower friction/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /the old pattern is more tools, more tabs, more stress/i,
      }),
    ).toBeInTheDocument();
  });

  it('covers all three care domains and the closing CTA block', () => {
    render(<HomePage />);

    expect(screen.getByText('Domiciliary care')).toBeInTheDocument();
    expect(screen.getAllByText('Supported living').length).toBeGreaterThan(0);
    expect(screen.getByText("Children's homes")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create your workspace/i })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: /see a guided demo/i })).toHaveAttribute(
      'href',
      '/demo',
    );
  });
});
