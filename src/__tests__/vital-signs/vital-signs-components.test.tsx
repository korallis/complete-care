/**
 * Tests for vital signs UI components.
 *
 * Validates:
 * - News2ScoreBadge renders correct colour and text
 * - News2EscalationAlert shows/hides based on escalation level
 * - VitalSignsCard renders all parameters
 * - VitalSignsChart renders table with data
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { News2ScoreBadge } from '@/components/vital-signs/news2-score-badge';
import { News2EscalationAlert } from '@/components/vital-signs/news2-escalation-alert';
import { VitalSignsCard } from '@/components/vital-signs/vital-signs-card';
import { VitalSignsChart } from '@/components/vital-signs/vital-signs-chart';

// ---------------------------------------------------------------------------
// News2ScoreBadge
// ---------------------------------------------------------------------------

describe('News2ScoreBadge', () => {
  it('renders the score', () => {
    render(<News2ScoreBadge score={3} escalation="ward_assessment" />);
    expect(screen.getByText(/NEWS2: 3/)).toBeDefined();
  });

  it('shows Scale 2 indicator', () => {
    render(
      <News2ScoreBadge score={2} escalation="ward_assessment" scaleUsed={2} />,
    );
    expect(screen.getByText(/Scale 2/)).toBeDefined();
  });

  it('shows escalation label when showEscalation is true', () => {
    render(
      <News2ScoreBadge
        score={7}
        escalation="emergency"
        showEscalation={true}
      />,
    );
    expect(screen.getByText(/Emergency Response/)).toBeDefined();
  });

  it('applies green colour for routine', () => {
    const { container } = render(
      <News2ScoreBadge score={0} escalation="routine" />,
    );
    const badge = container.querySelector('.bg-emerald-100');
    expect(badge).toBeDefined();
  });

  it('applies amber colour for ward_assessment', () => {
    const { container } = render(
      <News2ScoreBadge score={3} escalation="ward_assessment" />,
    );
    const badge = container.querySelector('.bg-amber-100');
    expect(badge).toBeDefined();
  });

  it('applies red colour for urgent', () => {
    const { container } = render(
      <News2ScoreBadge score={5} escalation="urgent" />,
    );
    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeDefined();
  });

  it('applies purple colour for emergency', () => {
    const { container } = render(
      <News2ScoreBadge score={8} escalation="emergency" />,
    );
    const badge = container.querySelector('.bg-purple-100');
    expect(badge).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// News2EscalationAlert
// ---------------------------------------------------------------------------

describe('News2EscalationAlert', () => {
  it('renders nothing for routine escalation', () => {
    const { container } = render(
      <News2EscalationAlert score={0} escalation="routine" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders alert for ward_assessment', () => {
    render(
      <News2EscalationAlert score={3} escalation="ward_assessment" />,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/NEWS2 Score: 3/)).toBeDefined();
  });

  it('renders alert for urgent', () => {
    render(
      <News2EscalationAlert score={5} escalation="urgent" />,
    );
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders alert for emergency', () => {
    render(
      <News2EscalationAlert score={8} escalation="emergency" />,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Emergency Response/)).toBeDefined();
  });

  it('shows Scale 2 indicator when applicable', () => {
    render(
      <News2EscalationAlert score={5} escalation="urgent" scaleUsed={2} />,
    );
    expect(screen.getByText(/Scale 2/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// VitalSignsCard
// ---------------------------------------------------------------------------

describe('VitalSignsCard', () => {
  const mockEntry = {
    id: '123',
    temperature: 37.5,
    systolicBp: 120,
    diastolicBp: 80,
    bpPosition: 'sitting',
    pulseRate: 72,
    pulseRhythm: 'regular',
    respiratoryRate: 16,
    spo2: 98,
    supplementalOxygen: false,
    oxygenFlowRate: null,
    avpu: 'alert',
    bloodGlucose: 5.5,
    painScore: 0,
    news2Score: 0,
    news2ScaleUsed: 1,
    news2Escalation: 'routine',
    isCopd: false,
    recordedByName: 'Nurse Smith',
    recordedAt: new Date('2026-04-01T10:00:00Z'),
    notes: 'Patient comfortable.',
  };

  it('renders the recorded by name', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText(/Nurse Smith/)).toBeDefined();
  });

  it('renders the NEWS2 badge', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText(/NEWS2: 0/)).toBeDefined();
  });

  it('renders temperature', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText('37.5')).toBeDefined();
  });

  it('renders blood pressure', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText('120/80')).toBeDefined();
  });

  it('renders consciousness level', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText('Alert')).toBeDefined();
  });

  it('renders notes', () => {
    render(<VitalSignsCard entry={mockEntry} />);
    expect(screen.getByText('Patient comfortable.')).toBeDefined();
  });

  it('shows COPD indicator when applicable', () => {
    render(<VitalSignsCard entry={{ ...mockEntry, isCopd: true, news2ScaleUsed: 2 }} />);
    expect(screen.getByText(/COPD patient/)).toBeDefined();
  });

  it('omits null parameters', () => {
    render(
      <VitalSignsCard
        entry={{
          ...mockEntry,
          bloodGlucose: null,
          painScore: null,
        }}
      />,
    );
    // These should not appear in the output
    expect(screen.queryByText('Blood Glucose')).toBeNull();
    expect(screen.queryByText('Pain Score')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// VitalSignsChart
// ---------------------------------------------------------------------------

describe('VitalSignsChart', () => {
  it('renders empty state when no data', () => {
    render(<VitalSignsChart data={[]} />);
    expect(screen.getByText(/No vital sign data/)).toBeDefined();
  });

  it('renders table with data', () => {
    render(
      <VitalSignsChart
        data={[
          {
            recordedAt: new Date('2026-04-01T10:00:00Z'),
            temperature: 37.0,
            systolicBp: 120,
            diastolicBp: 80,
            pulseRate: 72,
            respiratoryRate: 16,
            spo2: 98,
            news2Score: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText(/Vital Signs Trend/)).toBeDefined();
    // Table should have headers
    expect(screen.getByText('Temp')).toBeDefined();
    expect(screen.getByText('BP')).toBeDefined();
    expect(screen.getByText('Pulse')).toBeDefined();
  });

  it('renders multiple data points', () => {
    const data = [
      {
        recordedAt: new Date('2026-04-01T08:00:00Z'),
        temperature: 36.5,
        systolicBp: 115,
        diastolicBp: 75,
        pulseRate: 68,
        respiratoryRate: 14,
        spo2: 99,
        news2Score: 0,
      },
      {
        recordedAt: new Date('2026-04-01T14:00:00Z'),
        temperature: 37.2,
        systolicBp: 122,
        diastolicBp: 82,
        pulseRate: 78,
        respiratoryRate: 18,
        spo2: 97,
        news2Score: 0,
      },
    ];
    render(<VitalSignsChart data={data} />);
    // Both rows should render
    expect(screen.getByText('36.5')).toBeDefined();
    expect(screen.getByText('37.2')).toBeDefined();
  });
});
