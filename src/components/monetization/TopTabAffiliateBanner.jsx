import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Zap, Car } from 'lucide-react';
import { Pill } from '../common/OdometerPrimitives';

export default function TopTabAffiliateBanner({
  type = 'vin-check',
  vehicleName = 'Selected Vehicle',
  vehiclePriceFormatted = '$30,000',
  activeCode = 'P2002',
  activeCodeTitle = 'Diesel Particulate Filter Efficiency',
  className = '',
  compact = false,
}) {
  let config;

  if (type === 'vin-check') {
    config = {
      badge: 'Verified Partner',
      title: `Buying or owning this ${vehicleName}? Check odometer rollbacks & salvage records before paying ${vehiclePriceFormatted}`,
      description: `Verify real mileage, hidden structural collision damage, past salvage titles, and theft history before paying ${vehiclePriceFormatted}. Certified Euro & NMVTIS database inspection.`,
      features: ['Odometer Rollback Detection', 'Salvage & Flood Title Records', 'Accident & Repair History'],
      ctaText: 'Run Instant VIN Check',
      href: 'https://www.carfax.com/vehicle-history-reports/',
      highlightBadge: 'Average buyer avoids $3,200+ in undisclosed repairs',
      trustProof: 'Official NMVTIS & Euro Database Partner · 14,000+ Verified Scans',
      icon: Car,
    };
  } else if (type === 'warranty') {
    config = {
      badge: 'Verified Partner',
      title: `Avoid unexpected workshop bills for ${vehicleName} — Compare repair protection & save up to $420/yr`,
      description: `Mechanical repair costs escalate dramatically as mileage increases. Protect against high-pressure fuel pump, turbocharger, and transmission failures with $0 out-of-pocket coverage.`,
      features: ['Save up to $420/yr on Coverage', '$0 Deductible Options', 'Direct Master Workshop Billing'],
      ctaText: 'Compare Warranty Plans',
      href: 'https://www.carshield.com/',
      highlightBadge: 'Save up to $420/yr on Coverage',
      trustProof: 'Rated 4.8/5 · ASE-Certified Repair Network in US & Europe',
      icon: ShieldCheck,
    };
  } else {
    // 'obd-scanner'
    config = {
      badge: 'Verified Partner',
      title: `Don't pay $150+ in workshop diagnostic fees — Read ${activeCode} and live sensor PIDs yourself with a Bluetooth OBD2 scanner`,
      description: `Read freeze-frame telemetry, live O2/boost/fuel PIDs, and reset the Check Engine light in under 60 seconds. Recommended hardware diagnostic tool for ${activeCodeTitle}.`,
      features: ['iOS & Android Bluetooth', 'Live Sensor Telemetry PIDs', 'Reset Check Engine Light'],
      ctaText: 'Get Recommended OBD2 Scanner',
      href: 'https://www.amazon.com/s?k=bluetooth+obd2+scanner',
      highlightBadge: 'Pays for itself on the first diagnostic scan',
      trustProof: '4.9/5 Rating · Works with any 1996+ OBD-II / EOBD vehicle',
      icon: Zap,
    };
  }

  const IconComp = config.icon;

  if (compact) {
    return (
      <aside
        className={`relative overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-card transition-all duration-300 hover:shadow-card-hover ${className}`}
        aria-label="Partner Recommendation"
      >
        <div className="flex items-start gap-3.5 mb-3">
          <div className="flex w-9 h-9 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center">
            <IconComp className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="neutral" className="text-[10px] uppercase font-mono tracking-wider font-semibold">
                {config.badge}
              </Pill>
              <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                {config.highlightBadge}
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-ink dark:text-slate-100 leading-snug">
              {config.title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-body dark:text-slate-300 leading-relaxed mb-3">
          {config.description}
        </p>

        {/* Feature checklist chips */}
        <div className="flex flex-col gap-1.5 pt-1 pb-3 text-xs font-medium text-body dark:text-slate-300 border-t border-border/50 dark:border-slate-800">
          {config.features.map((feat) => (
            <span key={feat} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-score-good dark:text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </span>
          ))}
        </div>

        {/* Full-width CTA Button */}
        <div className="pt-2 border-t border-border/60 dark:border-slate-800 flex flex-col gap-1">
          <a
            href={config.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
          >
            <span>{config.ctaText}</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-[10px] text-muted dark:text-slate-400 font-mono text-center">
            {config.trustProof}
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 sm:p-6 shadow-card transition-all duration-300 hover:shadow-card-hover ${className}`}
      aria-label="Partner Recommendation"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Column: Icon + Context, Title, Description, and Badges */}
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center">
            <IconComp className="w-5 h-5" />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="neutral" className="text-[10px] uppercase font-mono tracking-wider font-semibold">
                {config.badge}
              </Pill>
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 px-2.5 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                {config.highlightBadge}
              </span>
              <span className="hidden md:inline text-[11px] font-mono text-muted dark:text-slate-400">
                · {config.trustProof}
              </span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-slate-100">
                {config.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-body dark:text-slate-300 leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Feature checklist chips */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium text-body dark:text-slate-300">
              {config.features.map((feat) => (
                <span key={feat} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-score-good dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: CTA Button */}
        <div className="shrink-0 flex flex-col sm:items-start lg:items-end gap-1.5">
          <a
            href={config.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
          >
            <span>{config.ctaText}</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-[11px] text-muted dark:text-slate-400 font-mono">
            Direct certified partner dispatch
          </span>
        </div>
      </div>
    </aside>
  );
}
