import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  AudioWaveform,
  Building2,
  CheckCircle2,
  Clock3,
  FileStack,
  HeartPulse,
  Home,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completecare.co.uk';

export const metadata: Metadata = {
  title: 'Complete Care — Care operations, without the patchwork',
  description:
    'A distinctive UK care platform for domiciliary care, supported living, complex care, and children\'s homes — built to keep teams coordinated, compliant, and easier to brief.',
  openGraph: {
    title: 'Complete Care — Care operations, without the patchwork',
    description:
      'One platform for domiciliary care, supported living, complex care, and children\'s residential homes with native operational and compliance depth.',
    type: 'website',
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Complete Care — care operations without the patchwork',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Complete Care — Care operations, without the patchwork',
    description:
      'A UK care platform for operators who need calm workflows, cleaner handovers, and better inspection readiness.',
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: {
    canonical: APP_URL,
  },
};

const DOMAIN_STORIES = [
  {
    icon: Home,
    title: 'Domiciliary care',
    strap: 'Visits, travel, timing, and safer field work.',
    body:
      'Coordinate calls, surface late-risk earlier, and keep frontline context close to the visit instead of spread across notes, spreadsheets, and memory.',
    signals: ['Live visit rhythm', 'Travel and lone-worker context', 'Medication and note continuity'],
  },
  {
    icon: Building2,
    title: 'Supported living',
    strap: 'Property-aware support, outcome tracking, and commissioner-ready structure.',
    body:
      'Bring tenancy, PBS, outcomes, and restrictive-practice monitoring into one operating picture without flattening the nuance of supported living.',
    signals: ['Property and tenancy context', 'Goals and progress view', 'Support-hour variance'],
  },
  {
    icon: HeartPulse,
    title: 'Complex care',
    strap: 'Higher-acuity coordination, continuity, and clinically aware operations.',
    body:
      'Plan complex packages with the staffing signal, protocol detail, and oversight rhythm that higher-acuity services need without splitting scheduling from clinical context.',
    signals: ['Competency-aware allocation', 'Critical visit continuity', 'Commissioner and protocol visibility'],
  },
  {
    icon: Users,
    title: "Children's homes",
    strap: 'A system that respects safeguarding seriousness and Ofsted reality.',
    body:
      'Keep keyworker activity, missing-from-care workflows, family contact, and statutory documentation connected in one calmer daily workspace.',
    signals: ['Safeguarding flow', 'LAC and contact records', 'Reg 44/45 readiness'],
  },
] as const;

const WORKFLOW_BANDS = [
  {
    icon: MapPinned,
    title: 'See the day before it slips',
    text:
      'Supervisors should not need three screens to spot what needs attention first. Complete Care is designed to make the signal obvious early.',
  },
  {
    icon: FileStack,
    title: 'Keep documentation in the work, not after it',
    text:
      'Care notes, plans, audits, and regulatory evidence should feel connected to the moment they are created, not archived in separate silos.',
  },
  {
    icon: ShieldCheck,
    title: 'Move from compliance anxiety to operational confidence',
    text:
      'Inspection-readiness should be a by-product of disciplined daily work, not a last-minute scramble through disconnected tools.',
  },
] as const;

const PROOF_NOTES = [
  'One product language across public, operational, and compliance surfaces',
  'Purpose-built for four UK care contexts instead of one generic module set',
  'Shaped for calm handover, scanability, and high-trust first impressions',
  'Designed to support inspection confidence without turning the UI into a policy binder',
] as const;

const QUOTES = [
  {
    quote:
      'It feels like a product built by people who understand how care work actually gets handed over between shifts.',
    name: 'Mina Adeyemi',
    title: 'Operations lead, multi-service provider',
  },
  {
    quote:
      'The big difference is not just the compliance coverage. It is how quickly you understand what matters when you open it.',
    name: 'Charlotte Rees',
    title: 'Registered manager, children\'s home group',
  },
] as const;

const SHIFT_RHYTHM: ReadonlyArray<readonly [string, string, boolean]> = [
  ['07:30', 'handover completed', true],
  ['09:10', 'medication prompt escalated', true],
  ['11:45', 'travel variance flagged', false],
  ['14:20', 'compliance review queued', false],
];

function MetricRail() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 md:grid-cols-4">
      {[
        ['4', 'care domains'],
        ['2', 'regulatory lenses'],
        ['1', 'operating system'],
        ['0', 'need for patchwork tools'],
      ].map(([value, label]) => (
        <div key={label} className="bg-white/5 px-5 py-4">
          <div className="font-display text-3xl font-semibold tracking-[-0.05em] text-white">
            {value}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/56">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function OperationsCanvas() {
  return (
    <div className="surface-panel relative overflow-hidden rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(12,20,31,0.98),rgba(18,29,45,0.95))] p-6 text-white shadow-[0_40px_120px_-50px_rgba(2,6,23,0.95)] sm:p-7">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-[oklch(0.66_0.09_197/0.18)] blur-3xl" aria-hidden="true" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[oklch(0.76_0.1_85/0.16)] blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/42">
            live care canvas
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
            Calm signal, not admin noise.
          </h2>
        </div>
        <Sparkles className="h-5 w-5 text-[oklch(0.82_0.11_85)]" aria-hidden="true" />
      </div>

      <div className="relative mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/42">
                today across services
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
                04 signals need review
              </p>
            </div>
            <HeartPulse className="h-5 w-5 text-[oklch(0.72_0.1_165)]" aria-hidden="true" />
          </div>

          <div className="mt-6 space-y-3">
            {[
              ['Field teams', '2 late-risk visits need reassignment'],
              ['Children\'s home', '1 safeguarding chronology ready for DSL review'],
              ['Supported living', 'PBS trend changed after yesterday\'s incident note'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-t border-white/8 pt-3 first:border-t-0 first:pt-0"
              >
                <p className="text-sm text-white/52">{label}</p>
                <p className="max-w-[14rem] text-right text-sm font-medium leading-6 text-white/86">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/42">
            shift rhythm
          </p>
          <div className="mt-4 space-y-4">
            {SHIFT_RHYTHM.map(([time, label, done]) => (
              <div key={time} className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    done ? 'bg-[oklch(0.72_0.1_165)]' : 'bg-white/28'
                  }`}
                />
                <span className="font-display text-sm tracking-[-0.03em] text-white/84">
                  {time}
                </span>
                <span className="text-sm text-white/58">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="pb-4 pt-24 sm:pt-28">
      <section className="section-frame">
        <div className="surface-ink relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div
            className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_60%)] lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/68">
                <AudioWaveform className="h-3.5 w-3.5" aria-hidden="true" />
                care operations without the patchwork
              </span>
              <h1 className="font-display mt-6 text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                A calmer system for care teams who carry serious work.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/72 sm:text-lg">
                Complete Care brings domiciliary care, supported living, complex care,
                and children&apos;s residential workflows into one modern operating surface —
                so handover, compliance, and daily decisions feel connected instead of
                improvised.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-[oklch(0.16_0.015_232)] transition-transform duration-200 hover:-translate-y-px"
                >
                  Start with one service
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/6 px-5 py-3.5 text-sm font-semibold text-white/86 transition-colors hover:bg-white/10"
                >
                  Book a guided walkthrough
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/48">
                Built for providers who need distinct operational signal, not another generic admin shell.
              </p>
            </div>
            <OperationsCanvas />
          </div>
          <div className="mt-10 lg:mt-12">
            <MetricRail />
          </div>
        </div>
      </section>

      <section id="domains" className="section-frame mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <span className="eyebrow">where it has to work</span>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-[oklch(0.17_0.016_232)] sm:text-4xl">
              Four care domains, one shared operating language.
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-[oklch(0.45_0.018_225)]">
              The platform should feel unified without flattening the reality of different care settings. Each workflow keeps its own nuance, but the experience stays coherent.
            </p>
          </div>

          <div className="surface-panel overflow-hidden rounded-[2rem] p-3 sm:p-4">
            <div className="divide-y divide-[oklch(0.9_0.012_220)]">
              {DOMAIN_STORIES.map((domain) => {
                const Icon = domain.icon;

                return (
                  <article
                    key={domain.title}
                    className="grid gap-5 px-4 py-6 sm:px-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.19_0.015_232)] text-white">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[oklch(0.18_0.016_232)]">
                            {domain.title}
                          </p>
                          <p className="mt-1 text-sm text-[oklch(0.45_0.018_225)]">
                            {domain.strap}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm leading-7 text-[oklch(0.34_0.016_225)]">
                        {domain.body}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {domain.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-[oklch(0.88_0.012_220)] bg-[oklch(0.985_0.003_95)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[oklch(0.42_0.018_225)]"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="section-frame mt-24">
        <div className="surface-panel overflow-hidden rounded-[2rem] p-8 sm:p-10">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <span className="eyebrow">how it should feel</span>
              <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-[oklch(0.17_0.016_232)] sm:text-4xl">
                From first referral to inspection day, the interface should lower friction.
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-[oklch(0.45_0.018_225)]">
                Premium software for care should not feel loud. It should make the next action obvious, hold context cleanly, and make trust visible in the details.
              </p>
            </div>

            <div className="space-y-6">
              {WORKFLOW_BANDS.map((band, index) => {
                const Icon = band.icon;

                return (
                  <article
                    key={band.title}
                    className="grid gap-4 border-t border-[oklch(0.9_0.012_220)] pt-6 first:border-t-0 first:pt-0 sm:grid-cols-[auto_1fr]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.9_0.018_198)] text-[oklch(0.32_0.05_200)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div>
                        <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-[oklch(0.18_0.016_232)]">
                          {band.title}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[oklch(0.42_0.018_225)]">
                          {band.text}
                        </p>
                      </div>
                      <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[oklch(0.48_0.02_225)]">
                        0{index + 1}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="evidence" className="section-frame mt-24">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-ink p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/58">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              what teams stop tolerating
            </span>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              The old pattern is more tools, more tabs, more stress.
            </h2>
            <div className="mt-8 space-y-4">
              {PROOF_NOTES.map((note) => (
                <div key={note} className="flex gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[oklch(0.76_0.1_85)]" aria-hidden="true" />
                  <p className="text-sm leading-7 text-white/68">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel p-8 sm:p-10">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[oklch(0.45_0.02_225)]">
              proof of tone
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {QUOTES.map((item) => (
                <figure key={item.name} className="rounded-[1.75rem] border border-[oklch(0.9_0.012_220)] bg-[oklch(0.985_0.003_95)] p-6">
                  <blockquote className="font-display text-xl leading-8 tracking-[-0.04em] text-[oklch(0.18_0.016_232)]">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-[oklch(0.9_0.012_220)] pt-4 text-sm leading-6 text-[oklch(0.44_0.018_225)]">
                    <span className="block font-semibold text-[oklch(0.2_0.016_232)]">{item.name}</span>
                    <span>{item.title}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-8 rounded-[1.75rem] border border-[oklch(0.88_0.012_220)] bg-[linear-gradient(135deg,rgba(223,242,248,0.72),rgba(255,251,241,0.94))] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.2_0.016_232)] text-white">
                  <Stethoscope className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[oklch(0.17_0.016_232)]">
                    Built for a serious setting.
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[oklch(0.4_0.018_225)]">
                    The benchmark is not “does this look techy?”. It is “would a care operator trust this instantly, and can they still move fast under pressure?”.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-frame mt-24">
        <div className="surface-ink overflow-hidden px-8 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/56">
                final call
              </span>
              <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Replace the patchwork with a system your team can actually brief in one breath.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
                Start with one service, grow into all four, and keep the interface coherent as your operation gets more complex — not more chaotic.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-[oklch(0.16_0.015_232)] transition-transform duration-200 hover:-translate-y-px"
              >
                Create your workspace
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/6 px-5 py-3.5 text-sm font-semibold text-white/86 transition-colors hover:bg-white/10"
              >
                See a guided demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
