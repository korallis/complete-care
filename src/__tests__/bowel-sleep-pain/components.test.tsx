/**
 * Tests for bowel, sleep, and pain UI components.
 *
 * Validates:
 * - BristolStoolChart renders all 7 types and handles selection
 * - BowelChart renders records and alerts
 * - NightSummary renders checks and auto-summary
 * - PainTrendChart renders assessments and trend data
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BristolStoolChart } from '@/components/bowel-sleep-pain/bristol-stool-chart';
import { BowelChart } from '@/components/bowel-sleep-pain/bowel-chart';
import { NightSummary } from '@/components/bowel-sleep-pain/night-summary';
import { PainTrendChart } from '@/components/bowel-sleep-pain/pain-trend-chart';

// ---------------------------------------------------------------------------
// BristolStoolChart
// ---------------------------------------------------------------------------

describe('BristolStoolChart', () => {
  it('renders all 7 Bristol types', () => {
    render(<BristolStoolChart value={null} onChange={() => {}} />);
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it('renders type descriptions', () => {
    render(<BristolStoolChart value={null} onChange={() => {}} />);
    expect(screen.getByText('Hard lumps')).toBeDefined();
    expect(screen.getByText('Smooth sausage')).toBeDefined();
    expect(screen.getByText('Liquid')).toBeDefined();
  });

  it('calls onChange when a type is clicked', () => {
    let selected: number | null = null;
    render(
      <BristolStoolChart
        value={null}
        onChange={(type) => {
          selected = type;
        }}
      />,
    );

    // Click on type 4
    const button = screen.getByLabelText(/Bristol type 4/);
    fireEvent.click(button);
    expect(selected).toBe(4);
  });

  it('marks selected type with aria-pressed', () => {
    render(<BristolStoolChart value={3} onChange={() => {}} />);
    const selected = screen.getByLabelText(/Bristol type 3/);
    expect(selected.getAttribute('aria-pressed')).toBe('true');

    const unselected = screen.getByLabelText(/Bristol type 5/);
    expect(unselected.getAttribute('aria-pressed')).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// BowelChart
// ---------------------------------------------------------------------------

describe('BowelChart', () => {
  const noAlert = { level: 'none' as const, type: 'none' as const, message: '' };

  it('renders empty state', () => {
    render(
      <BowelChart
        records={[]}
        constipationAlert={noAlert}
        diarrhoeaAlert={noAlert}
      />,
    );
    expect(screen.getByText(/No bowel records for this day/)).toBeDefined();
  });

  it('renders bowel records with Bristol type badge', () => {
    const records = [
      {
        id: '1',
        bristolType: 4,
        colour: 'brown',
        bloodPresent: false,
        mucusPresent: false,
        laxativeGiven: false,
        laxativeName: null,
        notes: null,
        recordedByName: 'Nurse Jones',
        recordedAt: new Date('2026-04-01T10:00:00Z'),
      },
    ];
    render(
      <BowelChart
        records={records}
        constipationAlert={noAlert}
        diarrhoeaAlert={noAlert}
      />,
    );
    expect(screen.getByText(/Type 4/)).toBeDefined();
    expect(screen.getByText(/Nurse Jones/)).toBeDefined();
  });

  it('renders blood and mucus badges', () => {
    const records = [
      {
        id: '1',
        bristolType: 6,
        colour: 'brown',
        bloodPresent: true,
        mucusPresent: true,
        laxativeGiven: false,
        laxativeName: null,
        notes: null,
        recordedByName: null,
        recordedAt: new Date('2026-04-01T10:00:00Z'),
      },
    ];
    render(
      <BowelChart
        records={records}
        constipationAlert={noAlert}
        diarrhoeaAlert={noAlert}
      />,
    );
    expect(screen.getByText('Blood')).toBeDefined();
    expect(screen.getByText('Mucus')).toBeDefined();
  });

  it('renders constipation alert', () => {
    render(
      <BowelChart
        records={[]}
        constipationAlert={{
          level: 'amber',
          type: 'constipation',
          message: 'No bowel movement for 3 days',
        }}
        diarrhoeaAlert={noAlert}
      />,
    );
    expect(screen.getByText(/Amber Alert/)).toBeDefined();
    expect(screen.getByText(/No bowel movement for 3 days/)).toBeDefined();
  });

  it('renders diarrhoea alert', () => {
    render(
      <BowelChart
        records={[]}
        constipationAlert={noAlert}
        diarrhoeaAlert={{
          level: 'red',
          type: 'diarrhoea',
          message: '3 loose stools in 24hrs',
        }}
      />,
    );
    expect(screen.getByText(/Diarrhoea Alert/)).toBeDefined();
  });

  it('renders laxative badge', () => {
    const records = [
      {
        id: '1',
        bristolType: 2,
        colour: 'dark_brown',
        bloodPresent: false,
        mucusPresent: false,
        laxativeGiven: true,
        laxativeName: 'Lactulose 15ml',
        notes: null,
        recordedByName: null,
        recordedAt: new Date('2026-04-01T10:00:00Z'),
      },
    ];
    render(
      <BowelChart
        records={records}
        constipationAlert={noAlert}
        diarrhoeaAlert={noAlert}
      />,
    );
    expect(screen.getByText(/Laxative: Lactulose 15ml/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// NightSummary
// ---------------------------------------------------------------------------

describe('NightSummary', () => {
  it('renders empty state', () => {
    render(<NightSummary checks={[]} />);
    // Text appears in both summary and check list
    const matches = screen.getAllByText(/No night checks recorded/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders sleep checks with status badges', () => {
    const checks = [
      {
        id: '1',
        checkTime: new Date('2026-04-01T22:00:00Z'),
        status: 'asleep',
        position: 'left',
        repositioned: false,
        nightWandering: false,
        bedRails: 'up',
        callBellChecked: true,
        notes: null,
        recordedByName: 'Night Staff',
      },
      {
        id: '2',
        checkTime: new Date('2026-04-02T02:00:00Z'),
        status: 'restless',
        position: 'back',
        repositioned: true,
        nightWandering: false,
        bedRails: 'up',
        callBellChecked: true,
        notes: 'Seemed uncomfortable',
        recordedByName: 'Night Staff',
      },
    ];
    render(<NightSummary checks={checks} />);
    expect(screen.getByText('Asleep')).toBeDefined();
    expect(screen.getByText('Restless')).toBeDefined();
    expect(screen.getByText('Repositioned')).toBeDefined();
    expect(screen.getByText(/Seemed uncomfortable/)).toBeDefined();
  });

  it('renders night wandering badge', () => {
    const checks = [
      {
        id: '1',
        checkTime: new Date('2026-04-01T23:00:00Z'),
        status: 'out_of_bed',
        position: 'sitting',
        repositioned: false,
        nightWandering: true,
        bedRails: 'down',
        callBellChecked: false,
        notes: null,
        recordedByName: null,
      },
    ];
    render(<NightSummary checks={checks} />);
    expect(screen.getByText('Night Wandering')).toBeDefined();
    expect(screen.getByText('Out of Bed')).toBeDefined();
  });

  it('shows auto-generated summary', () => {
    const checks = [
      { id: '1', checkTime: new Date(), status: 'asleep', position: 'left', repositioned: false, nightWandering: false, bedRails: 'up', callBellChecked: true, notes: null, recordedByName: null },
      { id: '2', checkTime: new Date(), status: 'asleep', position: 'right', repositioned: false, nightWandering: false, bedRails: 'up', callBellChecked: true, notes: null, recordedByName: null },
    ];
    render(<NightSummary checks={checks} />);
    expect(screen.getByText(/Slept well throughout the night/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PainTrendChart
// ---------------------------------------------------------------------------

describe('PainTrendChart', () => {
  it('renders empty state', () => {
    render(<PainTrendChart assessments={[]} trendData={[]} />);
    expect(screen.getByText(/No pain assessments recorded/)).toBeDefined();
  });

  it('renders assessment list', () => {
    const assessments = [
      {
        id: '1',
        toolUsed: 'nrs',
        nrsScore: 5,
        location: 'Lower back',
        painType: 'aching',
        totalScore: 5,
        notes: null,
        recordedByName: 'Dr Smith',
        recordedAt: new Date('2026-04-01T14:00:00Z'),
      },
    ];
    render(<PainTrendChart assessments={assessments} trendData={[]} />);
    expect(screen.getByText(/NRS/)).toBeDefined();
    expect(screen.getByText(/5\/10/)).toBeDefined();
    expect(screen.getByText(/Lower back/)).toBeDefined();
    expect(screen.getByText(/Dr Smith/)).toBeDefined();
  });

  it('renders trend table with multiple data points', () => {
    const trendData = [
      { recordedAt: new Date('2026-03-30T10:00:00Z'), toolUsed: 'nrs', totalScore: 3 },
      { recordedAt: new Date('2026-04-01T10:00:00Z'), toolUsed: 'nrs', totalScore: 5 },
    ];
    render(<PainTrendChart assessments={[]} trendData={trendData} />);
    expect(screen.getByText(/Pain Trend/)).toBeDefined();
    expect(screen.getByText(/3\/10/)).toBeDefined();
    expect(screen.getByText(/5\/10/)).toBeDefined();
  });

  it('renders Abbey scores with /18 denominator', () => {
    const assessments = [
      {
        id: '1',
        toolUsed: 'abbey',
        nrsScore: null,
        location: null,
        painType: null,
        totalScore: 12,
        notes: null,
        recordedByName: null,
        recordedAt: new Date('2026-04-01T14:00:00Z'),
      },
    ];
    render(<PainTrendChart assessments={assessments} trendData={[]} />);
    expect(screen.getByText(/12\/18/)).toBeDefined();
  });
});
