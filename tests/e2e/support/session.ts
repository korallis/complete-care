import type { Page } from '@playwright/test';
import { qaUser } from './config';

export async function login(page: Page, credentials = qaUser) {
  await page.goto('/login', { waitUntil: 'load', timeout: 20_000 });
  await page.getByLabel(/email address/i).fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}
