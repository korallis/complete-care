/**
 * Person Dashboard — Types
 *
 * Timeline entry types for the unified activity timeline that aggregates
 * care notes, care plan changes, risk assessments, incidents, and documents.
 */

export type TimelineEntryType =
  | 'care_note'
  | 'care_plan'
  | 'risk_assessment'
  | 'incident'
  | 'document';

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  title: string;
  description: string;
  /** ISO timestamp for sorting */
  timestamp: Date;
  /** Entity-specific metadata for badges / display */
  metadata: Record<string, string | number | null>;
};

export type DashboardMetrics = {
  activeCarePlans: number;
  recentNotes: number;
  openHighRiskAssessments: number;
  openIncidents: number;
};

export type TimelineResult = {
  entries: TimelineEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
