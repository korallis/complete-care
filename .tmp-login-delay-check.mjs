import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3200/login', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(3000);
await page.getByLabel('Email address').fill('lee@completecare.test');
await page.locator('input[name="password"]').fill('Superium123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
try {
  await page.waitForURL(/redesign-admin-workspace|onboarding/, { timeout: 15000 });
  console.log(JSON.stringify({ ok: true, url: page.url() }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, url: page.url(), error: String(error), body: (await page.locator('body').innerText()).slice(0, 500) }));
}
await browser.close();
