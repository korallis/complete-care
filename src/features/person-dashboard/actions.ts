'use server';

/**
 * Person Dashboard Server Actions
 *
 * Aggregates metrics and timeline data across all feature modules
 * for the person detail dashboard.
 *
 * All queries are tenant-scoped via requirePermission().
 */

import { and, count, desc, eq, gte, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  carePlans,
  careNotes,
  riskAssessments,
  incidents,
  documents,
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/rbac';
import type { DashboardMetrics, TimelineEntry, TimelineResult } from './types';

// ---------------------------------------------------------------------------
// Dashboard metrics — counts across all feature areas for a person
// ---------------------------------------------------------------------------

export async function getDashboardMetrics(
  personId: string,
): Promise<DashboardMetrics> {
  const { orgId } = await requirePermission('read', 'persons');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    carePlanCount,
    noteCount,
    riskCount,
    incidentCount,
  ] = await Promise.all([
    // Active care plans (draft, review, or approved — not archived/deleted)
    db
      .select({ count: count() })
      .from(carePlans)
      .where(
        and(
          eq(carePlans.organisationId, orgId),
          eq(carePlans.personId, personId),
          isNull(carePlans.deletedAt),
          or(
            eq(carePlans.status, 'draft'),
            eq(carePlans.status, 'review'),
            eq(carePlans.status, 'approved'),
          ),
        ),
      ),
    // Care notes in the last 7 days
    db
      .select({ count: count() })
      .from(careNotes)
      .where(
        and(
          eq(careNotes.organisationId, orgId),
          eq(careNotes.personId, personId),
          gte(careNotes.createdAt, sevenDaysAgo),
        ),
      ),
    // High/critical risk assessments that are completed
    db
      .select({ count: count() })
      .from(riskAssessments)
      .where(
        and(
          eq(riskAssessments.organisationId, orgId),
          eq(riskAssessments.personId, personId),
          eq(riskAssessments.status, 'completed'),
          or(
            eq(riskAssessments.riskLevel, 'high'),
            eq(riskAssessments.riskLevel, 'critical'),
          ),
        ),
      ),
    // Open incidents (not closed)
    db
      .select({ count: count() })
      .from(incidents)
      .where(
        and(
          eq(incidents.organisationId, orgId),
          eq(incidents.personId, personId),
          or(
            eq(incidents.status, 'reported'),
            eq(incidents.status, 'under_review'),
            eq(incidents.status, 'investigating'),
            eq(incidents.status, 'resolved'),
          ),
        ),
      ),
  ]);

  return {
    activeCarePlans: carePlanCount[0]?.count ?? 0,
    recentNotes: noteCount[0]?.count ?? 0,
    openHighRiskAssessments: riskCount[0]?.count ?? 0,
    openIncidents: incidentCount[0]?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Unified timeline — aggregates events from all feature modules
// ---------------------------------------------------------------------------

export async function getUnifiedTimeline({
  personId,
  page = 1,
  pageSize = 20,
  dateFrom,
  dateTo,
  types,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  types?: string[];
}): Promise<TimelineResult> {
  const { orgId } = await requirePermission('read', 'persons');

  // We fetch from each source, merge, sort by timestamp, and paginate in memory.
  // For MVP this is efficient enough (typically < 100 items per person).
  // In production, a materialised timeline table would be better.

  const dateFromTs = dateFrom ? new Date(dateFrom) : undefined;
  const dateToTs = dateTo ? (() => { const d = new Date(dateTo); d.setDate(d.getDate() + 1); return d; })() : undefined;

  const allTypes = types && types.length > 0
    ? new Set(types)
    : new Set(['care_note', 'care_plan', 'risk_assessment', 'incident', 'document']);

  const entries: TimelineEntry[] = [];

  // Fetch from each source in parallel
  const fetches: Promise<void>[] = [];

  if (allTypes.has('care_note')) {
    fetches.push(
      (async () => {
        const conditions = [
          eq(careNotes.organisationId, orgId),
          eq(careNotes.personId, personId),
        ];
        if (dateFromTs) conditions.push(gte(careNotes.createdAt, dateFromTs));
        const rows = await db
          .select({
            id: careNotes.id,
            noteType: careNotes.noteType,
            content: careNotes.content,
            authorName: careNotes.authorName,
            shift: careNotes.shift,
            mood: careNotes.mood,
            createdAt: careNotes.createdAt,
          })
          .from(careNotes)
          .where(and(...conditions))
          .orderBy(desc(careNotes.createdAt))
          .limit(50);

        for (const r of rows) {
          if (dateToTs && r.createdAt > dateToTs) continue;
          entries.push({
            id: r.id,
            type: 'care_note',
            title: `${r.noteType.charAt(0).toUpperCase() + r.noteType.slice(1)} note`,
            description: r.content.length > 120 ? r.content.slice(0, 120) + '...' : r.content,
            timestamp: r.createdAt,
            metadata: {
              noteType: r.noteType,
              authorName: r.authorName,
              shift: r.shift,
              mood: r.mood,
            },
          });
        }
      })(),
    );
  }

  if (allTypes.has('care_plan')) {
    fetches.push(
      (async () => {
        const conditions = [
          eq(carePlans.organisationId, orgId),
          eq(carePlans.personId, personId),
          isNull(carePlans.deletedAt),
        ];
        if (dateFromTs) conditions.push(gte(carePlans.updatedAt, dateFromTs));
        const rows = await db
          .select({
            id: carePlans.id,
            title: carePlans.title,
            status: carePlans.status,
            version: carePlans.version,
            updatedAt: carePlans.updatedAt,
          })
          .from(carePlans)
          .where(and(...conditions))
          .orderBy(desc(carePlans.updatedAt))
          .limit(50);

        for (const r of rows) {
          if (dateToTs && r.updatedAt > dateToTs) continue;
          entries.push({
            id: r.id,
            type: 'care_plan',
            title: r.title,
            description: `Care plan ${r.status} (v${r.version})`,
            timestamp: r.updatedAt,
            metadata: {
              status: r.status,
              version: r.version,
            },
          });
        }
      })(),
    );
  }

  if (allTypes.has('risk_assessment')) {
    fetches.push(
      (async () => {
        const conditions = [
          eq(riskAssessments.organisationId, orgId),
          eq(riskAssessments.personId, personId),
        ];
        if (dateFromTs) conditions.push(gte(riskAssessments.updatedAt, dateFromTs));
        const rows = await db
          .select({
            id: riskAssessments.id,
            templateId: riskAssessments.templateId,
            riskLevel: riskAssessments.riskLevel,
            totalScore: riskAssessments.totalScore,
            status: riskAssessments.status,
            completedByName: riskAssessments.completedByName,
            updatedAt: riskAssessments.updatedAt,
          })
          .from(riskAssessments)
          .where(and(...conditions))
          .orderBy(desc(riskAssessments.updatedAt))
          .limit(50);

        for (const r of rows) {
          if (dateToTs && r.updatedAt > dateToTs) continue;
          entries.push({
            id: r.id,
            type: 'risk_assessment',
            title: `${r.templateId.replace(/_/g, ' ')} assessment`,
            description: `${r.status} - ${r.riskLevel} risk (score: ${r.totalScore})`,
            timestamp: r.updatedAt,
            metadata: {
              templateId: r.templateId,
              riskLevel: r.riskLevel,
              totalScore: r.totalScore,
              status: r.status,
              completedByName: r.completedByName,
            },
          });
        }
      })(),
    );
  }

  if (allTypes.has('incident')) {
    fetches.push(
      (async () => {
        const conditions = [
          eq(incidents.organisationId, orgId),
          eq(incidents.personId, personId),
        ];
        if (dateFromTs) conditions.push(gte(incidents.dateTime, dateFromTs));
        const rows = await db
          .select({
            id: incidents.id,
            description: incidents.description,
            severity: incidents.severity,
            status: incidents.status,
            location: incidents.location,
            reportedByName: incidents.reportedByName,
            dateTime: incidents.dateTime,
          })
          .from(incidents)
          .where(and(...conditions))
          .orderBy(desc(incidents.dateTime))
          .limit(50);

        for (const r of rows) {
          if (dateToTs && r.dateTime > dateToTs) continue;
          entries.push({
            id: r.id,
            type: 'incident',
            title: `${r.severity.charAt(0).toUpperCase() + r.severity.slice(1)} incident`,
            description: r.description.length > 120 ? r.description.slice(0, 120) + '...' : r.description,
            timestamp: r.dateTime,
            metadata: {
              severity: r.severity,
              status: r.status,
              location: r.location,
              reportedByName: r.reportedByName,
            },
          });
        }
      })(),
    );
  }

  if (allTypes.has('document')) {
    fetches.push(
      (async () => {
        const conditions = [
          eq(documents.organisationId, orgId),
          eq(documents.personId, personId),
          isNull(documents.deletedAt),
        ];
        if (dateFromTs) conditions.push(gte(documents.createdAt, dateFromTs));
        const rows = await db
          .select({
            id: documents.id,
            name: documents.name,
            category: documents.category,
            uploadedByName: documents.uploadedByName,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .where(and(...conditions))
          .orderBy(desc(documents.createdAt))
          .limit(50);

        for (const r of rows) {
          if (dateToTs && r.createdAt > dateToTs) continue;
          entries.push({
            id: r.id,
            type: 'document',
            title: r.name,
            description: `${r.category} document uploaded`,
            timestamp: r.createdAt,
            metadata: {
              category: r.category,
              uploadedByName: r.uploadedByName,
            },
          });
        }
      })(),
    );
  }

  await Promise.all(fetches);

  // Sort by timestamp descending
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const totalCount = entries.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const offset = (page - 1) * pageSize;
  const paged = entries.slice(offset, offset + pageSize);

  return {
    entries: paged,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Recent activity — shortcut for dashboard overview (last 5 items)
// ---------------------------------------------------------------------------

export async function getRecentActivity(
  personId: string,
): Promise<TimelineEntry[]> {
  const result = await getUnifiedTimeline({
    personId,
    page: 1,
    pageSize: 5,
  });
  return result.entries;
}
