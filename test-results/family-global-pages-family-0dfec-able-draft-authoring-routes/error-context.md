# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: family-global-pages.spec.ts >> family and global page coverage >> global dashboards link into the available draft-authoring routes
- Location: tests/e2e/family-global-pages.spec.ts:5:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Complete Care home" [ref=e7] [cursor=pointer]:
      - /url: /
      - img [ref=e9]
      - generic [ref=e11]: Complete Care
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Welcome back" [level=1] [ref=e16]
        - paragraph [ref=e17]: Sign in to your Complete Care account
      - generic [ref=e18]:
        - button "Sign in with Google" [ref=e19]:
          - img
          - generic [ref=e20]: Sign in with Google
        - generic [ref=e22]: or sign in with email
        - generic [ref=e23]:
          - generic [ref=e24]:
            - text: Email address
            - textbox "Email address" [ref=e25]:
              - /placeholder: you@organisation.co.uk
              - text: lee@completecare.test
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]: Password
              - link "Forgot password?" [ref=e29] [cursor=pointer]:
                - /url: /forgot-password
            - generic [ref=e30]:
              - textbox "Password" [ref=e31]:
                - /placeholder: ••••••••
                - text: Superium123!
              - button "Show password" [ref=e32]:
                - img [ref=e33]
          - button "Sign in" [ref=e36]
          - paragraph [ref=e37]:
            - text: Don't have an account?
            - link "Create account" [ref=e38] [cursor=pointer]:
              - /url: /register
    - paragraph [ref=e39]: © 2026 Complete Care. UK Care Management Platform.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e45] [cursor=pointer]:
    - img [ref=e46]
  - alert [ref=e49]
```

# Test source

```ts
  1  | import type { Page } from '@playwright/test';
  2  | import { qaUser } from './config';
  3  | 
  4  | export async function login(page: Page, credentials = qaUser) {
  5  |   await page.goto('/login', { waitUntil: 'load', timeout: 20_000 });
  6  |   await page.getByLabel(/email address/i).fill(credentials.email);
  7  |   await page.locator('input[name="password"]').fill(credentials.password);
  8  |   await page.getByRole('button', { name: /^sign in$/i }).click();
> 9  |   await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  10 | }
  11 | 
```