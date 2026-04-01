import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Complete Care',
  description:
    'How Complete Care collects, uses, and protects your personal data. GDPR compliant. Registered in England & Wales.',
  openGraph: {
    title: 'Privacy Policy — Complete Care',
    description: 'How Complete Care handles your personal data under GDPR.',
    type: 'website',
    url: 'https://completecare.co.uk/privacy',
  },
  alternates: {
    canonical: 'https://completecare.co.uk/privacy',
  },
};

const LAST_UPDATED = '1 April 2026';
const COMPANY_NAME = 'Complete Care Ltd';
const COMPANY_NUMBER = '15892734';
const ICO_REGISTRATION = 'ZB445892';
const CONTACT_EMAIL = 'privacy@completecare.co.uk';
const REGISTERED_ADDRESS =
  '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.96_0.01_160)] text-[oklch(0.38_0.05_160)] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Legal
          </div>
          <h1 className="text-4xl font-bold text-[oklch(0.12_0.02_160)] tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-[oklch(0.52_0.01_160)]">
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-6 p-4 rounded-xl bg-[oklch(0.97_0.01_160)] border border-[oklch(0.91_0.005_160)]">
            <p className="text-sm text-[oklch(0.38_0.02_160)] leading-relaxed">
              This Privacy Policy explains how {COMPANY_NAME} (&ldquo;Complete
              Care&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) collects, uses, shares, and protects personal
              data when you use our care management platform. We are committed to
              protecting your privacy and complying with the UK General Data
              Protection Regulation (UK GDPR) and the Data Protection Act 2018.
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
              { n: 1, label: 'Who We Are' },
              { n: 2, label: 'Data We Collect' },
              { n: 3, label: 'How We Use Your Data' },
              { n: 4, label: 'Legal Basis for Processing' },
              { n: 5, label: 'Sharing Your Data' },
              { n: 6, label: 'International Transfers' },
              { n: 7, label: 'Retention Periods' },
              { n: 8, label: 'Cookies & Tracking' },
              { n: 9, label: 'Your Rights Under UK GDPR' },
              { n: 10, label: "Children\u2019s Data" },
              { n: 11, label: 'Security' },
              { n: 12, label: 'Changes to This Policy' },
              { n: 13, label: 'Contact Us & Complaints' },
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
        <div className="prose-custom space-y-12">
          <Section id="section-1" number="1" title="Who We Are">
            <p>
              <strong>{COMPANY_NAME}</strong> is the data controller for personal
              data processed through the Complete Care platform. We are registered
              in England and Wales (Company No. {COMPANY_NUMBER}) with our
              registered office at {REGISTERED_ADDRESS}.
            </p>
            <p>
              We are registered with the Information Commissioner&apos;s Office
              (ICO) under registration number {ICO_REGISTRATION}.
            </p>
            <p>
              Complete Care is a multi-tenant SaaS platform serving UK care
              organisations operating in domiciliary care, supported living, and
              children&apos;s residential homes. As a data processor on behalf of
              our care organisation customers, and as a data controller for
              platform account data, we take data protection obligations seriously.
            </p>
          </Section>

          <Section id="section-2" number="2" title="Data We Collect">
            <SubHeading>Account & Platform Users</SubHeading>
            <ul>
              <li>
                <strong>Account data:</strong> Name, email address, job title,
                phone number, and authentication credentials (hashed password or
                OAuth tokens)
              </li>
              <li>
                <strong>Organisation data:</strong> Organisation name, registered
                address, CQC/Ofsted registration numbers, care domain configuration
              </li>
              <li>
                <strong>Usage data:</strong> Log-in timestamps, feature usage
                events, audit trail entries linked to your user ID
              </li>
              <li>
                <strong>Payment data:</strong> Billing address and payment method
                tokens (handled by Stripe — we never store card numbers)
              </li>
            </ul>

            <SubHeading>Care Recipient Data (Processed on Behalf of Organisations)</SubHeading>
            <p>
              Care organisations input data about the people they support. This
              includes highly sensitive special category data. Complete Care
              processes this as a <strong>data processor</strong> under a Data
              Processing Agreement (DPA) with each organisation:
            </p>
            <ul>
              <li>Names, dates of birth, NHS numbers, contact details</li>
              <li>Health and medical information (care plans, medication records, clinical assessments)</li>
              <li>Safeguarding records, incident reports, risk assessments</li>
              <li>
                For children&apos;s homes: legal status, LAC documentation, placement
                plans, education records
              </li>
            </ul>

            <SubHeading>Technical Data</SubHeading>
            <ul>
              <li>IP addresses, browser type and version, operating system</li>
              <li>
                Device identifiers and session tokens (stored in HTTP-only cookies)
              </li>
              <li>
                Performance and error logs (anonymised where possible)
              </li>
            </ul>

            <SubHeading>Cookies</SubHeading>
            <p>
              We use cookies and localStorage to operate the platform. See{' '}
              <a href="#section-8">Section 8</a> for full details.
            </p>
          </Section>

          <Section id="section-3" number="3" title="How We Use Your Data">
            <ul>
              <li>
                <strong>Providing the service:</strong> Account management,
                authentication, platform features, and subscription billing
              </li>
              <li>
                <strong>Security:</strong> Fraud detection, rate limiting, audit
                logging, and intrusion detection
              </li>
              <li>
                <strong>Communications:</strong> Transactional emails (account
                verification, password reset, billing notifications), product
                updates (if opted in), and support responses
              </li>
              <li>
                <strong>Legal compliance:</strong> Responding to lawful requests
                from regulators (CQC, Ofsted, ICO), courts, or law enforcement
              </li>
              <li>
                <strong>Improvement:</strong> Aggregate, anonymised analytics to
                understand feature usage and improve the platform
              </li>
            </ul>
          </Section>

          <Section id="section-4" number="4" title="Legal Basis for Processing">
            <ul>
              <li>
                <strong>Contract performance:</strong> Processing necessary to
                provide the service you subscribed to (UK GDPR Article 6(1)(b))
              </li>
              <li>
                <strong>Legitimate interests:</strong> Security monitoring, fraud
                prevention, and service improvement (Article 6(1)(f))
              </li>
              <li>
                <strong>Legal obligation:</strong> Compliance with UK law,
                regulatory requests (Article 6(1)(c))
              </li>
              <li>
                <strong>Consent:</strong> Marketing communications and
                non-essential cookies (Article 6(1)(a))
              </li>
              <li>
                <strong>Special category data:</strong> Processing health and
                safeguarding data on behalf of care organisations relies on
                Article 9(2)(h) (health and social care purposes) and the
                Schedule 1 conditions in the Data Protection Act 2018
              </li>
            </ul>
          </Section>

          <Section id="section-5" number="5" title="Sharing Your Data">
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul>
              <li>
                <strong>Vercel Inc.</strong> — hosting and infrastructure (servers
                in the EU/EEA and USA; covered by Standard Contractual Clauses)
              </li>
              <li>
                <strong>Neon (Neondatabase Inc.)</strong> — database hosting (EU
                region selected; DPA in place)
              </li>
              <li>
                <strong>Stripe Inc.</strong> — payment processing (PCI-DSS Level 1
                certified)
              </li>
              <li>
                <strong>Amazon Web Services (AWS)</strong> — AI processing via
                Bedrock (UK/EU regions preferred; DPA in place)
              </li>
              <li>
                <strong>Regulators and law enforcement</strong> — only when legally
                required and after legal review
              </li>
            </ul>
            <p>
              All sub-processors are bound by Data Processing Agreements meeting UK
              GDPR requirements.
            </p>
          </Section>

          <Section id="section-6" number="6" title="International Transfers">
            <p>
              Some sub-processors store or process data outside the UK/EEA. Where
              this occurs, we rely on:
            </p>
            <ul>
              <li>
                UK Government adequacy regulations (for countries with equivalent
                protection)
              </li>
              <li>
                International Data Transfer Agreements (IDTAs) or Standard
                Contractual Clauses (SCCs) approved by the ICO
              </li>
            </ul>
          </Section>

          <Section id="section-7" number="7" title="Retention Periods">
            <ul>
              <li>
                <strong>Account data:</strong> Retained for the duration of your
                subscription plus 7 years (financial records obligation)
              </li>
              <li>
                <strong>Care records (adult services):</strong> Minimum 8 years
                after last contact per CQC guidance; longer for complex cases
              </li>
              <li>
                <strong>Children&apos;s records:</strong> 75 years from date of
                birth per Schedule 3 of the Children Act 1989 guidance
              </li>
              <li>
                <strong>Audit logs:</strong> 10 years for regulatory compliance
              </li>
              <li>
                <strong>Security logs:</strong> 90 days rolling retention
              </li>
              <li>
                <strong>Deleted account data:</strong> Anonymised within 30 days
                of account closure request (subject to legal hold requirements)
              </li>
            </ul>
          </Section>

          <Section id="section-8" number="8" title="Cookies & Tracking">
            <p>
              We use the following types of cookies and storage:
            </p>

            <SubHeading>Essential (Always Active)</SubHeading>
            <ul>
              <li>
                <strong>Session cookie</strong> (<code>__Secure-next-auth.session-token</code>):
                HTTP-only, Secure, SameSite=Lax. Stores your encrypted
                authentication token. Expires on browser close or after 30 days.
              </li>
              <li>
                <strong>CSRF token</strong>: Prevents cross-site request forgery.
                Session-scoped.
              </li>
            </ul>

            <SubHeading>Functional</SubHeading>
            <ul>
              <li>
                <strong>Cookie consent preference</strong>{' '}
                (<code>cc_consent</code>): Stored in localStorage. Records whether
                you accepted or rejected non-essential cookies. Expires after 12
                months.
              </li>
              <li>
                <strong>Organisation context</strong>: Your active organisation
                selection, stored in your session JWT.
              </li>
            </ul>

            <SubHeading>Analytics (Consent Required)</SubHeading>
            <p>
              We only activate analytics cookies after you explicitly accept cookies
              via our consent banner. We do not use advertising or cross-site
              tracking cookies.
            </p>

            <p>
              You can withdraw cookie consent at any time by visiting our{' '}
              <Link href="/#cookie-preferences" className="text-[oklch(0.38_0.05_160)] hover:underline">
                cookie preferences centre
              </Link>{' '}
              or clearing your browser&apos;s localStorage and cookies.
            </p>
          </Section>

          <Section id="section-9" number="9" title="Your Rights Under UK GDPR">
            <p>
              As a data subject, you have the following rights. To exercise any of
              these, contact us at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[oklch(0.38_0.05_160)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              :
            </p>
            <ul>
              <li>
                <strong>Right of access</strong> — Request a copy of personal data
                we hold about you (Subject Access Request)
              </li>
              <li>
                <strong>Right to rectification</strong> — Have inaccurate data
                corrected
              </li>
              <li>
                <strong>Right to erasure</strong> — Request deletion of your data
                (where no legal obligation to retain)
              </li>
              <li>
                <strong>Right to restrict processing</strong> — Limit how we
                process your data in certain circumstances
              </li>
              <li>
                <strong>Right to data portability</strong> — Receive your data in
                a structured, machine-readable format
              </li>
              <li>
                <strong>Right to object</strong> — Object to processing based on
                legitimate interests or for direct marketing
              </li>
              <li>
                <strong>Rights related to automated decision-making</strong> — Not
                to be subject to solely automated decisions with significant effects
              </li>
            </ul>
            <p>
              We will respond to all requests within <strong>one calendar month</strong>.
              If your request is complex, we may extend this by two further months
              with notification.
            </p>
          </Section>

          <Section id="section-10" number="10" title="Children\u2019s Data">
            <p>
              The Complete Care platform is not intended for direct use by
              children. Our customers are care organisations, and any data about
              children (young people in residential care) is processed strictly as
              a data processor under the care organisation&apos;s instructions.
            </p>
            <p>
              If you believe we have inadvertently collected personal data about a
              child outside of a care organisation context, please contact{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[oklch(0.38_0.05_160)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{' '}
              immediately and we will delete it promptly.
            </p>
          </Section>

          <Section id="section-11" number="11" title="Security">
            <p>
              We implement technical and organisational measures proportionate to
              the sensitivity of the data we hold:
            </p>
            <ul>
              <li>Encryption at rest (AES-256) and in transit (TLS 1.3)</li>
              <li>HTTP-only, Secure, SameSite cookies for session management</li>
              <li>Bcrypt password hashing (cost factor 12)</li>
              <li>Role-based access control with principle of least privilege</li>
              <li>Immutable audit logs on all data mutations</li>
              <li>Multi-tenant data isolation enforced at application and database layers</li>
              <li>Regular penetration testing and vulnerability assessments</li>
              <li>
                NHS DSPT (Data Security and Protection Toolkit) alignment for
                organisations handling NHS-referred clients
              </li>
            </ul>
            <p>
              In the event of a personal data breach affecting your rights and
              freedoms, we will notify the ICO within 72 hours and affected
              individuals without undue delay, as required by UK GDPR Article 33.
            </p>
          </Section>

          <Section id="section-12" number="12" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make
              material changes, we will:
            </p>
            <ul>
              <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
              <li>Email registered account holders at least 14 days before the change takes effect</li>
              <li>Display a banner in the platform dashboard</li>
            </ul>
            <p>
              Continued use of the platform after the effective date constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section id="section-13" number="13" title="Contact Us & Complaints">
            <p>
              For any privacy-related queries, Subject Access Requests, or to
              exercise your rights:
            </p>
            <div className="mt-4 p-5 rounded-xl bg-[oklch(0.97_0.01_160)] border border-[oklch(0.91_0.005_160)] text-sm space-y-1.5">
              <p>
                <strong>Data Protection Officer</strong>
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
            <p className="mt-6">
              If you are unhappy with how we have handled your personal data, you
              have the right to lodge a complaint with the{' '}
              <strong>Information Commissioner&apos;s Office (ICO)</strong>:
            </p>
            <ul>
              <li>
                Website:{' '}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[oklch(0.38_0.05_160)] hover:underline"
                >
                  ico.org.uk
                </a>
              </li>
              <li>Telephone: 0303 123 1113</li>
            </ul>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[oklch(0.91_0.005_160)] flex flex-wrap gap-4 text-sm">
          <Link
            href="/terms"
            className="text-[oklch(0.38_0.04_160)] hover:text-[oklch(0.22_0.04_160)] hover:underline transition-colors"
          >
            Terms of Service
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
      <div className="ml-8 space-y-3 text-[15px] text-[oklch(0.35_0.01_160)] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_a]:text-[oklch(0.38_0.05_160)] [&_a:hover]:underline [&_strong]:text-[oklch(0.22_0.02_160)] [&_code]:text-xs [&_code]:bg-[oklch(0.96_0.01_160)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-semibold text-[oklch(0.25_0.02_160)] mt-5 mb-2">
      {children}
    </p>
  );
}
