import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockAuth = vi.fn();
const mockRedirect = vi.fn();
const mockNotFound = vi.fn();
const redirectSignal = new Error('redirect');
const notFoundSignal = new Error('notFound');

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/auth/logout-button', () => ({
  LogoutButton: () => <button type="button">Log out</button>,
}));

vi.mock('@/components/dashboard/welcome-banner', () => ({
  WelcomeBanner: ({ userName }: { userName?: string }) => (
    <div data-testid="welcome-banner">Welcome banner for {userName ?? 'guest'}</div>
  ),
}));

describe('OrgDashboardPage redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Jane Smith',
        activeOrgId: 'org-1',
        memberships: [
          {
            orgId: 'org-1',
            orgSlug: 'acme',
            orgName: 'Acme Care',
          },
        ],
      },
    });
  });

  it('renders the redesigned overview, quick routes, and activation state copy', async () => {
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    const ui = await OrgDashboardPage({
      params: Promise.resolve({ orgSlug: 'acme' }),
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(ui);

    expect(html).toContain('Welcome back, Jane.');
    expect(html).toContain('operational overview');
    expect(html).toContain('today’s frame');
    expect(html).toContain('Go straight to the operational surfaces.');
    expect(html).toContain('This dashboard is ready for real signal as the next modules come online.');
    expect(html).toContain('/acme/persons');
    expect(html).toContain('/acme/staff');
    expect(html).toContain('/acme/settings');
    expect(html).toContain('/acme/travel-safety');
    expect(html).toContain('Log out');
  });

  it('renders the welcome banner when welcome=true is present', async () => {
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    const ui = await OrgDashboardPage({
      params: Promise.resolve({ orgSlug: 'acme' }),
      searchParams: Promise.resolve({ welcome: 'true' }),
    });

    const html = renderToStaticMarkup(ui);

    expect(html).toContain('Welcome banner for Jane Smith');
  });

  it('redirects to login when no authenticated user is present', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockImplementationOnce(() => {
      throw redirectSignal;
    });
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    await expect(
      OrgDashboardPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(redirectSignal);

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to onboarding when the user has no active organisation', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        memberships: [],
        activeOrgId: null,
      },
    });
    mockRedirect.mockImplementationOnce(() => {
      throw redirectSignal;
    });
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    await expect(
      OrgDashboardPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(redirectSignal);

    expect(mockRedirect).toHaveBeenCalledWith('/onboarding');
  });

  it('redirects through the org switch route when the slug exists on another membership', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        activeOrgId: 'org-1',
        memberships: [
          {
            orgId: 'org-1',
            orgSlug: 'north-hub',
            orgName: 'North Hub',
          },
          {
            orgId: 'org-2',
            orgSlug: 'acme',
            orgName: 'Acme Care',
          },
        ],
      },
    });
    mockRedirect.mockImplementationOnce(() => {
      throw redirectSignal;
    });
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    await expect(
      OrgDashboardPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(redirectSignal);

    expect(mockRedirect).toHaveBeenCalledWith(
      '/api/orgs/switch?slug=acme&returnTo=/acme/dashboard',
    );
  });

  it('calls notFound when the requested org slug is missing from memberships', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        activeOrgId: 'org-1',
        memberships: [
          {
            orgId: 'org-1',
            orgSlug: 'north-hub',
            orgName: 'North Hub',
          },
        ],
      },
    });
    mockNotFound.mockImplementationOnce(() => {
      throw notFoundSignal;
    });
    const { default: OrgDashboardPage } = await import(
      '@/app/(dashboard)/[orgSlug]/dashboard/page'
    );

    await expect(
      OrgDashboardPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBe(notFoundSignal);

    expect(mockNotFound).toHaveBeenCalled();
  });
});
