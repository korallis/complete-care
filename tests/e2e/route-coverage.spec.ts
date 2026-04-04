import fs from 'node:fs/promises';
import path from 'node:path';
import { test, type ConsoleMessage, type Page } from '@playwright/test';
import { baseUrl, slugifyRoute } from './support/config';
import { discoverRouteInventory, type RouteInventory } from './support/route-inventory';
import { getSeededDynamicRoutes, type SeedTargets } from './support/seed-data';
import { login } from './support/session';

const auditDir = '.omx/playwright/audit';
const failureDir = path.join(auditDir, 'failures');
const reportPath = path.join(auditDir, 'route-coverage-report.json');

type RouteAuditResult = {
  category: 'public' | 'authenticated' | 'dynamic-seeded';
  route: string;
  status: number | null;
  finalUrl: string;
  title: string;
  heading: string | null;
  buttonCount: number;
  linkCount: number;
  buttons: string[];
  links: string[];
  pageErrors: string[];
  consoleErrors: string[];
  bodySnippet: string;
  failureReasons: string[];
  failureScreenshot?: string;
};

let inventory: RouteInventory;
let seedTargets: SeedTargets;
let seededDynamicRoutes: string[];
const results: RouteAuditResult[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  inventory = await discoverRouteInventory();
  const seeded = await getSeededDynamicRoutes();
  seedTargets = seeded.targets;
  seededDynamicRoutes = seeded.routes;
  await fs.mkdir(failureDir, { recursive: true });
});

test.afterAll(async () => {
  const safeSeedTargets = seedTargets ?? {
    orgId: '',
    orgSlug: '',
    personId: null,
    propertyId: null,
    referralId: null,
    staffId: null,
    carePlanId: null,
    incidentId: null,
  };
  const safeSeededDynamicRoutes = seededDynamicRoutes ?? [];
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    inventorySummary: {
      publicRoutes: inventory.publicRoutes.length,
      authenticatedGlobalRoutes: inventory.authenticatedGlobalRoutes.length,
      authenticatedOrgRoutes: inventory.authenticatedOrgRoutes.length,
      skippedRoutes: inventory.skippedRoutes.length,
      dynamicSeededRoutes: safeSeededDynamicRoutes.length,
    },
    skippedRoutes: inventory.skippedRoutes,
    seedTargets: safeSeedTargets,
    summary: {
      auditedRoutes: results.length,
      failures: results.filter((entry) => entry.failureReasons.length > 0).length,
      routesWithButtons: results.filter((entry) => entry.buttonCount > 0).length,
      routesWithLinks: results.filter((entry) => entry.linkCount > 0).length,
    },
    results,
  };

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
});

async function collectVisibleControls(page: Page) {
  return page.evaluate(() => {
    function isVisible(element: Element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    function labelFor(element: Element) {
      const htmlElement = element as HTMLElement;
      const label = htmlElement.getAttribute('aria-label')
        || htmlElement.getAttribute('title')
        || htmlElement.textContent
        || htmlElement.getAttribute('href')
        || htmlElement.getAttribute('name')
        || '';
      return label.trim().replace(/\s+/g, ' ').slice(0, 120);
    }

    const buttons = [...document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')]
      .filter(isVisible)
      .map(labelFor)
      .filter(Boolean);
    const links = [...document.querySelectorAll('a[href]')]
      .filter(isVisible)
      .map(labelFor)
      .filter(Boolean);

    return {
      heading: document.querySelector('h1, h2')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 160) ?? null,
      buttonCount: buttons.length,
      linkCount: links.length,
      buttons: buttons.slice(0, 12),
      links: links.slice(0, 12),
    };
  });
}

async function auditRoute(
  page: Page,
  route: string,
  category: RouteAuditResult['category'],
  authenticated: boolean,
) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(String(error));
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    let response: Awaited<ReturnType<Page['goto']>> | null = null;
    let navigationError: string | null = null;
    try {
      response = await page.goto(route, { waitUntil: 'load', timeout: 20_000 });
      await page.waitForTimeout(250);
    } catch (error) {
      navigationError = error instanceof Error ? error.message : String(error);
    }

    const controls = navigationError
      ? {
          heading: null,
          buttonCount: 0,
          linkCount: 0,
          buttons: [],
          links: [],
        }
      : await collectVisibleControls(page);
    const result: RouteAuditResult = {
      category,
      route,
      status: response?.status() ?? null,
      finalUrl: page.url(),
      title: await page.title().catch(() => ''),
      ...controls,
      pageErrors,
      consoleErrors,
      bodySnippet: navigationError
        ? navigationError
        : (await page.locator('body').innerText()).slice(0, 600).replace(/\n+/g, ' | '),
      failureReasons: [],
    };

    if (navigationError) {
      result.failureReasons.push('navigation_error');
    }
    if (result.status !== null && result.status >= 400) {
      result.failureReasons.push(`http_${result.status}`);
    }
    if (authenticated && result.finalUrl.includes('/login')) {
      result.failureReasons.push('redirected_to_login');
    }
    if (pageErrors.length > 0) {
      result.failureReasons.push('pageerror');
    }
    if (consoleErrors.length > 0) {
      result.failureReasons.push('console_error');
    }
    if (result.failureReasons.length > 0) {
      const screenshotPath = path.join(failureDir, `${category}_${slugifyRoute(route)}.png`);
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.failureScreenshot = screenshotPath;
      } catch {
        result.failureReasons.push('failure_screenshot_unavailable');
      }
    }

    results.push(result);
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
}

test('public route inventory audit', async ({ page }) => {
  for (const route of inventory.publicRoutes) {
    await auditRoute(page, route, 'public', false);
  }
});

test('authenticated route inventory audit', async ({ page }) => {
  await login(page);
  for (const route of [...inventory.authenticatedGlobalRoutes, ...inventory.authenticatedOrgRoutes]) {
    await auditRoute(page, route, 'authenticated', true);
  }
});

test('seeded dynamic route audit', async ({ page }) => {
  await login(page);
  for (const route of seededDynamicRoutes) {
    await auditRoute(page, route, 'dynamic-seeded', true);
  }
});
