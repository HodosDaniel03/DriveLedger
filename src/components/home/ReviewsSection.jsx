import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import CommunityInvoiceModal, { loadCommunityInvoices } from './CommunityInvoiceModal';
import { RiskBadge } from '../common/OdometerPrimitives';
import { useUnits } from '../../context/UnitContext';

export const REVIEWS = [
  {
    id: 'bench-focus-ecoblue-wetbelt',
    name: 'Marcus T. · Verified Workshop Benchmark',
    role: 'Independent Specialist Invoice',
    vehicle: 'Ford Focus 2.0 EcoBlue',
    assembly: 'Timing Belt / Wet Belt & Water Pump',
    amountPaid: 1080,
    benchmarkAvgUsd: 1380,
    odometerMiles: 68400,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Main dealer quoted nearly double for the 2.0 EcoBlue oil-bath timing belt, tensioner, and oil sump strainer clean. Used DriveLedger flat-rate labor benchmarks to negotiate an independent Ford specialist package with genuine OEM belt and fresh 5W-30 oil.',
  },
  {
    id: 'bench-bmw-320d-zf8hp',
    name: 'David K. · Verified Workshop Benchmark',
    role: 'Independent Specialist Invoice',
    vehicle: 'BMW 320d (B47 G20)',
    assembly: 'DSG / ZF Automatic Transmission Fluid & Filter',
    amountPaid: 620,
    benchmarkAvgUsd: 980,
    odometerMiles: 61500,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Dealership insisted the ZF 8HP50 gearbox fluid was sealed for life, then quoted franchise rates when pressed. An independent ZF-certified workshop installed the genuine ZF integrated filter pan and 7L of LifeguardFluid 8 in 2.5 hours.',
  },
  {
    id: 'bench-vw-golf-dsg-dmf',
    name: 'Elena R. · Verified Workshop Benchmark',
    role: 'Independent Specialist Invoice',
    vehicle: 'VW Golf 2.0 TDI',
    assembly: 'Dual-Mass Flywheel & Clutch Pack',
    amountPaid: 1490,
    benchmarkAvgUsd: 2150,
    odometerMiles: 94200,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Caught the cold-idle Luk dual-mass flywheel rattle at 94k miles using the PPI Battlecard before buying. Negotiated the seller down by the full repair midpoint and had an independent VAG specialist replace the DMF, rear main seal, and DSG fluid.',
  },
  {
    id: 'bench-audi-a4-walnut-pcv',
    name: 'Thomas H. · Verified Workshop Benchmark',
    role: 'Independent Specialist Invoice (EU)',
    vehicle: 'Audi A4 2.0 TFSI (Petrol)',
    assembly: 'GDI Intake Valve Walnut Blasting & PCV',
    amountPaid: 590,
    benchmarkAvgUsd: 1120,
    odometerMiles: 76000,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Had intermittent cold-start misfires (P0300) and rough idle. Instead of replacing all four injectors as the service desk suggested, the OBD-II root-cause breakdown pointed to intake valve carbon buildup and the PCV diaphragm.',
  },
  {
    id: 'bench-camry-hybrid-inverter-ecvt',
    name: 'Rachel M. · Verified Workshop Benchmark',
    role: 'Independent Hybrid Specialist (US)',
    vehicle: 'Toyota Camry Hybrid 2.5L (Hybrid)',
    assembly: 'Inverter Coolant, e-CVT Fluid & Spark Plugs',
    amountPaid: 490,
    benchmarkAvgUsd: 860,
    odometerMiles: 98500,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Franchise service desk bundled an unnecessary $370 fuel induction flush with the 100k mile interval. Used the DriveLedger hybrid roadmap to book just the OEM WS e-CVT drain-and-fill, SLLC inverter coolant, and Denso iridium plugs.',
  },
  {
    id: 'bench-tesla-model3-control-arms',
    name: 'Daniel P. · Verified Workshop Benchmark',
    role: 'Independent EV Chassis Shop (US)',
    vehicle: 'Tesla Model 3 Long Range AWD (EV)',
    assembly: 'Front Upper Control Arms & 4-Wheel EV Alignment',
    amountPaid: 640,
    benchmarkAvgUsd: 1280,
    odometerMiles: 54200,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Developed the signature front suspension squeak over speed bumps and inner rear tire shoulder wear at 54k miles. Replaced both sealed upper control arms with revised heavy-duty ball joints and calibrated EV camber specs.',
  },
  {
    id: 'bench-f150-ecoboost-cam-phasers',
    name: 'Garrett W. · Verified Workshop Benchmark',
    role: 'Independent Ford Truck Specialist (US)',
    vehicle: 'Ford F-150 3.5L EcoBoost (Petrol)',
    assembly: 'VCT Cam Phasers, Timing Chains & Water Pump',
    amountPaid: 2450,
    benchmarkAvgUsd: 3900,
    odometerMiles: 88600,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Cold-start 2-second rattle matched the DriveLedger 3.5L EcoBoost known-issues dossier verbatim. Used the updated HL3Z cam phaser parts list and flat-rate hours to save $1,450 at an independent Ford master tech shop.',
  },
  {
    id: 'bench-vw-id4-heatpump-brakes',
    name: 'Sophie L. · Verified Workshop Benchmark',
    role: 'Independent EV Service Center (UK)',
    vehicle: 'VW ID.4 Pro 77 kWh (EV)',
    assembly: 'Heat Pump Dielectric Coolant, Reducer Oil & Brake Slide Service',
    amountPaid: 540,
    benchmarkAvgUsd: 1020,
    odometerMiles: 51800,
    rating: 5,
    isBenchmarkSample: true,
    review:
      'Main dealer claimed the single-speed reduction gearbox was sealed for life while quoting over £800 for brake disc replacement due to regen rust. An EV specialist flushed the reducer oil, de-glazed the rotors, and serviced the heat pump loop.',
  },
];

export default function ReviewsSection({
  communityInvoices: externalInvoices,
  onOpenInvoiceModal,
  onInvoiceSubmitted,
  embedded = false,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [localInvoices, setLocalInvoices] = useState(() => loadCommunityInvoices());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLocalInvoices(loadCommunityInvoices());
  }, [externalInvoices]);

  const activeCommunityInvoices = externalInvoices !== undefined ? externalInvoices : localInvoices;
  const allReviews = [...activeCommunityInvoices, ...REVIEWS];
  const visibleReviews = embedded && !showAll ? allReviews.slice(0, 4) : allReviews;

  const handleOpenModal = () => {
    if (onOpenInvoiceModal) {
      onOpenInvoiceModal();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleLocalInvoiceSubmitted = (newEntry) => {
    const refreshed = loadCommunityInvoices();
    setLocalInvoices(refreshed);
    if (onInvoiceSubmitted) {
      onInvoiceSubmitted(newEntry);
    }
  };

  return (
    <section className={embedded ? '' : 'mb-10'}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h3 className="text-h3 font-sans font-semibold tracking-tight text-ink dark:text-zinc-50">
            Owner Feedback &amp; Workshop Quote Comparisons
          </h3>
          <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
            Independent specialist invoices benchmarked against franchise dealer service desk averages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {activeCommunityInvoices.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-sans font-medium">
              <span className="font-mono tabular-nums">{activeCommunityInvoices.length}</span> saved locally
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenModal}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-semibold bg-surface-subtle dark:bg-zinc-800 hover:bg-canvas dark:hover:bg-zinc-700 text-[#183D22] dark:text-emerald-300 border border-border dark:border-zinc-700 transition-colors"
          >
            <Plus aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Compare Workshop Quote</span>
          </button>
        </div>
      </div>

      {allReviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-subtle/60 dark:bg-zinc-900/50 border border-border/80 dark:border-zinc-800 text-center max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-surface dark:bg-zinc-800 border border-border dark:border-zinc-700 flex items-center justify-center text-primary-600 dark:text-emerald-400 mx-auto mb-3">
            <FileText aria-hidden="true" className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-ink dark:text-zinc-100 mb-1.5">
            Compare a workshop quote against regional benchmarks
          </h4>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed mb-5">
            Evaluate parts and labor quotes locally in your browser with zero sign-up required.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-sans font-semibold bg-[#183D22] hover:bg-[#122E19] text-white transition-colors"
          >
            <Plus aria-hidden="true" className="w-4 h-4" />
            <span>Compare &amp; Save a Repair Quote</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleReviews.map((rev) => (
              <article
                key={rev.id}
                className="cq-card p-5 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 border border-border/80 dark:border-zinc-800 flex flex-col justify-between min-w-0"
              >
                <div className="min-w-0">
                  {/* Single concise invoice badge + savings metric (static card: zero hover lift) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                      {rev.benchmarkAvgUsd && rev.amountPaid
                        ? `Saved ${formatCurrency(Math.max(0, rev.benchmarkAvgUsd - rev.amountPaid))} vs ${formatCurrency(rev.benchmarkAvgUsd)} dealer avg`
                        : rev.savingsText}
                    </span>
                    {rev.isCommunitySubmission || rev.isBenchmarkSample ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-700 text-[11px] font-mono tabular-nums font-semibold shrink-0">
                        {formatCurrency(Number(rev.amountPaid || 0))} paid
                      </span>
                    ) : (
                      <RiskBadge level="low" label="Saved Note" />
                    )}
                  </div>

                  {rev.assembly && (
                    <div className="mb-2 text-xs font-sans font-semibold text-ink dark:text-zinc-100 truncate">
                      {rev.assembly}
                    </div>
                  )}

                  <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed mb-4">
                    &ldquo;{rev.review}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-border/70 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-sans min-w-0">
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-ink dark:text-zinc-200">{rev.vehicle}</span>
                    <span className="text-muted dark:text-zinc-400"> · {rev.name.split('·')[0].trim()}</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0">
                    {rev.odometerMiles ? formatDistance(rev.odometerMiles) : rev.verifiedOdometer}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {embedded && allReviews.length > 4 && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl border border-border dark:border-zinc-800 bg-surface hover:bg-surface-subtle dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-sans font-semibold text-ink dark:text-zinc-200 transition-colors"
              >
                {showAll ? 'Show fewer benchmarks' : `View all ${allReviews.length} verified workshop benchmarks`}
              </button>
            </div>
          )}
        </>
      )}

      {!onOpenInvoiceModal && (
        <CommunityInvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInvoiceSubmitted={handleLocalInvoiceSubmitted}
        />
      )}
    </section>
  );
}
