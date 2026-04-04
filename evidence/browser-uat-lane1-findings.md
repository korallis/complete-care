# Lane 1 — public/auth UAT findings

Date: 2026-04-04
Worker: `worker-1`
Target: `http://localhost:3200`

## Live repros observed on the shared port-3200 app

### 1) Invite entry routes were incorrectly protected

- `GET /invite` → `302 /login?callbackUrl=%2Finvite`
- `GET /invitations/accept?token=fake` → `302 /login?callbackUrl=%2Finvitations%2Faccept%3Ftoken%3Dfake`

Impact:
- emailed invite links could not reach their intended landing/acceptance UI

Relevant files:
- `src/auth.config.ts`
- `src/components/organisations/accept-invitation-form.tsx`
- `src/app/invitations/accept/page.tsx`
- `src/app/(family)/invite/page.tsx`

## 2) Email registration bounced users into auth churn

Browser repro from Playwright on the shared port-3200 app:

- `POST /api/auth/register` → `201`
- `GET /onboarding` → `302`
- `GET /login?callbackUrl=%2Fonboarding` → `200`

Impact:
- successful registration sent users to onboarding before email verification
- the UI immediately returned them to login instead of the verify-email prompt

Relevant files:
- `src/components/auth/register-form.tsx`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/(auth)/verify-email/page.tsx`

## 3) Invitation register CTA lost its callback

Flow evidence from code + UAT:
- `AcceptInvitationForm` links to `/register?callbackUrl=/invitations/accept?...`
- `RegisterPage` previously ignored `callbackUrl`
- verification emails previously hardcoded post-verify redirect to `/onboarding`

Impact:
- “Create account & accept” could not return users to the invitation acceptance route

Relevant files:
- `src/components/organisations/accept-invitation-form.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/components/auth/register-form.tsx`
- `src/lib/email/index.ts`
- `src/app/api/auth/verify-email/route.ts`

## Worker-branch fixes

Committed on this worker branch:
- `f95d500` — invite entry routes public + registration stays in verify-email flow

Additional local branch changes after that commit:
- preserve safe `callbackUrl` through registration → verify-email → post-verify login redirect
- add callback URL helper tests and registration regression coverage

## Verification commands

- `bun run test -- src/__tests__/auth/auth-route-access.test.ts src/__tests__/auth/auth-hardening.test.ts src/__tests__/marketing/registration-redirect.test.tsx src/__tests__/lib/auth/callback-url.test.ts`
- `bun run typecheck`
- `bun run lint -- --file src/lib/auth/callback-url.ts --file src/components/auth/register-form.tsx --file 'src/app/(auth)/register/page.tsx' --file 'src/app/(auth)/verify-email/page.tsx' --file src/app/api/auth/register/route.ts --file src/app/api/auth/verify-email/route.ts --file src/lib/email/index.ts --file src/__tests__/lib/auth/callback-url.test.ts --file src/__tests__/marketing/registration-redirect.test.tsx`
