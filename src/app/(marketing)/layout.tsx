import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
