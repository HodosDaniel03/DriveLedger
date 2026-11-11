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
} from 'lucide-react';

const TOPIC_OPTIONS = [
  { value: 'general', label: 'General Feedback or Suggestion' },
  { value: 'vehicle-correction', label: 'Vehicle Catalog / Spec Correction' },
  { value: 'obd-calibration', label: 'OBD-II Dossier Calibration' },
  { value: 'editorial', label: 'Editorial or Guide Question' },
  { value: 'legal', label: 'Data Privacy / GDPR Inquiry' },
  { value: 'advertising', label: 'Advertising & Commercial Partnerships' },
];

export default function ContactPage({ onNavigateTab }) {
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
    <div className="min-h-screen bg-canvas dark:bg-[#09090B] text-ink dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-emerald-950/40 border border-primary-100 dark:border-emerald-800 text-primary-700 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <MessageSquare className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
            Direct Communications
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink dark:text-zinc-50">
            Contact DriveLedger
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-body dark:text-zinc-300 leading-relaxed">
            Have a question regarding our TCO algorithms, spotted an OBD-II specification correction, or require data protection assistance? Our automotive engineering team is here to assist.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form or Success View (7 cols) */}
          <div className="lg:col-span-7">
            {submissionSuccess ? (
              <div
                className="bg-surface dark:bg-zinc-900 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-6"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-zinc-50">
                      Message Received
                    </h2>
                    <p className="text-xs text-muted dark:text-zinc-400">
                      Reference ID: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{submissionSuccess.refId}</span>
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-canvas dark:bg-zinc-900/60 border border-border dark:border-zinc-800 space-y-3 text-xs">
                  <div className="font-semibold text-ink dark:text-zinc-200 uppercase tracking-wide">
                    Submission Summary
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-body dark:text-zinc-300">
                    <div><span className="text-muted dark:text-zinc-500">Name:</span> {submissionSuccess.summary.name}</div>
                    <div><span className="text-muted dark:text-zinc-500">Email:</span> {submissionSuccess.summary.email}</div>
                    <div className="col-span-2"><span className="text-muted dark:text-zinc-500">Topic:</span> {TOPIC_OPTIONS.find(t => t.value === submissionSuccess.summary.topic)?.label}</div>
                    {submissionSuccess.summary.vehicleDetails && (
                      <div className="col-span-2"><span className="text-muted dark:text-zinc-500">Vehicle:</span> {submissionSuccess.summary.vehicleDetails}</div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-border dark:border-zinc-800 text-muted dark:text-zinc-400">
                    A copy of your inquiry has been queued for engineering review. General inquiries receive responses within 24 to 48 hours.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-surface dark:bg-zinc-900 rounded-3xl p-8 border border-border dark:border-zinc-800 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between border-b border-border dark:border-zinc-800 pb-4">
                  <h2 className="text-xl font-bold text-ink dark:text-zinc-100">Send an Inquiry</h2>
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
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Alex Mercer"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-canvas dark:bg-zinc-800/80 border transition-all text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-border dark:border-zinc-700 focus:ring-primary-500'
                    }`}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.name}
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
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. alex.mercer@example.com"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-canvas dark:bg-zinc-800/80 border transition-all text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-border dark:border-zinc-700 focus:ring-primary-500'
                    }`}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
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
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-canvas dark:bg-zinc-800/80 border border-border dark:border-zinc-700 text-ink dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    Vehicle Model / Engine / Mileage <span className="text-muted dark:text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="contact-vehicle"
                    name="vehicleDetails"
                    value={formData.vehicleDetails}
                    onChange={handleChange}
                    placeholder="e.g. 2018 BMW 320d (F30) - 85,000 miles"
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-canvas dark:bg-zinc-800/80 border border-border dark:border-zinc-700 text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-canvas dark:bg-zinc-800/80 border transition-all text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                      errors.message
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-border dark:border-zinc-700 focus:ring-primary-500'
                    }`}
                  />
                  {errors.message && (
                    <p id="message-error" role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Processing Inquiry...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Mailto Fallback */}
            <div className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 border border-border dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-zinc-800 text-primary-600 dark:text-emerald-400">
                  <Mail className="w-5 h-5" />
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
                <div className="p-2.5 rounded-xl bg-canvas dark:bg-zinc-900/80 border border-border dark:border-zinc-800 text-ink dark:text-zinc-200 font-semibold select-all">
                  contact@mydriveledger.com
                </div>
                <div className="p-2.5 rounded-xl bg-canvas dark:bg-zinc-900/80 border border-border dark:border-zinc-800 text-ink dark:text-zinc-200 text-[11px] select-all">
                  legal@mydriveledger.com (Privacy/GDPR)
                </div>
              </div>
              <a
                href={directMailtoUrl}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-canvas dark:bg-zinc-800 hover:bg-surface-subtle dark:hover:bg-zinc-700/80 border border-border dark:border-zinc-700 text-ink dark:text-zinc-200 text-xs font-semibold transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                Open Email Client (Pre-Filled)
              </a>
            </div>

            {/* Response Time SLA Expectations */}
            <div className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 border border-border dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink dark:text-zinc-100 text-sm">Response Time SLA</h3>
                  <p className="text-xs text-muted dark:text-zinc-400">Transparent handling timelines</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-body dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>General Inquiries & Feedback:</strong> Acknowledged and answered within 24 to 48 business hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Vehicle Data Corrections:</strong> Verified against OEM workshop manuals and updated in 1–3 business days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Statutory GDPR / Privacy Requests:</strong> Acknowledged within 2 business days; fulfilled within 30 statutory days.</span>
                </li>
              </ul>
            </div>

            {/* Data Protection Information */}
            <div className="bg-canvas dark:bg-zinc-900/40 rounded-3xl p-6 border border-border dark:border-zinc-800 space-y-3 text-xs text-muted dark:text-zinc-400">
              <div className="flex items-center gap-2 font-bold text-ink dark:text-zinc-200">
                <Shield className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
                Data Protection & Privacy
              </div>
              <p className="leading-relaxed">
                Information submitted through this form is processed solely to address your communication. We do not sell contact information or subscribe submitters to marketing lists. For complete details regarding our data minimization practices, inspect our{' '}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.location.hash = '#privacy';
                    }
                  }}
                  className="underline hover:text-ink dark:hover:text-zinc-100 text-primary-600 dark:text-emerald-400 font-semibold"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
