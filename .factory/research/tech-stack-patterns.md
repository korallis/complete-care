# Tech Stack Patterns: Vercel SaaS Platform Research

> **Date**: 2026-03-31  
> **Context**: UK Care Management Platform — Complete Care  
> **Stack**: Next.js 15 (App Router) · Vercel · Vercel Postgres (Neon) · Drizzle ORM · Auth.js v5 · AWS Bedrock · Stripe · Tailwind CSS · TypeScript

---

## Table of Contents

1. [Drizzle ORM + Vercel Postgres (Neon)](#1-drizzle-orm--vercel-postgres-neon)
2. [Auth.js v5 with Next.js 15](#2-authjs-v5-with-nextjs-15)
3. [AWS Bedrock Integration](#3-aws-bedrock-integration)
4. [Stripe Integration with Next.js](#4-stripe-integration-with-nextjs)
5. [Next.js 15 App Router Patterns for Large Apps](#5-nextjs-15-app-router-patterns-for-large-apps)
6. [UI Component Libraries](#6-ui-component-libraries)

---

## 1. Drizzle ORM + Vercel Postgres (Neon)

### 1.1 Connection Pooling Best Practices

The number one production issue with Drizzle + Neon on Vercel is **connection storms** — serverless functions each creating their own connection pool, overwhelming the database under load. There are three patterns to choose from:

#### Pattern A: Neon HTTP Driver (Recommended Default)

For most SaaS CRUD apps, use the Neon serverless HTTP driver. No TCP connections to hold open. No pool management. Each query is a stateless HTTPS request.

```typescript
// src/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**When to use**: Most server components, server actions, API routes. Works on both Node and Edge runtimes.

**Rough performance**: Moving from raw TCP to HTTP can cut cold-start query overhead by reducing round trips. Teams typically see p95 route latency drop by 50–150ms on endpoints that previously opened new connections under load.

#### Pattern B: Vercel Pool + node-postgres (For Heavy Endpoints)

When you need many queries per request and want lower per-query overhead:

```typescript
// src/lib/db.ts
import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
attachDatabasePool(pool); // Closes idle connections when function is frozen
export const db = drizzle({ client: pool, schema });
```

**When to use**: Node runtime only. Endpoints with many queries per request (dashboard aggregations, reports).

#### Pattern C: Neon WebSocket Pool (Interactive Transactions Only)

Only use this when you genuinely need interactive transactions (multi-step transactions with conditional logic).

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node < 22
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool);
```

**Important**: Most apps don't need interactive transactions. Neon HTTP supports single-statement transactions.

#### Critical Mistakes to Avoid

1. **Never create a Pool inside a request handler** — this is a self-inflicted DoS:
   ```typescript
   // ❌ BAD — creates a new pool per request
   export async function GET() {
     const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
     const rows = await pool.query('select 1');
     return Response.json(rows.rows);
   }
   ```

2. **Don't mix drivers** — pick one strategy per runtime (HTTP for Edge/most Node, pooling for heavy Node endpoints).

3. **Watch for static rendering** — Server Components in pages that Next.js decides are static will run DB queries at build time, not per-request. Force `dynamic = 'force-dynamic'` or use `unstable_noStore()` when you need runtime reads.

4. **Drizzle Kit runs outside Next.js** — load env vars properly (e.g. using `dotenv/config`) in `drizzle.config.ts`.

### 1.2 Schema Design for Multi-Tenant SaaS

For a care management platform with organisations (care homes, agencies), **application-level tenant isolation with a `organisationId` column** is the recommended starting approach, with the option to add PostgreSQL RLS later.

#### Recommended: Application-Level Isolation + Drizzle RLS

```typescript
// src/lib/schema.ts
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Organisations (tenants)
export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users belong to organisations via memberships
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  role: text('role').notNull().default('carer'), // admin, manager, carer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// All tenant-scoped tables include organisationId
export const residents = pgTable('residents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  // ... care-specific fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const carePlans = pgTable('care_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  residentId: uuid('resident_id').notNull().references(() => residents.id),
  title: text('title').notNull(),
  content: text('content'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Drizzle RLS Support (Available Since v1.0)

Drizzle now supports native Postgres RLS policies. You can add database-level enforcement:

```typescript
import { pgTable, uuid, text, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const residents = pgTable('residents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
}, (t) => [
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`organisation_id = current_setting('app.current_org_id')::uuid`,
    withCheck: sql`organisation_id = current_setting('app.current_org_id')::uuid`,
  }),
]);
```

Set tenant context in middleware/server actions:

```typescript
// Before any tenant-scoped query
await db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`);
```

#### Multi-Tenancy Strategy Recommendation

| Strategy | Pros | Cons | When to Use |
|----------|------|------|-------------|
| **Row-level (organisationId column)** | Simple, one migration affects all tenants, cheapest infrastructure | Bug in filtering leaks data, noisy-neighbour risk | Start here — covers 90% of SaaS needs |
| **Row-level + Postgres RLS** | Database-enforced isolation, defense-in-depth | Slightly more complex, need to set session vars | Add after MVP for compliance (CQC/Ofsted audits) |
| **Schema-per-tenant** | Strong logical isolation, easy GDPR data export/deletion | Migrations become fan-out operations, ~1000 schema limit | Enterprise tier, if regulators demand it |

**Recommendation for Complete Care**: Start with application-level `organisationId` filtering in a service layer. Add Postgres RLS policies before going to production for defense-in-depth. Design the service layer so switching to schema isolation later is possible without rewriting business logic.

### 1.3 Migration Workflow

Drizzle Kit provides two approaches:

#### `drizzle-kit generate` + `drizzle-kit migrate` (Production)

```bash
# 1. Generate SQL migration files from schema changes
npx drizzle-kit generate

# 2. Review generated SQL in ./drizzle/ directory

# 3. Apply migrations to the database
npx drizzle-kit migrate
```

**Configuration:**

```typescript
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Enable RLS role management
  entities: {
    roles: {
      provider: 'neon', // Exclude Neon system roles
    },
  },
});
```

#### `drizzle-kit push` (Development Only)

```bash
# Push schema changes directly — no migration files
npx drizzle-kit push
```

**Best practice**: Use `push` in local development for speed. Use `generate` + `migrate` in staging/production with migration files checked into git.

#### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/lib/seed.ts"
  }
}
```

#### Neon Branching for Dev/Test

Use Neon branches per environment:

```typescript
// src/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const getBranchUrl = () => {
  const env = process.env.NODE_ENV;
  if (env === 'development') return process.env.DEV_DATABASE_URL;
  if (env === 'test') return process.env.TEST_DATABASE_URL;
  return process.env.DATABASE_URL;
};

const sql = neon(getBranchUrl()!);
export const db = drizzle({ client: sql });
```

### 1.4 Type-Safe Query Patterns

#### Basic CRUD with Full Type Safety

```typescript
import { db } from '@/lib/db';
import { residents, carePlans } from '@/lib/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';

// Insert with type-safe return
const newResident = await db.insert(residents).values({
  organisationId: orgId,
  firstName: 'John',
  lastName: 'Smith',
}).returning();

// Select with filtering
const activeResidents = await db
  .select()
  .from(residents)
  .where(
    and(
      eq(residents.organisationId, orgId),
      ilike(residents.lastName, `%${search}%`)
    )
  )
  .orderBy(desc(residents.createdAt))
  .limit(20)
  .offset(page * 20);

// Update
await db.update(carePlans)
  .set({ status: 'active', updatedAt: new Date() })
  .where(
    and(
      eq(carePlans.id, planId),
      eq(carePlans.organisationId, orgId)
    )
  );

// Aggregation
const stats = await db
  .select({
    count: sql<number>`cast(count(*) as int)`,
    status: carePlans.status,
  })
  .from(carePlans)
  .where(eq(carePlans.organisationId, orgId))
  .groupBy(carePlans.status);
```

#### Relational Queries (Drizzle Query API)

Define relations first:

```typescript
// src/lib/schema.ts (relations)
import { relations } from 'drizzle-orm';

export const residentsRelations = relations(residents, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [residents.organisationId],
    references: [organisations.id],
  }),
  carePlans: many(carePlans),
}));

export const carePlansRelations = relations(carePlans, ({ one }) => ({
  resident: one(residents, {
    fields: [carePlans.residentId],
    references: [residents.id],
  }),
  organisation: one(organisations, {
    fields: [carePlans.organisationId],
    references: [organisations.id],
  }),
}));
```

Then query with nested relations:

```typescript
// Fetch resident with their care plans
const residentWithPlans = await db.query.residents.findFirst({
  where: and(
    eq(residents.id, residentId),
    eq(residents.organisationId, orgId)
  ),
  with: {
    carePlans: {
      orderBy: [desc(carePlans.createdAt)],
      limit: 10,
    },
  },
});
```

### 1.5 Read Replicas for Scale

Drizzle supports `withReplicas()` for automatic read/write splitting:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { withReplicas } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

const primaryDb = drizzle(new Pool({ connectionString: process.env.DATABASE_URL! }));
const readDb = drizzle(new Pool({ connectionString: process.env.READ_REPLICA_URL! }));

export const db = withReplicas(primaryDb, [readDb]);

// Reads auto-route to replica, writes go to primary
const data = await db.select().from(residents); // → replica
await db.insert(residents).values({...}); // → primary

// Force read from primary when needed
const fresh = await db.$primary().select().from(residents);
```

---

## 2. Auth.js v5 with Next.js 15

### 2.1 Core Setup Pattern

Auth.js v5 (the stable release of what was NextAuth v5) has a simplified API for Next.js 15 App Router.

#### Install

```bash
npm install next-auth@beta @auth/drizzle-adapter
```

> **Note**: Install `next-auth@beta` for v5 compatible with Next.js 15. The `@auth/drizzle-adapter` connects directly to your Drizzle schema.

#### Main Configuration

```typescript
// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        };
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith('/dashboard') ||
                          nextUrl.pathname.startsWith('/admin');

      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
});
```

#### API Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

#### Middleware for Route Protection

```typescript
// src/middleware.ts
export { auth as default } from '@/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*',
  ],
};
```

### 2.2 Multi-Tenant Auth (Organisation-Based Sessions)

For care management, users belong to organisations. Extend the session to include the active organisation:

```typescript
// Extended JWT callback
callbacks: {
  async jwt({ token, user, trigger, session }) {
    if (user) {
      token.id = user.id;

      // Fetch user's memberships
      const memberships = await db.query.memberships.findMany({
        where: eq(membershipsTable.userId, user.id),
        with: { organisation: true },
      });

      token.memberships = memberships.map(m => ({
        orgId: m.organisationId,
        orgName: m.organisation.name,
        orgSlug: m.organisation.slug,
        role: m.role,
      }));

      // Set default active org (first membership)
      token.activeOrgId = memberships[0]?.organisationId;
      token.activeRole = memberships[0]?.role;
    }

    // Allow switching active org
    if (trigger === 'update' && session?.activeOrgId) {
      const membership = token.memberships?.find(
        (m: any) => m.orgId === session.activeOrgId
      );
      if (membership) {
        token.activeOrgId = membership.orgId;
        token.activeRole = membership.role;
      }
    }

    return token;
  },
  session({ session, token }) {
    return {
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        activeOrgId: token.activeOrgId as string,
        activeRole: token.activeRole as string,
        memberships: token.memberships,
      },
    };
  },
}
```

#### TypeScript Type Extensions

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      activeOrgId: string;
      activeRole: string;
      memberships: Array<{
        orgId: string;
        orgName: string;
        orgSlug: string;
        role: string;
      }>;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    activeOrgId: string;
    activeRole: string;
    memberships: Array<{
      orgId: string;
      orgName: string;
      orgSlug: string;
      role: string;
    }>;
  }
}
```

### 2.3 Role-Based Access Control (RBAC)

#### Roles for a Care Platform

```typescript
// src/lib/auth/roles.ts
export const ROLES = {
  OWNER: 'owner',       // Organisation owner — full access
  ADMIN: 'admin',       // Admin — manages users, settings
  MANAGER: 'manager',   // Care manager — manages care plans, staff
  SENIOR_CARER: 'senior_carer', // Senior carer — approves notes
  CARER: 'carer',       // Carer — logs notes, views assigned residents
  VIEWER: 'viewer',     // Read-only access (inspectors, family)
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission matrix
export const PERMISSIONS = {
  'residents:create': ['owner', 'admin', 'manager'],
  'residents:read':   ['owner', 'admin', 'manager', 'senior_carer', 'carer', 'viewer'],
  'residents:update': ['owner', 'admin', 'manager', 'senior_carer'],
  'residents:delete': ['owner', 'admin'],
  'care_plans:create': ['owner', 'admin', 'manager', 'senior_carer'],
  'care_plans:approve': ['owner', 'admin', 'manager'],
  'notes:create': ['owner', 'admin', 'manager', 'senior_carer', 'carer'],
  'notes:read': ['owner', 'admin', 'manager', 'senior_carer', 'carer', 'viewer'],
  'users:manage': ['owner', 'admin'],
  'billing:manage': ['owner'],
  'settings:manage': ['owner', 'admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
```

#### Server-Side Permission Check

```typescript
// src/lib/auth/check-access.ts
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { hasPermission, type Permission } from './roles';

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  if (!hasPermission(session.user.activeRole, permission)) {
    redirect('/dashboard?error=unauthorized');
  }

  return session;
}

// Usage in server components / actions:
export default async function ResidentCreatePage() {
  const session = await requirePermission('residents:create');
  // ... render form
}
```

### 2.4 Edge Compatibility Split

If using database adapters that aren't edge-compatible, split config:

```typescript
// auth.config.ts — edge-safe config (no DB adapter)
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

export default {
  providers: [Google],
  pages: { signIn: '/auth/signin' },
} satisfies NextAuthConfig;
```

```typescript
// auth.ts — full config with adapter
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import authConfig from './auth.config';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
```

```typescript
// middleware.ts — uses edge-safe config
import authConfig from './auth.config';
import NextAuth from 'next-auth';

const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### 2.5 Key Auth.js v5 Changes from v4

| Change | Details |
|--------|---------|
| **Config location** | `auth.ts` in project root (not API route) |
| **Exports** | `NextAuth()` returns `{ auth, handlers, signIn, signOut }` |
| **API route** | `export const { GET, POST } = handlers` — one-liner |
| **Server auth** | `const session = await auth()` — replaces `getServerSession(authOptions)` |
| **Client auth** | `useSession()` hook unchanged, but needs `SessionProvider` |
| **Middleware** | `export { auth as default } from '@/auth'` — use `authorized` callback |
| **Environment** | `AUTH_SECRET` (auto-detected), `AUTH_` prefix for provider vars |
| **Cookies prefix** | Changed from `next-auth` to `authjs` |

---

## 3. AWS Bedrock Integration

### 3.1 Vercel AI SDK + Bedrock Provider (Recommended)

The Vercel AI SDK has an official Amazon Bedrock provider that handles authentication, streaming, and tool calling.

#### Install

```bash
npm install ai @ai-sdk/amazon-bedrock
```

#### Provider Setup

```typescript
// src/lib/ai.ts
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

export const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION ?? 'eu-west-2', // London region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Or use default provider with env vars auto-detected
// import { bedrock } from '@ai-sdk/amazon-bedrock';
```

#### Environment Variables

```env
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 3.2 Text Generation (Server Actions)

```typescript
// src/app/actions/ai.ts
'use server';

import { generateText, streamText } from 'ai';
import { bedrock } from '@/lib/ai';

// Simple text generation
export async function generateCarePlanSuggestion(residentInfo: string) {
  const { text } = await generateText({
    model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),
    system: `You are an expert UK care management assistant. 
             Generate care plan suggestions following CQC guidelines.
             Be specific, actionable, and person-centred.`,
    prompt: `Based on the following resident information, suggest care plan objectives:\n\n${residentInfo}`,
  });

  return text;
}
```

### 3.3 Streaming Responses

```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai';
import { bedrock } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),
    system: `You are a care management assistant for UK care homes.
             You help with care plans, risk assessments, and daily notes.
             Always follow CQC Key Lines of Enquiry.`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

#### Client-Side Chat UI

```typescript
// src/components/ai-chat.tsx
'use client';

import { useChat } from 'ai/react';

export function AICareAssistant() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <p className="inline-block p-3 rounded-lg bg-muted">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about care plans, risk assessments..."
          className="w-full p-2 border rounded"
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### 3.4 Available Bedrock Models

| Model | Use Case | Notes |
|-------|----------|-------|
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | General text, care plans, analysis | Best balance of quality/cost/speed |
| `us.anthropic.claude-opus-4-20250514-v1:0` | Complex reasoning, compliance analysis | Most capable, higher cost |
| `us.anthropic.claude-haiku-4-5-20251001-v1:0` | Quick summaries, daily note assistance | Fastest, cheapest |
| `us.meta.llama3-70b-instruct-v1:0` | Open-source alternative | Good for less sensitive tasks |
| `amazon.nova-pro-v1:0` | Amazon's model | Good for general text generation |

> **Important**: Request model access in the AWS console for your region. Not all models are available in `eu-west-2` — you may need `us-east-1` for some.

### 3.5 Structured Output with Tool Calling

```typescript
import { generateText } from 'ai';
import { bedrock } from '@/lib/ai';
import { z } from 'zod';

const result = await generateText({
  model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),
  tools: {
    assessRisk: {
      description: 'Assess risk level for a care situation',
      parameters: z.object({
        riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
        factors: z.array(z.string()),
        mitigations: z.array(z.string()),
        reviewDate: z.string().describe('Suggested review date in ISO format'),
      }),
    },
  },
  prompt: `Assess the fall risk for a 85-year-old resident who has had 
           2 falls in the past month, uses a walking frame, and has mild 
           cognitive impairment.`,
});
```

### 3.6 Prompt Caching (Preview)

Bedrock supports prompt caching for Claude models, reducing costs for repeated system prompts:

```typescript
const result = await generateText({
  model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),
  messages: [
    {
      role: 'system',
      content: longCareGuidelinesPrompt,
      providerOptions: {
        bedrock: { cachePoint: { type: 'default' } },
      },
    },
    { role: 'user', content: userMessage },
  ],
});
```

---

## 4. Stripe Integration with Next.js

### 4.1 Setup

```bash
npm install stripe @stripe/stripe-js
```

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18',
  typescript: true,
});
```

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 4.2 Subscription Billing Pattern

#### Create Checkout Session (Server Action)

```typescript
// src/app/actions/billing.ts
'use server';

import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: session.user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId: session.user.id,
      orgId: session.user.activeOrgId,
    },
  });

  redirect(checkoutSession.url!);
}
```

#### Customer Portal

```typescript
// src/app/actions/billing.ts
export async function createPortalSession() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const org = await db.query.organisations.findFirst({
    where: eq(organisations.id, session.user.activeOrgId),
  });

  if (!org?.stripeCustomerId) redirect('/pricing');

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  redirect(portalSession.url);
}
```

### 4.3 Webhook Handler

**Critical**: Use `req.text()` not `req.json()`. Stripe verifies the raw request body.

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organisations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text(); // ← MUST be text, not json
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.orgId;
  if (!orgId) return;

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  await db.update(organisations)
    .set({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: getPlanFromPriceId(priceId),
    })
    .where(eq(organisations.id, orgId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0].price.id;

  await db.update(organisations)
    .set({
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: getPlanFromPriceId(priceId),
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await db.update(organisations)
    .set({
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      plan: 'free',
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = invoice.customer as string;

  await db.update(organisations)
    .set({
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // Log and notify — don't immediately revoke (Stripe retries)
  console.warn(`Payment failed for customer: ${customerId}`);
  // TODO: Send email notification
}

function getPlanFromPriceId(priceId: string): string {
  const planMap: Record<string, string> = {
    [process.env.STRIPE_PRO_PRICE_ID!]: 'professional',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'enterprise',
  };
  return planMap[priceId] ?? 'free';
}
```

### 4.4 Multi-Tenant Billing

For care management, billing is **per-organisation**, not per-user:

```typescript
// Schema additions for organisations table
export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Entitlement Check Utility

```typescript
// src/lib/billing/entitlements.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function getOrgPlan() {
  const session = await auth();
  if (!session?.user?.activeOrgId) return null;

  const org = await db.query.organisations.findFirst({
    where: eq(organisations.id, session.user.activeOrgId),
    columns: {
      plan: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!org) return null;

  const isActive = org.stripeCurrentPeriodEnd &&
    org.stripeCurrentPeriodEnd > new Date();

  return {
    plan: isActive ? org.plan : 'free',
    isActive: !!isActive,
  };
}

// Feature gating
export const PLAN_LIMITS = {
  free: { residents: 5, users: 2, aiCredits: 10 },
  professional: { residents: 50, users: 20, aiCredits: 500 },
  enterprise: { residents: -1, users: -1, aiCredits: -1 }, // unlimited
} as const;
```

### 4.5 Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### 4.6 Webhook Best Practices

| Practice | Why |
|----------|-----|
| **Always verify signatures** | Prevents forged webhook requests |
| **Use `req.text()` not `req.json()`** | Signature verification needs raw body |
| **Handle idempotency** | Stripe may send the same event twice — use `event.id` to deduplicate |
| **Don't revoke on first payment failure** | Stripe retries for 3 days — add grace period |
| **Pass metadata through checkout** | `metadata.orgId` links payment to your tenant |
| **Return 200 quickly** | For long processing, queue async and respond immediately |

---

## 5. Next.js 15 App Router Patterns for Large Apps

### 5.1 Production Folder Structure

```
src/
├── app/                          # Routing only — thin page files
│   ├── (marketing)/              # Route group: public pages
│   │   ├── layout.tsx            # Marketing layout (nav + footer)
│   │   ├── page.tsx              # Homepage
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── blog/
│   │       ├── page.tsx
│   │       └── [slug]/
│   │           └── page.tsx
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── layout.tsx            # Centered card layout
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Route group: authenticated app
│   │   ├── layout.tsx            # Auth check + sidebar + org context
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── residents/
│   │   │   ├── page.tsx          # List
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detail
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit
│   │   ├── care-plans/
│   │   │   └── ...
│   │   ├── daily-notes/
│   │   │   └── ...
│   │   ├── staff/
│   │   │   └── ...
│   │   ├── reports/
│   │   │   └── ...
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── billing/
│   │       │   └── page.tsx
│   │       └── team/
│   │           └── page.tsx
│   ├── (admin)/                  # Route group: platform admin
│   │   ├── layout.tsx
│   │   └── admin/
│   │       └── ...
│   ├── api/                      # Only webhooks + external integrations
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── chat/
│   │       └── route.ts         # AI streaming endpoint
│   └── layout.tsx                # Root layout (providers, fonts, analytics)
├── features/                     # Domain feature modules
│   ├── residents/
│   │   ├── components/
│   │   │   ├── resident-table.tsx
│   │   │   ├── resident-form.tsx
│   │   │   └── resident-card.tsx
│   │   ├── actions/
│   │   │   ├── create-resident.ts
│   │   │   └── update-resident.ts
│   │   ├── hooks/
│   │   │   └── use-resident-filters.ts
│   │   └── types.ts
│   ├── care-plans/
│   │   ├── components/
│   │   ├── actions/
│   │   └── types.ts
│   ├── daily-notes/
│   ├── staff/
│   ├── reports/
│   ├── compliance/               # CQC/Ofsted compliance features
│   ├── billing/
│   └── ai-assistant/
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── layout/                   # Shared layout components
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── footer.tsx
├── lib/                          # Shared infrastructure
│   ├── db.ts                     # Database client
│   ├── schema.ts                 # Drizzle schema
│   ├── ai.ts                     # Bedrock client
│   ├── stripe.ts                 # Stripe client
│   └── utils.ts                  # Generic utilities (cn, formatDate)
├── hooks/                        # Shared client hooks
│   ├── use-debounce.ts
│   └── use-media-query.ts
└── types/                        # Global type definitions
    ├── next-auth.d.ts
    └── global.ts
```

### 5.2 Route Groups and Layout Patterns

Route groups `(parenthesized)` create separate layout trees **without affecting URLs**.

```typescript
// app/(dashboard)/layout.tsx — auth check at layout level
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

```typescript
// app/(marketing)/layout.tsx — public layout
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

### 5.3 Server Components vs Client Components

**Default rule**: Everything is a Server Component. Add `'use client'` only when you need browser APIs, event handlers, or React state.

```
Server Component (default):
✅ Database queries
✅ Auth checks
✅ Environment variables
✅ Heavy computation
✅ Rendering data

Client Component ('use client'):
✅ onClick, onChange, onSubmit handlers
✅ useState, useEffect, useRef
✅ Browser APIs (localStorage, geolocation)
✅ Third-party client libs (charts, maps, rich text editors)
```

**Pattern**: Keep pages as Server Components, extract interactive parts:

```typescript
// app/(dashboard)/residents/page.tsx — Server Component
import { db } from '@/lib/db';
import { residents } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { ResidentTable } from '@/features/residents/components/resident-table';

export default async function ResidentsPage() {
  const session = await auth();
  const data = await db.select().from(residents)
    .where(eq(residents.organisationId, session!.user.activeOrgId));

  return (
    <div>
      <h1 className="text-2xl font-bold">Residents</h1>
      {/* Only this component is 'use client' */}
      <ResidentTable data={data} />
    </div>
  );
}
```

### 5.4 Server Actions for Mutations

Server Actions replace most API routes for mutations:

```typescript
// src/features/residents/actions/create-resident.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createResidentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
});

export async function createResident(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const parsed = createResidentSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    dateOfBirth: formData.get('dateOfBirth'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const [newResident] = await db.insert(residents).values({
    organisationId: session.user.activeOrgId,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
  }).returning();

  revalidatePath('/residents');
  redirect(`/residents/${newResident.id}`);
}
```

### 5.5 Middleware for Auth and Multi-Tenancy

```typescript
// src/middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAuthPage = nextUrl.pathname.startsWith('/signin') ||
                     nextUrl.pathname.startsWith('/register');
  const isDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                      nextUrl.pathname.startsWith('/residents') ||
                      nextUrl.pathname.startsWith('/care-plans');

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Protect dashboard routes
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/signin', nextUrl));
  }

  // Ensure user has an active organisation
  if (isDashboard && isLoggedIn && !session?.user?.activeOrgId) {
    return NextResponse.redirect(new URL('/onboarding', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 5.6 API Routes — Keep Minimal

With Server Actions handling mutations, `api/` is only needed for:

- **Webhooks** (Stripe, external integrations)
- **Streaming endpoints** (AI chat via Vercel AI SDK)
- **External callbacks** (OAuth providers handle this via Auth.js)

### 5.7 Parallel Routes (Advanced)

Useful for dashboards with independent loading states:

```
app/(dashboard)/dashboard/
├── page.tsx              # Main dashboard
├── @metrics/
│   ├── page.tsx          # Metrics panel (loads independently)
│   └── loading.tsx       # Metrics skeleton
├── @recent/
│   ├── page.tsx          # Recent activity panel
│   └── loading.tsx       # Activity skeleton
└── layout.tsx            # Composes parallel slots
```

```typescript
// app/(dashboard)/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  metrics,
  recent,
}: {
  children: React.ReactNode;
  metrics: React.ReactNode;
  recent: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2 gap-4">
        {metrics}
        {recent}
      </div>
    </div>
  );
}
```

---

## 6. UI Component Libraries

### 6.1 shadcn/ui Patterns

shadcn/ui is not a traditional npm package — it's a code distribution system. You own the components.

#### Installation

```bash
npx shadcn@latest init
```

Configuration chooses Tailwind CSS, adds `components.json`, and sets up the `cn()` utility.

#### Adding Components

```bash
npx shadcn@latest add button card input dialog table form
npx shadcn@latest add dropdown-menu select textarea badge avatar
npx shadcn@latest add sheet command popover calendar
```

Components are copied into `src/components/ui/` and you own the code — modify freely.

### 6.2 Form Handling: react-hook-form + zod + shadcn Form

This is the standard pattern for validated forms in the ecosystem:

```typescript
// src/features/residents/components/resident-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createResident } from '../actions/create-resident';

const residentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  roomNumber: z.string().optional(),
  careLevel: z.enum(['low', 'medium', 'high', 'complex']),
  notes: z.string().optional(),
});

type ResidentFormValues = z.infer<typeof residentSchema>;

export function ResidentForm() {
  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      careLevel: 'medium',
    },
  });

  async function onSubmit(data: ResidentFormValues) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    await createResident(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="careLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Care Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select care level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Resident'}
        </Button>
      </form>
    </Form>
  );
}
```

### 6.3 Data Tables with TanStack Table + shadcn

For complex care data (residents, daily notes, medications, staff schedules), use TanStack Table with shadcn:

```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

```typescript
// src/features/residents/components/resident-table.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  careLevel: string;
  roomNumber: string | null;
  createdAt: Date;
};

const columns: ColumnDef<Resident>[] = [
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'careLevel',
    header: 'Care Level',
    cell: ({ row }) => {
      const level = row.getValue('careLevel') as string;
      const variant = {
        low: 'secondary',
        medium: 'default',
        high: 'destructive',
        complex: 'destructive',
      }[level] as 'secondary' | 'default' | 'destructive';
      return <Badge variant={variant}>{level}</Badge>;
    },
  },
  {
    accessorKey: 'roomNumber',
    header: 'Room',
  },
];

export function ResidentTable({ data }: { data: Resident[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by last name..."
          value={(table.getColumn('lastName')?.getFilterValue() as string) ?? ''}
          onChange={(e) =>
            table.getColumn('lastName')?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No residents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

#### Server-Side Pagination Pattern

For large datasets (thousands of care notes), use server-side pagination:

```typescript
// src/features/daily-notes/actions/get-notes.ts
'use server';

import { db } from '@/lib/db';
import { dailyNotes } from '@/lib/schema';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';

export async function getNotes({
  orgId,
  page = 0,
  pageSize = 20,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  orgId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const conditions = [eq(dailyNotes.organisationId, orgId)];
  if (search) {
    conditions.push(ilike(dailyNotes.content, `%${search}%`));
  }

  const [data, countResult] = await Promise.all([
    db.select()
      .from(dailyNotes)
      .where(and(...conditions))
      .orderBy(sortOrder === 'desc' ? desc(dailyNotes.createdAt) : dailyNotes.createdAt)
      .limit(pageSize)
      .offset(page * pageSize),
    db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(dailyNotes)
      .where(and(...conditions)),
  ]);

  return {
    data,
    totalCount: countResult[0].count,
    pageCount: Math.ceil(countResult[0].count / pageSize),
  };
}
```

### 6.4 Tailwind CSS Best Practices

#### Utility Function

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Design Tokens via CSS Variables

shadcn/ui uses CSS variables for theming. Extend in `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... care platform brand colors */
    --care-blue: 210 100% 45%;
    --care-green: 142 71% 45%;
    --alert-amber: 38 92% 50%;
    --alert-red: 0 84% 60%;
  }
}
```

### 6.5 Key Libraries Summary

| Library | Purpose | Install |
|---------|---------|---------|
| `shadcn/ui` | UI component system | `npx shadcn@latest init` |
| `@tanstack/react-table` | Data tables (sorting, filtering, pagination) | `npm install @tanstack/react-table` |
| `react-hook-form` | Form state management | `npm install react-hook-form` |
| `@hookform/resolvers` | Zod integration for react-hook-form | `npm install @hookform/resolvers` |
| `zod` | Schema validation (forms + server actions) | `npm install zod` |
| `tailwind-merge` | Merge Tailwind classes safely | `npm install tailwind-merge` |
| `clsx` | Conditional class names | `npm install clsx` |
| `lucide-react` | Icon library (used by shadcn) | `npm install lucide-react` |
| `date-fns` | Date formatting/manipulation | `npm install date-fns` |
| `recharts` | Charts for dashboards/reports | `npm install recharts` |

---

## Quick Reference: Package Install Command

```bash
# Core
npm install next@15 react react-dom typescript

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth
npm install next-auth@beta @auth/drizzle-adapter bcryptjs
npm install -D @types/bcryptjs

# AI
npm install ai @ai-sdk/amazon-bedrock

# Payments
npm install stripe @stripe/stripe-js

# UI
npx shadcn@latest init
npm install @tanstack/react-table react-hook-form @hookform/resolvers zod
npm install tailwind-merge clsx lucide-react date-fns recharts

# Dev tools
npm install -D @types/node @types/react @types/react-dom
```

---

## Sources

### Drizzle + Neon
- [Neon Docs: Connect from Drizzle](https://www.neon.tech/docs/guides/drizzle)
- [HeyDev: Drizzle + Neon on Vercel Connection Storms](https://heydev.us/blog/drizzle-neon-vercel-connection-storm-fix-2026)
- [Neon Guide: Drizzle Read Replicas](https://neon.tech/guides/read-replica-drizzle)
- [Neon Guide: Drizzle Local + Serverless](https://neon.tech/guides/drizzle-local-vercel)
- [Drizzle ORM: Row-Level Security](https://orm.drizzle.team/docs/rls)
- [Kriedy Systems: Multi-Tenant SaaS Database Design](https://kriedysystems.com/blog/multi-tenant-saas-database-design)

### Auth.js v5
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Noqta: Auth.js v5 + Next.js 15 Guide (2026)](https://noqta.tn/en/tutorials/nextjs-authjs-v5-authentication-guide-2026)
- [CodeVoWeb: Next.js 15 + NextAuth v5 (2026)](https://codevoweb.com/how-to-set-up-next-js-15-with-nextauth-v5/)

### AWS Bedrock
- [Vercel AI SDK: Amazon Bedrock Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/amazon-bedrock)
- [AWS SDK for JS v3: Bedrock Runtime Examples](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_bedrock-runtime_code_examples.html)

### Stripe
- [ZeroDrag: Stripe Webhooks in Next.js Complete Guide](https://zerodrag.cloud/blog/stripe-webhooks-nextjs-complete-guide)
- [APIScout: Stripe Payments + Next.js (2026)](https://apiscout.dev/blog/how-to-add-stripe-payments-nextjs-2026)
- [HookRelay: Complete Stripe Webhook Guide](https://www.hookrelay.io/guides/nextjs-webhook-stripe)
- [Stripe Docs: Webhooks with Subscriptions](https://stripe.com/docs/billing/subscriptions/webhooks)

### Next.js 15 Patterns
- [DEV.to: Structure a Full-Stack Next.js 15 Project in 2026](https://dev.to/krunal_groovy/how-to-structure-a-full-stack-nextjs-15-project-in-2026-7c8)
- [Akousa: Structuring Next.js at Scale](http://akousa.net/blog/nextjs-at-scale)
- [jsUpskills: Next.js 15 Folder Structure Best Practices](https://jsupskills.dev/next-js-15-folder-structure-best-practices)

### UI / Forms / Data Tables
- [shadcn/ui: React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
- [Wasp: Building Advanced Forms with RHF + Zod + shadcn](https://wasp.sh/blog/2025/01/22/advanced-react-hook-form-zod-shadcn)
- [shadcn-table (Tablecn): Server-side data table component](https://github.com/sadmann7/shadcn-table)
