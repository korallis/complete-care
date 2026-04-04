import { chromium } from '@playwright/test';

const routes = [
  '/redesign-admin-workspace/dashboard',
  '/redesign-admin-workspace/admissions',
  '/redesign-admin-workspace/audit-log',
  '/redesign-admin-workspace/ofsted',
  '/redesign-admin-workspace/properties',
  '/redesign-admin-workspace/safeguarding',
  '/redesign-admin-workspace/scheduling',
  '/redesign-admin-workspace/rostering',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto('http://localhost:3200/login', { waitUntil: 'load' });
await page.getByLabel('Email address').fill('lee@completecare.test');
await page.locator('input[name="password"]').fill('Superium123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL(/redesign-admin-workspace/, { timeout: 15000 });

for (const route of routes) {
  await page.goto(`http://localhost:3200${route}`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(1000);
  const entries = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a,button'));
    return elements.map((node) => ({
      tag: node.tagName.toLowerCase(),
      text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
      href: node instanceof HTMLAnchorElement ? node.href : null,
      disabled: node instanceof HTMLButtonElement ? node.disabled : false,
      hidden: node.offsetParent === null,
    })).filter((entry) => entry.text && !entry.hidden);
  });
  console.log(`\n=== ${route} ===`);
  for (const entry of entries) {
    console.log(`${entry.tag.toUpperCase()} | ${entry.text}${entry.href ? ` | ${entry.href.replace('http://localhost:3200','')}` : ''}${entry.disabled ? ' | disabled' : ''}`);
  }
}

await browser.close();
