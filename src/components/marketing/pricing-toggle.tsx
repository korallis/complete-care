'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X, Zap, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingCycle = 'monthly' | 'annual';

type PricingTier = {
  id: string;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
};

type ComparisonRow = {
  category: string;
  feature: string;
  free: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for single-site providers getting started.',
    cta: 'Get started free',
    ctaHref: '/register?plan=free',
    highlighted: false,
    features: [
      '1 service location',
      'Up to 10 staff',
      'Up to 25 people in care',
      'Core care notes & care plans',
      'Basic staff profiles',
      'Mobile PWA access',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 119,
    description: 'For growing care organisations that need the full toolkit.',
    cta: 'Start free trial',
    ctaHref: '/register?plan=professional',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Unlimited service locations',
      'Unlimited staff',
      'Unlimited people in care',
      'Full EMAR (NICE SC1 compliant)',
      'CQC & Ofsted compliance tools',
      'AI care note assistance',
      'Clinical monitoring (NEWS2, MUST)',
      'Staff compliance dashboard',
      'Incident & accident reporting',
      'Rostering & scheduling',
      'Audit trail & reporting',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'Bespoke solutions for large groups and local authorities.',
    cta: 'Contact sales',
    ctaHref: '/demo',
    highlighted: false,
    features: [
      'Everything in Professional',
      'Custom contract & SLA',
      'Dedicated account manager',
      'Data migration support',
      'Custom integrations (API)',
      'SSO / SAML authentication',
      'NHS DSPT compliance support',
      'Custom training & onboarding',
      'Uptime SLA guarantee',
      'Custom data retention policies',
    ],
  },
];

const COMPARISON: ComparisonRow[] = [
  // Care Management
  { category: 'Care Management', feature: 'Care notes & care plans', free: true, professional: true, enterprise: true },
  { category: 'Care Management', feature: 'Risk assessments', free: 'Basic', professional: true, enterprise: true },
  { category: 'Care Management', feature: 'Body map tool', free: false, professional: true, enterprise: true },
  { category: 'Care Management', feature: 'Document management', free: '5 GB', professional: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Care Management', feature: 'Incident & accident reporting', free: false, professional: true, enterprise: true },
  // EMAR & Clinical
  { category: 'EMAR & Clinical', feature: 'Digital MAR chart (NICE SC1)', free: false, professional: true, enterprise: true },
  { category: 'EMAR & Clinical', feature: 'Controlled drugs register', free: false, professional: true, enterprise: true },
  { category: 'EMAR & Clinical', feature: 'Clinical monitoring (NEWS2, MUST)', free: false, professional: true, enterprise: true },
  { category: 'EMAR & Clinical', feature: 'Mental Capacity Assessments', free: false, professional: true, enterprise: true },
  // Staff Management
  { category: 'Staff Management', feature: 'Staff profiles', free: 'Up to 10', professional: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Staff Management', feature: 'DBS & training tracking', free: false, professional: true, enterprise: true },
  { category: 'Staff Management', feature: 'Compliance dashboard (RAG)', free: false, professional: true, enterprise: true },
  { category: 'Staff Management', feature: 'Rostering & scheduling', free: false, professional: true, enterprise: true },
  // Compliance
  { category: 'Compliance', feature: 'CQC Quality Statements mapping', free: false, professional: true, enterprise: true },
  { category: 'Compliance', feature: 'Ofsted 9 Quality Standards', free: false, professional: true, enterprise: true },
  { category: 'Compliance', feature: 'Audit trail', free: '30 days', professional: '7 years', enterprise: 'Custom' },
  { category: 'Compliance', feature: 'AI inspection readiness score', free: false, professional: true, enterprise: true },
  // AI Features
  { category: 'AI Features', feature: 'AI care note assistance', free: false, professional: true, enterprise: true },
  { category: 'AI Features', feature: 'AI risk prediction', free: false, professional: true, enterprise: true },
  { category: 'AI Features', feature: 'AI compliance gap detection', free: false, professional: true, enterprise: true },
  // Platform
  { category: 'Platform', feature: 'Mobile PWA (offline capable)', free: true, professional: true, enterprise: true },
  { category: 'Platform', feature: 'Multi-tenant org management', free: false, professional: true, enterprise: true },
  { category: 'Platform', feature: 'SSO / SAML', free: false, professional: false, enterprise: true },
  { category: 'Platform', feature: 'Custom API access', free: false, professional: false, enterprise: true },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <td className="px-4 py-3 text-center">
        <Check className="w-4 h-4 text-[oklch(0.52_0.14_160)] mx-auto" aria-label="Included" />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className="px-4 py-3 text-center">
        <X className="w-4 h-4 text-[oklch(0.78_0_0)] mx-auto" aria-label="Not included" />
      </td>
    );
  }
  return (
    <td className="px-4 py-3 text-center">
      <span className="text-xs font-medium text-[oklch(0.45_0.03_160)]">{value}</span>
    </td>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PricingContent() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const groupedComparison = COMPARISON.reduce<Record<string, ComparisonRow[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Toggle                                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <span
          className={`text-sm font-medium transition-colors ${
            billing === 'monthly'
              ? 'text-[oklch(0.18_0.03_160)]'
              : 'text-[oklch(0.62_0.01_160)]'
          }`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'annual'}
          aria-label="Toggle annual billing"
          onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.12_160)] focus-visible:ring-offset-2 ${
            billing === 'annual'
              ? 'bg-[oklch(0.22_0.04_160)]'
              : 'bg-[oklch(0.85_0_0)]'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              billing === 'annual' ? 'translate-x-7' : 'translate-x-1'
            }`}
            aria-hidden="true"
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors flex items-center gap-2 ${
            billing === 'annual'
              ? 'text-[oklch(0.18_0.03_160)]'
              : 'text-[oklch(0.62_0.01_160)]'
          }`}
        >
          Annual
          {billing === 'annual' && (
            <span className="inline-flex items-center gap-1 bg-[oklch(0.88_0.12_130)] text-[oklch(0.28_0.08_160)] text-[11px] font-bold px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" aria-hidden="true" />
              Save 20%
            </span>
          )}
        </span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Tier Cards                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {TIERS.map((tier) => {
          const price =
            tier.monthlyPrice === null
              ? null
              : billing === 'annual'
              ? tier.annualPrice
              : tier.monthlyPrice;

          return (
            <article
              key={tier.id}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? 'bg-[oklch(0.14_0.03_160)] text-white shadow-2xl shadow-[oklch(0.14_0.03_160)/0.3] ring-2 ring-[oklch(0.35_0.06_160)]'
                  : 'bg-white border border-[oklch(0.91_0.005_160)]'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-[oklch(0.82_0.14_130)] text-[oklch(0.18_0.06_160)] text-xs font-bold px-3 py-1 rounded-full shadow">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-lg font-bold tracking-tight ${
                    tier.highlighted ? 'text-white' : 'text-[oklch(0.18_0.03_160)]'
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    tier.highlighted ? 'text-white/60' : 'text-[oklch(0.52_0.01_160)]'
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {price === null ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold tracking-tight ${
                        tier.highlighted ? 'text-white' : 'text-[oklch(0.18_0.03_160)]'
                      }`}
                    >
                      Custom
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold tracking-tight ${
                        tier.highlighted ? 'text-white' : 'text-[oklch(0.18_0.03_160)]'
                      }`}
                    >
                      {price === 0 ? 'Free' : `£${price}`}
                    </span>
                    {price !== 0 && (
                      <span
                        className={`text-sm ${
                          tier.highlighted ? 'text-white/60' : 'text-[oklch(0.52_0.01_160)]'
                        }`}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                )}
                {billing === 'annual' && price !== null && price !== 0 && (
                  <p
                    className={`text-xs mt-1 ${
                      tier.highlighted ? 'text-[oklch(0.78_0.08_130)]' : 'text-[oklch(0.48_0.06_160)]'
                    }`}
                  >
                    Billed £{price * 12}/year · Save £{(tier.monthlyPrice! - price) * 12}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all ${
                  tier.highlighted
                    ? 'bg-white text-[oklch(0.18_0.03_160)] hover:bg-[oklch(0.94_0.01_160)]'
                    : 'bg-[oklch(0.22_0.04_160)] text-white hover:bg-[oklch(0.28_0.05_160)]'
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              {/* Feature list */}
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        tier.highlighted
                          ? 'text-[oklch(0.78_0.12_130)]'
                          : 'text-[oklch(0.52_0.12_160)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-sm ${
                        tier.highlighted ? 'text-white/80' : 'text-[oklch(0.38_0.02_160)]'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Feature Comparison Table                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-[oklch(0.15_0.03_160)] tracking-tight text-center mb-10">
          Compare all features
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-[oklch(0.88_0.005_160)] shadow-sm">
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.91_0.005_160)] bg-[oklch(0.98_0.003_160)]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[oklch(0.45_0.01_160)] uppercase tracking-wide w-[44%]">
                  Feature
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    className={`px-4 py-4 text-center text-sm font-bold ${
                      tier.highlighted
                        ? 'text-[oklch(0.22_0.04_160)]'
                        : 'text-[oklch(0.38_0.01_160)]'
                    }`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedComparison).map(([category, rows]) => (
                <React.Fragment key={category}>
                  <tr className="bg-[oklch(0.965_0.005_160)]">
                    <td
                      colSpan={4}
                      className="px-6 py-2.5 text-xs font-bold text-[oklch(0.35_0.03_160)] uppercase tracking-widest"
                    >
                      {category}
                    </td>
                  </tr>
                  {rows.map((row, i) => (
                    <tr
                      key={`${category}-${row.feature}`}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-[oklch(0.99_0.002_160)]'}
                    >
                      <td className="px-6 py-3 text-sm text-[oklch(0.32_0.02_160)]">
                        {row.feature}
                      </td>
                      <FeatureCell value={row.free} />
                      <td className="px-4 py-3 text-center bg-[oklch(0.97_0.01_160)]">
                        {row.professional === true ? (
                          <Check className="w-4 h-4 text-[oklch(0.52_0.14_160)] mx-auto" aria-label="Included" />
                        ) : row.professional === false ? (
                          <X className="w-4 h-4 text-[oklch(0.78_0_0)] mx-auto" aria-label="Not included" />
                        ) : (
                          <span className="text-xs font-medium text-[oklch(0.45_0.03_160)]">{row.professional}</span>
                        )}
                      </td>
                      <FeatureCell value={row.enterprise} />
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
