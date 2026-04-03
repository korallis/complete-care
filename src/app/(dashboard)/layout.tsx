import { DashboardRouteFrame } from '@/components/dashboard/dashboard-route-frame';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardRouteFrame>{children}</DashboardRouteFrame>;
}
