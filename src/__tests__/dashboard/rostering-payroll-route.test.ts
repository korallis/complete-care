import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockExportPayrollCsvForPeriod = vi.fn();

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/features/timesheets/actions", () => ({
  exportPayrollCsvForPeriod: mockExportPayrollCsvForPeriod,
}));

describe("GET /[orgSlug]/rostering/payroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
        activeOrgId: "org-1",
        role: "manager",
        memberships: [{ orgId: "org-1", orgSlug: "acme", role: "manager" }],
      },
    });
  });

  it("returns a payroll csv download when the export succeeds", async () => {
    mockExportPayrollCsvForPeriod.mockResolvedValue({
      success: true,
      data: {
        csv: "Staff Name,Total Pay\nAlice Smith,96.00",
        fileName: "payroll-2026-04-06-to-2026-04-12.csv",
        summary: { rows: [] },
      },
    });

    const { GET } = await import("@/app/(dashboard)/[orgSlug]/rostering/payroll/route");
    const response = await GET(
      new Request("https://example.com/acme/rostering/payroll?startDate=2026-04-06&endDate=2026-04-12"),
      { params: Promise.resolve({ orgSlug: "acme" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("payroll-2026-04-06-to-2026-04-12.csv");
    await expect(response.text()).resolves.toContain("Alice Smith");
  });

  it("rejects users without rota management permissions", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
        activeOrgId: "org-1",
        role: "viewer",
        memberships: [{ orgId: "org-1", orgSlug: "acme", role: "viewer" }],
      },
    });

    const { GET } = await import("@/app/(dashboard)/[orgSlug]/rostering/payroll/route");
    const response = await GET(
      new Request("https://example.com/acme/rostering/payroll?startDate=2026-04-06&endDate=2026-04-12"),
      { params: Promise.resolve({ orgSlug: "acme" }) },
    );

    expect(response.status).toBe(403);
    expect(mockExportPayrollCsvForPeriod).not.toHaveBeenCalled();
  });
});
