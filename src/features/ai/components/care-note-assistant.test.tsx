import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CareNoteAssistant } from './care-note-assistant';

// Mock the server actions
vi.mock('@/features/ai/actions/care-notes', () => ({
  expandCareNote: vi.fn(),
  correctCareNoteGrammar: vi.fn(),
}));

describe('CareNoteAssistant', () => {
  it('renders expand and grammar mode buttons', () => {
    render(<CareNoteAssistant />);
    const expandButtons = screen.getAllByRole('button', { name: 'Expand Note' });
    expect(expandButtons.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('button', { name: 'Fix Grammar' }),
    ).toBeInTheDocument();
  });

  it('renders a text area for input', () => {
    render(<CareNoteAssistant />);
    expect(
      screen.getByPlaceholderText('Enter brief care note to expand...'),
    ).toBeInTheDocument();
  });

  it('populates input with initialText', () => {
    render(<CareNoteAssistant initialText="Patient ate well" />);
    expect(screen.getByDisplayValue('Patient ate well')).toBeInTheDocument();
  });

  it('shows tone selector in expand mode', () => {
    render(<CareNoteAssistant />);
    expect(screen.getByLabelText('Tone:')).toBeInTheDocument();
  });

  it('hides tone selector in grammar mode', async () => {
    const user = userEvent.setup();
    render(<CareNoteAssistant />);
    await user.click(screen.getByRole('button', { name: 'Fix Grammar' }));
    expect(screen.queryByLabelText('Tone:')).not.toBeInTheDocument();
  });

  it('disables submit when input is empty', () => {
    render(<CareNoteAssistant />);
    const buttons = screen.getAllByRole('button', { name: 'Expand Note' });
    // The submit button (second one) should be disabled
    const submitButton = buttons[buttons.length - 1];
    expect(submitButton).toBeDisabled();
  });
});
