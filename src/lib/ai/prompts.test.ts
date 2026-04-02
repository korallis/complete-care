import { describe, it, expect } from 'vitest';
import {
  expandNotePrompt,
  correctGrammarPrompt,
  shiftSummaryPrompt,
  riskPredictionPrompt,
  complianceGapPrompt,
  inspectionReadinessPrompt,
} from './prompts';

describe('AI Prompt Templates', () => {
  describe('expandNotePrompt', () => {
    it('includes the brief note text', () => {
      const result = expandNotePrompt('Patient ate breakfast', 'professional');
      expect(result).toContain('Patient ate breakfast');
    });

    it('includes professional tone instructions', () => {
      const result = expandNotePrompt('note', 'professional');
      expect(result).toContain('professional');
    });

    it('includes warm tone instructions', () => {
      const result = expandNotePrompt('note', 'warm');
      expect(result).toContain('warm');
      expect(result).toContain('compassion');
    });

    it('includes clinical tone instructions', () => {
      const result = expandNotePrompt('note', 'clinical');
      expect(result).toContain('clinical terminology');
    });

    it('includes person-centred language guidance', () => {
      const result = expandNotePrompt('note', 'professional');
      expect(result).toContain('person-centred');
    });
  });

  describe('correctGrammarPrompt', () => {
    it('includes the text to correct', () => {
      const result = correctGrammarPrompt('the patient was sleepin good');
      expect(result).toContain('the patient was sleepin good');
    });

    it('specifies British English', () => {
      const result = correctGrammarPrompt('text');
      expect(result).toContain('British English');
    });
  });

  describe('shiftSummaryPrompt', () => {
    it('formats notes with time and author', () => {
      const result = shiftSummaryPrompt([
        { time: '08:00', author: 'Jane', content: 'Morning check completed' },
        { time: '12:00', author: 'John', content: 'Lunch served' },
      ]);
      expect(result).toContain('[08:00] Jane: Morning check completed');
      expect(result).toContain('[12:00] John: Lunch served');
    });

    it('includes handover structure sections', () => {
      const result = shiftSummaryPrompt([
        { time: '08:00', author: 'Jane', content: 'note' },
      ]);
      expect(result).toContain('Key Events');
      expect(result).toContain('Handover Actions');
    });
  });

  describe('riskPredictionPrompt', () => {
    it('includes care notes and incidents', () => {
      const result = riskPredictionPrompt(
        ['Resident fell twice this week'],
        ['Fall incident 12/03'],
      );
      expect(result).toContain('Resident fell twice this week');
      expect(result).toContain('Fall incident 12/03');
    });

    it('requests JSON output format', () => {
      const result = riskPredictionPrompt(['note'], []);
      expect(result).toContain('JSON');
      expect(result).toContain('"risks"');
    });
  });

  describe('complianceGapPrompt', () => {
    it('includes documentation inventory', () => {
      const result = complianceGapPrompt(
        [{ type: 'Care Plan', status: 'Complete', lastReviewed: '2025-01-15' }],
        'CQC',
      );
      expect(result).toContain('Care Plan');
      expect(result).toContain('Complete');
      expect(result).toContain('2025-01-15');
    });

    it('references the specified framework', () => {
      const result = complianceGapPrompt(
        [{ type: 'Risk Assessment', status: 'Draft' }],
        'Ofsted',
      );
      expect(result).toContain('Ofsted');
    });
  });

  describe('inspectionReadinessPrompt', () => {
    it('includes all metrics', () => {
      const result = inspectionReadinessPrompt({
        totalDocuments: 50,
        completeDocuments: 40,
        overdueReviews: 5,
        outstandingActions: 3,
        recentIncidents: 2,
        staffTrainingCompliance: 85,
      });
      expect(result).toContain('50');
      expect(result).toContain('40');
      expect(result).toContain('5');
      expect(result).toContain('85');
    });

    it('references CQC/Ofsted rating descriptors', () => {
      const result = inspectionReadinessPrompt({
        totalDocuments: 10,
        completeDocuments: 8,
        overdueReviews: 1,
        outstandingActions: 0,
        recentIncidents: 0,
        staffTrainingCompliance: 95,
      });
      expect(result).toContain('CQC/Ofsted');
    });
  });
});
