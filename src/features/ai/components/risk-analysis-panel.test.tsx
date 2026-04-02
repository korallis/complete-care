import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskAnalysisPanel } from './risk-analysis-panel';

vi.mock('@/features/ai/actions/risk-compliance', () => ({
  analyseRisks: vi.fn(),
}));

describe('RiskAnalysisPanel', () => {
  it('renders the heading', () => {
    render(<RiskAnalysisPanel />);
    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
  });

  it('renders with pre-populated notes', () => {
    render(
      <RiskAnalysisPanel careNotes={['Resident fell in bathroom']} />,
    );
    expect(screen.getByText('Care Notes (1)')).toBeInTheDocument();
    expect(
      screen.getByText('Resident fell in bathroom'),
    ).toBeInTheDocument();
  });

  it('disables analyse button when no notes', () => {
    render(<RiskAnalysisPanel />);
    expect(
      screen.getByRole('button', { name: 'Analyse Risks' }),
    ).toBeDisabled();
  });

  it('enables analyse button when notes exist', () => {
    render(
      <RiskAnalysisPanel careNotes={['Some note']} />,
    );
    expect(
      screen.getByRole('button', { name: 'Analyse Risks' }),
    ).not.toBeDisabled();
  });
});
