import React, { useState, useEffect } from 'react';
import { Shield, Sliders, Check } from 'lucide-react';
import { MONETIZATION_CONFIG } from '../../config/monetizationConfig';

export const COOKIE_CONSENT_STORAGE_KEY = 'shiftmetric_cookie_consent';

function resolveStorage() {
  if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

export function getSavedCookieConsent() {
  const storage = resolveStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

export function saveCookieConsentSelection(selection) {
  const payload = {
    essential: true,
    analytics: Boolean(selection.analytics),
    advertising: Boolean(selection.advertising),
    mode: selection.mode || (selection.advertising ? 'all' : 'essential'),
    updatedAt: new Date().toISOString(),
  };
  const storage = resolveStorage();
  if (storage) {
    try {
      storage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch (_err) {
      // Ignore storage quota errors in restricted environments
    }
  }
  return payload;
}

export default function CookieConsentBanner({
  isOpenOverride = false,
  onCloseOverride,
  onOpenPolicyModal,
}) {
  const [savedConsent, setSavedConsent] = useState(() => getSavedCookieConsent());
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => savedConsent?.analytics ?? false
  );
  const [advertisingEnabled, setAdvertisingEnabled] = useState(
    () => savedConsent?.advertising ?? false
  );

  useEffect(() => {
    if (isOpenOverride) {
      const current = getSavedCookieConsent();
      if (current) {
        setAnalyticsEnabled(Boolean(current.analytics));
        setAdvertisingEnabled(Boolean(current.advertising));
      }
      setShowSettings(true);
    }
  }, [isOpenOverride]);

  const isVisible = !savedConsent || isOpenOverride;
  if (!isVisible) return null;

  const handleAcceptAll = () => {
    const next = saveCookieConsentSelection({
      essential: true,
      analytics: true,
      advertising: true,
      mode: 'all',
    });
    setSavedConsent(next);
    setAnalyticsEnabled(true);
    setAdvertisingEnabled(true);
    setShowSettings(false);
    if (onCloseOverride) onCloseOverride();
  };

  const handleEssentialOnly = () => {
    const next = saveCookieConsentSelection({
      essential: true,
      analytics: false,
      advertising: false,
      mode: 'essential',
    });
    setSavedConsent(next);
    setAnalyticsEnabled(false);
    setAdvertisingEnabled(false);
    setShowSettings(false);
    if (onCloseOverride) onCloseOverride();
  };

  const handleSaveCustom = () => {
    const next = saveCookieConsentSelection({
      essential: true,
      analytics: analyticsEnabled,
      advertising: advertisingEnabled,
      mode: advertisingEnabled || analyticsEnabled ? 'custom' : 'essential',
    });
    setSavedConsent(next);
    setShowSettings(false);
    if (onCloseOverride) onCloseOverride();
  };

  return (
    <aside
      data-testid="cookie-consent-banner"
      aria-label="GDPR and CCPA Cookie Consent Banner"
      className="fixed bottom-0 inset-x-0 z-40 p-2 sm:p-4 safe-area-x safe-area-bottom pointer-events-none print:hidden no-print"
    >
      <div className="mx-auto max-w-[1280px] max-h-[90dvh] overflow-y-auto pointer-events-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface/95 dark:bg-[#121215]/95 backdrop-blur-md shadow-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3 max-w-3xl min-w-0">
            <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
                  Privacy &amp; Cookie Governance (GDPR / UK GDPR / CCPA)
                </span>
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  100% Client-Side Calculator Math
                </span>
              </div>
              <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed">
                {MONETIZATION_CONFIG.brandName} processes all vehicle cost and OBD-II calculations locally in your browser. We use essential local storage for unit/theme preferences and, with your consent, Google AdSense (DoubleClick DART) cookies to support free access. Review our{' '}
                <a
                  href="#cookies"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenPolicyModal) onOpenPolicyModal('cookies');
                  }}
                  className="font-semibold text-primary-600 dark:text-primary-400 underline hover:text-primary-700"
                >
                  Cookie &amp; AdSense DART Policy
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="cookie-settings-toggle"
              onClick={() => setShowSettings((prev) => !prev)}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cookie Settings</span>
            </button>
            <button
              type="button"
              data-testid="cookie-essential-only"
              onClick={handleEssentialOnly}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Essential Only
            </button>
            <button
              type="button"
              data-testid="cookie-accept-all"
              onClick={handleAcceptAll}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-sans font-semibold text-white hover:bg-primary-700 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All</span>
            </button>
          </div>
        </div>

        {showSettings && (
          <div
            data-testid="cookie-granular-settings"
            className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans"
          >
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>1. Strictly Necessary Storage</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Always Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Stores currency/unit preferences (US, UK, EU), dark/light theme, and locally saved garage vehicles. Never transmitted externally.
                </p>
              </div>
            </div>

            <label className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 flex flex-col justify-between gap-2 cursor-pointer">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>2. Anonymous Diagnostic Telemetry</span>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Helps us measure aggregate calculator responsiveness and identify missing vehicle presets or OBD-II fault codes.
                </p>
              </div>
            </label>

            <label className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 flex flex-col justify-between gap-2 cursor-pointer">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>3. Google AdSense &amp; DART Cookies</span>
                  <input
                    type="checkbox"
                    checked={advertisingEnabled}
                    onChange={(e) => setAdvertisingEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Permits Google AdSense and DoubleClick DART cookies to serve relevant automotive advertisements and cap ad frequency.
                </p>
              </div>
            </label>

            <div className="md:col-span-3 flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted dark:text-zinc-400">
                CCPA / CPRA Notice: Selecting &ldquo;Essential Only&rdquo; enforces your &ldquo;Do Not Sell or Share My Personal Information&rdquo; opt-out right.
              </span>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="rounded-lg bg-ink dark:bg-zinc-100 px-4 py-1.5 text-xs font-sans font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                Save Selected Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
