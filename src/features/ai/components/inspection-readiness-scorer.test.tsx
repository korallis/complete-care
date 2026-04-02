import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectionReadinessScorer } from './inspection-readiness-scorer';

vi.mock('@/features/ai/actions/risk-compliance', () => ({
  scoreInspectionReadiness: vi.fn(),
}));

describe('InspectionReadinessScorer', () => {
  it('renders the heading', () => {
    render(<InspectionReadinessScorer />);
    expect(
      screen.getByText('Inspection Readiness Score'),
    ).toBeInTheDocument();
  });

  it('renders metric input fields', () => {
    render(<InspectionReadinessScorer />);
    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('Complete Documents')).toBeInTheDocument();
    expect(screen.getByText('Overdue Reviews')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Actions')).toBeInTheDocument();
    expect(
      screen.getByText('Recent Incidents (30 days)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Staff Training Compliance (%)'),
    ).toBeInTheDocument();
  });

  it('renders the score button', () => {
    render(<InspectionReadinessScorer />);
    expect(
      screen.getByRole('button', { name: 'Calculate Readiness Score' }),
    ).toBeInTheDocument();
  });

  it('accepts initial metrics', () => {
    render(
      <InspectionReadinessScorer
        initialMetrics={{
          totalDocuments: 50,
          completeDocuments: 40,
          overdueReviews: 5,
          outstandingActions: 3,
          recentIncidents: 2,
          staffTrainingCompliance: 85,
        }}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(6);
  });
});
