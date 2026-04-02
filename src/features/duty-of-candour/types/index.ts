import type { DutyOfCandourIncident, NewDutyOfCandourIncident } from '@/lib/db/schema';

export type { DutyOfCandourIncident, NewDutyOfCandourIncident };

export type DocIncidentStatus =
  | 'open'
  | 'verbal_given'
  | 'written_sent'
  | 'investigating'
  | 'closed';

export type DocSeverity =
  | 'moderate_harm'
  | 'severe_harm'
  | 'death'
  | 'prolonged_psychological_harm';

export interface DocTimelineStep {
  step: 'verbal' | 'written' | 'investigation' | 'apology';
  completed: boolean;
  date?: string;
  overdue?: boolean;
}
