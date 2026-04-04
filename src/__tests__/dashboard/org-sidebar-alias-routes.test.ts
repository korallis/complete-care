import { describe, expect, it, vi } from 'vitest';

const redirect = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});

vi.mock('next/navigation', () => ({
  redirect,
}));

describe('org sidebar alias routes', () => {
  it('redirects org compliance route to staff compliance', async () => {
    const { default: ComplianceAliasPage } = await import(
      '@/app/(dashboard)/[orgSlug]/compliance/page'
    );

    await expect(
      ComplianceAliasPage({
        params: Promise.resolve({ orgSlug: 'redesign-admin-workspace' }),
      }),
    ).rejects.toThrow(
      'REDIRECT:/redesign-admin-workspace/staff/compliance',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/redesign-admin-workspace/staff/compliance',
    );
  });

  it('redirects org reports route to custom reports', async () => {
    const { default: ReportsAliasPage } = await import(
      '@/app/(dashboard)/[orgSlug]/reports/page'
    );

    expect(() => ReportsAliasPage()).toThrow('REDIRECT:/custom-reports');
    expect(redirect).toHaveBeenCalledWith('/custom-reports');
  });
});
