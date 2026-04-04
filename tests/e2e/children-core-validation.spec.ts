import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getSeedTargets } from './support/seed-data';
import { login } from './support/session';

const evidenceDir = '.omx/playwright/children-core';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await fs.mkdir(evidenceDir, { recursive: true });
});

test('children-core seeded journeys expose current validation reality', async ({
  page,
}) => {
  const targets = await getSeedTargets();
  const { orgSlug, personId } = targets;

  expect(orgSlug).toBe('redesign-admin-workspace');
  expect(personId).toBeTruthy();

  await login(page);

  // VAL-CHILD-001: Ofsted dashboard renders 9 standards.
  await page.goto(`/${orgSlug}/ofsted`, { waitUntil: 'networkidle' });
  await expect(
    page.getByRole('heading', { name: /ofsted compliance/i }),
  ).toBeVisible();
  const standardCards = page.locator(
    'a[href*="/ofsted/standards/"] h3',
  );
  await expect(standardCards).toHaveCount(9);
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-001-ofsted-dashboard.png'),
    fullPage: true,
  });

  await standardCards.first().click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/sub-requirements/i)).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-001-standard-detail.png'),
    fullPage: true,
  });

  // VAL-CHILD-003: current register state.
  await page.goto(`/${orgSlug}/ofsted/register`, { waitUntil: 'networkidle' });
  await expect(
    page.getByRole('heading', { name: /children's register/i }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-003-register.png'),
    fullPage: true,
  });

  // VAL-CHILD-004/005: LAC overview with legal status + contacts + history.
  await page.goto(`/${orgSlug}/persons/${personId}/lac`, {
    waitUntil: 'networkidle',
  });
  await expect(
    page.getByRole('heading', { name: /lac documentation/i }),
  ).toBeVisible();
  await expect(page.getByText(/legal status/i)).toBeVisible();
  await expect(page.getByText(/assigned social worker/i)).toBeVisible();
  await expect(page.getByText(/independent reviewing officer/i)).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-004-005-lac-overview.png'),
    fullPage: true,
  });

  // VAL-CHILD-006: placement plans list + creation page deadline notice.
  await page.goto(`/${orgSlug}/persons/${personId}/lac/placement-plans`, {
    waitUntil: 'networkidle',
  });
  await expect(
    page.getByRole('heading', { name: /placement plans/i }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-006-placement-plans.png'),
    fullPage: true,
  });

  await page.goto(
    `/${orgSlug}/persons/${personId}/lac/placement-plans/new`,
    { waitUntil: 'networkidle' },
  );
  await expect(
    page.getByRole('heading', { name: /create placement plan/i }),
  ).toBeVisible();
  await expect(page.getByText(/5-working-day deadline/i)).toBeVisible();
  await page.screenshot({
    path: path.join(evidenceDir, 'val-child-006-placement-plan-new.png'),
    fullPage: true,
  });
});
