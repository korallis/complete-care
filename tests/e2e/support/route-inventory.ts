import fs from 'node:fs/promises';
import path from 'node:path';
import { orgSlug } from './config';

export type RouteInventory = {
  publicRoutes: string[];
  authenticatedGlobalRoutes: string[];
  authenticatedOrgRoutes: string[];
  skippedRoutes: Array<{ route: string; reason: string }>;
};

const appRoot = path.resolve('src/app');
const publicRouteSet = new Set([
  '/',
  '/demo',
  '/pricing',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
]);
const skippedPrefixes = new Map<string, string>([
  ['/reset-password', 'requires tokenized password reset context'],
  ['/invitations/accept', 'requires invitation token context'],
  ['/invite', 'requires family invitation flow context'],
  ['/family/portal', 'requires family-portal session'],
  ['/family/portal/care-info', 'requires family-portal session'],
  ['/family/portal/messages', 'requires family-portal session'],
  ['/family/portal/updates', 'requires family-portal session'],
]);

async function collectPageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectPageFiles(fullPath);
      }
      return entry.name === 'page.tsx' ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function normalizeRoute(filePath: string) {
  const relativePath = path.relative(appRoot, filePath).replace(/\\/g, '/');
  const segments = relativePath.replace(/\/page\.tsx$/, '').split('/').filter(Boolean);
  const routeSegments = segments.filter((segment) => !/^\(.*\)$/.test(segment));
  return routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`;
}

function classifyRoute(rawRoute: string) {
  for (const [prefix, reason] of skippedPrefixes.entries()) {
    if (rawRoute === prefix || rawRoute.startsWith(`${prefix}/`)) {
      return { kind: 'skipped' as const, route: rawRoute, reason };
    }
  }

  const segments = rawRoute.split('/').filter(Boolean);
  const unsupportedDynamicSegment = segments.find(
    (segment) => /^\[.+\]$/.test(segment) && segment !== '[orgSlug]',
  );
  if (unsupportedDynamicSegment) {
    return {
      kind: 'skipped' as const,
      route: rawRoute,
      reason: `requires seeded identifier for ${unsupportedDynamicSegment}`,
    };
  }

  const resolvedRoute = rawRoute.replace('/[orgSlug]', `/${orgSlug}`);
  if (publicRouteSet.has(resolvedRoute)) {
    return { kind: 'public' as const, route: resolvedRoute };
  }
  if (resolvedRoute.startsWith(`/${orgSlug}/`)) {
    return { kind: 'authenticatedOrg' as const, route: resolvedRoute };
  }
  return { kind: 'authenticatedGlobal' as const, route: resolvedRoute };
}

function uniqueSorted(routes: string[]) {
  return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}

export async function discoverRouteInventory(): Promise<RouteInventory> {
  const inventory: RouteInventory = {
    publicRoutes: [],
    authenticatedGlobalRoutes: [],
    authenticatedOrgRoutes: [],
    skippedRoutes: [],
  };

  for (const filePath of await collectPageFiles(appRoot)) {
    const classification = classifyRoute(normalizeRoute(filePath));
    if (classification.kind === 'public') {
      inventory.publicRoutes.push(classification.route);
      continue;
    }
    if (classification.kind === 'authenticatedGlobal') {
      inventory.authenticatedGlobalRoutes.push(classification.route);
      continue;
    }
    if (classification.kind === 'authenticatedOrg') {
      inventory.authenticatedOrgRoutes.push(classification.route);
      continue;
    }
    inventory.skippedRoutes.push({ route: classification.route, reason: classification.reason });
  }

  inventory.publicRoutes = uniqueSorted(inventory.publicRoutes);
  inventory.authenticatedGlobalRoutes = uniqueSorted(inventory.authenticatedGlobalRoutes);
  inventory.authenticatedOrgRoutes = uniqueSorted(inventory.authenticatedOrgRoutes);
  inventory.skippedRoutes = inventory.skippedRoutes
    .sort((left, right) => left.route.localeCompare(right.route) || left.reason.localeCompare(right.reason))
    .filter(
      (entry, index, list) =>
        index === 0
        || entry.route !== list[index - 1]?.route
        || entry.reason !== list[index - 1]?.reason,
    );

  return inventory;
}
