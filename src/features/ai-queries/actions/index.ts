'use server';

import { db } from '@/lib/db';
import { persons, incidents, carePlans, staffProfiles, medications } from '@/lib/db/schema';
import { eq, and, desc, lte, gte, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/rbac';
import type { QueryResult, SuggestedQuery } from '../types';

/**
 * Process a natural language query by matching against known query patterns
 * and executing real DB queries. Falls back to a helpful message if no
 * pattern matches.
 */
export async function executeNlQuery(
  queryText: string,
): Promise<{ success: boolean; result?: QueryResult; error?: string }> {
  const { orgId } = await requirePermission('read', 'reports');
  const lower = queryText.toLowerCase();

  try {
    // Pattern: active persons / service users
    if (lower.includes('active') && (lower.includes('person') || lower.includes('service user') || lower.includes('resident'))) {
      const data = await db
        .select({
          name: sql<string>`COALESCE(${persons.firstName} || ' ' || ${persons.lastName}, 'Unknown')`,
          status: persons.status,
          type: persons.type,
          createdAt: persons.createdAt,
        })
        .from(persons)
        .where(and(eq(persons.organisationId, orgId), eq(persons.status, 'active')))
        .orderBy(persons.lastName)
        .limit(100);

      return {
        success: true,
        result: {
          columns: ['Name', 'Status', 'Type', 'Since'],
          rows: data.map((r) => ({
            Name: r.name,
            Status: r.status,
            Type: r.type ?? 'unknown',
            Since: r.createdAt?.toISOString().split('T')[0] ?? '',
          })),
          totalCount: data.length,
        },
      };
    }

    // Pattern: incidents this month
    if (lower.includes('incident')) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const data = await db
        .select()
        .from(incidents)
        .where(and(
          eq(incidents.organisationId, orgId),
          gte(incidents.createdAt, startOfMonth),
        ))
        .orderBy(desc(incidents.createdAt))
        .limit(100);

      return {
        success: true,
        result: {
          columns: ['Title', 'Severity', 'Status', 'Date'],
          rows: data.map((r) => ({
            Title: r.description?.slice(0, 80) ?? 'Untitled',
            Severity: r.severity,
            Status: r.status,
            Date: r.createdAt?.toISOString().split('T')[0] ?? '',
          })),
          totalCount: data.length,
        },
      };
    }

    // Pattern: overdue care plans
    if (lower.includes('overdue') && lower.includes('care plan')) {
      const nowStr = new Date().toISOString().split('T')[0];
      const data = await db
        .select()
        .from(carePlans)
        .where(and(
          eq(carePlans.organisationId, orgId),
          lte(carePlans.nextReviewDate, nowStr),
          eq(carePlans.status, 'approved'),
        ))
        .orderBy(carePlans.nextReviewDate)
        .limit(100);

      return {
        success: true,
        result: {
          columns: ['Title', 'Status', 'Review Due', 'Version'],
          rows: data.map((r) => ({
            Title: r.title,
            Status: r.status,
            'Review Due': r.nextReviewDate ?? 'N/A',
            Version: String(r.version ?? 1),
          })),
          totalCount: data.length,
        },
      };
    }

    // Pattern: staff
    if (lower.includes('staff') || lower.includes('employee')) {
      const data = await db
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.organisationId, orgId))
        .limit(100);

      return {
        success: true,
        result: {
          columns: ['First Name', 'Last Name', 'Job Title', 'Status'],
          rows: data.map((r) => ({
            'First Name': r.firstName,
            'Last Name': r.lastName,
            'Job Title': r.jobTitle ?? '',
            Status: r.status,
          })),
          totalCount: data.length,
        },
      };
    }

    // Pattern: medications
    if (lower.includes('medication') || lower.includes('drug') || lower.includes('prescription')) {
      const data = await db
        .select()
        .from(medications)
        .where(and(eq(medications.organisationId, orgId), eq(medications.status, 'active')))
        .limit(100);

      return {
        success: true,
        result: {
          columns: ['Drug Name', 'Dose', 'Route', 'Frequency', 'Status'],
          rows: data.map((r) => ({
            'Drug Name': r.drugName,
            Dose: `${r.dose} ${r.doseUnit}`,
            Route: r.route,
            Frequency: r.frequency,
            Status: r.status,
          })),
          totalCount: data.length,
        },
      };
    }

    // No pattern matched
    return {
      success: true,
      result: {
        columns: ['Message'],
        rows: [{ Message: 'No matching query pattern found. Try: "active service users", "incidents this month", "overdue care plans", "staff list", or "active medications".' }],
        totalCount: 0,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Query failed' };
  }
}

export async function getSuggestedQueries(): Promise<SuggestedQuery[]> {
  return [
    { label: 'All active service users', queryText: 'Show me all active service users' },
    { label: 'Overdue care plan reviews', queryText: 'Which care plans are overdue for review?' },
    { label: 'Incidents this month', queryText: 'Show incidents reported this month' },
    { label: 'Staff list', queryText: 'Show all staff members' },
    { label: 'Active medications', queryText: 'List all active medications' },
  ];
}
