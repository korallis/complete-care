# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

All stored in `.env.local` (gitignored). Never commit secrets.

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | Vercel Postgres (Neon) connection string | Vercel dashboard |
| `AUTH_SECRET` | Auth.js session encryption secret | `openssl rand -base64 32` |
| `AUTH_URL` | Auth.js callback URL | `http://localhost:3200` |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) | Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test mode) | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `stripe listen` CLI |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock access key | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock secret key | AWS IAM |
| `AWS_REGION` | AWS Bedrock region | `us-east-1` (default) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console |

## External Services

- **Vercel Postgres (Neon)**: Managed PostgreSQL database. Connection via Neon HTTP driver for serverless.
- **AWS Bedrock**: AI model access (Claude). Used via `@ai-sdk/amazon-bedrock` provider with Vercel AI SDK.
- **Stripe**: Subscription billing. Test mode for development. Webhooks via `stripe listen --forward-to localhost:3200/api/webhooks/stripe`.
- **Google Maps API**: Geocoding, directions, and map display. Used for EVV geofencing and route optimisation in domiciliary care.

## Platform Notes

- **Runtime**: Bun 1.3.11 (package manager + runtime)
- **Node.js**: v25.8.2 (used by Next.js)
- **macOS**: darwin 25.3.0, 24GB RAM, 12 CPU cores
- **Docker**: Not available on this machine — no containerized services
