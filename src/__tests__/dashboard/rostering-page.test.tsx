import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockAuth = vi.fn();
const mockListTimesheetsForPeriod = vi.fn();
const mockGetPayrollSummaryForPeriod = vi.fn();
const mockGenerateTimesheetsForPeriod = vi.fn();
const mockApproveTimesheetsForPeriod = vi.fn();
const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/features/timesheets/actions", () => ({
  listTimesheetsForPeriod: mockListTimesheetsForPeriod,
  getPayrollSummaryForPeriod: mockGetPayrollSummaryForPeriod,
  generateTimesheetsForPeriod: mockGenerateTimesheetsForPeriod,
  approveTimesheetsForPeriod: mockApproveTimesheetsForPeriod,
}));

describe("RosteringPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
        activeOrgId: "org-1",
        role: "manager",
        memberships: [
          { orgId: "org-1", orgSlug: "acme", role: "manager" },
        ],
      },
    });

    mockListTimesheetsForPeriod.mockResolvedValue([
      {
        id: "ts-1",
        shiftDate: "2026-04-06",
        staffName: "Alice Smith",
        scheduledStart: "08:00:00",
        scheduledEnd: "16:00:00",
        totalHours: 8,
        status: "draft",
      },
    ]);

    mockGetPayrollSummaryForPeriod.mockResolvedValue({
      periodStart: "2026-04-06",
      periodEnd: "2026-04-12",
      staffCount: 1,
      totalHours: 8,
      totalOvertimeHours: 0,
      totalAmount: 96,
      rows: [
        {
          staffId: "staff-1",
          staffName: "Alice Smith",
          hoursWorked: 8,
          overtimeHours: 0,
          shiftType: "day",
          payRate: 12,
          overtimeRate: 18,
          regularPay: 96,
          overtimePay: 0,
          totalPay: 96,
        },
      ],
    });
  });

  it("renders rota-to-payroll workflow links and weekly data", async () => {
    const { default: RosteringPage } = await import("@/app/(dashboard)/[orgSlug]/rostering/page");

    const ui = await RosteringPage({
      params: Promise.resolve({ orgSlug: "acme" }),
      searchParams: Promise.resolve({ date: "2026-04-06" }),
    });

    const html = renderToStaticMarkup(ui);

    expect(html).toContain("Rostering &amp; payroll");
    expect(html).toContain("Open rota week");
    expect(html).toContain("/acme/scheduling?date=2026-04-06");
    expect(html).toContain("Export payroll CSV");
    expect(html).toContain("/acme/rostering/payroll?startDate=2026-04-06&amp;endDate=2026-04-12");
    expect(html).toContain("Alice Smith");
    expect(html).toContain("£96.00");
  });

  it("hides management actions for read-only roles", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
        activeOrgId: "org-1",
        role: "viewer",
        memberships: [
          { orgId: "org-1", orgSlug: "acme", role: "viewer" },
        ],
      },
    });

    const { default: RosteringPage } = await import("@/app/(dashboard)/[orgSlug]/rostering/page");
    const ui = await RosteringPage({
      params: Promise.resolve({ orgSlug: "acme" }),
      searchParams: Promise.resolve({ date: "2026-04-06" }),
    });

    const html = renderToStaticMarkup(ui);

    expect(html).not.toContain("Generate timesheets");
    expect(html).not.toContain("Approve ready entries");
    expect(html).not.toContain("Export payroll CSV");
  });
});
