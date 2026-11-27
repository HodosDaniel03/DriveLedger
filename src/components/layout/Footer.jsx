import React, { useEffect } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { OBD_CODES } from '../../data/obdCodes';
import { PROGRAMMATIC_OBD_MATRIX, isObdCompatibleWithVehicle } from '../../data/seoMatrixData';
import { useUnits } from '../../context/UnitContext';
import BrandLogo from '../common/BrandLogo';
import VinCheckBanner from '../monetization/VinCheckBanner';
import { getPresetById } from '../../data/vehiclePresets';
import { MONETIZATION_CONFIG } from '../../config/monetizationConfig';
import {
  WORKSPACE_LEGAL_NOTICE_LINE,
  NOMINATIVE_FAIR_USE_NOTICE,
  AMAZON_ASSOCIATES_CLAUSE,
} from '../../data/legalPolicies';
import { openPrivacySettings } from '../legal/CookieConsentBanner';
import { BrandQuickJumpIndex } from '../seo/VehicleInternalLinks';

const FAQS = [
  {
    q: 'How do we calculate 5-year depreciation?',
    a: 'We apply a brand-specific annual value loss rate to the purchase price, compounded for each year you own the car. Above-average annual mileage lowers the expected resale value further, while low mileage protects it. The difference between what you pay and the estimated resale value is spread across every month of ownership.',
  },
  {
    q: 'Why do short city trips wear out modern engines faster?',
    a: 'Short trips rarely let the engine, oil and exhaust reach full operating temperature. Diesel particulate filters cannot complete their soot-burning regeneration, EGR valves clog with carbon, and brakes and clutches work far harder in stop-start traffic. That is why we apply a 1.35x wear multiplier to these systems for mostly-city driving.',
  },
  {
    q: 'Independent specialist vs. Dealership service costs',
    a: 'Main dealerships typically charge 50–80% more per hour than independent specialists and often fit only branded parts. A good independent using OE-quality parts can usually do the same job, and most regions protect your warranty as long as servicing follows the manufacturer schedule. Keep receipts and stamped records either way.',
  },
  {
    q: 'How to read OBD2 codes before visiting a workshop',
    a: 'Every car sold since the late 1990s has an OBD2 port under the dashboard. A low-cost Bluetooth scanner and a free phone app will read the stored fault code and live sensor data. Knowing the code, and checking the cheap culprits first, makes it much harder for anyone to sell you parts you do not need.',
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
  onNavigateToVehicles,
  onOpenLegalModal,
  onOpenCookiePreferences,
  hideFaq = false,
  hideVinBanner = false,
  selectedPresetId,
  hasSelectedVehicle = Boolean(selectedPresetId),
}) {
  const { formatCurrency } = useUnits();
  const activePreset = hasSelectedVehicle && selectedPresetId ? getPresetById(selectedPresetId) : null;

  // Fallback for mutually exclusive <details name="footer-faq"> in older browsers
  useEffect(() => {
    if (
      hideFaq ||
      typeof document === 'undefined' ||
      typeof HTMLDetailsElement === 'undefined' ||
      Object.hasOwn(HTMLDetailsElement.prototype, 'name')
    ) {
      return undefined;
    }
    const handleToggle = (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (details.getAttribute('name') !== 'footer-faq') return;
      for (const other of document.querySelectorAll('details[name="footer-faq"]')) {
        if (other !== details) other.open = false;
      }
    };
    document.addEventListener('toggle', handleToggle, { capture: true });
    return () => document.removeEventListener('toggle', handleToggle, { capture: true });
  }, [hideFaq]);

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
    <div className="mt-12 space-y-12">
      {/* 1. Official carVertical Vehicle History Verification Card */}
      {!hideVinBanner && (
        <VinCheckBanner
          placement="footer"
          vehicleName={activePreset?.name || ''}
          purchasePriceUsd={activePreset?.purchasePriceUsd}
          vehiclePriceFormatted={activePreset?.purchasePriceUsd ? formatCurrency(activePreset.purchasePriceUsd) : undefined}
          odometerMiles={activePreset?.defaultOdometerMiles}
          compact={false}
          className="max-w-[1380px] mx-auto w-full"
        />
      )}

      {/* 2. Native Exclusive <details> FAQ Accordion (hidden on Overview & Methodology) */}
      {!hideFaq && (
        <section aria-labelledby="faq-heading" className="max-w-[1380px] mx-auto w-full">
          <h2 id="faq-heading" className="scroll-mt-24 text-h2 font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-5">
            Questions, answered
          </h2>

          <div className="rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] divide-y divide-border/80 dark:divide-zinc-800 overflow-hidden">
            {FAQS.map((f, idx) => (
              <details
                key={f.q}
                name="footer-faq"
                open={idx === 0}
                className="dl-disclosure group"
              >
                <summary className="min-h-[48px] flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left text-sm sm:text-base font-sans font-semibold text-ink dark:text-zinc-50 hover:bg-surface-subtle/60 dark:hover:bg-zinc-900/50 transition-colors">
                  <span>{f.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="px-5 sm:px-6 pb-5 text-sm font-sans leading-relaxed text-body dark:text-zinc-300 max-w-[70ch] text-pretty">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 3. Master Footer with Collapsed Deep-Link & Brand Index */}
      <footer className="w-full max-w-full bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800 rounded-2xl px-5 sm:px-8 lg:px-10 pt-8 sm:pt-10 pb-8 safe-area-x safe-area-bottom">
        <div className="max-w-[1380px] mx-auto">
          {/* Primary Footer Navigation Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab && onSelectTab('overview');
                }}
                className="inline-flex items-center min-h-[44px] sm:min-h-0 cursor-pointer w-fit"
                aria-label="DriveLedger home"
              >
                <BrandLogo size="md" />
              </a>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-400 leading-relaxed max-w-[44ch] text-pretty">
                Independent automotive cost analytics. Transparent 5-year depreciation models, powertrain wear horizons, and regional workshop labor estimates.
              </p>
              <span className="text-xs font-mono text-muted dark:text-zinc-400">
                {MONETIZATION_CONFIG.contactEmail}
              </span>
            </div>

            {/* Tools Col */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <span className="text-xs font-sans text-ink dark:text-zinc-100 font-semibold">Calculators</span>
              <ul className="flex flex-col gap-0 sm:gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <a href="/" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('overview'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Platform Overview
                  </a>
                </li>
                <li>
                  <a href="/vehicles" onClick={(e) => { e.preventDefault(); (onNavigateToVehicles ? onNavigateToVehicles() : onSelectTab && onSelectTab('vehicles')); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    All 35 Brands &amp; 179 Vehicles
                  </a>
                </li>
                <li>
                  <a href="/tco" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('tco'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    5-Year True Cost to Own
                  </a>
                </li>
                <li>
                  <a href="/risk-matrix" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('risk'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Maintenance Risk Matrix
                  </a>
                </li>
                <li>
                  <a href="/obd-estimator" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('obd'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    OBD2 Repair Estimator
                  </a>
                </li>
                <li>
                  <a href="/compare" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('compare'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Vehicle Comparator
                  </a>
                </li>
                <li>
                  <a href="/checklist" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('checklist'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Pre-Purchase Inspection (PPI)
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform Col */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <span className="text-xs font-sans text-ink dark:text-zinc-100 font-semibold">Platform</span>
              <ul className="flex flex-col gap-0 sm:gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <a href="/guides" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('guides'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Buyer Guides &amp; Insights
                  </a>
                </li>
                <li>
                  <a href="/reviews" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('reviews'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Driver Reviews
                  </a>
                </li>
                <li>
                  <a href="/methodology" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('methodology'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Methodology &amp; White Paper
                  </a>
                </li>
                <li>
                  <a href="/about" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('about'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" onClick={(e) => { e.preventDefault(); onSelectTab && onSelectTab('contact'); }} className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors">
                    Contact ({MONETIZATION_CONFIG.contactEmail})
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Col */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <span className="text-xs font-sans text-ink dark:text-zinc-100 font-semibold">Legal &amp; Privacy</span>
              <ul className="flex flex-col gap-0 sm:gap-2 text-xs font-sans text-muted dark:text-zinc-400">
                <li>
                  <a
                    href="/privacy"
                    data-testid="footer-privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerLegal('privacy');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    data-testid="footer-terms-of-service"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerLegal('terms');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/disclaimer"
                    data-testid="footer-liability-disclaimer"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerLegal('disclaimer');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Liability Disclaimer
                  </a>
                </li>
                <li>
                  <a
                    href="/affiliate-disclosure"
                    data-testid="footer-affiliate-disclosure"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerLegal('affiliate-disclosure');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Affiliate Disclosure
                  </a>
                </li>
                <li>
                  <a
                    href="/cookies"
                    data-testid="footer-cookie-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerLegal('cookies');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    data-testid="footer-cookie-preferences"
                    data-action="privacy-cookie-settings"
                    onClick={() => {
                      openPrivacySettings(() => {
                        if (onOpenCookiePreferences) {
                          onOpenCookiePreferences();
                        } else {
                          triggerLegal('cookies');
                        }
                      });
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-emerald-400 hover:underline transition-colors text-left"
                  >
                    <Settings2 aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>Privacy &amp; Cookie Settings (EU/UK)</span>
                  </button>
                </li>
                <li>
                  <a
                    href="/do-not-sell"
                    data-testid="footer-do-not-sell"
                    onClick={(e) => {
                      e.preventDefault();
                      openPrivacySettings(() => {
                        if (onOpenCookiePreferences) {
                          onOpenCookiePreferences();
                        }
                      });
                      triggerLegal('do-not-sell');
                    }}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-ink dark:hover:text-zinc-50 transition-colors text-left"
                  >
                    Do Not Sell or Share My Personal Information (US)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Tucked Deep-Link Presets, OBD-II Matrix & 35-Brand Index (searchable via Find-in-Page & fully crawlable) */}
          <details className="dl-disclosure group border-t border-border/80 dark:border-zinc-800">
            <summary className="min-h-[44px] py-3 flex items-center justify-between gap-3 text-xs font-sans font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
              <span>Benchmark Presets, OBD-II Dossiers &amp; 35-Brand Directory</span>
              <ChevronDown
                aria-hidden="true"
                className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="pt-3 pb-6 space-y-6 text-xs font-sans text-muted dark:text-zinc-400">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-sans font-semibold text-xs text-ink dark:text-zinc-100 mb-2.5">
                    Benchmark Vehicle TCO Models
                  </h3>
                  <ul className="space-y-1.5">
                    {benchmarkPresets.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-2">
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
                          className="flex items-center justify-between w-full hover:text-primary-600 dark:hover:text-emerald-400 hover:underline transition-colors py-0.5 text-left"
                        >
                          <span className="font-sans font-medium text-body dark:text-zinc-300">{v.name}</span>
                          <span className="font-mono tabular-nums text-muted dark:text-zinc-400">{formatCurrency(v.price)}</span>
                        </button>
                        <a
                          href={`/tco/${v.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (onSelectPreset) onSelectPreset(v.id);
                          }}
                          className="sr-only"
                        >
                          {v.name} TCO Report
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-sans font-semibold text-xs text-ink dark:text-zinc-100 mb-2.5">
                    High-Frequency OBD-II Fault Dossiers
                  </h3>
                  <ul className="space-y-1.5">
                    {OBD_CODES.slice(0, 5).map((item) => {
                      const fallbackPresetId = ['P2002', 'P2463', 'P20EE'].includes(item.code)
                        ? 'vw-golf-20-tdi'
                        : 'toyota-camry-hybrid';
                      const targetPresetId =
                        activePreset && isObdCompatibleWithVehicle(activePreset, item.code)
                          ? activePreset.id
                          : fallbackPresetId;
                      return (
                        <li key={item.code} className="flex items-center justify-between gap-2">
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
                            className="flex items-center gap-2 w-full hover:text-primary-600 dark:hover:text-emerald-400 text-left transition-colors py-0.5"
                          >
                            <span className="font-mono tabular-nums font-bold text-primary-600 dark:text-emerald-400">{item.code}</span>
                            <span className="truncate font-sans text-body dark:text-zinc-300 hover:underline">{item.title}</span>
                          </button>
                          <a
                            href={`/obd/${targetPresetId}/${item.code.toLowerCase()}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onSelectHybridObd) {
                                onSelectHybridObd(targetPresetId, item.code);
                              } else if (onSelectObdCode) {
                                onSelectObdCode(item.code);
                              }
                            }}
                            className="sr-only"
                          >
                            {item.code} {item.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <h3 className="font-sans font-semibold text-xs text-ink dark:text-zinc-100 mb-2.5">
                    Programmatic Vehicle × OBD-II Matrix
                  </h3>
                  <ul className="space-y-1.5">
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
                          className="flex items-center justify-between gap-2 w-full hover:text-primary-600 dark:hover:text-emerald-400 text-left transition-colors py-0.5"
                        >
                          <span className="truncate font-sans text-body dark:text-zinc-300 hover:underline">
                            {item.anchorText}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-primary-600 dark:text-emerald-400 shrink-0">
                            {item.code}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <BrandQuickJumpIndex
                onNavigateToVehicles={
                  onNavigateToVehicles || (() => onSelectTab && onSelectTab('vehicles'))
                }
              />
            </div>
          </details>

          {/* Legal Disclosure Line */}
          <div className="py-4 border-t border-border/80 dark:border-zinc-800 space-y-1.5 text-[11px] font-sans text-muted dark:text-zinc-400 leading-relaxed">
            <p data-testid="footer-legal-notice-line" className="font-medium text-body dark:text-zinc-300">
              {WORKSPACE_LEGAL_NOTICE_LINE} {AMAZON_ASSOCIATES_CLAUSE}
            </p>
            <p className="text-[10px] text-faint dark:text-zinc-500">
              {NOMINATIVE_FAIR_USE_NOTICE}
            </p>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-4 border-t border-border/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans text-muted dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span>© 2026 {MONETIZATION_CONFIG.brandName} ({MONETIZATION_CONFIG.domain}). Estimates only.</span>
              <span>·</span>
              <span>Independent benchmark, not affiliated with OEMs.</span>
              <span>·</span>
              <span>Updated {MONETIZATION_CONFIG.lastUpdated}</span>
            </div>
            <span className="text-faint dark:text-zinc-500 font-mono tabular-nums">v4.15</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
