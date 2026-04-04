import { expect, test } from '@playwright/test';
import { login } from './support/session';

test.describe('family and global page coverage', () => {
  test('global placeholder actions do not expose dead-end creation links', async ({
    page,
  }) => {
    await login(page);

    const checks = [
      {
        route: '/budgets',
        action: 'New Budget',
        note: /Budget creation is coming soon/i,
      },
      {
        route: '/duty-of-candour',
        action: 'Record Incident',
        note: /Incident creation from this dashboard is coming soon/i,
      },
      {
        route: '/eol-care',
        action: 'New Care Plan',
        note: /End-of-life care plan creation is coming soon/i,
      },
      {
        route: '/reg45',
        action: 'New Report',
        note: /Reg 45 report authoring is coming soon/i,
      },
    ] as const;

    for (const check of checks) {
      await page.goto(check.route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(check.route);
      await expect(
        page.getByRole('button', { name: check.action }),
      ).toBeDisabled();
      await expect(page.getByText(check.note)).toBeVisible();
    }
  });

  test('family portal routes show the seeded empty state for the QA user', async ({
    page,
  }) => {
    await login(page);

    const routes = [
      '/portal',
      '/portal/messages',
      '/portal/updates',
      '/portal/care-info',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(route);
      await expect(
        page.getByText(/No approved family links are available/i),
      ).toBeVisible();
    }
  });

  test('family invitation landing explains the current acceptance flow state', async ({
    page,
  }) => {
    await page.goto('/invite', { waitUntil: 'load' });

    await expect(
      page.getByRole('heading', { name: 'Family Portal Invitation' }),
    ).toBeVisible();
    await expect(
      page.getByText(/The invitation acceptance flow will be connected to Auth\.js v5/i),
    ).toBeVisible();
  });
});
