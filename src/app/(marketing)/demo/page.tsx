import type { Metadata } from 'next';
import { DemoBookingForm } from '@/components/marketing/demo-booking-form';

export const metadata: Metadata = {
  title: 'Book a Demo — Complete Care',
  description:
    'See Complete Care in action. Book a personalised demo with our team and discover how we can help your care organisation deliver better outcomes.',
  openGraph: {
    title: 'Book a Demo — Complete Care',
    description:
      'Book a personalised demo and see how Complete Care unifies domiciliary care, supported living, and children\'s homes management.',
  },
};

export default function DemoPage() {
  return (
    <main className="flex-1">
      {/* ── Hero ── */}
      <section
        className="pt-32 pb-16 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.14 0.03 160) 0%, oklch(0.20 0.04 160) 50%, oklch(0.16 0.04 175) 100%)',
        }}
        aria-label="Book a demo hero"
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full border border-white/15 backdrop-blur-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.18_130)] inline-block" aria-hidden="true" />
            Live product demos available daily
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            See Complete Care
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, oklch(0.88 0.15 130), oklch(0.78 0.18 160))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              in action
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            Get a personalised walkthrough tailored to your care domain — domiciliary,
            supported living, or children&apos;s homes. No obligation, no sales pressure.
          </p>
        </div>
      </section>

      {/* ── Form + Benefits ── */}
      <section className="py-16 bg-[oklch(0.985_0.005_160)]" aria-label="Demo booking form">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Form */}
            <div>
              <DemoBookingForm />
            </div>

            {/* Right: What to expect */}
            <div className="lg:pt-2">
              <h2 className="text-xl font-bold text-[oklch(0.15_0.03_160)] mb-8">
                What to expect from your demo
              </h2>

              <div className="space-y-6">
                {DEMO_STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[oklch(0.22_0.04_160)] text-white text-sm font-bold flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[oklch(0.18_0.03_160)] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[oklch(0.48_0.01_160)] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="mt-10 pt-8 border-t border-[oklch(0.91_0.005_160)]">
                <h3 className="text-xs font-semibold text-[oklch(0.52_0.01_160)] uppercase tracking-wide mb-4">
                  Trusted by care providers across England
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {TRUST_BADGES.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[oklch(0.91_0.005_160)]"
                    >
                      <span className="text-lg" aria-hidden="true">{badge.emoji}</span>
                      <span className="text-xs font-medium text-[oklch(0.32_0.02_160)] leading-snug">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const DEMO_STEPS = [
  {
    title: 'Tailored to your care domain',
    description:
      'We\'ll focus on the features most relevant to you — whether that\'s Ofsted compliance for children\'s homes, EVV for domiciliary care, or PBS plans for supported living.',
  },
  {
    title: 'See real workflows in action',
    description:
      'Walk through end-to-end workflows: care planning, medication management, staff compliance, and regulatory reporting — all in a live environment.',
  },
  {
    title: 'Ask anything',
    description:
      'No scripts. Our team knows the product deeply and can answer questions about CQC, Ofsted, NICE SC1, data security, and integrations.',
  },
  {
    title: 'No commitment required',
    description:
      'After the demo, take all the time you need. We\'ll send you a recording and a tailored proposal. No pressure, no artificial deadlines.',
  },
];

const TRUST_BADGES = [
  { emoji: '🏆', label: 'CQC compliant design' },
  { emoji: '✅', label: 'Ofsted ready workflows' },
  { emoji: '🔒', label: 'NHS DSPT aligned' },
  { emoji: '🌐', label: 'UK-based support team' },
];
