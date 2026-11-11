import React from 'react';
import { ArrowRight, ShieldCheck, Car, Zap, Landmark, Wrench } from 'lucide-react';
import { Pill } from '../common/OdometerPrimitives';
import { useUnits } from '../../context/UnitContext';
import VinCheckBanner from './VinCheckBanner';
import {
  resolveAffiliateOffer,
  buildAffiliateUrl,
  FTC_PROXIMATE_DISCLOSURE,
} from '../../config/monetizationConfig';

const ICONS = {
  'vin-check': Car,
  vinCheck: Car,
  'obd-scanner': Zap,
  obdScanner: Zap,
  warranty: ShieldCheck,
  'parts-lookup': Wrench,
  partsLookup: Wrench,
  'insurance-finance': Landmark,
  autoInsurance: Landmark,
};

export default function AffiliateCTA({
  type = 'vin-check',
  vehicleName = 'Selected Vehicle',
  purchasePriceUsd,
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
  stepLabel,
  customHeadline,
  customBody,
  ctaText,
  href,
  className = '',
}) {
  const { region, formatCurrency, formatDistance } = useUnits();

  if (type === 'vin-check' || type === 'vinCheck') {
    return (
      <VinCheckBanner
        placement="affiliate-cta"
        vehicleName={vehicleName}
        purchasePriceUsd={purchasePriceUsd}
        odometerMiles={odometerMiles}
        stepLabel={stepLabel}
        headline={customHeadline}
        description={customBody}
        className={className}
      />
    );
  }

  const offer = resolveAffiliateOffer({
    type,
    region,
    vehicleName,
    purchasePriceUsd,
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

  const headline = customHeadline || offer.title;
  const bodyText = customBody !== undefined ? customBody : offer.description;
  const actionText = ctaText || offer.ctaText || linkProps.buttonText;
  const targetHref = href && href !== '#' ? href : offer.href || linkProps.href;
  const IconComp = ICONS[offer.type] || ICONS[type] || Car;

  return (
    <aside
      data-testid={`affiliate-cta-${offer.type}`}
      className={`w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] p-4 sm:p-5 print:hidden no-print ${className}`}
      aria-label="Partner Recommendation"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-zinc-900 text-primary-600 dark:text-primary-400 border border-zinc-200 dark:border-zinc-800 items-center justify-center shadow-xs">
            <IconComp className="w-4 h-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {stepLabel && (
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  {stepLabel}
                </span>
              )}
              <Pill tone="brand">
                {offer.badge}
              </Pill>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                {offer.highlightBadge}
              </span>
            </div>
            <h4 className="text-sm font-sans font-bold tracking-tight text-ink dark:text-zinc-50 leading-snug break-words">
              {headline}
            </h4>
            {bodyText && (
              <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed">
                {bodyText}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto flex flex-col sm:items-end gap-1">
          <a
            href={targetHref}
            target={linkProps.target}
            rel={linkProps.rel}
            className="group w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 sm:py-2 text-xs font-sans font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-primary-700 active:scale-[0.98] shadow-sm"
          >
            <span>{actionText}</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-[10px] font-sans text-muted dark:text-zinc-400">
            {FTC_PROXIMATE_DISCLOSURE}
          </span>
          <span className="text-[10px] font-sans font-medium text-faint dark:text-zinc-500">
            {offer.partnerName} ({offer.region})
          </span>
        </div>
      </div>
    </aside>
  );
}
