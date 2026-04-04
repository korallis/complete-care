import 'dotenv/config';

export const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200';
export const orgSlug = process.env.PLAYWRIGHT_ORG_SLUG ?? 'redesign-admin-workspace';
export const qaUser = {
  email: process.env.PLAYWRIGHT_QA_EMAIL ?? 'lee@completecare.test',
  password: process.env.PLAYWRIGHT_QA_PASSWORD ?? 'Superium123!',
};

export function slugifyRoute(route: string) {
  return route.replace(/^\//, '').replace(/[^a-zA-Z0-9-_]+/g, '_') || 'home';
}
