import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Zap, Car, Landmark, Wrench } from 'lucide-react';
import { Pill } from '../common/OdometerPrimitives';
import { useUnits } from '../../context/UnitContext';
import {
  resolveAffiliateOffer,
  buildAffiliateUrl,
  FTC_PROXIMATE_DISCLOSURE,
} from '../../config/monetizationConfig';

const TYPE_ICONS = {
  'vin-check': Car,
  vinCheck: Car,
  warranty: ShieldCheck,
  'parts-lookup': Wrench,
  partsLookup: Wrench,
  'obd-scanner': Zap,
  obdScanner: Zap,
  'insurance-finance': Landmark,
  autoInsurance: Landmark,
};

export default function TopTabAffiliateBanner({
  type = 'vin-check',
  vehicleName = 'Selected Vehicle',
  purchasePriceUsd,
  vehiclePriceFormatted,
  odometerMiles,
  serviceReserveUsd,
  activeCode = 'P2002',
  activeCodeTitle = 'Diesel Particulate Filter Efficiency',
  cheapestCauseUsd,
  costliestCauseUsd,
  cheapCauseProbPct,
  insuranceAndInterest5YrUsd,
  insuranceSharePct,
  monthlySavingsEstUsd,
  className = '',
  compact = false,
}) {
  const { region, formatCurrency, formatDistance } = useUnits();

  const config = resolveAffiliateOffer({
    type,
    region,
    vehicleName,
    purchasePriceUsd,
    vehiclePriceFormatted,
    odometerMiles,
    serviceReserveUsd,
    activeCode,
    activeCodeTitle,
    cheapestCauseUsd,
    costliestCauseUsd,
    cheapCauseProbPct,
    insuranceAndInterest5YrUsd,
    insuranceSharePct,
    monthlySavingsEstUsd,
    formatCurrency,
    formatDistance,
  });

  const linkProps = buildAffiliateUrl(type, {
    vehicleName,
    purchasePriceUsd,
    odometerMiles,
    activeCode,
    region,
  });

  const IconComp = TYPE_ICONS[config.type] || TYPE_ICONS[type] || Car;

  if (compact) {
    return (
      <aside
        data-testid={`affiliate-banner-${config.type}`}
        className={`relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover print:hidden no-print ${className}`}
        aria-label="Partner Recommendation"
      >
        <div className="flex items-start gap-3.5 mb-3">
          <div className="flex w-9 h-9 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center">
            <IconComp className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="neutral">
                {config.badge}
              </Pill>
              <span className="text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                {config.highlightBadge}
              </span>
            </div>
            <h3 className="text-sm font-sans font-bold tracking-tight text-ink dark:text-zinc-50 leading-snug">
              {config.title}
            </h3>
          </div>
        </div>

        <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed mb-3">
          {config.description}
        </p>

        <div className="flex flex-col gap-1.5 pt-1 pb-3 text-xs font-sans font-medium text-body dark:text-zinc-300 border-t border-zinc-200/70 dark:border-zinc-800">
          {config.features.map((feat) => (
            <span key={feat} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-col gap-1">
          <a
            href={config.href || linkProps.href}
            target={linkProps.target}
            rel={linkProps.rel}
            className="group w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-sans font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-700 active:scale-[0.98]"
          >
            <span>{config.ctaText}</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-[10px] text-muted dark:text-zinc-400 font-sans text-center">
            {FTC_PROXIMATE_DISCLOSURE}
          </span>
          <span className="text-[10px] text-faint dark:text-zinc-500 font-sans font-medium text-center">
            {config.trustProof}
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-testid={`affiliate-banner-${config.type}`}
      className={`relative overflow-hidden w-full max-w-full min-w-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-4 sm:p-6 shadow-card transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover print:hidden no-print ${className}`}
      aria-label="Partner Recommendation"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between min-w-0">
        <div className="flex items-start gap-4 max-w-3xl min-w-0">
          <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center">
            <IconComp className="w-5 h-5" />
          </div>

          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="neutral">
                {config.badge}
              </Pill>
              <span className="text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                {config.highlightBadge}
              </span>
              <span className="hidden md:inline text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                · {config.trustProof}
              </span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 break-words">
                {config.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed">
                {config.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-sans font-medium text-body dark:text-zinc-300">
              {config.features.map((feat) => (
                <span key={feat} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto flex flex-col sm:items-start lg:items-end gap-1.5">
          <a
            href={config.href || linkProps.href}
            target={linkProps.target}
            rel={linkProps.rel}
            className="group w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-xs font-sans font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-700 active:scale-[0.98]"
          >
            <span>{config.ctaText}</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-[11px] text-muted dark:text-zinc-400 font-sans">
            {FTC_PROXIMATE_DISCLOSURE}
          </span>
          <span className="text-[10px] text-faint dark:text-zinc-500 font-sans font-medium">
            {config.trustProof} ({config.region})
          </span>
        </div>
      </div>
    </aside>
  );
}
