import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceNoteInput } from './voice-note-input';

describe('VoiceNoteInput', () => {
  it('renders a text area', () => {
    render(<VoiceNoteInput onCapture={vi.fn()} />);
    expect(
      screen.getByPlaceholderText(
        'Tap the microphone to dictate or type your note...',
      ),
    ).toBeInTheDocument();
  });

  it('renders the Use Note button', () => {
    render(<VoiceNoteInput onCapture={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Use Note' }),
    ).toBeInTheDocument();
  });

  it('disables Use Note when empty', () => {
    render(<VoiceNoteInput onCapture={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Use Note' })).toBeDisabled();
  });

  it('calls onCapture with text when Use Note is clicked', async () => {
    const user = userEvent.setup();
    const onCapture = vi.fn();
    render(<VoiceNoteInput onCapture={onCapture} />);

    const textarea = screen.getByPlaceholderText(
      'Tap the microphone to dictate or type your note...',
    );
    await user.type(textarea, 'Resident had a good day');
    await user.click(screen.getByRole('button', { name: 'Use Note' }));

    expect(onCapture).toHaveBeenCalledWith('Resident had a good day');
  });

  it('shows unsupported message when Speech API is unavailable', () => {
    render(<VoiceNoteInput onCapture={vi.fn()} />);
    expect(
      screen.getByText(/voice dictation is not supported/i),
    ).toBeInTheDocument();
  });

  it('shows Clear button when text is entered', async () => {
    const user = userEvent.setup();
    render(<VoiceNoteInput onCapture={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      'Tap the microphone to dictate or type your note...',
    );
    await user.type(textarea, 'some text');

    expect(
      screen.getByRole('button', { name: 'Clear' }),
    ).toBeInTheDocument();
  });
});
