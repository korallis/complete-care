/**
 * PUT /api/organisations/:id — Update organisation settings.
 *
 * Requires 'manage' permission on 'organisation' resource (owner or admin).
 * Returns 403 for authenticated users without the required role (e.g., manager, carer).
 * Returns 401 for unauthenticated requests.
 *
 * Body: { name: string; slug: string; domains: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateOrgSettings } from '@/features/organisations/actions';
import { requirePermission, UnauthorizedError, UnauthenticatedError } from '@/lib/rbac';

const updateOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .max(100, 'Organisation name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(63, 'Slug must be 63 characters or fewer')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    ),
  domains: z
    .array(z.string())
    .min(1, 'At least one care domain must be selected'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // RBAC: requires 'manage' on 'organisation' — only owner and admin have this.
    // Throws UnauthenticatedError (→ 401) or UnauthorizedError (→ 403).
    await requirePermission('manage', 'organisation');

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const field = issue.path.join('.');
          acc[field] = issue.message;
          return acc;
        },
        {},
      );
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 422 },
      );
    }

    // Delegate to the server action which enforces tenant scoping
    const result = await updateOrgSettings(id, parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Organisation updated successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('PUT /api/organisations/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
