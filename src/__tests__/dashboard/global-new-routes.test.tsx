import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NewBudgetPage from '@/app/(dashboard)/budgets/new/page';
import NewDutyOfCandourIncidentPage from '@/app/(dashboard)/duty-of-candour/new/page';
import NewEolCarePlanPage from '@/app/(dashboard)/eol-care/new/page';
import NewReg45Page from '@/app/(dashboard)/reg45/new/page';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/duty-of-candour', () => ({
  DocIncidentForm: ({ personId }: { personId: string }) => (
    <div data-testid="doc-incident-form">{personId}</div>
  ),
}));

vi.mock('@/features/eol-care', () => ({
  EolCarePlanForm: ({ personId }: { personId: string }) => (
    <div data-testid="eol-care-plan-form">{personId}</div>
  ),
}));

vi.mock('@/features/reg45', () => ({
  Reg45ReportForm: () => <div data-testid="reg45-report-form">reg45-form</div>,
}));

describe('global new-route pages', () => {
  it('renders the new budget page and saves a browser draft state', () => {
    render(<NewBudgetPage />);

    expect(
      screen.getByRole('heading', { name: /start a new budget outline/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to budgets/i })).toHaveAttribute(
      'href',
      '/budgets',
    );

    fireEvent.change(screen.getByLabelText(/budget name/i), {
      target: { value: '2026 personal budget' },
    });
    fireEvent.change(screen.getByLabelText(/person \/ package/i), {
      target: { value: 'Jordan Evans' },
    });
    fireEvent.change(screen.getByLabelText(/allocated amount/i), {
      target: { value: '1200' },
    });
    fireEvent.change(screen.getByLabelText(/period start/i), {
      target: { value: '2026-04-01' },
    });
    fireEvent.change(screen.getByLabelText(/period end/i), {
      target: { value: '2026-09-30' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /save budget outline/i }),
    );

    expect(
      screen.getByText(/budget outline captured for browser uat/i),
    ).toBeInTheDocument();
  });

  it('renders the duty of candour incident form route', () => {
    render(<NewDutyOfCandourIncidentPage />);

    expect(
      screen.getByRole('heading', {
        name: /record a duty of candour incident/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('doc-incident-form')).toHaveTextContent(
      'global-duty-of-candour',
    );
  });

  it('renders the end of life care plan route', () => {
    render(<NewEolCarePlanPage />);

    expect(
      screen.getByRole('heading', {
        name: /create an end of life care plan/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('eol-care-plan-form')).toHaveTextContent(
      'global-eol-plan',
    );
  });

  it('renders the reg45 review route', () => {
    render(<NewReg45Page />);

    expect(
      screen.getByRole('heading', {
        name: /start a reg 45 quality review/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('reg45-report-form')).toBeInTheDocument();
  });
});
