// Dashboard layout — auth check and sidebar shell will be added in
// m1-dashboard-shell feature. This is the scaffold placeholder.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
