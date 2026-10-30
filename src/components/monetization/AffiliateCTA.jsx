import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Pill } from '../common/OdometerPrimitives';

export default function AffiliateCTA({
  type = 'vin-check',
  vehicleName = 'Selected Vehicle',
  customHeadline,
  customBody,
  ctaText,
  href = '#',
}) {
  const isScanner = type === 'obd-scanner';
  const badge = 'Verified Partner';
  const headline = customHeadline || (isScanner
    ? 'Prevent $2,500+ surprise workshop bills — scan live engine & DPF health from your phone.'
    : `Buying used? Check ${vehicleName}'s hidden accident & odometer history.`);
  const actionText = ctaText || (isScanner ? 'Compare OBD2 Scanners' : 'Run VIN Check');
  const targetHref = href !== '#' ? href : (isScanner
    ? 'https://www.amazon.com/s?k=bluetooth+obd2+scanner'
    : 'https://www.carfax.com/vehicle-history-reports/');

  return (
    <aside className="rounded-xl border border-border bg-surface-subtle p-4">
      <Pill tone="brand" className="text-[10px] tracking-wide uppercase font-mono">
        {badge}
      </Pill>
      <h4 className="mt-2 text-sm font-bold tracking-tight text-ink">
        {headline}
      </h4>
      {customBody && (
        <p className="mt-1 text-xs text-body leading-relaxed">
          {customBody}
        </p>
      )}
      <a
        href={targetHref}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="group mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98] shadow-sm"
      >
        <span>{actionText}</span>
        <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </aside>
  );
}
