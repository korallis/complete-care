import { describe, expect, it } from 'vitest';
import {
  buildLeavingCareChecklist,
  buildPathwayPlanAlerts,
  calculateAge,
  calculateAssessmentReadiness,
  sortChronologyEntries,
} from '../helpers';

describe('reg44 helpers', () => {
  it('calculates age from date of birth', () => {
    expect(calculateAge('2008-04-02', new Date('2026-04-02'))).toBe(18);
    expect(calculateAge('2010-04-03', new Date('2026-04-02'))).toBe(15);
  });

  it('calculates readiness percentages across skill domains', () => {
    const readiness = calculateAssessmentReadiness({
      dailyLiving: [{ skill: 'Cooking', rating: 5, notes: '' }],
      financialCapability: [{ skill: 'Budgeting', rating: 4, notes: '' }],
      healthAndWellbeing: [{ skill: 'Health', rating: 3, notes: '' }],
      socialAndRelationships: [{ skill: 'Support', rating: 2, notes: '' }],
      educationAndWork: [{ skill: 'Work', rating: 1, notes: '' }],
      housingKnowledge: [{ skill: 'Tenancy', rating: 5, notes: '' }],
    });

    expect(readiness.overall).toBeGreaterThan(0);
    expect(readiness.domains).toHaveLength(6);
    expect(readiness.domains[0]?.score).toBe(100);
  });

  it('flags upcoming review and missing accommodation evidence', () => {
    const alerts = buildPathwayPlanAlerts({
      person: {
        fullName: 'Alex Johnson',
        dateOfBirth: '2008-08-01',
      },
      plan: {
        sections: {
          accommodation: 'Exploring supported lodgings options',
          education: '',
          employment: '',
          health: '',
          financialSupport: '',
          relationships: '',
          identity: '',
          practicalSkills: '',
        },
        planReviewDate: '2026-04-10',
        status: 'active',
      },
      milestones: [
        {
          title: 'Secure placement',
          status: 'not-started',
          targetDate: '2026-03-01',
        },
      ],
      now: new Date('2026-04-02'),
    });

    expect(alerts.some((alert) => alert.includes('Accommodation'))).toBe(true);
    expect(alerts.some((alert) => alert.includes('review'))).toBe(true);
    expect(alerts.some((alert) => alert.includes('overdue'))).toBe(true);
  });

  it('builds leaving care checklist statuses from plan and person data', () => {
    const checklist = buildLeavingCareChecklist({
      person: {
        gpName: 'Dr Example',
        gpPractice: 'Example Surgery',
        allergies: ['Penicillin'],
        medicalConditions: ['Asthma'],
        emergencyContacts: [
          {
            id: '1',
            name: 'Parent',
            relationship: 'Parent',
            phone: '123',
            priority: 1,
          },
        ],
        address: '1 Example Street',
        nhsNumber: '123-456-7890',
      },
      plan: {
        sections: {
          accommodation: 'Supported lodgings secured for June.',
          education: 'College placement confirmed.',
          employment: 'Weekend volunteering.',
          health: 'GP and dentist registered.',
          financialSupport: 'Budget created and benefits discussed.',
          relationships: 'Emergency contacts shared.',
          identity: 'Passport and NI details checked.',
          practicalSkills: 'Cooking and laundry practice ongoing.',
        },
      },
      readiness: 78,
    });

    expect(checklist.every((item) => item.status !== 'not_started')).toBe(true);
    expect(
      checklist.find((item) => item.key === 'readiness')?.status,
    ).toBe('completed');
  });

  it('sorts chronology entries newest first', () => {
    const sorted = sortChronologyEntries([
      {
        id: 'older',
        date: '2026-01-01',
        source: 'pathway_plan',
        title: 'Plan created',
        description: 'Older event',
      },
      {
        id: 'newer',
        date: '2026-04-01',
        source: 'assessment',
        title: 'Assessment',
        description: 'Newer event',
      },
    ]);

    expect(sorted[0]?.id).toBe('newer');
  });
});
