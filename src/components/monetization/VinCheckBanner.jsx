import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Check, ArrowRight, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import CarVerticalLogo from '../common/CarVerticalLogo';
import {
  getCarVerticalUrl,
  CARVERTICAL_DISCOUNT_CODE,
  CARVERTICAL_LEGAL_ATTRIBUTION,
  FTC_PROXIMATE_DISCLOSURE,
} from '../../config/monetizationConfig';
import { decodeVinNhtsa } from '../../services/vehicleApi.ts';

function CopyIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function formatEngineBadge(data) {
  if (!data) return null;
  const fuelType = String(data.FuelTypePrimary || '').trim();
  const displacement = String(data.DisplacementL || '').trim();
  const cylinders = String(data.EngineCylinders || '').trim();

  const isEv =
    fuelType.toLowerCase().includes('electric') ||
    (!displacement && !cylinders && fuelType);

  if (isEv) {
    return fuelType || 'Electric';
  }

  const parts = [];
  if (displacement) {
    parts.push(`${displacement}L`);
  }
  if (cylinders) {
    parts.push(`${cylinders}-Cyl`);
  }
  if (fuelType) {
    parts.push(fuelType);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * VinCheckBanner Component
 *
 * Official carVertical Affiliate Banner & Interactive Verification Card.
 * Standardized across all pages to match the canonical True to Cost (TCO) presentation:
 * 1. Clean header: Official logo in white pill on the left, copyable 20% discount coupon badge on the right.
 * 2. Dynamic vehicle-aware title & description with formatted price.
 * 3. 3-point vertical inspection feature list with green checkmarks.
 * 4. 2-Step Live NHTSA VIN Decoder funnel with Factory VIN Decoded preview strip.
 * 5. Interactive uppercase VIN/Plate input and direct Everflow tracking button.
 * 6. Proximate FTC disclosure and Clause 1.3 Partnership Agreement legal attribution.
 */
export default function VinCheckBanner({
  placement = 'general',
  initialVin = '',
  vehicleName = '',
  purchasePriceUsd,
  vehiclePriceFormatted,
  odometerMiles,
  compact = true,
  stepLabel = '',
  headline = '',
  description = '',
  className = '',
}) {
  const [vinOrPlate, setVinOrPlate] = useState(initialVin);
  const [copied, setCopied] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState(null);
  const [decodeError, setDecodeError] = useState(null);

  const abortControllerRef = useRef(null);
  const lastDecodedVinRef = useRef('');

  const targetUrl = getCarVerticalUrl(vinOrPlate, placement);

  const triggerDecode = async (rawVin) => {
    const clean = String(rawVin || '').trim().toUpperCase();
    if (!clean || clean.length !== 17 || !/^[A-Z0-9]{17}$/.test(clean)) {
      setDecodeError('Please enter a valid 17-character VIN to decode free factory specifications.');
      return;
    }
    if (clean === lastDecodedVinRef.current && decodedData) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsDecoding(true);
    setDecodeError(null);

    try {
      const result = await decodeVinNhtsa(clean, controller.signal);
      if (controller.signal.aborted) return;
      lastDecodedVinRef.current = clean;

      if (result && result.Make && String(result.Make).trim() !== '') {
        setDecodedData(result);
        setDecodeError(null);
      } else {
        setDecodedData(null);
        setDecodeError(
          result?.ErrorText ||
          'Government database returned no factory record for this VIN. Unlock complete history records via carVertical below.'
        );
      }
    } catch (err) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setDecodedData(null);
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setDecodeError(
        isOffline
          ? 'Network appears offline. Free factory decoding unavailable, but you can continue to carVertical.'
          : 'Free NHTSA decoding service temporarily unreachable. Continue below to check full vehicle history on carVertical.'
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsDecoding(false);
      }
    }
  };

  useEffect(() => {
    if (initialVin) {
      setVinOrPlate(initialVin);
      const clean = String(initialVin).trim().toUpperCase();
      if (clean.length === 17 && /^[A-Z0-9]{17}$/.test(clean)) {
        triggerDecode(clean);
      }
    }
  }, [initialVin]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setVinOrPlate(val);
    const clean = val.trim().toUpperCase();
    if (clean.length === 17 && /^[A-Z0-9]{17}$/.test(clean)) {
      triggerDecode(clean);
    } else if (clean.length < 17) {
      if (decodedData) setDecodedData(null);
      if (decodeError) setDecodeError(null);
    }
  };

  const handleCopyCode = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let copiedSuccess = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CARVERTICAL_DISCOUNT_CODE);
        copiedSuccess = true;
      }
    } catch {
      // Fallback to legacy document.execCommand
    }

    if (!copiedSuccess && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = CARVERTICAL_DISCOUNT_CODE;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copiedSuccess = true;
      } catch {
        // Safe silent fallback
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formattedPrice =
    vehiclePriceFormatted ||
    (purchasePriceUsd ? `$${Number(purchasePriceUsd).toLocaleString()}` : '$24,800');

  const cleanVehicleName = String(vehicleName || '').trim().replace(/^(a|an)\s+/i, '');

  const displayTitle =
    headline ||
    (cleanVehicleName
      ? `Buying or owning this ${cleanVehicleName}? Check odometer rollbacks & salvage records before paying ${formattedPrice}`
      : `Buying or owning a used vehicle? Check odometer rollbacks & salvage records before paying ${formattedPrice}`);

  const displayDescription =
    description ||
    `Check chronological mileage records, past damage history, salvage or flood title status, and theft records via carVertical before paying ${formattedPrice}.`;

  const features = [
    'Odometer Rollback Detection',
    'Salvage & Flood Title Records',
    'Accident & Repair History',
  ];

  const engineBadge = formatEngineBadge(decodedData);

  return (
    <aside
      id="affiliate-cta-vin-check"
      data-testid="vin-check-banner"
      data-placement={placement}
      className={`affiliate-cta-vin-check relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-4 sm:p-5 shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover print:hidden no-print ${className}`}
      aria-label="carVertical Vehicle History Report"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <CarVerticalLogo withPill={true} imgClassName="h-5 w-auto object-contain" />
          {stepLabel && (
            <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              {stepLabel}
            </span>
          )}
        </div>

        {/* Copyable Promo Code Badge */}
        <button
          type="button"
          onClick={handleCopyCode}
          title="Click to copy 20% discount coupon code"
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[11px] font-sans font-semibold text-[#0068FF] dark:text-blue-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-emerald-700 dark:text-emerald-300">Code Copied!</span>
            </>
          ) : (
            <>
              <span>Code: <span className="font-mono uppercase font-bold">{CARVERTICAL_DISCOUNT_CODE}</span> (20% OFF)</span>
              <CopyIcon className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>
      </div>

      <h3 className="text-sm font-sans font-bold tracking-tight text-ink dark:text-zinc-50 leading-snug mb-1.5">
        {displayTitle}
      </h3>

      <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed mb-3">
        {displayDescription}
      </p>

      {/* Verification Features Badges */}
      <div className="flex flex-col gap-1.5 pt-1 pb-3 text-xs font-sans font-medium text-body dark:text-zinc-300 border-t border-zinc-200/70 dark:border-zinc-800">
        {features.map((feat) => (
          <span key={feat} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feat}</span>
          </span>
        ))}
      </div>

      {/* In-flight Decoding Indicator */}
      {isDecoding && (
        <div
          data-testid="vin-decoding-indicator"
          className="mb-3 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex items-center gap-2 text-xs font-sans text-blue-700 dark:text-blue-300"
        >
          <RotateCcw className="w-4 h-4 animate-spin text-[#0068FF] shrink-0" />
          <span>Contacting NHTSA vPIC database for official factory vehicle specifications...</span>
        </div>
      )}

      {/* Decoding Error / Offline State */}
      {decodeError && !isDecoding && (
        <div
          data-testid="vin-decode-error"
          className="mb-3 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-2 text-xs font-sans text-amber-800 dark:text-amber-200"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{decodeError}</span>
          </div>
        </div>
      )}

      {/* Factory VIN Decoded Preview Strip */}
      {decodedData && (decodedData.Make || decodedData.Model) && (
        <div
          data-testid="factory-vin-decoded-strip"
          className="mb-3 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/40 text-ink dark:text-zinc-100 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Factory VIN Decoded
              </span>
            </div>
            {decodedData.PlantCountry && (
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-emerald-200 dark:border-emerald-900/40">
                Plant: {decodedData.PlantCountry}
              </span>
            )}
          </div>

          {/* Verified Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans">
            {decodedData.ModelYear && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {decodedData.ModelYear}
              </span>
            )}
            {decodedData.Make && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {decodedData.Make}
              </span>
            )}
            {decodedData.Model && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {decodedData.Model}
              </span>
            )}
            {engineBadge && (
              <span className="px-2 py-0.5 rounded-md font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-emerald-200 dark:border-emerald-900/50">
                {engineBadge}
              </span>
            )}
          </div>

          {/* High-contrast conversion prompt verbatim */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-xs font-sans leading-relaxed text-zinc-800 dark:text-zinc-200 shadow-sm">
            <p className="font-medium text-emerald-950 dark:text-emerald-200">
              Factory specifications confirmed. Note: Free government VIN decoding does NOT reveal odometer rollbacks, hidden accident damage, salvage titles, or theft records. Unlock the full history report on carVertical below (20% OFF code: mydriveledger).
            </p>
          </div>
        </div>
      )}

      {/* Interactive VIN / Plate Input Strip & Dual Action Buttons */}
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-2 mb-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={vinOrPlate}
              onChange={handleInputChange}
              placeholder="Enter 17-digit VIN or License Plate (Optional)"
              maxLength={20}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-sans text-ink dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#0068FF] focus:border-transparent transition-all uppercase tracking-wide"
            />
          </div>
          <button
            type="button"
            onClick={() => triggerDecode(vinOrPlate)}
            disabled={isDecoding}
            className="shrink-0 h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 text-xs font-sans font-medium text-ink dark:text-zinc-200 transition-colors disabled:opacity-60 cursor-pointer"
            title="Decode official factory specifications via US NHTSA database"
          >
            {isDecoding ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-[#0068FF]" />
                <span>Decoding Specs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Decode Free Factory Specs</span>
              </>
            )}
          </button>
          <a
            href={targetUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group shrink-0 h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-lg bg-[#0068FF] hover:bg-[#0055d4] active:scale-[0.98] text-white text-xs font-sans font-semibold shadow-sm transition-[background-color,transform]"
          >
            <span>Check Vehicle History (20% OFF)</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </form>

      <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800 space-y-1">
        <div className="flex flex-wrap items-center justify-between text-[10px] font-sans text-muted dark:text-zinc-400">
          <span>{FTC_PROXIMATE_DISCLOSURE}</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Run Instant VIN Check · 20% OFF</span>
        </div>
        <p className="text-[9.5px] font-sans text-faint dark:text-zinc-500 leading-normal">
          {CARVERTICAL_LEGAL_ATTRIBUTION}
        </p>
      </div>
    </aside>
  );
}
