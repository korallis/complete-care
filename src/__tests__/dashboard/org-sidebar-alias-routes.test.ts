import { describe, expect, it, vi } from 'vitest';
import { NAV_ITEMS_BY_ROLE } from '@/lib/rbac/nav-items';

const redirect = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});

vi.mock('next/navigation', () => ({
  redirect,
}));

describe('org sidebar alias routes', () => {
  it('sends compliance navigation directly to the staff compliance route', () => {
    expect(
      NAV_ITEMS_BY_ROLE.owner.find((item) => item.label === 'Compliance')?.href,
    ).toBe('/staff/compliance');
    expect(
      NAV_ITEMS_BY_ROLE.admin.find((item) => item.label === 'Compliance')?.href,
    ).toBe('/staff/compliance');
  });

  it('redirects org reports route to custom reports', async () => {
    const { default: ReportsAliasPage } = await import(
      '@/app/(dashboard)/[orgSlug]/reports/page'
    );

    expect(() => ReportsAliasPage()).toThrow('REDIRECT:/custom-reports');
    expect(redirect).toHaveBeenCalledWith('/custom-reports');
  });
});
