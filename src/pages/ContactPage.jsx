import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  MessageSquare,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Copy,
} from 'lucide-react';

import { Card, PageHeader } from '../components/common/OdometerPrimitives';

const TOPIC_OPTIONS = [
  { value: 'general', label: 'General Feedback or Suggestion' },
  { value: 'vehicle-correction', label: 'Vehicle Catalog / Spec Correction' },
  { value: 'obd-calibration', label: 'OBD-II Dossier Calibration' },
  { value: 'editorial', label: 'Editorial or Guide Question' },
  { value: 'legal', label: 'Data Privacy / GDPR Inquiry' },
  { value: 'advertising', label: 'Advertising & Commercial Partnerships' },
];

export default function ContactPage({ onNavigateTab, onOpenLegalModal }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general',
    vehicleDetails: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [copiedInquiry, setCopiedInquiry] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Please enter your full name (at least 2 characters).';
        }
        return null;
      case 'email':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address.';
        }
        return null;
      case 'message':
        if (!value || value.trim().length < 10) {
          return 'Please provide more details (at least 10 characters).';
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    ['name', 'email', 'message'].forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setTouched({ name: true, email: true, message: true });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    // Simulate reliable client-side processing
    setTimeout(() => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const refId = `DL-2026-${randomSuffix}`;
      setSubmissionSuccess({
        refId,
        submittedAt: new Date().toISOString(),
        summary: { ...formData },
      });
      setIsSubmitting(false);
    }, 450);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      topic: 'general',
      vehicleDetails: '',
      message: '',
    });
    setErrors({});
    setTouched({});
    setSubmissionSuccess(null);
    setCopiedInquiry(false);
  };

  // Formatted inquiry for submission confirmation card (R3)
  const topicLabel =
    TOPIC_OPTIONS.find((t) => t.value === submissionSuccess?.summary?.topic)?.label ||
    submissionSuccess?.summary?.topic ||
    'General Inquiry';

  const formattedInquiryText = submissionSuccess
    ? [
        'To: contact@mydriveledger.com',
        `Subject: [DriveLedger Ticket: ${submissionSuccess.refId}] ${topicLabel} from ${submissionSuccess.summary.name}`,
        `Ticket Reference: ${submissionSuccess.refId}`,
        `Submitted: ${submissionSuccess.submittedAt}`,
        `Sender Name: ${submissionSuccess.summary.name}`,
        `Sender Email: ${submissionSuccess.summary.email}`,
        `Topic: ${topicLabel}`,
        submissionSuccess.summary.vehicleDetails
          ? `Vehicle: ${submissionSuccess.summary.vehicleDetails}`
          : null,
        '',
        'Message Body:',
        submissionSuccess.summary.message,
      ]
        .filter((line) => line !== null)
        .join('\n')
    : '';

  const submissionMailtoSubject = submissionSuccess
    ? encodeURIComponent(
        `[DriveLedger Ticket: ${submissionSuccess.refId}] ${topicLabel} from ${submissionSuccess.summary.name}`
      )
    : '';
  const submissionMailtoBody = submissionSuccess
    ? encodeURIComponent(formattedInquiryText)
    : '';
  const submissionMailtoUrl = `mailto:contact@mydriveledger.com?subject=${submissionMailtoSubject}&body=${submissionMailtoBody}`;

  const handleCopyInquiry = async () => {
    if (!formattedInquiryText) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(formattedInquiryText);
      } else if (typeof document !== 'undefined') {
        const input = document.createElement('textarea');
        input.value = formattedInquiryText;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch {
      // Graceful fallback for restricted environments
    }
    setCopiedInquiry(true);
    setTimeout(() => setCopiedInquiry(false), 2500);
  };

  // Generate mailto link as direct fallback
  const mailtoSubject = encodeURIComponent(
    `[DriveLedger Inquiry: ${formData.topic}] from ${formData.name || 'User'}`
  );
  const mailtoBody = encodeURIComponent(
    `Name: ${formData.name}\nEmail: ${formData.email}\nTopic: ${formData.topic}\nVehicle: ${
      formData.vehicleDetails || 'N/A'
    }\n\nMessage:\n${formData.message}`
  );
  const directMailtoUrl = `mailto:contact@mydriveledger.com?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-ink dark:text-zinc-100">
      <PageHeader
        title="Contact DriveLedger"
        subtitle="Have a question regarding our TCO algorithms, spotted an OBD-II specification correction, or require data protection assistance? Our automotive engineering team is here to assist."
        className="mb-0"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main Form or Success View (7 cols) */}
        <div className="lg:col-span-7">
          {submissionSuccess ? (
            <Card
              className="p-6 sm:p-8 border-emerald-200 dark:border-emerald-900/60 space-y-6"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 aria-hidden="true" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-50">
                    Inquiry Received — Ticket Prepared &amp; Ready to Dispatch
                  </h2>
                  <p className="text-xs text-muted dark:text-zinc-400">
                    Reference ID: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{submissionSuccess.refId}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle dark:bg-zinc-900/60 space-y-3 text-xs">
                <div className="font-semibold text-ink dark:text-zinc-200">
                  Submission Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-body dark:text-zinc-300">
                  <div><span className="text-muted dark:text-zinc-400">Name:</span> {submissionSuccess.summary.name}</div>
                  <div><span className="text-muted dark:text-zinc-400">Email:</span> {submissionSuccess.summary.email}</div>
                  <div className="col-span-2"><span className="text-muted dark:text-zinc-400">Topic:</span> {TOPIC_OPTIONS.find(t => t.value === submissionSuccess.summary.topic)?.label}</div>
                  {submissionSuccess.summary.vehicleDetails && (
                    <div className="col-span-2"><span className="text-muted dark:text-zinc-400">Vehicle:</span> {submissionSuccess.summary.vehicleDetails}</div>
                  )}
                </div>
                <div className="pt-2 border-t border-border/80 dark:border-zinc-800 text-muted dark:text-zinc-400">
                  DriveLedger operates with a privacy-first, zero-tracking client architecture. Click <strong>Send via Email App</strong> below (or copy the formatted ticket to send from your webmail) to deliver your message directly to <span className="font-mono">contact@mydriveledger.com</span>. Responses arrive within 24 to 48 hours.
                </div>
              </div>

              {/* 1-Click Dispatch & Copy Actions (R3) */}
              <div className="space-y-2 pt-2 border-t border-border/80 dark:border-zinc-800">
                <div className="text-xs font-semibold text-ink dark:text-zinc-200">
                  Dispatch Options &amp; Records:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={submissionMailtoUrl}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    <Mail aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
                    <span>Send via Email App</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyInquiry}
                    className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      copiedInquiry
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white border-transparent'
                    }`}
                  >
                    {copiedInquiry ? (
                      <>
                        <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
                        <span>Inquiry Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="w-4 h-4" />
                        <span>Copy Formatted Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-body dark:text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                <RotateCcw aria-hidden="true" className="w-4 h-4" />
                <span>Send Another Inquiry</span>
              </button>
            </Card>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-surface dark:bg-[#121215] rounded-2xl p-6 sm:p-8 border border-border/80 dark:border-zinc-800/90 shadow-card dark:shadow-none space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/80 dark:border-zinc-800 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">Send an Inquiry</h2>
                <span className="text-xs text-muted dark:text-zinc-400">* Required fields</span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-xs font-semibold text-ink dark:text-zinc-200">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Alex Mercer"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`min-h-[44px] w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border transition-colors text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-400 focus:outline-none focus-visible:border-primary-600 dark:focus-visible:border-emerald-500 ${
                    errors.name
                      ? 'border-red-500'
                      : 'border-border/80 dark:border-zinc-700'
                  }`}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-xs font-semibold text-ink dark:text-zinc-200">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. alex.mercer@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`min-h-[44px] w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border transition-colors text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-400 focus:outline-none focus-visible:border-primary-600 dark:focus-visible:border-emerald-500 ${
                    errors.email
                      ? 'border-red-500'
                      : 'border-border/80 dark:border-zinc-700'
                  }`}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Topic Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="contact-topic" className="block text-xs font-semibold text-ink dark:text-zinc-200">
                  Inquiry Topic *
                </label>
                <select
                  id="contact-topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-100 focus:outline-none focus-visible:border-primary-600 dark:focus-visible:border-emerald-500"
                >
                  {TOPIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Details (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="contact-vehicle" className="block text-xs font-semibold text-ink dark:text-zinc-200">
                  Vehicle Model / Engine / Mileage <span className="text-muted dark:text-zinc-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="contact-vehicle"
                  name="vehicleDetails"
                  value={formData.vehicleDetails}
                  onChange={handleChange}
                  placeholder="e.g. 2018 BMW 320d (F30) - 85,000 miles"
                  className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-400 focus:outline-none focus-visible:border-primary-600 dark:focus-visible:border-emerald-500"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-semibold text-ink dark:text-zinc-200">
                  Detailed Message *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Please describe your question, observation, or algorithmic correction in detail..."
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  className={`min-h-[112px] w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border transition-colors text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-400 focus:outline-none focus-visible:border-primary-600 dark:focus-visible:border-emerald-500 ${
                    errors.message
                      ? 'border-red-500'
                      : 'border-border/80 dark:border-zinc-700'
                  }`}
                />
                {errors.message && (
                  <p id="message-error" role="alert" className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Inquiry...</span>
                ) : (
                  <>
                    <Send aria-hidden="true" className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Direct Mailto Fallback */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-primary-600 dark:text-emerald-400 shrink-0">
                <Mail aria-hidden="true" className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink dark:text-zinc-100 text-sm">Direct Mailbox Fallback</h3>
                <p className="text-xs text-muted dark:text-zinc-400">Prefer sending via your email client?</p>
              </div>
            </div>
            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              You can reach our editorial and technical team directly at:
            </p>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 font-semibold select-all">
                contact@mydriveledger.com
              </div>
              <div className="p-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 text-[11px] select-all">
                legal@mydriveledger.com (Privacy/GDPR)
              </div>
            </div>
            <a
              href={directMailtoUrl}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-200 text-xs font-semibold transition-colors"
            >
              <Mail aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Open Email Client (Pre-Filled)</span>
            </a>
          </Card>

          {/* Response Time SLA Expectations */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                <Clock aria-hidden="true" className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink dark:text-zinc-100 text-sm">Response Time SLA</h3>
                <p className="text-xs text-muted dark:text-zinc-400">Transparent handling timelines</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-body dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>General Inquiries &amp; Feedback:</strong> Acknowledged and answered within 24 to 48 business hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Vehicle Data Corrections:</strong> Verified against OEM workshop manuals and updated in 1–3 business days.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Statutory GDPR / Privacy Requests:</strong> Acknowledged within 2 business days; fulfilled within 30 statutory days.</span>
              </li>
            </ul>
          </Card>

          {/* Data Protection Information */}
          <section className="bg-surface-subtle dark:bg-[#121215] rounded-2xl p-5 sm:p-6 border border-border/80 dark:border-zinc-800 space-y-3 text-xs text-muted dark:text-zinc-400">
            <div className="flex items-center gap-2 font-bold text-ink dark:text-zinc-200">
              <Shield aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
              <span>Data Protection &amp; Privacy</span>
            </div>
            <p className="leading-relaxed">
              Information submitted through this form is processed solely to address your communication. We do not sell contact information or subscribe submitters to marketing lists. For complete details regarding our data minimization practices, inspect our{' '}
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof onOpenLegalModal === 'function') {
                    onOpenLegalModal('privacy');
                  } else if (typeof window !== 'undefined') {
                    window.location.hash = '#privacy';
                  }
                }}
                className="underline hover:text-ink dark:hover:text-zinc-100 text-primary-600 dark:text-emerald-400 font-semibold"
              >
                Privacy Policy
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
