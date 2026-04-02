/**
 * MCA & DoLS schema definition tests — verify table structure, column types, indexes.
 * Operates on schema objects in memory (no database connection required).
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  mcaAssessments,
  bestInterestDecisions,
  lpaAdrtRecords,
  dolsApplications,
  dolsRestrictions,
  mcaAssessmentsRelations,
  bestInterestDecisionsRelations,
  lpaAdrtRecordsRelations,
  dolsApplicationsRelations,
  dolsRestrictionsRelations,
} from '../../../lib/db/schema';
import type {
  McaAssessment,
  NewMcaAssessment,
  BestInterestDecision,
  LpaAdrtRecord,
  DolsApplication,
  DolsRestriction,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// mcaAssessments
// ---------------------------------------------------------------------------

describe('mcaAssessments schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(mcaAssessments)).toBe('mca_assessments');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(mcaAssessments);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'decisionToBeAssessed',
        'assessorId',
        'diagnosticTestResult',
        'diagnosticTestEvidence',
        'canUnderstand',
        'canUnderstandEvidence',
        'canRetain',
        'canRetainEvidence',
        'canUseOrWeigh',
        'canUseOrWeighEvidence',
        'canCommunicate',
        'canCommunicateEvidence',
        'supportStepsTaken',
        'outcome',
        'assessmentDate',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id is uuid primary key', () => {
    expect(mcaAssessments.id.columnType).toBe('PgUUID');
    expect(mcaAssessments.id.primary).toBe(true);
    expect(mcaAssessments.id.hasDefault).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(mcaAssessments.organisationId.notNull).toBe(true);
  });

  it('diagnosticTestResult is boolean not null', () => {
    expect(mcaAssessments.diagnosticTestResult.columnType).toBe('PgBoolean');
    expect(mcaAssessments.diagnosticTestResult.notNull).toBe(true);
  });

  it('functional test fields are nullable (only required when diagnostic = true)', () => {
    expect(mcaAssessments.canUnderstand.notNull).toBeFalsy();
    expect(mcaAssessments.canRetain.notNull).toBeFalsy();
    expect(mcaAssessments.canUseOrWeigh.notNull).toBeFalsy();
    expect(mcaAssessments.canCommunicate.notNull).toBeFalsy();
  });

  it('outcome is text not null', () => {
    expect(mcaAssessments.outcome.notNull).toBe(true);
  });

  it('exports type aliases (compile-time check)', () => {
    const assessment: McaAssessment = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      decisionToBeAssessed: 'Whether to move',
      assessorId: 'assessor-uuid',
      diagnosticTestResult: true,
      diagnosticTestEvidence: 'Evidence',
      canUnderstand: false,
      canUnderstandEvidence: 'Evidence',
      canRetain: true,
      canRetainEvidence: 'Evidence',
      canUseOrWeigh: true,
      canUseOrWeighEvidence: 'Evidence',
      canCommunicate: true,
      canCommunicateEvidence: 'Evidence',
      supportStepsTaken: 'Steps',
      outcome: 'lacks_capacity',
      assessmentDate: new Date(),
      reviewDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(assessment.outcome).toBe('lacks_capacity');

    const newAssessment: NewMcaAssessment = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      decisionToBeAssessed: 'Test',
      assessorId: 'assessor-uuid',
      diagnosticTestResult: false,
      diagnosticTestEvidence: 'No impairment',
      supportStepsTaken: 'Steps',
      outcome: 'has_capacity',
      assessmentDate: new Date(),
    };
    expect(newAssessment.outcome).toBe('has_capacity');
  });
});

// ---------------------------------------------------------------------------
// bestInterestDecisions
// ---------------------------------------------------------------------------

describe('bestInterestDecisions schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(bestInterestDecisions)).toBe('best_interest_decisions');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(bestInterestDecisions);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'mcaAssessmentId',
        'personId',
        'decisionBeingMade',
        'personsConsulted',
        'personWishesFeelingsBeliefs',
        'lessRestrictiveOptionsConsidered',
        'decisionReached',
        'decisionMakerName',
        'decisionMakerRole',
        'decisionDate',
      ]),
    );
  });

  it('mcaAssessmentId is not null (must be linked to an MCA)', () => {
    expect(bestInterestDecisions.mcaAssessmentId.notNull).toBe(true);
  });

  it('personsConsulted is jsonb not null', () => {
    expect(bestInterestDecisions.personsConsulted.columnType).toBe('PgJsonb');
    expect(bestInterestDecisions.personsConsulted.notNull).toBe(true);
  });

  it('exports type aliases (compile-time check)', () => {
    const decision: BestInterestDecision = {
      id: 'uuid',
      organisationId: 'org-uuid',
      mcaAssessmentId: 'mca-uuid',
      personId: 'person-uuid',
      decisionBeingMade: 'Move to care home',
      personsConsulted: [{ name: 'Jane', role: 'Daughter', relationship: 'Next of kin', views: 'Agrees' }],
      personWishesFeelingsBeliefs: 'Wishes to stay home',
      lessRestrictiveOptionsConsidered: 'Domiciliary care',
      decisionReached: 'Move is in best interest',
      decisionMakerName: 'Dr Smith',
      decisionMakerRole: 'Consultant',
      decisionDate: new Date(),
      reviewDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(decision.decisionBeingMade).toBe('Move to care home');
  });
});

// ---------------------------------------------------------------------------
// lpaAdrtRecords
// ---------------------------------------------------------------------------

describe('lpaAdrtRecords schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(lpaAdrtRecords)).toBe('lpa_adrt_records');
  });

  it('isActive defaults to true', () => {
    expect(lpaAdrtRecords.isActive.default).toBe(true);
  });

  it('exports type aliases (compile-time check)', () => {
    const record: LpaAdrtRecord = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      recordType: 'lpa_health',
      isActive: true,
      details: 'Attorney: John Smith',
      registeredDate: '2025-01-01',
      conditions: null,
      documentReference: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(record.recordType).toBe('lpa_health');
  });
});

// ---------------------------------------------------------------------------
// dolsApplications
// ---------------------------------------------------------------------------

describe('dolsApplications schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(dolsApplications)).toBe('dols_applications');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(dolsApplications);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'managingAuthority',
        'supervisoryBody',
        'laReferenceNumber',
        'applicationDate',
        'reason',
        'restrictions',
        'linkedMcaId',
        'linkedBestInterestId',
        'personsRepresentative',
        'imcaInstructed',
        'status',
        'authorisationStartDate',
        'authorisationEndDate',
        'conditions',
        'reviewDate',
        'expiryAlertDays',
      ]),
    );
  });

  it('status defaults to "applied"', () => {
    expect(dolsApplications.status.default).toBe('applied');
  });

  it('imcaInstructed defaults to false', () => {
    expect(dolsApplications.imcaInstructed.default).toBe(false);
  });

  it('expiryAlertDays defaults to 28', () => {
    expect(dolsApplications.expiryAlertDays.default).toBe(28);
  });

  it('authorisation dates are nullable', () => {
    expect(dolsApplications.authorisationStartDate.notNull).toBeFalsy();
    expect(dolsApplications.authorisationEndDate.notNull).toBeFalsy();
  });

  it('exports type aliases (compile-time check)', () => {
    const app: DolsApplication = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      managingAuthority: 'Care Home Ltd',
      supervisoryBody: 'Birmingham CC',
      laReferenceNumber: 'DOLS-2026-001',
      applicationDate: '2026-01-10',
      reason: 'Continuous supervision',
      restrictions: 'Locked doors',
      linkedMcaId: null,
      linkedBestInterestId: null,
      personsRepresentative: 'Jane Doe',
      imcaInstructed: false,
      status: 'applied',
      authorisationStartDate: null,
      authorisationEndDate: null,
      conditions: null,
      reviewDate: null,
      expiryAlertDays: 28,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(app.status).toBe('applied');
  });
});

// ---------------------------------------------------------------------------
// dolsRestrictions
// ---------------------------------------------------------------------------

describe('dolsRestrictions schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(dolsRestrictions)).toBe('dols_restrictions');
  });

  it('isActive defaults to true', () => {
    expect(dolsRestrictions.isActive.default).toBe(true);
  });

  it('dolsApplicationId is not null', () => {
    expect(dolsRestrictions.dolsApplicationId.notNull).toBe(true);
  });

  it('exports type aliases (compile-time check)', () => {
    const restriction: DolsRestriction = {
      id: 'uuid',
      organisationId: 'org-uuid',
      dolsApplicationId: 'dols-uuid',
      personId: 'person-uuid',
      restrictionType: 'Locked doors',
      description: 'Front door locked',
      justification: 'Wandering risk',
      isActive: true,
      startDate: '2026-01-15',
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(restriction.restrictionType).toBe('Locked doors');
  });
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

describe('MCA/DoLS relations', () => {
  it('mcaAssessmentsRelations is defined', () => {
    expect(mcaAssessmentsRelations).toBeDefined();
  });

  it('bestInterestDecisionsRelations is defined', () => {
    expect(bestInterestDecisionsRelations).toBeDefined();
  });

  it('lpaAdrtRecordsRelations is defined', () => {
    expect(lpaAdrtRecordsRelations).toBeDefined();
  });

  it('dolsApplicationsRelations is defined', () => {
    expect(dolsApplicationsRelations).toBeDefined();
  });

  it('dolsRestrictionsRelations is defined', () => {
    expect(dolsRestrictionsRelations).toBeDefined();
  });
});
