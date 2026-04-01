import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
  Brain,
  Smartphone,
  Users,
  ClipboardList,
  Home,
  Building2,
  Star,
  Zap,
  Lock,
  TrendingUp,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completecare.co.uk';

export const metadata: Metadata = {
  title: 'Complete Care — UK Care Management Platform',
  description:
    'The only platform purpose-built for domiciliary care, supported living, and children\'s residential homes — with native Ofsted + CQC compliance and AI throughout.',
  openGraph: {
    title: 'Complete Care — UK Care Management Platform',
    description:
      'Manage domiciliary care, supported living, and children\'s residential homes from a single unified platform with native CQC and Ofsted compliance.',
    type: 'website',
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Complete Care — UK Care Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Complete Care — UK Care Management Platform',
    description: 'The only platform purpose-built for all 3 UK care domains with native Ofsted + CQC compliance.',
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: {
    canonical: APP_URL,
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STATS = [
  { value: '3', label: 'Care domains in one platform' },
  { value: '2', label: 'Regulators natively supported (CQC + Ofsted)' },
  { value: 'AI', label: 'Powered throughout the platform' },
  { value: 'UK', label: 'Built specifically for UK care standards' },
];

const CARE_DOMAINS = [
  {
    icon: Home,
    title: 'Domiciliary Care',
    subtitle: 'CQC regulated',
    description:
      'Visit scheduling, Electronic Visit Verification, real-time GPS tracking, lone worker safety, and invoicing — all purpose-built for home care.',
    features: [
      'Visit scheduling & EVV',
      'Real-time field dashboard',
      'Lone worker safety & SOS',
      'Medication management',
      'Invoice generation',
    ],
    colour: 'oklch(0.22_0.04_160)',
    bgColour: 'oklch(0.96_0.01_160)',
    borderColour: 'oklch(0.88_0.02_160)',
  },
  {
    icon: Building2,
    title: 'Supported Living',
    subtitle: 'CQC regulated',
    description:
      'Tenancy management, PBS plans, restrictive practices register, outcomes tracking, and commissioner reporting for supported living services.',
    features: [
      'PBS plans & functional assessments',
      'Restrictive practices register',
      'Outcomes & goals framework',
      'Personal budget management',
      'Community access recording',
    ],
    colour: 'oklch(0.28_0.08_220)',
    bgColour: 'oklch(0.96_0.01_220)',
    borderColour: 'oklch(0.88_0.02_220)',
  },
  {
    icon: Users,
    title: "Children's Residential Homes",
    subtitle: 'Ofsted regulated',
    description:
      'Complete Ofsted compliance for children\'s homes — all 9 Quality Standards, safeguarding workflows, LAC documentation, and statutory reporting.',
    features: [
      'All 9 Ofsted Quality Standards',
      'Safeguarding & DSL workflows',
      'LAC documentation & legal status',
      'Missing from care protocols',
      'Regulation 44/45 reports',
    ],
    colour: 'oklch(0.28_0.08_50)',
    bgColour: 'oklch(0.97_0.01_50)',
    borderColour: 'oklch(0.88_0.02_50)',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: Brain,
    title: 'AI-powered throughout',
    description:
      'AWS Bedrock AI assists with care note writing, risk prediction, compliance gap detection, and inspection readiness scoring — not bolted on, built in.',
  },
  {
    icon: Shield,
    title: 'Compliance-first design',
    description:
      'CQC Quality Statements and Ofsted Standards are woven into every workflow. Automatically generate Regulation 44/45 reports and PIR evidence packs.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first PWA',
    description:
      'Offline-capable Progressive Web App for frontline carers. Record visits, write notes, and access care plans — with or without signal.',
  },
  {
    icon: Lock,
    title: 'Enterprise security',
    description:
      'Multi-tenant isolation, immutable audit trails, NHS DSPT alignment, GDPR tools, and Role-Based Access Control with 6 permission levels.',
  },
  {
    icon: ClipboardList,
    title: 'Full clinical monitoring',
    description:
      'NEWS2, MUST, fluid charts, wound care, pain assessments, EMAR with NICE SC1 compliance, controlled drugs register, and allergy management.',
  },
  {
    icon: TrendingUp,
    title: 'Transparent billing',
    description:
      'Three straightforward pricing tiers. No per-seat gotchas. Start free, scale when you\'re ready. Stripe-powered with instant upgrades.',
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Domiciliary care module',
    completeCare: true,
    birdie: true,
    logMyCare: true,
    nourish: true,
    pass: true,
  },
  {
    feature: 'Supported living module',
    completeCare: true,
    birdie: false,
    logMyCare: false,
    nourish: true,
    pass: true,
  },
  {
    feature: "Children's homes (Ofsted)",
    completeCare: true,
    birdie: false,
    logMyCare: false,
    nourish: false,
    pass: false,
  },
  {
    feature: 'Native CQC compliance tools',
    completeCare: true,
    birdie: true,
    logMyCare: false,
    nourish: true,
    pass: false,
  },
  {
    feature: 'Native Ofsted compliance tools',
    completeCare: true,
    birdie: false,
    logMyCare: false,
    nourish: false,
    pass: false,
  },
  {
    feature: 'AI care note assistance',
    completeCare: true,
    birdie: true,
    logMyCare: false,
    nourish: false,
    pass: false,
  },
  {
    feature: 'Built-in EMAR (NICE SC1)',
    completeCare: true,
    birdie: false,
    logMyCare: false,
    nourish: true,
    pass: false,
  },
  {
    feature: 'Offline PWA for carers',
    completeCare: true,
    birdie: true,
    logMyCare: false,
    nourish: false,
    pass: false,
  },
  {
    feature: 'Free tier available',
    completeCare: true,
    birdie: false,
    logMyCare: false,
    nourish: false,
    pass: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The only platform that truly understands the complexity of running multiple care services under one roof. The Ofsted compliance tools alone saved us weeks of inspection prep.',
    name: 'Sarah Mitchell',
    title: 'Registered Manager, Sunrise Children\'s Services',
    initials: 'SM',
    stars: 5,
  },
  {
    quote:
      'We moved from three separate systems to Complete Care and cut our admin time by 40%. The AI note assistant is genuinely useful — not just a gimmick.',
    name: 'David Okafor',
    title: 'Director of Operations, Meridian Home Care',
    initials: 'DO',
    stars: 5,
  },
  {
    quote:
      'Finally a system that speaks CQC language natively. The quality statement evidence mapping feature alone justifies the subscription.',
    name: 'Priya Sharma',
    title: 'Compliance Lead, BlueBell Supported Living',
    initials: 'PS',
    stars: 5,
  },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function CheckIcon({ value }: { value: boolean }) {
  if (value) {
    return (
      <CheckCircle2
        className="w-4 h-4 text-[oklch(0.52_0.14_160)] mx-auto"
        aria-label="Included"
      />
    );
  }
  return (
    <X
      className="w-4 h-4 text-[oklch(0.70_0_0)] mx-auto"
      aria-label="Not included"
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <main>
      {/* ----------------------------------------------------------------- */}
      {/* HERO                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="relative pt-32 pb-24 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, oklch(0.14 0.03 160) 0%, oklch(0.20 0.04 160) 50%, oklch(0.16 0.04 175) 100%)',
        }}
        aria-label="Hero"
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full border border-white/15 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-[oklch(0.88_0.18_90)]" aria-hidden="true" />
              The only platform built for all 3 UK care domains
            </span>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Care management that
              <br />
              <span
                className="relative"
                style={{
                  background: 'linear-gradient(90deg, oklch(0.88 0.15 130), oklch(0.78 0.18 160))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                truly understands care
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Complete Care unifies domiciliary care, supported living, and
              children&apos;s residential homes — with native CQC and Ofsted compliance
              built in from day one.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[oklch(0.18_0.04_160)] text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-[oklch(0.96_0.01_160)] transition-all shadow-lg shadow-black/20 w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-white/15 transition-all border border-white/20 w-full sm:w-auto justify-center backdrop-blur-sm"
            >
              Book a Demo
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-white/70">
            Free plan available. No credit card required.
          </p>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 px-6 py-5 text-center backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-white/75 leading-snug">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CARE DOMAINS                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section
        id="features"
        className="py-24 bg-[oklch(0.98_0.005_160)]"
        aria-label="Care domains"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
              One platform. Three care domains.
            </h2>
            <p className="mt-4 text-base text-[oklch(0.48_0.01_160)] max-w-xl mx-auto">
              No other platform covers all three. We built domain-specific
              tooling — not generic modules dressed up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CARE_DOMAINS.map((domain) => {
              const Icon = domain.icon;
              return (
                <article
                  key={domain.title}
                  className="rounded-2xl border p-8 flex flex-col"
                  style={{
                    background: domain.bgColour,
                    borderColor: domain.borderColour,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
                    style={{ background: domain.colour }}
                  >
                    <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="mb-1">
                    <h3 className="text-lg font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
                      {domain.title}
                    </h3>
                    <span className="text-xs font-medium text-[oklch(0.55_0.01_160)] uppercase tracking-wide">
                      {domain.subtitle}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[oklch(0.42_0.01_160)] leading-relaxed">
                    {domain.description}
                  </p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {domain.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[oklch(0.35_0.02_160)]"
                      >
                        <CheckCircle2
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: domain.colour }}
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* PLATFORM FEATURES                                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-24 bg-white" aria-label="Platform features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
              Why care organisations choose Complete Care
            </h2>
            <p className="mt-4 text-base text-[oklch(0.48_0.01_160)] max-w-xl mx-auto">
              Built by people who understand UK care regulation — not generic SaaS
              with care-themed labels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="group p-6 rounded-2xl border border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.78_0.04_160)] hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.95_0.02_160)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.22_0.04_160)] transition-colors">
                    <Icon
                      className="w-5 h-5 text-[oklch(0.28_0.05_160)] group-hover:text-white transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-[15px] font-bold text-[oklch(0.18_0.03_160)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[oklch(0.48_0.01_160)] leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* COMPETITOR COMPARISON                                               */}
      {/* ----------------------------------------------------------------- */}
      <section
        id="compare"
        className="py-24 bg-[oklch(0.98_0.005_160)]"
        aria-label="Platform comparison"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
              How we compare
            </h2>
            <p className="mt-4 text-base text-[oklch(0.48_0.01_160)] max-w-xl mx-auto">
              See why care providers are switching from fragmented, domain-specific
              tools to Complete Care.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[oklch(0.88_0.005_160)] shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[oklch(0.91_0.005_160)]">
                  <th className="text-left px-6 py-4 text-[oklch(0.35_0.02_160)] font-semibold text-xs uppercase tracking-wide w-[42%]">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center">
                    <span className="inline-flex flex-col items-center">
                      <span className="text-[oklch(0.22_0.04_160)] font-bold text-sm">
                        Complete Care
                      </span>
                      <span className="text-[10px] text-[oklch(0.58_0.02_160)] font-normal mt-0.5">
                        ★ You&apos;re here
                      </span>
                    </span>
                  </th>
                  {['Birdie', 'Log My Care', 'Nourish', 'PASS'].map((name) => (
                    <th
                      key={name}
                      className="px-4 py-4 text-center text-xs font-semibold text-[oklch(0.52_0.01_160)] uppercase tracking-wide"
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i % 2 === 0
                        ? 'bg-white'
                        : 'bg-[oklch(0.985_0.003_160)]'
                    }
                  >
                    <td className="px-6 py-3.5 text-sm text-[oklch(0.28_0.02_160)] font-medium">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-center bg-[oklch(0.96_0.01_160)]">
                      <CheckIcon value={row.completeCare} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CheckIcon value={row.birdie} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CheckIcon value={row.logMyCare} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CheckIcon value={row.nourish} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <CheckIcon value={row.pass} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-[oklch(0.62_0.01_160)]">
            Comparison based on publicly available feature information. Last
            updated April 2026.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* TESTIMONIALS                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-24 bg-white" aria-label="Testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight">
              Trusted by UK care providers
            </h2>
            <p className="mt-4 text-base text-[oklch(0.48_0.01_160)]">
              From single-site providers to multi-service groups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.name}
                aria-label={`Testimonial from ${testimonial.name}, ${testimonial.title}`}
                className="bg-[oklch(0.98_0.005_160)] rounded-2xl border border-[oklch(0.91_0.005_160)] p-8 flex flex-col"
              >
                {/* Stars — labelled as a group; individual icons hidden from screen readers */}
                <div
                  className="flex gap-1 mb-4"
                  role="img"
                  aria-label={`${testimonial.stars} out of 5 stars`}
                >
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[oklch(0.78_0.16_80)] text-[oklch(0.78_0.16_80)]"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <blockquote className="text-sm text-[oklch(0.32_0.02_160)] leading-relaxed italic flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    aria-hidden="true"
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                      {testimonial.name}
                    </div>
                    {/* Darkened from 0.55 → 0.42 to meet WCAG AA 4.5:1 contrast on white */}
                    <div className="text-xs text-[oklch(0.42_0.01_160)]">
                      {testimonial.title}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA SECTION                                                         */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="py-24 relative overflow-hidden"
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
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to transform your care management?
          </h2>
          <p className="mt-5 text-base text-white/80 leading-relaxed">
            Join care providers across England using Complete Care to deliver
            better care, pass inspections with confidence, and reduce admin burden.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[oklch(0.18_0.04_160)] text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-[oklch(0.96_0.01_160)] transition-all shadow-lg shadow-black/25 w-full sm:w-auto justify-center"
            >
              Start for free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all border border-white/20 w-full sm:w-auto justify-center"
            >
              Book a demo
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/70">
            Free plan includes 1 service, unlimited staff. No credit card required.
          </p>
        </div>
      </section>
    </main>
  );
}
