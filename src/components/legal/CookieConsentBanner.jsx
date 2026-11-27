import React, { useState, useEffect } from 'react';
import { Shield, Sliders, Check } from 'lucide-react';

export const COOKIE_CONSENT_STORAGE_KEY = 'shiftmetric_cookie_consent';

export function isGoogleCmpPresent() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.googlefc ||
    typeof window.__tcfapi === 'function' ||
    typeof window.__gpp === 'function' ||
    typeof window.__uspapi === 'function'
  );
}

export function openPrivacySettings(fallbackCallback) {
  if (typeof window !== 'undefined') {
    // 1. Direct call if window.googlefc.showRevocationMessage is already available
    if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
      try {
        window.googlefc.showRevocationMessage();
        return true;
      } catch (_err) {
        // Fall back if exception thrown
      }
    }

    // 2. Queue via callbackQueue if window.googlefc is present or loading
    if (window.googlefc && typeof window.googlefc === 'object') {
      window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
      try {
        window.googlefc.callbackQueue.push({
          CONSENT_DATA_READY: () => {
            if (typeof window.googlefc.showRevocationMessage === 'function') {
              window.googlefc.showRevocationMessage();
            } else if (typeof fallbackCallback === 'function') {
              fallbackCallback();
            }
          },
        });
        return true;
      } catch (_err) {
        // Fall back if exception thrown
      }
    }
  }

  // 3. Fallback to our internal cookie preferences modal if blocked by an adblocker
  if (typeof fallbackCallback === 'function') {
    fallbackCallback();
  }
  return false;
}

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
      if (typeof window !== 'undefined') {
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: payload.analytics ? 'granted' : 'denied',
            ad_storage: payload.advertising ? 'granted' : 'denied',
            ad_user_data: payload.advertising ? 'granted' : 'denied',
            ad_personalization: payload.advertising ? 'granted' : 'denied',
          });
        }
        if (typeof window.__loadDriveLedgerAdSense === 'function') {
          window.__loadDriveLedgerAdSense();
        } else if (!payload.advertising && typeof document !== 'undefined') {
          const existing = document.getElementById('driveledger-adsense-script');
          if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
          }
        }
      }
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
  const [hasCmp, setHasCmp] = useState(() => isGoogleCmpPresent());
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => savedConsent?.analytics ?? false
  );
  const [advertisingEnabled, setAdvertisingEnabled] = useState(
    () => savedConsent?.advertising ?? false
  );

  useEffect(() => {
    // If CMP is not detected immediately on mount, check again shortly after scripts execute
    if (!hasCmp) {
      const checkCmp = () => {
        if (isGoogleCmpPresent()) {
          setHasCmp(true);
        }
      };
      checkCmp();
      const t1 = setTimeout(checkCmp, 250);
      const t2 = setTimeout(checkCmp, 1000);
      const t3 = setTimeout(checkCmp, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [hasCmp]);

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

  // Suppress custom fallback bottom banner if Google's official CMP is present,
  // preventing double overlapping consent popups for EU and US visitors.
  // When explicitly opened by user via cookie settings (isOpenOverride === true), render our modal.
  if (hasCmp && !isOpenOverride) {
    return null;
  }

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
      className={`fixed bottom-0 inset-x-0 ${isOpenOverride ? 'z-50' : 'z-40'} p-0 sm:p-3 safe-area-x safe-area-bottom pointer-events-none print:hidden no-print`}
    >
      <div className="mx-auto max-w-[1280px] max-h-[85dvh] overflow-y-auto pointer-events-auto rounded-none sm:rounded-2xl border-t sm:border border-border dark:border-zinc-800 bg-surface/95 dark:bg-[#121215]/95 backdrop-blur-md shadow-lg px-3 py-2 sm:px-5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2.5 max-w-3xl min-w-0">
            <div className="hidden sm:flex w-7 h-7 shrink-0 rounded-lg bg-primary-50 dark:bg-emerald-950/60 text-primary-600 dark:text-emerald-400 border border-primary-100 dark:border-emerald-800 items-center justify-center">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <p className="text-[11px] sm:text-xs font-sans text-body dark:text-zinc-300 leading-snug min-w-0">
              We use essential cookies and, with consent, AdSense cookies.{' '}
              <a
                href="#cookies"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenPolicyModal) onOpenPolicyModal('cookies');
                }}
                className="font-semibold text-primary-600 dark:text-emerald-400 underline hover:text-primary-700 dark:hover:text-emerald-300 whitespace-nowrap"
              >
                Cookie Policy
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-nowrap shrink-0">
            <button
              type="button"
              data-testid="cookie-settings-toggle"
              onClick={() => setShowSettings((prev) => !prev)}
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-sans font-semibold text-ink dark:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                <span className="sr-only sm:not-sr-only">Cookie </span>Settings
              </span>
            </button>
            <button
              type="button"
              data-testid="cookie-essential-only"
              onClick={handleEssentialOnly}
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center rounded-lg border border-border-strong dark:border-zinc-700 bg-surface dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold text-ink dark:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              Essential Only
            </button>
            <button
              type="button"
              data-testid="cookie-accept-all"
              onClick={handleAcceptAll}
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-3 sm:px-3.5 py-1.5 text-xs font-sans font-semibold text-white shadow-xs transition-colors whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Accept All</span>
            </button>
          </div>
        </div>

        {showSettings && (
          <div
            data-testid="cookie-granular-settings"
            className="mt-3 pt-3 border-t border-border dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-sans"
          >
            <div className="rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/70 p-3 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>1. Strictly Necessary Storage</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0">
                    Always Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Stores currency/unit preferences (US, UK, EU), dark/light theme, and locally saved garage vehicles. Never transmitted externally.
                </p>
              </div>
            </div>

            <label className="rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/70 p-3 flex flex-col justify-between gap-2 cursor-pointer">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>2. Anonymous Diagnostic Telemetry</span>
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border-strong dark:border-zinc-600 accent-primary-600 dark:accent-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Helps us measure aggregate calculator responsiveness and identify missing vehicle presets or OBD-II fault codes.
                </p>
              </div>
            </label>

            <label className="rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/70 p-3 flex flex-col justify-between gap-2 cursor-pointer">
              <div>
                <div className="flex items-center justify-between gap-2 font-semibold text-ink dark:text-zinc-100">
                  <span>3. Google AdSense &amp; DART Cookies</span>
                  <input
                    type="checkbox"
                    checked={advertisingEnabled}
                    onChange={(e) => setAdvertisingEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border-strong dark:border-zinc-600 accent-primary-600 dark:accent-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                  Permits Google AdSense and DoubleClick DART cookies to serve relevant automotive advertisements and cap ad frequency.
                </p>
              </div>
            </label>

            <div className="md:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-muted dark:text-zinc-400">
                CCPA / CPRA Notice: Selecting &ldquo;Essential Only&rdquo; enforces your &ldquo;Do Not Sell or Share My Personal Information&rdquo; opt-out right.
              </span>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="min-h-[44px] sm:min-h-0 rounded-lg bg-ink dark:bg-zinc-100 px-4 py-1.5 text-xs font-sans font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity shrink-0"
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
