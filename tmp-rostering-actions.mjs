import { chromium } from '@playwright/test';
const base = 'http://localhost:3200';
const email = 'lee@completecare.test';
const password = 'Superium123!';
const orgSlug = 'redesign-admin-workspace';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ baseURL: base, acceptDownloads: true });
const t0 = Date.now();
function log(msg){ console.log(`${((Date.now()-t0)/1000).toFixed(1)}s ${msg}`); }
try {
  page.on('response', (resp) => {
    const url = resp.url().replace(base, '');
    if (url.includes('/rostering') || url.includes('/api/auth/login')) {
      log(`RESP ${resp.status()} ${url}`);
    }
  });
  await page.goto('/login', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
  await page.goto(`/${orgSlug}/rostering`, { waitUntil: 'load', timeout: 20000 });
  await page.getByRole('heading', { name: /rostering & payroll/i }).waitFor({ timeout: 10000 });
  log('heading visible');

  const body = await page.locator('body').innerText();
  log(body.includes('Generate timesheets') ? 'generate button visible' : 'generate button missing');

  await page.getByRole('button', { name: /generate timesheets/i }).click();
  await page.waitForURL((url) => url.pathname.endsWith('/rostering') && url.searchParams.get('status')?.includes('generated'), { timeout: 20000 });
  log(`after generate: ${page.url().replace(base, '')}`);

  await page.getByRole('button', { name: /approve ready entries/i }).click();
  await page.waitForURL((url) => url.pathname.endsWith('/rostering') && url.searchParams.get('status')?.includes('approved'), { timeout: 20000 });
  log(`after approve: ${page.url().replace(base, '')}`);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    page.getByRole('link', { name: /export payroll csv/i }).click(),
  ]);
  log(`downloaded ${download.suggestedFilename()}`);
} catch (e) {
  console.error('FAILED');
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
