import Link from 'next/link';
import { CreditCard, CheckCircle2, Zap, Building2 } from 'lucide-react';

const PLAN_FEATURES = {
  free: [
    '1 service location',
    'Up to 10 staff members',
    'Up to 25 people in care',
    'Core care planning features',
    'Basic audit trail',
    'Email support',
  ],
  professional: [
    'Unlimited service locations',
    'Unlimited staff members',
    'Unlimited people in care',
    'All care management features',
    'Full audit trail & compliance tools',
    'AI-powered care note assistance',
    'Priority support',
    'Advanced reporting',
  ],
  enterprise: [
    'Everything in Professional',
    'Multi-organisation management',
    'Custom integrations',
    'Dedicated account manager',
    'On-site training',
    'SLA guarantee',
    'Custom data retention policies',
  ],
};

export function BillingContent() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_160)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Page header */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CreditCard className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
              Billing &amp; Subscription
            </h1>
            <p className="text-sm text-[oklch(0.48_0_0)] mt-0.5">
              Manage your plan, payment details, and invoices.
            </p>
          </div>
        </div>

        {/* Current plan */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[oklch(0.93_0.005_160)] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
                Current plan
              </h2>
              <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
                Your organisation is on the <strong className="text-[oklch(0.25_0.02_160)]">Free</strong> plan.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.01_160)] border border-[oklch(0.88_0.02_160)] px-3 py-1 text-xs font-semibold text-[oklch(0.35_0.06_160)]">
              Free
            </span>
          </div>

          <div className="px-6 py-5">
            <ul className="space-y-2">
              {PLAN_FEATURES.free.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-[oklch(0.35_0.02_160)]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upgrade options */}
        <div>
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-4">
            Upgrade your plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Professional */}
            <div className="rounded-xl border-2 border-[oklch(0.35_0.06_160)] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-[oklch(0.22_0.04_160)] flex items-center gap-2">
                <Zap className="h-4 w-4 text-white" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">Professional</span>
                <span className="ml-auto text-sm font-bold text-white">£149/mo</span>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-2 mb-5">
                  {PLAN_FEATURES.professional.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-[oklch(0.35_0.02_160)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="block w-full text-center rounded-lg bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white text-sm font-semibold py-2.5 transition-colors"
                >
                  Upgrade to Professional
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-[oklch(0.96_0.01_160)] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[oklch(0.35_0.06_160)]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[oklch(0.22_0.02_160)]">Enterprise</span>
                <span className="ml-auto text-xs text-[oklch(0.48_0_0)] font-medium">Custom pricing</span>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-2 mb-5">
                  {PLAN_FEATURES.enterprise.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-[oklch(0.35_0.02_160)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/demo"
                  className="block w-full text-center rounded-lg border border-[oklch(0.88_0.005_160)] hover:bg-[oklch(0.97_0.003_160)] text-[oklch(0.25_0.03_160)] text-sm font-semibold py-2.5 transition-colors"
                >
                  Contact sales
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Billing portal placeholder */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-2">
            Payment &amp; invoices
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Full payment management, invoice history, and subscription controls will be available once you upgrade to a paid plan.
            Contact{' '}
            <a href="mailto:billing@completecare.co.uk" className="text-[oklch(0.35_0.06_160)] hover:underline font-medium">
              billing@completecare.co.uk
            </a>{' '}
            for billing enquiries.
          </p>
        </div>

      </div>
    </div>
  );
}
