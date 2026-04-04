import { expect, test } from '@playwright/test';
import { login } from './support/session';

test.describe('family and global page coverage', () => {
  test('global dashboards link into the available draft-authoring routes', async ({
    page,
  }) => {
    await login(page);

    const checks = [
      {
        route: '/budgets',
        action: 'New Budget',
        destination: '/budgets/new',
        heading: /Start a new budget outline/i,
      },
      {
        route: '/duty-of-candour',
        action: 'Record Incident',
        destination: '/duty-of-candour/new',
        heading: /Record a duty of candour incident/i,
      },
      {
        route: '/eol-care',
        action: 'New Care Plan',
        destination: '/eol-care/new',
        heading: /Create an end of life care plan/i,
      },
      {
        route: '/reg45',
        action: 'New Report',
        destination: '/reg45/new',
        heading: /Start a Reg 45 quality review/i,
      },
    ] as const;

    for (const check of checks) {
      await page.goto(check.route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(check.route);
      await page.getByRole('link', { name: check.action }).click();
      await expect(page).toHaveURL(check.destination);
      await expect(
        page.getByRole('heading', { name: check.heading }),
      ).toBeVisible();
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
