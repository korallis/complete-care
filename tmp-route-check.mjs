import { chromium } from '@playwright/test';
const route = process.argv[2];
const base = 'http://localhost:3200';
const email = 'lee@completecare.test';
const password = 'Superium123!';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ baseURL: base });
const t0 = Date.now();
let hits = 0;
function log(msg){ console.log(`${((Date.now()-t0)/1000).toFixed(1)}s ${msg}`); }
page.on('response', (resp) => {
  const url = resp.url().replace(base, '');
  if (url.startsWith(route) || url.startsWith('/login')) {
    hits++;
    log(`RESP ${resp.status()} ${url}`);
  }
});
try {
  await page.goto('/login', { waitUntil: 'load', timeout: 20000 });
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
  log(`goto ${route}`);
  await page.goto(route, { waitUntil: 'load', timeout: 20000 });
  log('loaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).then(()=>log('networkidle ok')).catch(()=>log('networkidle timeout'));
  log(`hits=${hits}`);
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await browser.close(); }
