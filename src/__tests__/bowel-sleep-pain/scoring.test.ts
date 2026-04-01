/**
 * Comprehensive tests for bowel, sleep, and pain scoring algorithms.
 *
 * Tests:
 * - Abbey Pain Scale scoring and severity classification
 * - PAINAD scoring and severity classification
 * - NRS severity classification
 * - Constipation detection (3-day amber, 5-day red)
 * - Diarrhoea detection (3+ type 6-7 in 24hrs)
 * - Stool colour alerts (black, red-tinged, clay)
 * - Night summary generation
 */

import { describe, it, expect } from 'vitest';
import {
  scoreAbbey,
  getAbbeySeverity,
  scorePainad,
  getPainadSeverity,
  getNrsSeverity,
  getNrsSeverityLabel,
  detectConstipation,
  detectDiarrhoea,
  detectColourAlert,
  generateNightSummary,
} from '@/features/bowel-sleep-pain/scoring';
import type { AbbeyScores, PainadScores } from '@/features/bowel-sleep-pain/scoring';

// ---------------------------------------------------------------------------
// Abbey Pain Scale scoring
// ---------------------------------------------------------------------------

describe('scoreAbbey', () => {
  it('returns 0 with no pain severity for all zeros', () => {
    const scores: AbbeyScores = {
      vocalisation: 0,
      facial_expression: 0,
      body_language: 0,
      behaviour_change: 0,
      physiological_change: 0,
      physical_change: 0,
    };
    const result = scoreAbbey(scores);
    expect(result.totalScore).toBe(0);
    expect(result.severity).toBe('none');
    expect(result.severityLabel).toBe('No Pain');
  });

  it('calculates mild pain (1-7)', () => {
    const scores: AbbeyScores = {
      vocalisation: 1,
      facial_expression: 1,
      body_language: 1,
      behaviour_change: 0,
      physiological_change: 0,
      physical_change: 0,
    };
    const result = scoreAbbey(scores);
    expect(result.totalScore).toBe(3);
    expect(result.severity).toBe('mild');
    expect(result.severityLabel).toBe('Mild Pain');
  });

  it('calculates moderate pain (8-13)', () => {
    const scores: AbbeyScores = {
      vocalisation: 2,
      facial_expression: 2,
      body_language: 2,
      behaviour_change: 1,
      physiological_change: 1,
      physical_change: 0,
    };
    const result = scoreAbbey(scores);
    expect(result.totalScore).toBe(8);
    expect(result.severity).toBe('moderate');
  });

  it('calculates severe pain (14-18)', () => {
    const scores: AbbeyScores = {
      vocalisation: 3,
      facial_expression: 3,
      body_language: 3,
      behaviour_change: 2,
      physiological_change: 2,
      physical_change: 1,
    };
    const result = scoreAbbey(scores);
    expect(result.totalScore).toBe(14);
    expect(result.severity).toBe('severe');
    expect(result.severityLabel).toBe('Severe Pain');
  });

  it('calculates maximum score (18)', () => {
    const scores: AbbeyScores = {
      vocalisation: 3,
      facial_expression: 3,
      body_language: 3,
      behaviour_change: 3,
      physiological_change: 3,
      physical_change: 3,
    };
    const result = scoreAbbey(scores);
    expect(result.totalScore).toBe(18);
    expect(result.severity).toBe('severe');
  });
});

describe('getAbbeySeverity', () => {
  it('returns none for score 0', () => {
    expect(getAbbeySeverity(0)).toBe('none');
  });

  it('returns mild for scores 1-7', () => {
    expect(getAbbeySeverity(1)).toBe('mild');
    expect(getAbbeySeverity(7)).toBe('mild');
  });

  it('returns moderate for scores 8-13', () => {
    expect(getAbbeySeverity(8)).toBe('moderate');
    expect(getAbbeySeverity(13)).toBe('moderate');
  });

  it('returns severe for scores 14-18', () => {
    expect(getAbbeySeverity(14)).toBe('severe');
    expect(getAbbeySeverity(18)).toBe('severe');
  });
});

// ---------------------------------------------------------------------------
// PAINAD scoring
// ---------------------------------------------------------------------------

describe('scorePainad', () => {
  it('returns 0 with no pain severity for all zeros', () => {
    const scores: PainadScores = {
      breathing: 0,
      vocalisation: 0,
      facial_expression: 0,
      body_language: 0,
      consolability: 0,
    };
    const result = scorePainad(scores);
    expect(result.totalScore).toBe(0);
    expect(result.severity).toBe('none');
    expect(result.severityLabel).toBe('No Pain');
  });

  it('calculates mild pain (1-3)', () => {
    const scores: PainadScores = {
      breathing: 1,
      vocalisation: 1,
      facial_expression: 0,
      body_language: 0,
      consolability: 0,
    };
    const result = scorePainad(scores);
    expect(result.totalScore).toBe(2);
    expect(result.severity).toBe('mild');
  });

  it('calculates moderate pain (4-6)', () => {
    const scores: PainadScores = {
      breathing: 1,
      vocalisation: 1,
      facial_expression: 1,
      body_language: 1,
      consolability: 1,
    };
    const result = scorePainad(scores);
    expect(result.totalScore).toBe(5);
    expect(result.severity).toBe('moderate');
  });

  it('calculates severe pain (7-10)', () => {
    const scores: PainadScores = {
      breathing: 2,
      vocalisation: 2,
      facial_expression: 1,
      body_language: 1,
      consolability: 1,
    };
    const result = scorePainad(scores);
    expect(result.totalScore).toBe(7);
    expect(result.severity).toBe('severe');
    expect(result.severityLabel).toBe('Severe Pain');
  });

  it('calculates maximum score (10)', () => {
    const scores: PainadScores = {
      breathing: 2,
      vocalisation: 2,
      facial_expression: 2,
      body_language: 2,
      consolability: 2,
    };
    const result = scorePainad(scores);
    expect(result.totalScore).toBe(10);
    expect(result.severity).toBe('severe');
  });
});

describe('getPainadSeverity', () => {
  it('returns none for score 0', () => {
    expect(getPainadSeverity(0)).toBe('none');
  });

  it('returns mild for scores 1-3', () => {
    expect(getPainadSeverity(1)).toBe('mild');
    expect(getPainadSeverity(3)).toBe('mild');
  });

  it('returns moderate for scores 4-6', () => {
    expect(getPainadSeverity(4)).toBe('moderate');
    expect(getPainadSeverity(6)).toBe('moderate');
  });

  it('returns severe for scores 7-10', () => {
    expect(getPainadSeverity(7)).toBe('severe');
    expect(getPainadSeverity(10)).toBe('severe');
  });
});

// ---------------------------------------------------------------------------
// NRS severity
// ---------------------------------------------------------------------------

describe('getNrsSeverity', () => {
  it('returns none for score 0', () => {
    expect(getNrsSeverity(0)).toBe('none');
  });

  it('returns mild for scores 1-3', () => {
    expect(getNrsSeverity(1)).toBe('mild');
    expect(getNrsSeverity(3)).toBe('mild');
  });

  it('returns moderate for scores 4-6', () => {
    expect(getNrsSeverity(4)).toBe('moderate');
    expect(getNrsSeverity(6)).toBe('moderate');
  });

  it('returns severe for scores 7-10', () => {
    expect(getNrsSeverity(7)).toBe('severe');
    expect(getNrsSeverity(10)).toBe('severe');
  });
});

describe('getNrsSeverityLabel', () => {
  it('returns correct labels', () => {
    expect(getNrsSeverityLabel(0)).toBe('No Pain');
    expect(getNrsSeverityLabel(2)).toBe('Mild Pain');
    expect(getNrsSeverityLabel(5)).toBe('Moderate Pain');
    expect(getNrsSeverityLabel(8)).toBe('Severe Pain');
  });
});

// ---------------------------------------------------------------------------
// Constipation detection
// ---------------------------------------------------------------------------

describe('detectConstipation', () => {
  it('returns red alert when no BM on record', () => {
    const result = detectConstipation(null);
    expect(result.level).toBe('red');
    expect(result.type).toBe('constipation');
    expect(result.message).toContain('No bowel movement on record');
  });

  it('returns red alert for 5+ days without BM', () => {
    const lastBm = new Date('2026-03-25T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z'); // 5 days later
    const result = detectConstipation(lastBm, now);
    expect(result.level).toBe('red');
    expect(result.type).toBe('constipation');
    expect(result.message).toContain('days');
  });

  it('returns amber alert for 3-4 days without BM', () => {
    const lastBm = new Date('2026-03-27T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z'); // 3 days later
    const result = detectConstipation(lastBm, now);
    expect(result.level).toBe('amber');
    expect(result.type).toBe('constipation');
    expect(result.message).toContain('monitor closely');
  });

  it('returns no alert for recent BM (same day)', () => {
    const now = new Date('2026-03-30T12:00:00Z');
    const result = detectConstipation(now, now);
    expect(result.level).toBe('none');
    expect(result.type).toBe('none');
  });

  it('returns no alert for BM 2 days ago', () => {
    const lastBm = new Date('2026-03-28T08:00:00Z');
    const now = new Date('2026-03-30T12:00:00Z');
    const result = detectConstipation(lastBm, now);
    expect(result.level).toBe('none');
  });

  it('uses provided currentTime for comparison', () => {
    const lastBm = new Date('2026-03-25T10:00:00Z');
    const now = new Date('2026-03-30T10:00:00Z'); // 5 days later
    const result = detectConstipation(lastBm, now);
    expect(result.level).toBe('red');
    expect(result.message).toContain('5 days');
  });
});

// ---------------------------------------------------------------------------
// Diarrhoea detection
// ---------------------------------------------------------------------------

describe('detectDiarrhoea', () => {
  it('returns red alert for 3+ type 6-7 stools', () => {
    const result = detectDiarrhoea([6, 7, 6]);
    expect(result.level).toBe('red');
    expect(result.type).toBe('diarrhoea');
    expect(result.message).toContain('3 loose/liquid stools');
  });

  it('returns red alert for 4 type 6-7 stools', () => {
    const result = detectDiarrhoea([6, 7, 6, 7]);
    expect(result.level).toBe('red');
    expect(result.message).toContain('4 loose/liquid stools');
  });

  it('returns no alert for 2 type 6-7 stools', () => {
    const result = detectDiarrhoea([6, 7]);
    expect(result.level).toBe('none');
  });

  it('returns no alert for normal stools', () => {
    const result = detectDiarrhoea([3, 4, 4, 3]);
    expect(result.level).toBe('none');
  });

  it('only counts type 6-7, ignoring other types', () => {
    const result = detectDiarrhoea([1, 2, 3, 4, 5, 6, 7]);
    expect(result.level).toBe('none'); // Only 2 loose stools
  });

  it('returns no alert for empty array', () => {
    const result = detectDiarrhoea([]);
    expect(result.level).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Stool colour alerts
// ---------------------------------------------------------------------------

describe('detectColourAlert', () => {
  it('returns red alert for black stool', () => {
    const result = detectColourAlert('black');
    expect(result.level).toBe('red');
    expect(result.type).toBe('colour');
    expect(result.message).toContain('upper GI bleeding');
  });

  it('returns red alert for red-tinged stool', () => {
    const result = detectColourAlert('red_tinged');
    expect(result.level).toBe('red');
    expect(result.message).toContain('lower GI bleeding');
  });

  it('returns red alert for clay stool', () => {
    const result = detectColourAlert('clay');
    expect(result.level).toBe('red');
    expect(result.message).toContain('biliary obstruction');
  });

  it('returns no alert for normal brown', () => {
    const result = detectColourAlert('brown');
    expect(result.level).toBe('none');
  });

  it('returns no alert for dark brown', () => {
    const result = detectColourAlert('dark_brown');
    expect(result.level).toBe('none');
  });

  it('returns no alert for green', () => {
    const result = detectColourAlert('green');
    expect(result.level).toBe('none');
  });

  it('returns no alert for yellow', () => {
    const result = detectColourAlert('yellow');
    expect(result.level).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Night summary generation
// ---------------------------------------------------------------------------

describe('generateNightSummary', () => {
  it('generates empty summary for no checks', () => {
    const result = generateNightSummary([]);
    expect(result.totalChecks).toBe(0);
    expect(result.summary).toBe('No night checks recorded.');
  });

  it('generates summary for all asleep', () => {
    const checks = [
      { status: 'asleep', nightWandering: false, repositioned: false },
      { status: 'asleep', nightWandering: false, repositioned: false },
      { status: 'asleep', nightWandering: false, repositioned: false },
    ];
    const result = generateNightSummary(checks);
    expect(result.totalChecks).toBe(3);
    expect(result.asleepCount).toBe(3);
    expect(result.summary).toContain('Slept well throughout the night');
  });

  it('generates summary with mixed statuses', () => {
    const checks = [
      { status: 'asleep', nightWandering: false, repositioned: false },
      { status: 'awake', nightWandering: false, repositioned: false },
      { status: 'restless', nightWandering: false, repositioned: true },
      { status: 'asleep', nightWandering: false, repositioned: false },
    ];
    const result = generateNightSummary(checks);
    expect(result.totalChecks).toBe(4);
    expect(result.asleepCount).toBe(2);
    expect(result.awakeCount).toBe(1);
    expect(result.restlessCount).toBe(1);
    expect(result.repositionedCount).toBe(1);
    expect(result.summary).toContain('asleep 2/4');
    expect(result.summary).toContain('awake 1');
    expect(result.summary).toContain('restless 1');
    expect(result.summary).toContain('Repositioned 1 time.');
  });

  it('includes night wandering count', () => {
    const checks = [
      { status: 'out_of_bed', nightWandering: true, repositioned: false },
      { status: 'asleep', nightWandering: false, repositioned: false },
    ];
    const result = generateNightSummary(checks);
    expect(result.nightWanderingCount).toBe(1);
    expect(result.outOfBedCount).toBe(1);
    expect(result.summary).toContain('Night wandering observed 1 time.');
  });

  it('handles single check', () => {
    const result = generateNightSummary([
      { status: 'asleep', nightWandering: false, repositioned: false },
    ]);
    expect(result.totalChecks).toBe(1);
    expect(result.summary).toContain('1 check performed');
  });

  it('pluralises correctly for multiple repositions', () => {
    const checks = [
      { status: 'asleep', nightWandering: false, repositioned: true },
      { status: 'asleep', nightWandering: false, repositioned: true },
      { status: 'asleep', nightWandering: false, repositioned: true },
    ];
    const result = generateNightSummary(checks);
    expect(result.repositionedCount).toBe(3);
    expect(result.summary).toContain('Repositioned 3 times.');
  });
});
