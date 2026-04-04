import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();
const base = 'http://localhost:3200';
const routes = [
  '/redesign-admin-workspace/staff',
  '/redesign-admin-workspace/settings',
  '/redesign-admin-workspace/settings/team',
  '/redesign-admin-workspace/settings/security',
  '/redesign-admin-workspace/settings/gdpr',
  '/portal',
  '/portal/messages',
  '/portal/updates',
  '/portal/care-info',
  '/dashboard',
  '/budgets',
  '/budgets/new',
  '/custom-reports',
  '/ai-queries',
  '/invoicing',
  '/duty-of-candour',
  '/duty-of-candour/new',
  '/eol-care',
  '/eol-care/new',
  '/reg45',
  '/reg45/new',
];

await page.goto(`${base}/login`, { waitUntil: 'load' });
await page.getByLabel('Email address').fill('lee@completecare.test');
await page.locator('input[name="password"]').fill('Superium123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL(/redesign-admin-workspace|dashboard|onboarding/, { timeout: 20000 });

for (const route of routes) {
  const res = await page.goto(`${base}${route}`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(1200);
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  const body = await page.locator('body').innerText();
  const status = res?.status() ?? null;
  const notFound = /404|This page could not be found/i.test(body);
  console.log(JSON.stringify({ route, status, finalUrl: page.url(), title, h1, notFound, snippet: body.slice(0, 200).replace(/\s+/g,' ') }));
}

await browser.close();
