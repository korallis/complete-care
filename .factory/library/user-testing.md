# User Testing

Testing surface, required testing skills/tools, and resource cost classification.

**What belongs here:** Validation surface findings, tools used for testing, concurrency limits, runtime observations.
**What does NOT belong here:** Feature requirements or implementation details.

---

## Validation Surface

### Primary Surface: Browser UI
- **Tool**: `agent-browser` skill
- **URL**: http://localhost:3200
- **Scope**: All UI flows — navigation, forms, data display, interactive features, responsive layout
- **Setup**: Start Next.js dev server via `PORT=3200 bun run dev`

### Secondary Surface: API
- **Tool**: `curl`
- **Scope**: API route verification, webhook testing, server action validation
- **Base URL**: http://localhost:3200/api

## Validation Concurrency

### agent-browser (Primary)
- **Machine**: 24GB RAM, 12 CPU cores
- **Baseline usage**: ~9.6GB active+wired
- **Reclaimable headroom (70%)**: ~2.6GB
- **Per-validator cost**: ~500-700MB (Next.js dev server shared + headless browser instance)
- **Max concurrent validators**: **3**
- **Rationale**: Memory-constrained. 3 instances × 600MB avg = 1.8GB, within 2.6GB budget. Dev server shared across instances.

## Testing Prerequisites

- Next.js dev server running on port 3200
- Database accessible (Vercel Postgres / Neon)
- Seed data loaded for testing (test organisation, test users with different roles)
- `.env.local` configured with all required variables

## Known Constraints

- No Docker available — all services must run natively
- Google Maps API requires valid key for EVV/mapping tests
- Stripe webhook testing requires `stripe listen` CLI forwarding
- AWS Bedrock requires valid credentials for AI feature testing
