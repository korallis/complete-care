import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockAuth = vi.fn();
const mockGetCqcDashboard = vi.fn();
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

vi.mock('@/features/dashboards/components/cqc-dashboard', () => ({
  CqcDashboard: ({
    data,
  }: {
    data: { overallCoverage: { coveragePercent: number } };
  }) => (
    <div data-testid="cqc-dashboard">
      Coverage {data.overallCoverage.coveragePercent}%
    </div>
  ),
}));

vi.mock('@/features/dashboards/actions', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/dashboards/actions')
  >('@/features/dashboards/actions');

  return {
    ...actual,
    getCqcDashboard: mockGetCqcDashboard,
  };
});

describe('CqcPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: 'user-1',
        activeOrgId: 'org-1',
        role: 'manager',
        memberships: [
          {
            orgId: 'org-1',
            orgSlug: 'acme',
            orgName: 'Acme Care',
            role: 'manager',
          },
        ],
      },
    });

    mockGetCqcDashboard.mockResolvedValue({
      statements: [],
      overallCoverage: {
        full: 18,
        partial: 7,
        none: 4,
        totalStatements: 29,
        coveragePercent: 62,
      },
    });
  });

  it('renders the CQC workspace with domain framing and follow-on links', async () => {
    const { default: CqcPage } = await import(
      '@/app/(dashboard)/[orgSlug]/cqc/page'
    );

    const ui = await CqcPage({
      params: Promise.resolve({ orgSlug: 'acme' }),
    });

    const html = renderToStaticMarkup(ui);

    expect(html).toContain('CQC Quality Statements');
    expect(html).toContain('Domiciliary Care');
    expect(html).toContain('Supported Living');
    expect(html).toContain('Complex Care');
    expect(html).toContain('Priority evidence gaps');
    expect(html).toContain('11');
    expect(html).toContain('/acme/staff/compliance');
    expect(html).toContain('/acme/reports');
    expect(html).toContain('Coverage 62%');
  });

  it('redirects to login when the user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockImplementationOnce(() => {
      throw redirectSignal;
    });

    const { default: CqcPage } = await import(
      '@/app/(dashboard)/[orgSlug]/cqc/page'
    );

    await expect(
      CqcPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
      }),
    ).rejects.toBe(redirectSignal);

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('blocks roles without compliance access', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        activeOrgId: 'org-1',
        role: 'carer',
        memberships: [
          {
            orgId: 'org-1',
            orgSlug: 'acme',
            orgName: 'Acme Care',
            role: 'carer',
          },
        ],
      },
    });
    mockNotFound.mockImplementationOnce(() => {
      throw notFoundSignal;
    });

    const { default: CqcPage } = await import(
      '@/app/(dashboard)/[orgSlug]/cqc/page'
    );

    await expect(
      CqcPage({
        params: Promise.resolve({ orgSlug: 'acme' }),
      }),
    ).rejects.toBe(notFoundSignal);

    expect(mockNotFound).toHaveBeenCalled();
  });
});
