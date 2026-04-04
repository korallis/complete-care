import { chromium } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3200';
const email = process.env.PLAYWRIGHT_QA_EMAIL || 'lee@completecare.test';
const password = process.env.PLAYWRIGHT_QA_PASSWORD || 'Superium123!';
const orgSlug = process.env.PLAYWRIGHT_ORG_SLUG || 'redesign-admin-workspace';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ baseURL: base });
const t0 = Date.now();
function log(msg){ console.log(`${((Date.now()-t0)/1000).toFixed(1)}s ${msg}`); }
try {
  page.on('response', (resp) => {
    const url = resp.url();
    if (url.includes('/rostering') || url.includes('/api/auth') || url.includes('/login')) {
      log(`RESP ${resp.status()} ${url.replace(base, '')}`);
    }
  });
  log('goto login');
  await page.goto('/login', { waitUntil: 'load', timeout: 20000 });
  log('fill login');
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('input[name="password"]').fill(password);
  log('submit login');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
  log(`logged in at ${page.url().replace(base, '')}`);

  const target = `/${orgSlug}/rostering`;
  log(`goto ${target}`);
  await page.goto(target, { waitUntil: 'load', timeout: 20000 });
  log(`loaded ${page.url().replace(base, '')}`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => log('networkidle timeout'));
  log(`title=${await page.title()}`);
  const text = await page.locator('body').innerText({ timeout: 5000 });
  console.log(text.slice(0,1000));
} catch (error) {
  console.error('CHECK_FAILED');
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
