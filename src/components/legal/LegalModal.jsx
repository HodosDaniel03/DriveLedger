import React from 'react';
import { ShieldCheck, Scale, Lock, Settings2, ExternalLink, FileText, BookOpen, Shield } from 'lucide-react';
import {
  LEGAL_POLICIES,
  resolveLegalPolicyKey,
  NOMINATIVE_FAIR_USE_NOTICE,
} from '../../data/legalPolicies';
import { MONETIZATION_CONFIG } from '../../config/monetizationConfig';
import { openPrivacySettings } from './CookieConsentBanner';

const POLICY_NAV_ITEMS = [
  { key: 'terms', label: 'Terms of Service', path: '/terms', hash: '#terms', Icon: Scale },
  { key: 'disclaimer', label: 'Liability Disclaimer', path: '/disclaimer', hash: '#disclaimer', Icon: ShieldCheck },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy', hash: '#privacy', Icon: Lock },
  { key: 'cookies', label: 'Cookie Policy', path: '/cookies', hash: '#cookies', Icon: Settings2 },
  { key: 'do-not-sell', label: 'Do Not Sell / US Privacy', path: '/do-not-sell', hash: '#do-not-sell', Icon: Shield },
  { key: 'affiliate-disclosure', label: 'Affiliate Disclosure', path: '/affiliate-disclosure', hash: '#affiliate-disclosure', Icon: ExternalLink },
  { key: 'about', label: 'About & Methodology', path: '/about', hash: '#about', Icon: BookOpen },
  { key: 'contact', label: 'Contact', path: '/contact', hash: '#contact', Icon: FileText },
];

export default function LegalModal({
  activePolicy,
  onSelectPolicy,
  onClose,
  onOpenCookieSettings,
}) {
  const resolvedKey = resolveLegalPolicyKey(activePolicy);
  if (!resolvedKey) return null;

  const policy = LEGAL_POLICIES[resolvedKey] || LEGAL_POLICIES.terms;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      data-testid={`legal-modal-${policy.id}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/50 dark:bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-4xl max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-2xl overflow-hidden sm:my-auto">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-900/50 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 text-[11px] font-sans font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{MONETIZATION_CONFIG.brandName} Legal &amp; Compliance</span>
              </span>
              <span className="text-[11px] font-mono text-muted dark:text-zinc-400 break-all">
                https://{MONETIZATION_CONFIG.domain}/{policy.key || policy.id}
              </span>
            </div>
            <h2
              id="legal-modal-title"
              className="text-lg sm:text-xl font-sans font-bold tracking-tight text-ink dark:text-zinc-50"
            >
              {policy.title}
            </h2>
            <p className="text-xs font-sans text-muted dark:text-zinc-400">
              {policy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg p-2 text-muted hover:bg-zinc-200/70 hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Policy Switcher Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {POLICY_NAV_ITEMS.map(({ key, label, path, Icon }) => {
            const isCurrent = policy.id === key;
            return (
              <a
                key={key}
                href={path}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectPolicy) onSelectPolicy(key);
                }}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : 'text-body dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </a>
            );
          })}
        </div>

        {/* Scrollable Multi-Paragraph Formal Legal Prose Body */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 flex-1 overflow-y-auto space-y-6 text-sm font-sans leading-relaxed text-body dark:text-zinc-300">
          {policy.sections.map((section) => (
            <section
              key={section.heading}
              className="space-y-2.5 pb-5 border-b border-zinc-200/70 dark:border-zinc-800/70 last:border-b-0 last:pb-0"
            >
              <h3 className="text-sm sm:text-base font-sans font-bold text-ink dark:text-zinc-100">
                {section.heading}
              </h3>
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx} className="text-xs sm:text-sm leading-relaxed text-body dark:text-zinc-300">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {/* Nominative Fair Use & Contact Callout Box */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 text-xs space-y-2">
            <p className="font-semibold text-ink dark:text-zinc-100">
              Statutory Data Controller &amp; Legal Notice Desk
            </p>
            <p className="text-muted dark:text-zinc-400 leading-relaxed">
              {NOMINATIVE_FAIR_USE_NOTICE}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-[11px] font-mono text-ink dark:text-zinc-200">
              <span>Platform: {MONETIZATION_CONFIG.brandName} ({MONETIZATION_CONFIG.domain})</span>
              <span>Editorial Contact: {MONETIZATION_CONFIG.contactEmail}</span>
              <span>Legal &amp; GDPR/CCPA Desk: {MONETIZATION_CONFIG.legalEmail}</span>
              <span>Effective Date: {MONETIZATION_CONFIG.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenCookieSettings && (
              <button
                type="button"
                data-testid="legal-modal-cookie-settings"
                onClick={() => {
                  openPrivacySettings(() => {
                    onClose();
                    onOpenCookieSettings();
                  });
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {policy.id === 'do-not-sell' ? 'Opt Out / Cookie Settings' : 'Manage Cookie Preferences'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-5 py-2 text-xs font-sans font-semibold text-white hover:bg-primary-700 shadow-sm transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
