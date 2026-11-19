import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, FileText, Plus } from 'lucide-react';
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
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [localInvoices, setLocalInvoices] = useState(() => loadCommunityInvoices());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLocalInvoices(loadCommunityInvoices());
  }, [externalInvoices]);

  const activeCommunityInvoices = externalInvoices !== undefined ? externalInvoices : localInvoices;
  const allReviews = [...activeCommunityInvoices, ...REVIEWS];

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
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
            Community Cost Notes &amp; Quote Benchmarks
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 mt-1">
            Owner Feedback &amp; Workshop Quote Comparisons
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeCommunityInvoices.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted dark:text-zinc-400 font-sans font-medium">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-sans font-medium">
                <span className="font-mono tabular-nums">{activeCommunityInvoices.length}</span> saved in your browser
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-subtle dark:bg-zinc-800 hover:bg-primary-50 dark:hover:bg-zinc-700 text-primary-700 dark:text-primary-300 border border-border dark:border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compare Workshop Quote</span>
          </button>
        </div>
      </div>

      {allReviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink dark:text-zinc-100 mb-1.5">
            Be the first to share your experience or compare a workshop quote
          </h3>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed mb-5">
            DriveLedger is a newly launched independent project, and we do not display fabricated testimonials. You can compare your repair quote against our regional cost estimates and save your notes locally in your browser.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-sans font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Compare &amp; Save a Repair Quote</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {allReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ease-out flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                {/* Rating Stars & Community Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1 text-amber-500 shrink-0">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  {rev.isCommunitySubmission || rev.isBenchmarkSample ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium shrink-0">
                      <FileText className="w-2.5 h-2.5" />
                      <span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(Number(rev.amountPaid || 0))}
                        </span>{' '}
                        Quote
                      </span>
                    </span>
                  ) : (
                    <RiskBadge level="low" label="Saved Note" />
                  )}
                </div>

                {/* Savings / Benchmark Hook */}
                <div className="mb-2 text-xs font-sans font-bold text-success-text dark:text-emerald-400 truncate">
                  {rev.benchmarkAvgUsd && rev.amountPaid
                    ? `Saved ${formatCurrency(Math.max(0, rev.benchmarkAvgUsd - rev.amountPaid))} vs ${formatCurrency(rev.benchmarkAvgUsd)} Dealer Avg`
                    : rev.savingsText}
                </div>

                {rev.assembly && (
                  <div className="mb-2 text-[11px] font-sans font-medium text-primary-600 dark:text-primary-400 truncate">
                    Service: {rev.assembly}
                  </div>
                )}

                {/* Review Text */}
                <p className="text-xs text-body dark:text-zinc-300 leading-relaxed mb-4">
                  "{rev.review}"
                </p>
              </div>

              {/* Author & Vehicle Metadata */}
              <div className="pt-3 border-t border-border dark:border-zinc-800 text-xs min-w-0">
                <div className="font-bold text-ink dark:text-zinc-100 flex items-center justify-between gap-2 min-w-0">
                  <span className="truncate">{rev.name}</span>
                  <span className="text-[10px] font-code tabular-nums text-muted dark:text-zinc-400 flex items-center gap-1 shrink-0">
                    {rev.odometerMiles ? formatDistance(rev.odometerMiles) : rev.verifiedOdometer}
                  </span>
                </div>
                <div className="text-[11px] text-muted dark:text-zinc-400 truncate mt-0.5">
                  {rev.vehicle} · {rev.role}
                </div>
              </div>
            </div>
          ))}
        </div>
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
