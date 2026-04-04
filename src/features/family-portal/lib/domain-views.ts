/**
 * Domain-specific view configuration for the family portal.
 * Each care domain surfaces different information relevant to families.
 */
import type {
  CareDomain,
  DomiciliaryPortalView,
  ComplexCarePortalView,
  SupportedLivingPortalView,
  ChildrensHomesPortalView,
  PortalView,
} from '../types';

/** Labels and descriptions for each care domain */
export const DOMAIN_CONFIG: Record<
  CareDomain,
  { label: string; description: string; sections: string[] }
> = {
  domiciliary_care: {
    label: 'Domiciliary Care',
    description: 'Home care visit schedule and notes',
    sections: ['visitSchedule', 'recentVisitNotes', 'carePlanSummary'],
  },
  complex_care: {
    label: 'Complex Care',
    description: 'Clinical alerts, staffing continuity, and protocol highlights',
    sections: ['clinicalAlerts', 'staffingContinuity', 'protocolHighlights'],
  },
  supported_living: {
    label: 'Supported Living',
    description: 'Goals, activities, and support hours',
    sections: ['goalsProgress', 'communityActivities', 'supportHoursSummary'],
  },
  childrens_homes: {
    label: "Children's Home",
    description: 'Key worker sessions, contact schedule, and daily logs',
    sections: ['keyWorkerSessions', 'contactSchedule', 'dailyLogHighlights'],
  },
};

/**
 * Build an empty portal view for a given domain.
 * In production, these would be populated from domain-specific tables.
 */
export function buildEmptyPortalView(domain: CareDomain): PortalView {
  switch (domain) {
    case 'domiciliary_care':
      return {
        domain: 'domiciliary_care',
        visitSchedule: [],
        recentVisitNotes: [],
        carePlanSummary: null,
      } satisfies DomiciliaryPortalView;

    case 'complex_care':
      return {
        domain: 'complex_care',
        clinicalAlerts: [],
        staffingContinuity: [],
        protocolHighlights: [],
      } satisfies ComplexCarePortalView;

    case 'supported_living':
      return {
        domain: 'supported_living',
        goalsProgress: [],
        communityActivities: [],
        supportHoursSummary: {
          weeklyAllocated: 0,
          weeklyUsed: 0,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
        },
      } satisfies SupportedLivingPortalView;

    case 'childrens_homes':
      return {
        domain: 'childrens_homes',
        keyWorkerSessions: [],
        contactSchedule: [],
        dailyLogHighlights: [],
      } satisfies ChildrensHomesPortalView;
  }
}

/**
 * Get the section titles for a domain-specific view.
 */
export function getDomainSectionTitles(
  domain: CareDomain,
): { key: string; title: string; description: string }[] {
  switch (domain) {
    case 'domiciliary_care':
      return [
        {
          key: 'visitSchedule',
          title: 'Visit Schedule',
          description: 'Upcoming and recent care visits',
        },
        {
          key: 'recentVisitNotes',
          title: 'Recent Visit Notes',
          description: 'Notes from recent care visits',
        },
        {
          key: 'carePlanSummary',
          title: 'Care Plan Summary',
          description: 'Current care plan objectives and review dates',
        },
      ];

    case 'complex_care':
      return [
        {
          key: 'clinicalAlerts',
          title: 'Clinical Alerts',
          description: 'Key alerts, escalations, and active clinical watch items',
        },
        {
          key: 'staffingContinuity',
          title: 'Staffing Continuity',
          description: 'Named staff coverage and upcoming continuity check-ins',
        },
        {
          key: 'protocolHighlights',
          title: 'Protocol Highlights',
          description: 'Important protocols, owners, and latest review dates',
        },
      ];

    case 'supported_living':
      return [
        {
          key: 'goalsProgress',
          title: 'Goals Progress',
          description: 'Progress towards personal goals',
        },
        {
          key: 'communityActivities',
          title: 'Community Activities',
          description: 'Upcoming and recent community activities',
        },
        {
          key: 'supportHoursSummary',
          title: 'Support Hours',
          description: 'Weekly support hours allocation and usage',
        },
      ];

    case 'childrens_homes':
      return [
        {
          key: 'keyWorkerSessions',
          title: 'Key Worker Sessions',
          description: 'Recent key worker session summaries',
        },
        {
          key: 'contactSchedule',
          title: 'Contact Schedule',
          description: 'Upcoming family contact sessions',
        },
        {
          key: 'dailyLogHighlights',
          title: 'Daily Log Highlights',
          description: 'Highlights from recent daily logs',
        },
      ];
  }
}
