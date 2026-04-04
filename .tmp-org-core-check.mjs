import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3200';
const ORG = 'redesign-admin-workspace';
const routes = [
  `/${ORG}/dashboard`,
  `/${ORG}/admissions`,
  `/${ORG}/audit-log`,
  `/${ORG}/ofsted`,
  `/${ORG}/properties`,
  `/${ORG}/safeguarding`,
  `/${ORG}/scheduling`,
  `/${ORG}/rostering`,
];

const linkChecks = [
  { from: `/${ORG}/admissions`, name: 'New referral', expect: `/${ORG}/admissions/new` },
  { from: `/${ORG}/admissions`, name: 'Noah Bennett', expect: `/${ORG}/admissions/8e409e61-48c6-4249-bc97-b58d3d44d231` },
  { from: `/${ORG}/ofsted`, name: "Children's Register", expect: `/${ORG}/ofsted/register` },
  { from: `/${ORG}/ofsted`, name: 'Statement of Purpose', expect: `/${ORG}/ofsted/statement` },
  { from: `/${ORG}/properties`, name: '1 Willow House', expect: `/${ORG}/properties/a01bca38-979f-4f0e-ad59-fc137318815d` },
  { from: `/${ORG}/safeguarding`, name: 'Record Concern', expect: `/${ORG}/safeguarding/concerns/new` },
  { from: `/${ORG}/safeguarding`, name: 'DSL Review Dashboard', expect: `/${ORG}/safeguarding/reviews` },
  { from: `/${ORG}/scheduling`, name: 'Timesheets & payroll', expect: `/${ORG}/rostering?date=2026-03-30` },
  { from: `/${ORG}/rostering`, name: 'Open rota week', expect: `/${ORG}/scheduling?date=2026-03-30` },
  { from: `/${ORG}/rostering`, name: 'Export payroll CSV', expect: `/${ORG}/rostering/payroll?startDate=2026-03-30&endDate=2026-04-05` },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
await page.getByLabel('Email address').fill('lee@completecare.test');
await page.locator('input[name="password"]').fill('Superium123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL(new RegExp(ORG), { timeout: 15000 });

const results = [];
for (const route of routes) {
  const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForLoadState('networkidle');
  results.push({ kind: 'route', route, status: res?.status() ?? null, finalUrl: page.url().replace(BASE_URL, '') });
}

for (const check of linkChecks) {
  await page.goto(`${BASE_URL}${check.from}`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: check.name, exact: true }).click();
  await page.waitForLoadState('load');
  results.push({ kind: 'link', from: check.from, name: check.name, finalUrl: page.url().replace(BASE_URL, '') });
}

console.log(JSON.stringify({ results, pageErrors, consoleErrors }, null, 2));
await browser.close();
