import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { CookieConsentBanner } from '@/components/marketing/cookie-consent-banner';

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
      <CookieConsentBanner />
    </div>
  );
}
