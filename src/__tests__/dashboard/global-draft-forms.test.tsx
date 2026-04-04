import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocIncidentForm } from '@/features/duty-of-candour';
import { EolCarePlanForm } from '@/features/eol-care';
import { Reg45ReportForm } from '@/features/reg45';

describe('global draft-authoring forms', () => {
  it('captures a duty of candour incident draft for browser UAT', () => {
    render(<DocIncidentForm personId="global-duty-of-candour" />);

    fireEvent.change(screen.getByLabelText(/incident title/i), {
      target: { value: 'Medication error' },
    });
    fireEvent.change(screen.getByLabelText(/full description/i), {
      target: { value: 'A medication omission was identified during handover.' },
    });
    fireEvent.change(screen.getByLabelText(/incident date/i), {
      target: { value: '2026-04-04T09:30' },
    });
    fireEvent.change(screen.getByLabelText(/severity/i), {
      target: { value: 'moderate_harm' },
    });

    fireEvent.click(screen.getByRole('button', { name: /record incident/i }));

    expect(
      screen.getByText(/duty of candour incident draft captured for browser uat/i),
    ).toBeInTheDocument();
  });

  it('captures an end of life care plan draft for browser UAT', () => {
    render(<EolCarePlanForm personId="global-eol-plan" />);

    fireEvent.click(screen.getByLabelText(/^home$/i));
    fireEvent.click(screen.getByRole('button', { name: /save care plan/i }));

    expect(
      screen.getByText(/end of life care plan draft captured for browser uat/i),
    ).toBeInTheDocument();
  });

  it('captures a reg 45 draft from the global authoring route', () => {
    render(<Reg45ReportForm />);

    fireEvent.change(screen.getByLabelText(/reporting period label/i), {
      target: { value: 'Oct 2025 - Mar 2026' },
    });
    fireEvent.change(screen.getByLabelText(/period start/i), {
      target: { value: '2025-10-01' },
    });
    fireEvent.change(screen.getByLabelText(/period end/i), {
      target: { value: '2026-03-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

    expect(
      screen.getByText(/reg 45 review draft captured for browser uat/i),
    ).toBeInTheDocument();
  });
});
