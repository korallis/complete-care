import { describe, it, expect } from 'vitest';
import {
  reportMedicationErrorSchema,
  updateInvestigationSchema,
  createTopicalMarSchema,
  recordTopicalAdministrationSchema,
  createHomelyRemedyProtocolSchema,
  recordHomelyRemedyAdministrationSchema,
} from './types';

describe('reportMedicationErrorSchema', () => {
  const validError = {
    errorType: 'wrong_dose' as const,
    severity: 'low' as const,
    occurredAt: '2026-04-02T10:00:00.000Z',
    discoveredAt: '2026-04-02T10:30:00.000Z',
    description: 'Patient was given double the prescribed dose of Paracetamol.',
  };

  it('should validate correct error report', () => {
    const result = reportMedicationErrorSchema.safeParse(validError);
    expect(result.success).toBe(true);
  });

  it('should reject invalid error type', () => {
    const result = reportMedicationErrorSchema.safeParse({
      ...validError,
      errorType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid severity', () => {
    const result = reportMedicationErrorSchema.safeParse({
      ...validError,
      severity: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject description shorter than 10 characters', () => {
    const result = reportMedicationErrorSchema.safeParse({
      ...validError,
      description: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional linked records', () => {
    const result = reportMedicationErrorSchema.safeParse({
      ...validError,
      personId: '550e8400-e29b-41d4-a716-446655440000',
      medicationStockId: '550e8400-e29b-41d4-a716-446655440001',
      administrationRecordId: '550e8400-e29b-41d4-a716-446655440002',
      involvedStaffId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateInvestigationSchema', () => {
  it('should validate investigation update', () => {
    const result = updateInvestigationSchema.safeParse({
      investigationStatus: 'under_investigation',
      investigatorId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should validate resolution with findings', () => {
    const result = updateInvestigationSchema.safeParse({
      investigationStatus: 'resolved',
      investigationFindings: 'Staff miscounted tablets during round.',
      rootCause: 'Inadequate lighting at medication trolley.',
      correctiveActions: 'Improved lighting installed. Staff retrained.',
      lessonsLearned: 'Always double-check counts at the trolley.',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid investigation status', () => {
    const result = updateInvestigationSchema.safeParse({
      investigationStatus: 'pending',
    });
    expect(result.success).toBe(false);
  });
});

describe('createTopicalMarSchema', () => {
  const validTopical = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    medicationName: 'Aqueous Cream BP',
    instructions: 'Apply thinly to affected areas twice daily',
    frequency: 'twice_daily' as const,
    startDate: '2026-04-02',
  };

  it('should validate correct topical MAR', () => {
    const result = createTopicalMarSchema.safeParse(validTopical);
    expect(result.success).toBe(true);
  });

  it('should reject invalid frequency', () => {
    const result = createTopicalMarSchema.safeParse({
      ...validTopical,
      frequency: 'every_5_minutes',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date format', () => {
    const result = createTopicalMarSchema.safeParse({
      ...validTopical,
      startDate: '02/04/2026',
    });
    expect(result.success).toBe(false);
  });
});

describe('recordTopicalAdministrationSchema', () => {
  const validAdmin = {
    topicalMarId: '550e8400-e29b-41d4-a716-446655440000',
    administeredAt: '2026-04-02T09:00:00.000Z',
    status: 'applied' as const,
    applicationSite: 'Left forearm, inner aspect',
  };

  it('should validate correct topical administration', () => {
    const result = recordTopicalAdministrationSchema.safeParse(validAdmin);
    expect(result.success).toBe(true);
  });

  it('should accept body map data', () => {
    const result = recordTopicalAdministrationSchema.safeParse({
      ...validAdmin,
      bodyMapData: {
        sites: [
          { region: 'left_arm', x: 120, y: 340, description: 'Inner forearm' },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should accept refusal status', () => {
    const result = recordTopicalAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'refused',
    });
    expect(result.success).toBe(true);
  });
});

describe('createHomelyRemedyProtocolSchema', () => {
  const validProtocol = {
    medicationName: 'Paracetamol',
    form: 'tablet',
    strength: '500mg',
    indication: 'Mild to moderate pain or fever',
    dosageInstructions: '1-2 tablets every 4-6 hours as needed',
    maxDose24Hours: '8 tablets (4g)',
    approvedBy: 'Dr Smith',
    approvedDate: '2026-04-01',
  };

  it('should validate correct protocol', () => {
    const result = createHomelyRemedyProtocolSchema.safeParse(validProtocol);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = createHomelyRemedyProtocolSchema.safeParse({
      medicationName: 'Paracetamol',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional clinical details', () => {
    const result = createHomelyRemedyProtocolSchema.safeParse({
      ...validProtocol,
      contraindications: 'Liver disease, alcohol dependence',
      sideEffects: 'Rare: skin rash, blood disorders',
      interactions: 'Warfarin — may enhance anticoagulant effect',
      maxDurationDays: 3,
      reviewDate: '2027-04-01',
    });
    expect(result.success).toBe(true);
  });
});

describe('recordHomelyRemedyAdministrationSchema', () => {
  const validAdmin = {
    protocolId: '550e8400-e29b-41d4-a716-446655440000',
    personId: '550e8400-e29b-41d4-a716-446655440001',
    administeredAt: '2026-04-02T14:00:00.000Z',
    doseGiven: '2 tablets (1g)',
    reason: 'Headache reported by service user',
  };

  it('should validate correct administration', () => {
    const result = recordHomelyRemedyAdministrationSchema.safeParse(validAdmin);
    expect(result.success).toBe(true);
  });

  it('should reject missing reason', () => {
    const { reason: _reason, ...noReason } = validAdmin;
    const result = recordHomelyRemedyAdministrationSchema.safeParse(noReason);
    expect(result.success).toBe(false);
  });

  it('should accept outcome and GP notification', () => {
    const result = recordHomelyRemedyAdministrationSchema.safeParse({
      ...validAdmin,
      outcome: 'Headache resolved within 30 minutes',
      gpInformed: true,
      notes: 'Third dose in 48 hours — GP informed as per protocol',
    });
    expect(result.success).toBe(true);
  });
});
