import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Phone } from 'lucide-react';
import { PricingContent } from '@/components/marketing/pricing-toggle';

export const metadata: Metadata = {
  title: 'Pricing — Complete Care',
  description:
    'Simple, transparent pricing for UK care providers. Free plan available. Professional at £149/month. Enterprise custom pricing.',
  openGraph: {
    title: 'Pricing — Complete Care',
    description:
      'Simple, transparent pricing for UK care management. No hidden fees, no per-seat surprises.',
    type: 'website',
    url: 'https://completecare.co.uk/pricing',
  },
  alternates: {
    canonical: 'https://completecare.co.uk/pricing',
  },
};

const FAQ_ITEMS = [
  {
    question: 'Is there really a free plan?',
    answer:
      'Yes — genuinely free, forever. The free plan supports one service location with up to 10 staff and 25 people in care. No credit card required to get started.',
  },
  {
    question: 'What counts as a "service location"?',
    answer:
      'A service location is one registered care service — e.g. one domiciliary care branch, one supported living property, or one children\'s home. The Professional and Enterprise plans support unlimited locations.',
  },
  {
    question: 'Can I switch between plans?',
    answer:
      'Yes. You can upgrade at any time and your data carries over instantly. Downgrading at the end of a billing period is also supported.',
  },
  {
    question: 'Is the annual discount applied immediately?',
    answer:
      'Yes. When you switch to annual billing, you\'re charged the discounted annual rate immediately. If you\'re mid-cycle on monthly, we\'ll apply a pro-rata credit.',
  },
  {
    question: 'Does Complete Care handle CQC and Ofsted compliance?',
    answer:
      'Yes. The Professional and Enterprise plans include native CQC Quality Statement mapping, Ofsted 9 Quality Standards compliance engine, AI inspection readiness scoring, and auto-generated evidence packs for inspection.',
  },
  {
    question: 'Is data stored securely?',
    answer:
      'All data is stored on UK-based infrastructure (Vercel/Neon Postgres in EU-West). We follow NHS DSPT guidelines, implement strict multi-tenant data isolation, and maintain a full immutable audit trail.',
  },
];

export default function PricingPage() {
  return (
    <main className="pt-16">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                             */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="py-20 text-center relative overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.14 0.03 160) 0%, oklch(0.19 0.04 160) 100%)',
        }}
        aria-label="Pricing header"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Transparent pricing.
            <br />
            No surprises.
          </h1>
          <p className="mt-5 text-lg text-white/65 max-w-xl mx-auto">
            Start free. Scale when you&apos;re ready. Every plan includes our
            mobile PWA, care notes, and 24/7 data security.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Pricing Content (toggle + cards + comparison)                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 bg-[oklch(0.98_0.003_160)]" aria-label="Pricing plans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingContent />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Trust Badges                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-12 bg-white border-y border-[oklch(0.91_0.005_160)]" aria-label="Trust indicators">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'UK data sovereignty',
                description: 'All data stored in EU-West (UK). NHS DSPT aligned.',
              },
              {
                icon: Zap,
                title: 'Instant setup',
                description: 'Go live in under 10 minutes. No IT team required.',
              },
              {
                icon: Phone,
                title: 'Real support',
                description: 'Priority email and phone support on Professional+.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 rounded-xl bg-[oklch(0.98_0.003_160)] border border-[oklch(0.91_0.005_160)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.95_0.02_160)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[oklch(0.28_0.05_160)]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[oklch(0.22_0.03_160)]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[oklch(0.52_0.01_160)] mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-20 bg-[oklch(0.98_0.003_160)]" aria-label="Frequently asked questions">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight text-center mb-12">
            Frequently asked questions
          </h2>

          <dl className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="bg-white rounded-xl border border-[oklch(0.91_0.005_160)] p-6"
              >
                <dt className="text-sm font-bold text-[oklch(0.18_0.03_160)]">
                  {item.question}
                </dt>
                <dd className="mt-2 text-sm text-[oklch(0.45_0.01_160)] leading-relaxed">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA                                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.14 0.03 160) 0%, oklch(0.20 0.04 160) 100%)',
        }}
        aria-label="Call to action"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Not sure which plan is right for you?
          </h2>
          <p className="mt-4 text-white/60 text-base">
            Our care specialists can walk you through the platform and help you
            choose the right configuration for your service.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-[oklch(0.18_0.04_160)] text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-[oklch(0.96_0.01_160)] transition-all shadow-lg shadow-black/20 w-full sm:w-auto"
            >
              Start free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-white/15 transition-all border border-white/20 w-full sm:w-auto"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
