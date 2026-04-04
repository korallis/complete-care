'use client';

/**
 * DemoBookingForm — public demo request form.
 *
 * Collects name, email, organisation name, phone, care domain interest,
 * and a message. Shows a success state after submission.
 *
 * NOTE: This is a client-side form. In production this would call an API
 * route or server action to send the enquiry. For now it simulates success.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  name: string;
  email: string;
  organisation: string;
  phone: string;
  domain: string;
  message: string;
};

const DOMAIN_OPTIONS = [
  { value: '', label: 'Select care domain(s)' },
  { value: 'domiciliary', label: 'Domiciliary Care' },
  { value: 'supported_living', label: 'Supported Living' },
  { value: 'complex_care', label: 'Complex Care' },
  { value: 'childrens_residential', label: "Children's Residential Homes" },
  { value: 'multiple', label: 'Multiple / All Domains' },
];

export function DemoBookingForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    organisation: '',
    phone: '',
    domain: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validateForm(): boolean {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = 'Your name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Your email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.organisation.trim()) newErrors.organisation = 'Organisation name is required';
    if (!form.domain) newErrors.domain = 'Please select a care domain';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    // Simulate async submission (in production this calls an API route)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="bg-white rounded-2xl border border-[oklch(0.91_0.005_160)] shadow-sm p-8 text-center"
        role="status"
        aria-live="polite"
        aria-label="Demo request submitted"
      >
        <div
          className="w-14 h-14 rounded-full bg-[oklch(0.95_0.03_160)] flex items-center justify-center mx-auto mb-5"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.35 0.1 160)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[oklch(0.15_0.03_160)] mb-2">
          Demo request received!
        </h2>
        <p className="text-sm text-[oklch(0.45_0.01_160)] leading-relaxed max-w-sm mx-auto">
          Thank you, {form.name.split(' ')[0]}! We&apos;ll be in touch within one business day
          to schedule your personalised demo at a time that suits you.
        </p>
        <p className="mt-4 text-xs text-[oklch(0.55_0.01_160)]">
          Confirmation sent to{' '}
          <span className="font-medium text-[oklch(0.32_0.02_160)]">{form.email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[oklch(0.91_0.005_160)] shadow-sm p-8">
      <h2 className="text-xl font-bold text-[oklch(0.15_0.03_160)] mb-1">
        Request your demo
      </h2>
      <p className="text-sm text-[oklch(0.48_0.01_160)] mb-6">
        Fill in your details and we&apos;ll be in touch within one business day.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-name"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Full name <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id="demo-name"
            name="name"
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'demo-name-error' : undefined}
            className="h-11"
          />
          {errors.name && (
            <p id="demo-name-error" className="text-xs text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-email"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Work email <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id="demo-email"
            name="email"
            type="email"
            placeholder="jane@sunrisecare.co.uk"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'demo-email-error' : undefined}
            className="h-11"
          />
          {errors.email && (
            <p id="demo-email-error" className="text-xs text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Organisation */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-organisation"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Organisation name <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id="demo-organisation"
            name="organisation"
            type="text"
            placeholder="Sunrise Care Group"
            value={form.organisation}
            onChange={handleChange}
            autoComplete="organization"
            aria-required="true"
            aria-invalid={!!errors.organisation}
            aria-describedby={errors.organisation ? 'demo-org-error' : undefined}
            className="h-11"
          />
          {errors.organisation && (
            <p id="demo-org-error" className="text-xs text-red-600" role="alert">
              {errors.organisation}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-phone"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Phone number{' '}
            <span className="text-[oklch(0.55_0.01_160)] font-normal">(optional)</span>
          </Label>
          <Input
            id="demo-phone"
            name="phone"
            type="tel"
            placeholder="+44 7700 900000"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            className="h-11"
          />
        </div>

        {/* Care domain */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-domain"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Care domain <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <select
            id="demo-domain"
            name="domain"
            value={form.domain}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.domain}
            aria-describedby={errors.domain ? 'demo-domain-error' : undefined}
            className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-[oklch(0.25_0.03_160)]"
          >
            {DOMAIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.domain && (
            <p id="demo-domain-error" className="text-xs text-red-600" role="alert">
              {errors.domain}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demo-message"
            className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
          >
            Anything you&apos;d like us to focus on?{' '}
            <span className="text-[oklch(0.55_0.01_160)] font-normal">(optional)</span>
          </Label>
          <textarea
            id="demo-message"
            name="message"
            rows={3}
            placeholder="e.g. We're particularly interested in the Ofsted compliance tools and staff training matrix..."
            value={form.message}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none text-[oklch(0.25_0.03_160)] placeholder:text-[oklch(0.6_0_0)]"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold text-sm rounded-xl"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending your request…
            </span>
          ) : (
            'Request demo →'
          )}
        </Button>

        <p className="text-xs text-[oklch(0.55_0.01_160)] text-center">
          By submitting this form you agree to our{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-[oklch(0.32_0.02_160)]"
          >
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
