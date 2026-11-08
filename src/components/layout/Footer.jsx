import React, { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { OBD_CODES } from '../../data/obdCodes';
import { PROGRAMMATIC_OBD_MATRIX } from '../../data/seoMatrixData';
import { useUnits } from '../../context/UnitContext';
import { Collapse } from '../common/OdometerPrimitives';
import AdUnit from '../monetization/AdUnit';
import { MONETIZATION_CONFIG } from '../../config/monetizationConfig';
import {
  WORKSPACE_LEGAL_NOTICE_LINE,
  NOMINATIVE_FAIR_USE_NOTICE,
  AMAZON_ASSOCIATES_CLAUSE,
} from '../../data/legalPolicies';

const FAQS = [
  {
    q: 'How do we calculate 5-year depreciation?',
    a: 'We apply a brand-specific annual value loss rate to the purchase price, compounded for each year you own the car. Above-average annual mileage lowers the expected resale value further, while low mileage protects it. The difference between what you pay and the estimated resale value is spread across every month of ownership.',
  },
  {
    q: 'Why do short city trips wear out modern engines faster?',
    a: 'Short trips rarely let the engine, oil and exhaust reach full operating temperature. Diesel particulate filters can’t complete their soot-burning regeneration, EGR valves clog with carbon, and brakes and clutches work far harder in stop-start traffic. That’s why we apply a 1.35x wear multiplier to these systems for mostly-city driving.',
  },
  {
    q: 'Independent specialist vs. Dealership service costs',
    a: 'Main dealerships typically charge 50–80% more per hour than independent specialists and often fit only branded parts. A good independent using OE-quality parts can usually do the same job, and most regions protect your warranty as long as servicing follows the manufacturer schedule. Keep receipts and stamped records either way.',
  },
  {
    q: 'How to read OBD2 codes before visiting a workshop',
    a: 'Every car sold since the late 1990s has an OBD2 port under the dashboard. A low-cost Bluetooth scanner and a free phone app will read the stored fault code and live sensor data. Knowing the code, and checking the cheap culprits first, makes it much harder for anyone to sell you parts you don’t need.',
  },
  {
    q: 'How is the Ownership Value Score calculated?',
    a: 'Our algorithmic scoring engine evaluates 10-year residual decay curves, real-world highway vs urban consumption ratios, known mechanical failure frequencies, and component repair costs relative to the segment median.',
  },
];

export default function Footer({
  onSelectTab,
  onSelectPreset,
  onSelectObdCode,
  onSelectHybridObd,
  onOpenLegalModal,
  onOpenCookiePreferences,
  hideFaq = false,
}) {
  const { formatCurrency } = useUnits();
  const [openFaq, setOpenFaq] = useState(null);

  const benchmarkPresets = [
    { id: 'toyota-camry-hybrid', name: 'Toyota Camry Hybrid 2.5L', price: 31500 },
    { id: 'ford-focus-ecoblue', name: 'Ford Focus 2.0 EcoBlue Diesel', price: 24800 },
    { id: 'tesla-model-3-lr', name: 'Tesla Model 3 Long Range', price: 42900 },
    { id: 'bmw-330i-g20', name: 'BMW 3 Series 2.0T', price: 43500 },
    { id: 'vw-golf-20-tdi', name: 'VW Golf 2.0 TDI', price: 27900 },
  ];

  const triggerLegal = (policyKey) => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#${policyKey}`
      );
    }
    if (onOpenLegalModal) {
      onOpenLegalModal(policyKey);
    }
  };

  return (
    <div className="mt-16 space-y-16">
      {/* 1. Reserved Zero-CLS Ad Container Controlled by monetizationConfig.js */}
      <AdUnit
        slotId={MONETIZATION_CONFIG.slots.topLeaderboard}
        variant="leaderboard"
        partnerKey="vinCheck"
        contextLabel="DriveLedger Automotive Cost & Diagnostic Benchmark"
      />

      {/* 2. Collapsible FAQ Accordion with Stitch Clean Styling */}
      {!hideFaq && (
        <section aria-labelledby="faq-heading" className="max-w-[1380px] mx-auto w-full">
          <div className="mb-6">
            <span className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold">
              Common questions
            </span>
            <h2 id="faq-heading" className="scroll-mt-28 lg:scroll-mt-32 text-2xl sm:text-3xl font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mt-1">
              Questions, answered
            </h2>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-sm divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} className="transition-colors duration-150">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left text-sm sm:text-base font-sans font-semibold text-ink dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600 transition-colors duration-150"
                    >
                      <span>{f.q}</span>
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-md text-muted dark:text-zinc-400 transition-transform duration-300 ease-out ${
                          isOpen ? 'rotate-45 text-primary-600 dark:text-primary-400' : ''
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    </button>
                  </h3>
                  <Collapse open={isOpen} id={`faq-${i}`}>
                    <p className="px-6 pb-5 text-sm font-sans leading-relaxed text-body dark:text-zinc-300 text-pretty">
                      {f.a}
                    </p>
                  </Collapse>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Deep-Link Presets & Diagnostics Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-xs font-sans text-muted dark:text-zinc-400 max-w-[1380px] mx-auto w-full">
        <div>
          <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-ink dark:text-zinc-50 mb-3">
            Benchmark Vehicle TCO Models
          </h3>
          <ul className="space-y-2">
            {benchmarkPresets.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectPreset) {
                      onSelectPreset(v.id);
                    } else if (onSelectTab) {
                      onSelectTab('tco');
                    }
                    if (typeof window !== 'undefined' && window.scrollTo) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center justify-between w-full hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors duration-150 py-0.5"
                >
                  <span className="font-sans font-medium text-body dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400">{v.name}</span>
                  <span className="font-mono tabular-nums text-muted dark:text-zinc-400">{formatCurrency(v.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-ink dark:text-zinc-50 mb-3">
            High-Frequency OBD-II Fault Dossiers
          </h3>
          <ul className="space-y-2">
            {OBD_CODES.slice(0, 5).map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectObdCode) {
                      onSelectObdCode(item.code);
                    } else if (onSelectTab) {
                      onSelectTab('obd');
                    }
                    if (typeof window !== 'undefined' && window.scrollTo) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-2 w-full hover:text-primary-600 dark:hover:text-primary-400 text-left transition-colors duration-150 py-0.5"
                >
                  <span className="font-mono tabular-nums font-bold text-primary-600 dark:text-primary-400">{item.code}</span>
                  <span className="truncate font-sans text-body dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:underline">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-ink dark:text-zinc-50 mb-3">
            Programmatic Vehicle × OBD-II Matrix
          </h3>
          <ul className="space-y-2">
            {PROGRAMMATIC_OBD_MATRIX.slice(0, 6).map((item) => (
              <li key={item.id}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof onSelectHybridObd === 'function') {
                      onSelectHybridObd(item.presetId, item.code);
                    } else {
                      if (typeof onSelectPreset === 'function') {
                        onSelectPreset(item.presetId);
                      }
                      if (typeof onSelectObdCode === 'function') {
                        onSelectObdCode(item.code);
                      } else if (typeof onSelectTab === 'function') {
                        onSelectTab('obd');
                      }
                    }
                    if (typeof window !== 'undefined' && window.scrollTo) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center justify-between gap-2 w-full hover:text-primary-600 dark:hover:text-primary-400 text-left transition-colors duration-150 py-0.5"
                >
                  <span className="truncate font-sans text-body dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                    {item.anchorText}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-primary-600 dark:text-primary-400 shrink-0">
                    {item.code}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Stitch Master Footer */}
      <footer className="w-full max-w-full bg-surface dark:bg-[#121215] border-t border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 sm:px-6 lg:px-12 pt-10 sm:pt-14 pb-10 safe-area-x safe-area-bottom">
        <div className="max-w-[1380px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            {/* Brand Col */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-ink dark:text-zinc-50 cursor-pointer" onClick={() => onSelectTab && onSelectTab('overview')}>
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
                  <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M4 15a8 8 0 1 1 16 0" />
                    <path d="m12 14 3-3" />
                  </svg>
                </span>
                <span className="font-sans text-h3 tracking-tight font-bold text-ink dark:text-zinc-50">
                  {MONETIZATION_CONFIG.brandName}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed max-w-sm">
                Independent automotive cost analytics platform. Providing transparent depreciation models, real-world ownership expenditure, and precision vehicle cost reports.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-sans font-medium">
                  Verified Automotive Data Index
                </span>
                <span className="text-[11px] font-mono text-muted dark:text-zinc-400">
                  {MONETIZATION_CONFIG.contactEmail}
                </span>
              </div>
            </div>

            {/* Tools Col */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-sans uppercase tracking-wider text-ink dark:text-zinc-50 font-semibold">Tools</span>
              <ul className="flex flex-col gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('overview')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Platform Overview
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('tco')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    5-Year True Cost to Own
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('risk')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Maintenance Risk Matrix
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('obd')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    OBD2 Repair Estimator
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('compare')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Vehicle Comparator
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('checklist')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Pre-Purchase Inspection (PPI)
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Col */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-sans uppercase tracking-wider text-ink dark:text-zinc-50 font-semibold">Platform</span>
              <ul className="flex flex-col gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('blog')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    From the Garage (Blog)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('reviews')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Driver Reviews
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onSelectTab && onSelectTab('methodology')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Methodology &amp; White Paper
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => triggerLegal('about')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    About Us
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => triggerLegal('contact')} className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150">
                    Contact ({MONETIZATION_CONFIG.contactEmail})
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Col */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-sans uppercase tracking-wider text-ink dark:text-zinc-50 font-semibold">Legal &amp; Compliance</span>
              <ul className="flex flex-col gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => triggerLegal('privacy')}
                    className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150 text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => triggerLegal('terms')}
                    className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150 text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => triggerLegal('disclaimer')}
                    className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150 text-left"
                  >
                    Liability Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => triggerLegal('affiliate-disclosure')}
                    className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150 text-left"
                  >
                    Affiliate Disclosure
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => triggerLegal('cookies')}
                    className="hover:text-ink dark:hover:text-zinc-50 transition-colors duration-150 text-left"
                  >
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    data-testid="footer-cookie-preferences"
                    onClick={() => {
                      if (onOpenCookiePreferences) {
                        onOpenCookiePreferences();
                      } else {
                        triggerLegal('cookies');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline transition-colors duration-150 text-left"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Cookie Preferences</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Comprehensive 1-Line & Nominative Fair Use Legal Shield in Footer */}
          <div className="py-5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2 text-[11px] font-sans text-muted dark:text-zinc-400 leading-relaxed">
            <p data-testid="footer-legal-notice-line" className="font-medium text-body dark:text-zinc-300">
              {WORKSPACE_LEGAL_NOTICE_LINE} {AMAZON_ASSOCIATES_CLAUSE}
            </p>
            <p className="text-[10px] text-faint dark:text-zinc-500">
              {NOMINATIVE_FAIR_USE_NOTICE}
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-muted dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans">© 2026 {MONETIZATION_CONFIG.brandName} ({MONETIZATION_CONFIG.domain}). Estimates only.</span>
              <span>•</span>
              <span>Independent benchmark, not affiliated with OEMs.</span>
              <span>•</span>
              <span>Updated {MONETIZATION_CONFIG.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-faint dark:text-zinc-500 font-mono tabular-nums">v4.14-prod</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
