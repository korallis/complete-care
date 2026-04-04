import { describe, it, expect } from 'vitest';
import {
  DOMAIN_CONFIG,
  buildEmptyPortalView,
  getDomainSectionTitles,
} from '../lib/domain-views';
import type { CareDomain } from '../types';

describe('Domain views', () => {
  describe('DOMAIN_CONFIG', () => {
    it('has configuration for all four care domains', () => {
      expect(DOMAIN_CONFIG.domiciliary_care).toBeDefined();
      expect(DOMAIN_CONFIG.complex_care).toBeDefined();
      expect(DOMAIN_CONFIG.supported_living).toBeDefined();
      expect(DOMAIN_CONFIG.childrens_homes).toBeDefined();
    });

    it('each domain has a label, description, and sections', () => {
      for (const domain of Object.values(DOMAIN_CONFIG)) {
        expect(domain.label).toBeTruthy();
        expect(domain.description).toBeTruthy();
        expect(domain.sections.length).toBeGreaterThan(0);
      }
    });
  });

  describe('buildEmptyPortalView', () => {
    it('builds an empty domiciliary care view', () => {
      const view = buildEmptyPortalView('domiciliary_care');
      expect(view.domain).toBe('domiciliary_care');
      if (view.domain === 'domiciliary_care') {
        expect(view.visitSchedule).toEqual([]);
        expect(view.recentVisitNotes).toEqual([]);
        expect(view.carePlanSummary).toBeNull();
      }
    });

    it('builds an empty complex care view', () => {
      const view = buildEmptyPortalView('complex_care');
      expect(view.domain).toBe('complex_care');
      if (view.domain === 'complex_care') {
        expect(view.clinicalAlerts).toEqual([]);
        expect(view.staffingContinuity).toEqual([]);
        expect(view.protocolHighlights).toEqual([]);
      }
    });

    it('builds an empty supported living view', () => {
      const view = buildEmptyPortalView('supported_living');
      expect(view.domain).toBe('supported_living');
      if (view.domain === 'supported_living') {
        expect(view.goalsProgress).toEqual([]);
        expect(view.communityActivities).toEqual([]);
        expect(view.supportHoursSummary.weeklyAllocated).toBe(0);
        expect(view.supportHoursSummary.weeklyUsed).toBe(0);
      }
    });

    it('builds an empty childrens homes view', () => {
      const view = buildEmptyPortalView('childrens_homes');
      expect(view.domain).toBe('childrens_homes');
      if (view.domain === 'childrens_homes') {
        expect(view.keyWorkerSessions).toEqual([]);
        expect(view.contactSchedule).toEqual([]);
        expect(view.dailyLogHighlights).toEqual([]);
      }
    });
  });

  describe('getDomainSectionTitles', () => {
    const domains: CareDomain[] = [
      'domiciliary_care',
      'complex_care',
      'supported_living',
      'childrens_homes',
    ];

    it('returns three sections for each domain', () => {
      for (const domain of domains) {
        const sections = getDomainSectionTitles(domain);
        expect(sections).toHaveLength(3);
      }
    });

    it('each section has key, title, and description', () => {
      for (const domain of domains) {
        const sections = getDomainSectionTitles(domain);
        for (const section of sections) {
          expect(section.key).toBeTruthy();
          expect(section.title).toBeTruthy();
          expect(section.description).toBeTruthy();
        }
      }
    });

    it('domiciliary care sections match expected keys', () => {
      const sections = getDomainSectionTitles('domiciliary_care');
      expect(sections.map((s) => s.key)).toEqual([
        'visitSchedule',
        'recentVisitNotes',
        'carePlanSummary',
      ]);
    });

    it('supported living sections match expected keys', () => {
      const sections = getDomainSectionTitles('supported_living');
      expect(sections.map((s) => s.key)).toEqual([
        'goalsProgress',
        'communityActivities',
        'supportHoursSummary',
      ]);
    });

    it('complex care sections match expected keys', () => {
      const sections = getDomainSectionTitles('complex_care');
      expect(sections.map((s) => s.key)).toEqual([
        'clinicalAlerts',
        'staffingContinuity',
        'protocolHighlights',
      ]);
    });

    it('childrens homes sections match expected keys', () => {
      const sections = getDomainSectionTitles('childrens_homes');
      expect(sections.map((s) => s.key)).toEqual([
        'keyWorkerSessions',
        'contactSchedule',
        'dailyLogHighlights',
      ]);
    });
  });
});
