import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Complete Care',
  description:
    'Terms of Service for Complete Care — the UK care management platform. Read your rights, obligations, and service commitments.',
  openGraph: {
    title: 'Terms of Service — Complete Care',
    description: 'Terms governing your use of the Complete Care platform.',
    type: 'website',
    url: 'https://completecare.co.uk/terms',
  },
  alternates: {
    canonical: 'https://completecare.co.uk/terms',
  },
};

const LAST_UPDATED = '1 April 2026';
const COMPANY_NAME = 'Complete Care Ltd';
const COMPANY_NUMBER = '15892734';
const CONTACT_EMAIL = 'legal@completecare.co.uk';
const REGISTERED_ADDRESS =
  '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.96_0.01_160)] text-[oklch(0.38_0.05_160)] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Legal
          </div>
          <h1 className="text-4xl font-bold text-[oklch(0.12_0.02_160)] tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-[oklch(0.52_0.01_160)]">
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-6 p-4 rounded-xl bg-[oklch(0.97_0.01_160)] border border-[oklch(0.91_0.005_160)]">
            <p className="text-sm text-[oklch(0.38_0.02_160)] leading-relaxed">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the
              Complete Care platform operated by {COMPANY_NAME}, registered in
              England and Wales (Company No. {COMPANY_NUMBER}). By creating an
              account or accessing the platform, you agree to be bound by these
              Terms. If you do not agree, do not use the platform.
            </p>
          </div>
        </div>

        {/* Table of contents */}
        <nav
          className="mb-12 p-6 rounded-2xl bg-[oklch(0.97_0.01_160)] border border-[oklch(0.91_0.005_160)]"
          aria-label="Table of contents"
        >
          <h2 className="text-xs font-semibold text-[oklch(0.52_0.01_160)] uppercase tracking-widest mb-4">
            Contents
          </h2>
          <ol className="space-y-1.5 text-sm">
            {[
              { n: 1, label: 'Definitions' },
              { n: 2, label: 'Account Registration & Eligibility' },
              { n: 3, label: 'Subscription Plans & Billing' },
              { n: 4, label: 'Acceptable Use' },
              { n: 5, label: 'Data Processing & Ownership' },
              { n: 6, label: 'Intellectual Property' },
              { n: 7, label: 'Confidentiality' },
              { n: 8, label: 'Service Availability & SLA' },
              { n: 9, label: 'Liability & Indemnity' },
              { n: 10, label: 'Regulatory Compliance' },
              { n: 11, label: 'Termination' },
              { n: 12, label: 'Governing Law & Disputes' },
              { n: 13, label: 'Changes to These Terms' },
              { n: 14, label: 'Contact' },
            ].map(({ n, label }) => (
              <li key={n}>
                <a
                  href={`#section-${n}`}
                  className="flex items-center gap-2 text-[oklch(0.38_0.04_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors group"
                >
                  <span className="text-[oklch(0.72_0.02_160)] text-xs w-4 shrink-0 font-mono">
                    {n}.
                  </span>
                  <span className="group-hover:underline">{label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="space-y-12">
          <Section id="section-1" number="1" title="Definitions">
            <ul>
              <li>
                <strong>&ldquo;Platform&rdquo;</strong> means the Complete Care
                web application, APIs, and associated services.
              </li>
              <li>
                <strong>&ldquo;Organisation&rdquo;</strong> means the care
                provider entity that subscribes to the platform.
              </li>
              <li>
                <strong>&ldquo;User&rdquo;</strong> means any individual granted
                access under an Organisation account.
              </li>
              <li>
                <strong>&ldquo;Customer Data&rdquo;</strong> means all data
                submitted by you or your Users to the platform, including care
                records, staff records, and personal data of people receiving care.
              </li>
              <li>
                <strong>&ldquo;Subscription&rdquo;</strong> means a paid or free
                plan as described on our pricing page.
              </li>
            </ul>
          </Section>

          <Section id="section-2" number="2" title="Account Registration & Eligibility">
            <p>To use Complete Care you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>
                Act on behalf of a legitimate care organisation registered and
                operating in the United Kingdom
              </li>
              <li>
                Provide accurate registration information and keep it up to date
              </li>
              <li>
                Be authorised to bind your organisation to these Terms
              </li>
            </ul>
            <p>
              You are responsible for maintaining the confidentiality of your login
              credentials. Notify us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you
              suspect unauthorised access.
            </p>
            <p>
              We reserve the right to refuse registration or suspend accounts at
              our discretion, particularly where we believe the platform is being
              used for unlawful purposes.
            </p>
          </Section>

          <Section id="section-3" number="3" title="Subscription Plans & Billing">
            <p>
              The platform is offered on tiered subscription plans (Free,
              Professional, Enterprise) with features and limits as described on{' '}
              <Link href="/pricing">our pricing page</Link>. Plan details may
              change; existing subscribers will receive 30 days&apos; notice of
              material price increases.
            </p>
            <ul>
              <li>
                <strong>Free plan:</strong> No payment required. Subject to feature
                and capacity limits as published.
              </li>
              <li>
                <strong>Paid plans:</strong> Billed monthly or annually via Stripe.
                Invoices are issued automatically. All prices are in GBP and
                exclusive of VAT unless stated.
              </li>
              <li>
                <strong>Non-payment:</strong> If payment fails, we will retry
                within 7 days. Continued non-payment may result in service
                suspension and data export facilitation for 30 days.
              </li>
              <li>
                <strong>Refunds:</strong> Monthly plans may be cancelled at any
                time; no refund for the current period. Annual plans: pro-rata
                refund within 30 days of payment if you request cancellation.
              </li>
            </ul>
          </Section>

          <Section id="section-4" number="4" title="Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the platform for any unlawful purpose or in violation of any
                applicable UK law or regulation
              </li>
              <li>
                Attempt to gain unauthorised access to other organisations&apos;
                data, systems, or accounts
              </li>
              <li>
                Upload malicious code, viruses, or disruptive content
              </li>
              <li>
                Scrape, reverse-engineer, or copy the platform for competitive
                purposes
              </li>
              <li>
                Use the platform to process data for organisations other than
                those registered on your account
              </li>
              <li>
                Circumvent rate limits, security controls, or access restrictions
              </li>
            </ul>
            <p>
              Complete Care is intended for professional care management purposes.
              Use in clinical settings is the responsibility of the Organisation,
              which remains accountable to its regulator (CQC or Ofsted).
            </p>
          </Section>

          <Section id="section-5" number="5" title="Data Processing & Ownership">
            <p>
              <strong>You own your Customer Data.</strong> We claim no intellectual
              property rights over the data you input.
            </p>
            <p>
              By using the platform, you grant us a limited licence to process
              Customer Data solely to provide and improve the platform in
              accordance with our{' '}
              <Link href="/privacy">Privacy Policy</Link> and the Data Processing
              Agreement (DPA) you enter into on subscription.
            </p>
            <p>
              On account termination or cancellation, you may export your data via
              the platform&apos;s data export tools for 30 days. After this period,
              Customer Data will be securely deleted, subject to legal retention
              obligations (see our Privacy Policy, Section 7).
            </p>
            <p>
              You warrant that you have obtained all necessary consents and have a
              lawful basis to process any personal data you input, in accordance
              with UK GDPR and the Data Protection Act 2018.
            </p>
          </Section>

          <Section id="section-6" number="6" title="Intellectual Property">
            <p>
              Complete Care, its design, code, trademarks, and content are owned
              by or licensed to {COMPANY_NAME}. These Terms do not transfer any
              intellectual property rights to you.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable,
              non-sublicensable licence to access and use the platform for your
              internal care management purposes during the subscription term.
            </p>
          </Section>

          <Section id="section-7" number="7" title="Confidentiality">
            <p>
              Each party agrees to keep confidential any non-public information
              disclosed by the other party in connection with these Terms, including
              business information, technical specifications, and Customer Data.
            </p>
            <p>
              We will not disclose Customer Data to third parties except as
              necessary to provide the platform, as required by law, or as
              permitted by our Privacy Policy.
            </p>
          </Section>

          <Section id="section-8" number="8" title="Service Availability & SLA">
            <p>
              We target <strong>99.5% monthly uptime</strong> for paid plans. This
              excludes:
            </p>
            <ul>
              <li>
                Scheduled maintenance (announced with 48 hours&apos; notice where
                possible)
              </li>
              <li>Events outside our reasonable control (force majeure)</li>
              <li>Issues caused by your equipment, network, or third-party services</li>
            </ul>
            <p>
              Free plan users receive best-effort availability without SLA
              guarantees.
            </p>
            <p>
              In the event of significant outage (&gt;2 hours), we will post
              updates to our status page and notify affected subscribers by email.
            </p>
          </Section>

          <Section id="section-9" number="9" title="Liability & Indemnity">
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul>
              <li>
                Our aggregate liability to you under these Terms shall not exceed
                the greater of: (a) the total fees paid by you in the 12 months
                preceding the claim; or (b) £500.
              </li>
              <li>
                We are not liable for indirect, special, consequential, or punitive
                damages, loss of profits, or loss of data.
              </li>
              <li>
                Nothing in these Terms limits liability for death or personal
                injury caused by negligence, fraud, or any liability that cannot be
                excluded under UK law.
              </li>
            </ul>
            <p>
              You agree to indemnify and hold harmless {COMPANY_NAME} against any
              claims, losses, or expenses arising from your breach of these Terms
              or your use of the platform in violation of applicable law.
            </p>
            <p>
              <strong>Important:</strong> Complete Care is a care management tool.
              Clinical and care decisions remain the professional and regulatory
              responsibility of your organisation and its registered practitioners.
              We are not a regulated health professional and do not provide medical
              advice.
            </p>
          </Section>

          <Section id="section-10" number="10" title="Regulatory Compliance">
            <p>
              You are responsible for ensuring your use of the platform complies
              with your regulatory obligations including but not limited to:
            </p>
            <ul>
              <li>
                CQC registration and compliance with the Health and Social Care
                Act 2008 (Regulated Activities) Regulations 2014
              </li>
              <li>
                Ofsted registration and compliance with the Children&apos;s Homes
                (England) Regulations 2015
              </li>
              <li>UK GDPR and the Data Protection Act 2018</li>
              <li>The Care Act 2014, Children Act 1989 and associated guidance</li>
            </ul>
            <p>
              Complete Care provides tools designed to assist with compliance but
              does not guarantee that your use of the platform will satisfy
              regulatory requirements. Compliance is your organisation&apos;s
              responsibility.
            </p>
          </Section>

          <Section id="section-11" number="11" title="Termination">
            <p>
              <strong>By you:</strong> You may cancel your subscription at any
              time via your account settings. Your access continues until the end
              of the current billing period.
            </p>
            <p>
              <strong>By us:</strong> We may suspend or terminate your account
              with 30 days&apos; written notice for any reason, or immediately if
              you breach these Terms, fail to pay, or use the platform in a way
              that poses a risk to others.
            </p>
            <p>
              On termination, your right to access the platform ceases. Sections
              5, 6, 7, 9, and 12 survive termination.
            </p>
          </Section>

          <Section id="section-12" number="12" title="Governing Law & Disputes">
            <p>
              These Terms are governed by the laws of England and Wales. Any
              disputes arising under these Terms shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
            <p>
              Before initiating legal proceedings, you agree to notify us in
              writing and allow 30 days to attempt resolution in good faith.
            </p>
          </Section>

          <Section id="section-13" number="13" title="Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we make material
              changes, we will:
            </p>
            <ul>
              <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
              <li>
                Email registered account holders at least 30 days before the
                changes take effect for existing subscribers
              </li>
              <li>Display a notification in the platform</li>
            </ul>
            <p>
              Continued use of the platform after the effective date of updated
              Terms constitutes acceptance. If you do not accept the updated Terms,
              you must stop using the platform.
            </p>
          </Section>

          <Section id="section-14" number="14" title="Contact">
            <div className="p-5 rounded-xl bg-[oklch(0.97_0.01_160)] border border-[oklch(0.91_0.005_160)] text-sm space-y-1.5">
              <p>
                <strong>Legal Enquiries</strong>
              </p>
              <p>{COMPANY_NAME}</p>
              <p>{REGISTERED_ADDRESS}</p>
              <p>
                Email:{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[oklch(0.38_0.05_160)] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[oklch(0.91_0.005_160)] flex flex-wrap gap-4 text-sm">
          <Link
            href="/privacy"
            className="text-[oklch(0.38_0.04_160)] hover:text-[oklch(0.22_0.04_160)] hover:underline transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="text-[oklch(0.38_0.04_160)] hover:text-[oklch(0.22_0.04_160)] hover:underline transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-xs font-mono font-semibold text-[oklch(0.72_0.02_160)] shrink-0 w-5">
          {number}.
        </span>
        <h2 className="text-xl font-bold text-[oklch(0.12_0.02_160)] tracking-tight">
          {title}
        </h2>
      </div>
      <div className="ml-8 space-y-3 text-[15px] text-[oklch(0.35_0.01_160)] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_a]:text-[oklch(0.38_0.05_160)] [&_a:hover]:underline [&_strong]:text-[oklch(0.22_0.02_160)]">
        {children}
      </div>
    </section>
  );
}
