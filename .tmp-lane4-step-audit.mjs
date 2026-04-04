import { chromium } from '@playwright/test';

const base = 'http://localhost:3200';
const org = 'redesign-admin-workspace';
const personId = '1a3dfc32-da59-4f41-b53d-943a3da1d03e';
const routes = [
  `/${org}/persons/${personId}/clinical/vitals`,
  `/${org}/persons/${personId}/emar`,
  `/${org}/persons/${personId}/contacts`,
  `/${org}/persons/${personId}/education`,
  `/${org}/persons/${personId}/lac`,
  `/${org}/persons/${personId}/missing`,
  `/${org}/persons/${personId}/meetings`,
  `/${org}/persons/${personId}/pbs`,
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();
page.on('pageerror', err => console.log(JSON.stringify({ event: 'pageerror', route: page.url(), text: String(err) })));
page.on('console', msg => {
  if (msg.type() === 'error') console.log(JSON.stringify({ event: 'console-error', route: page.url(), text: msg.text() }));
});

console.log(JSON.stringify({ event: 'login-start' }));
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.getByLabel('Email address').fill('lee@completecare.test');
await page.locator('input[name="password"]').fill('Superium123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL(new RegExp(`/${org}`), { timeout: 15000 });
console.log(JSON.stringify({ event: 'login-ok', url: page.url() }));

for (const route of routes) {
  const started = Date.now();
  let response = null;
  let navigationError = null;
  try {
    response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(600);
  } catch (error) {
    navigationError = String(error);
  }
  const body = await page.locator('body').innerText().catch(() => '');
  console.log(JSON.stringify({
    event: 'route-result',
    route,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    navigationError,
    durationMs: Date.now() - started,
    heading: body.split('\n').find(Boolean) ?? '',
    snippet: body.slice(0, 180),
  }));
}

await browser.close();
