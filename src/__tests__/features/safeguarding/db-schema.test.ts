/**
 * Safeguarding Drizzle schema definition tests.
 * Verifies table structure, column types, indexes, and constraints.
 * These tests operate on schema objects in memory — no database connection needed.
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  safeguardingConcerns,
  concernCorrections,
  dslReviews,
  ladoReferrals,
  section47Investigations,
  mashReferrals,
  safeguardingChronology,
  CONCERN_SEVERITIES,
  DSL_DECISIONS,
  LADO_STATUSES,
  LADO_OUTCOMES,
  CHRONOLOGY_SOURCES,
} from '@/lib/db/schema/safeguarding';
import {
  safeguardingConcernsRelations,
  concernCorrectionsRelations,
  dslReviewsRelations,
  ladoReferralsRelations,
  section47InvestigationsRelations,
  mashReferralsRelations,
  safeguardingChronologyRelations,
} from '@/lib/db/schema/relations';
import type {
  SafeguardingConcern,
} from '@/lib/db/schema/safeguarding';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('safeguarding constants', () => {
  it('CONCERN_SEVERITIES has 4 levels', () => {
    expect(CONCERN_SEVERITIES).toHaveLength(4);
    expect(CONCERN_SEVERITIES).toContain('low');
    expect(CONCERN_SEVERITIES).toContain('critical');
  });

  it('DSL_DECISIONS has 4 decision pathways', () => {
    expect(DSL_DECISIONS).toHaveLength(4);
    expect(DSL_DECISIONS).toContain('internal_monitoring');
    expect(DSL_DECISIONS).toContain('refer_to_mash');
    expect(DSL_DECISIONS).toContain('refer_to_lado');
    expect(DSL_DECISIONS).toContain('refer_to_police');
  });

  it('LADO_STATUSES tracks investigation lifecycle', () => {
    expect(LADO_STATUSES).toContain('allegation_received');
    expect(LADO_STATUSES).toContain('outcome_reached');
    expect(LADO_STATUSES).toContain('closed');
  });

  it('LADO_OUTCOMES has 5 possible outcomes', () => {
    expect(LADO_OUTCOMES).toHaveLength(5);
  });

  it('CHRONOLOGY_SOURCES covers all record types', () => {
    expect(CHRONOLOGY_SOURCES).toContain('concern');
    expect(CHRONOLOGY_SOURCES).toContain('dsl_review');
    expect(CHRONOLOGY_SOURCES).toContain('mash_referral');
    expect(CHRONOLOGY_SOURCES).toContain('lado_referral');
    expect(CHRONOLOGY_SOURCES).toContain('section_47');
    expect(CHRONOLOGY_SOURCES).toContain('incident');
    expect(CHRONOLOGY_SOURCES).toContain('missing_episode');
    expect(CHRONOLOGY_SOURCES).toContain('manual');
  });
});

// ---------------------------------------------------------------------------
// safeguarding_concerns
// ---------------------------------------------------------------------------

describe('safeguardingConcerns schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(safeguardingConcerns)).toBe('safeguarding_concerns');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(safeguardingConcerns);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'childId',
        'reportedById',
        'observedAt',
        'verbatimAccount',
        'description',
        'childPresentation',
        'bodyMapId',
        'severity',
        'status',
        'referenceNumber',
        'createdAt',
      ]),
    );
  });

  it('id is uuid primary key with defaultRandom', () => {
    expect(safeguardingConcerns.id.columnType).toBe('PgUUID');
    expect(safeguardingConcerns.id.primary).toBe(true);
    expect(safeguardingConcerns.id.hasDefault).toBe(true);
  });

  it('organisationId is not null (tenant isolation)', () => {
    expect(safeguardingConcerns.organisationId.notNull).toBe(true);
  });

  it('childId is not null', () => {
    expect(safeguardingConcerns.childId.notNull).toBe(true);
  });

  it('reportedById is not null', () => {
    expect(safeguardingConcerns.reportedById.notNull).toBe(true);
  });

  it('description is not null', () => {
    expect(safeguardingConcerns.description.notNull).toBe(true);
  });

  it('verbatimAccount is nullable (optional)', () => {
    expect(safeguardingConcerns.verbatimAccount.notNull).toBeFalsy();
  });

  it('severity defaults to medium', () => {
    expect(safeguardingConcerns.severity.default).toBe('medium');
  });

  it('status defaults to open', () => {
    expect(safeguardingConcerns.status.default).toBe('open');
  });

  it('referenceNumber is not null', () => {
    expect(safeguardingConcerns.referenceNumber.notNull).toBe(true);
  });

  it('exports inferred types', () => {
    const concern: SafeguardingConcern = {
      id: 'uuid',
      organisationId: 'org-uuid',
      childId: 'child-uuid',
      reportedById: 'user-uuid',
      observedAt: new Date(),
      verbatimAccount: null,
      description: 'Test concern',
      childPresentation: null,
      bodyMapId: null,
      severity: 'high',
      status: 'open',
      location: null,
      category: null,
      witnesses: null,
      immediateActions: null,
      referenceNumber: 'SC-20260401-1234',
      createdAt: new Date(),
    };
    expect(concern.id).toBe('uuid');
  });
});

// ---------------------------------------------------------------------------
// concern_corrections
// ---------------------------------------------------------------------------

describe('concernCorrections schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(concernCorrections)).toBe('concern_corrections');
  });

  it('has organisationId for tenant isolation', () => {
    expect(concernCorrections.organisationId.notNull).toBe(true);
  });

  it('concernId is not null', () => {
    expect(concernCorrections.concernId.notNull).toBe(true);
  });

  it('fieldName and correctedValue are not null', () => {
    expect(concernCorrections.fieldName.notNull).toBe(true);
    expect(concernCorrections.correctedValue.notNull).toBe(true);
  });

  it('reason is not null', () => {
    expect(concernCorrections.reason.notNull).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// dsl_reviews
// ---------------------------------------------------------------------------

describe('dslReviews schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(dslReviews)).toBe('dsl_reviews');
  });

  it('has organisationId for tenant isolation', () => {
    expect(dslReviews.organisationId.notNull).toBe(true);
  });

  it('decision and rationale are not null', () => {
    expect(dslReviews.decision.notNull).toBe(true);
    expect(dslReviews.rationale.notNull).toBe(true);
  });

  it('referral fields are nullable (only for external referrals)', () => {
    expect(dslReviews.referralDate.notNull).toBeFalsy();
    expect(dslReviews.referralAgency.notNull).toBeFalsy();
    expect(dslReviews.referralReference.notNull).toBeFalsy();
    expect(dslReviews.expectedResponseDate.notNull).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// lado_referrals
// ---------------------------------------------------------------------------

describe('ladoReferrals schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(ladoReferrals)).toBe('lado_referrals');
  });

  it('has organisationId for tenant isolation', () => {
    expect(ladoReferrals.organisationId.notNull).toBe(true);
  });

  it('isRestricted defaults to true', () => {
    expect(ladoReferrals.isRestricted.default).toBe(true);
  });

  it('allegationDetails and allegationAgainstStaffName are not null', () => {
    expect(ladoReferrals.allegationDetails.notNull).toBe(true);
    expect(ladoReferrals.allegationAgainstStaffName.notNull).toBe(true);
  });

  it('status defaults to allegation_received', () => {
    expect(ladoReferrals.status.default).toBe('allegation_received');
  });

  it('outcome is nullable', () => {
    expect(ladoReferrals.outcome.notNull).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// section_47_investigations
// ---------------------------------------------------------------------------

describe('section47Investigations schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(section47Investigations)).toBe(
      'section_47_investigations',
    );
  });

  it('has organisationId for tenant isolation', () => {
    expect(section47Investigations.organisationId.notNull).toBe(true);
  });

  it('status defaults to strategy_meeting_scheduled', () => {
    expect(section47Investigations.status.default).toBe(
      'strategy_meeting_scheduled',
    );
  });

  it('strategyMeetingAttendees is jsonb', () => {
    expect(section47Investigations.strategyMeetingAttendees.columnType).toBe(
      'PgJsonb',
    );
  });
});

// ---------------------------------------------------------------------------
// mash_referrals
// ---------------------------------------------------------------------------

describe('mashReferrals schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(mashReferrals)).toBe('mash_referrals');
  });

  it('has organisationId for tenant isolation', () => {
    expect(mashReferrals.organisationId.notNull).toBe(true);
  });

  it('status defaults to submitted', () => {
    expect(mashReferrals.status.default).toBe('submitted');
  });

  it('referralReason is not null', () => {
    expect(mashReferrals.referralReason.notNull).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// safeguarding_chronology
// ---------------------------------------------------------------------------

describe('safeguardingChronology schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(safeguardingChronology)).toBe(
      'safeguarding_chronology',
    );
  });

  it('has organisationId for tenant isolation', () => {
    expect(safeguardingChronology.organisationId.notNull).toBe(true);
  });

  it('isManual defaults to false', () => {
    expect(safeguardingChronology.isManual.default).toBe(false);
  });

  it('isRestricted defaults to false', () => {
    expect(safeguardingChronology.isRestricted.default).toBe(false);
  });

  it('source is not null', () => {
    expect(safeguardingChronology.source.notNull).toBe(true);
  });

  it('title and description are not null', () => {
    expect(safeguardingChronology.title.notNull).toBe(true);
    expect(safeguardingChronology.description.notNull).toBe(true);
  });

  it('createdById is nullable (system-generated entries)', () => {
    expect(safeguardingChronology.createdById.notNull).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

describe('safeguarding relations', () => {
  it('safeguardingConcernsRelations is defined', () => {
    expect(safeguardingConcernsRelations).toBeDefined();
  });

  it('concernCorrectionsRelations is defined', () => {
    expect(concernCorrectionsRelations).toBeDefined();
  });

  it('dslReviewsRelations is defined', () => {
    expect(dslReviewsRelations).toBeDefined();
  });

  it('ladoReferralsRelations is defined', () => {
    expect(ladoReferralsRelations).toBeDefined();
  });

  it('section47InvestigationsRelations is defined', () => {
    expect(section47InvestigationsRelations).toBeDefined();
  });

  it('mashReferralsRelations is defined', () => {
    expect(mashReferralsRelations).toBeDefined();
  });

  it('safeguardingChronologyRelations is defined', () => {
    expect(safeguardingChronologyRelations).toBeDefined();
  });
});
