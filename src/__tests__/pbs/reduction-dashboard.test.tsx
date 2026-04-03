import { render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ReductionDashboard } from '@/features/pbs/components/reduction-dashboard';

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar-series" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line-series" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

class MockResizeObserver {
  constructor(
    private readonly callback: ResizeObserverCallback,
  ) {}

  observe() {
    this.callback(
      [
        {
          contentRect: { width: 640, height: 288 },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  disconnect() {}
  unobserve() {}
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('ReductionDashboard', () => {
  const props = {
    data: [
      { period: '2026-01-05', count: 4 },
      { period: '2026-01-12', count: 2 },
    ],
    period: 'weekly' as const,
    onPeriodChange: vi.fn(),
    reductionPlan: null,
  };

  it('renders a non-chart placeholder during server render', () => {
    const html = renderToString(<ReductionDashboard {...props} />);

    expect(html).toContain('Preparing chart');
    expect(html).not.toContain('data-testid="bar-chart"');
  });

  it('renders the chart after mount in the browser', async () => {
    render(<ReductionDashboard {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('reduction-chart-placeholder'),
    ).not.toBeInTheDocument();
  });
});
