import { chromium } from '@playwright/test';

const requiredEnv = ['QA_EMAIL', 'QA_PASSWORD', 'QA_ORG_SLUG', 'QA_PERSON_ID'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3200';
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;
const orgSlug = process.env.QA_ORG_SLUG;
const personId = process.env.QA_PERSON_ID;

const routes = [
  `/persons/${personId}/clinical/alerts`,
  `/persons/${personId}/clinical/bowel`,
  `/persons/${personId}/clinical/fluids`,
  `/persons/${personId}/clinical/nutrition`,
  `/persons/${personId}/clinical/pain`,
  `/persons/${personId}/clinical/sleep`,
  `/persons/${personId}/clinical/vitals`,
  `/persons/${personId}/emar`,
  `/persons/${personId}/emar/medications`,
  `/persons/${personId}/emar/prn`,
  '/emar/controlled-drugs',
  '/emar/errors',
  '/emar/stock',
  `/persons/${personId}/behaviour`,
  `/persons/${personId}/body-map`,
  `/persons/${personId}/complaints`,
  `/persons/${personId}/contacts`,
  `/persons/${personId}/education`,
  `/persons/${personId}/education/attendance`,
  `/persons/${personId}/keyworker`,
  `/persons/${personId}/lac`,
  `/persons/${personId}/lac/new`,
  `/persons/${personId}/lac/placement-plans`,
  `/persons/${personId}/lac/placement-plans/new`,
  `/persons/${personId}/meetings`,
  `/persons/${personId}/missing`,
  `/persons/${personId}/missing/philomena`,
  `/persons/${personId}/outcomes`,
  `/persons/${personId}/pbs`,
  `/persons/${personId}/pbs/abc`,
  `/persons/${personId}/pbs/reduction`,
  `/persons/${personId}/pbs/restrictive-practices`,
].map((route) => `/${orgSlug}${route}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();
const issues = [];

page.on('pageerror', (error) => {
  issues.push({ type: 'pageerror', route: page.url(), text: String(error) });
});

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    issues.push({ type: 'console-error', route: page.url(), text: msg.text() });
  }
});

async function login() {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 20_000 });
  await page.waitForTimeout(3_000);
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(new RegExp(`/${orgSlug}`), { timeout: 15_000 });
}

await login();

const results = [];
for (const route of routes) {
  const beforeIssueCount = issues.length;
  let response = null;
  let navigationError = null;

  try {
    response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 12_000,
    });
    await page.waitForTimeout(1_200);
  } catch (error) {
    navigationError = String(error);
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  results.push({
    route,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    heading: bodyText.split('\n').find(Boolean) ?? '',
    bodySnippet: bodyText.slice(0, 240),
    navigationError,
    issues: issues.slice(beforeIssueCount),
  });
}

console.log(JSON.stringify({ baseUrl, orgSlug, personId, results }, null, 2));

await browser.close();
