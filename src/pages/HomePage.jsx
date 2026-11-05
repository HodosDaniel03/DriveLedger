import React, { useState } from 'react';
import {
  Calculator,
  ShieldAlert,
  Cpu,
  Sparkles,
  ArrowRight,
  Gauge,
  Shield,
  Car,
  Check,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import HeroVehicleFinder from '../components/home/HeroVehicleFinder';
import SubsystemGrid from '../components/home/SubsystemGrid';
import PreInspectionChecklist from '../components/home/PreInspectionChecklist';
import ReviewsSection from '../components/home/ReviewsSection';
import { VEHICLE_PRESETS } from '../data/vehiclePresets';
import { useUnits } from '../context/UnitContext';
import { BLOG_POSTS } from './BlogPage';
import { RiskBadge } from '../components/common/OdometerPrimitives';

export default function HomePage({
  selectedPresetId,
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToObd,
  onNavigateToMethodology,
  onNavigateToBlog,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Featured canonical presets for the Telemetry Benchmark section
  const featuredPresets = [
    VEHICLE_PRESETS.find((p) => p.id === 'vw-golf-20-tdi') || VEHICLE_PRESETS[1],
    VEHICLE_PRESETS.find((p) => p.id === 'bmw-320d-b47') || VEHICLE_PRESETS[10],
    VEHICLE_PRESETS.find((p) => p.id === 'peugeot-208-12-puretech') || VEHICLE_PRESETS[15],
    VEHICLE_PRESETS.find((p) => p.id === 'toyota-corolla-18-hybrid') || VEHICLE_PRESETS[20],
    VEHICLE_PRESETS.find((p) => p.id === 'skoda-octavia-20-tdi') || VEHICLE_PRESETS[6],
    VEHICLE_PRESETS.find((p) => p.id === 'tesla-model-3-lr') || VEHICLE_PRESETS[25],
  ];

  const faqs = [
    {
      q: 'How accurate are the cost estimates?',
      a: 'Our cost models combine verified factory depreciation curves, regional insurance group tables, real-world fuel economy logs from over 50,000 vehicles, and average regional labor rates updated regularly.',
    },
    {
      q: 'Where do the repair prices come from?',
      a: 'We aggregate OEM component catalog prices and regional flat-rate book labor times across Independent, Dealership, and DIY repair tiers.',
    },
    {
      q: 'Do I need to create an account or sign up?',
      a: 'No. ShiftMetric is 100% free, independent, and requires zero sign-up or personal credit card info.',
    },
    {
      q: 'Which regions and currencies are supported?',
      a: 'We support United States (USD $, miles, MPG), United Kingdom (GBP £, miles, MPG), and European Union (EUR €, kilometers, L/100km) with live unit conversion.',
    },
    {
      q: 'How is the Ownership Value Score calculated?',
      a: 'The 0–100 score balances 5-year depreciation retention, expected failure probabilities of major powertrain assemblies, and typical service expense vs the segment benchmark.',
    },
  ];

  return (
    <div className="space-y-16">
      {/* 1. Hero with Vehicle Finder & Body Type Selector */}
      <HeroVehicleFinder
        selectedPresetId={selectedPresetId}
        onSelectPreset={onSelectPreset}
        onNavigateToTco={onNavigateToTco}
        onNavigateToRisk={onNavigateToRisk}
      />

      {/* 2. Trust Stats Strip (Stitch Landing Section 2) */}
      <div className="bg-surface dark:bg-[#121215] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums">120+</span>
            <span className="text-xs sm:text-small font-sans font-medium text-muted dark:text-zinc-400 mt-1">Car models analysed</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums">4,800</span>
            <span className="text-xs sm:text-small font-sans font-medium text-muted dark:text-zinc-400 mt-1">OBD2 codes priced</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums">3</span>
            <span className="text-xs sm:text-small font-sans font-medium text-muted dark:text-zinc-400 mt-1">Regions: US · UK · EU</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums">0</span>
            <span className="text-xs sm:text-small font-sans font-medium text-muted dark:text-zinc-400 mt-1">Sign-ups required</span>
          </div>
        </div>
      </div>

      {/* 3. How It Works (Three steps to a clear answer) */}
      <section className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold">
            Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-ink dark:text-zinc-50 tracking-tight mt-2">
            Three steps to a clear answer
          </h2>
          <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-2">
            From vehicle selection to actionable cost intelligence in seconds.
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 font-mono tabular-nums font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              1
            </div>
            <h3 className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2">Pick your car</h3>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 max-w-xs leading-relaxed">
              Select your model and powertrain, or choose a catalog preset.
            </p>
          </div>
          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 font-mono tabular-nums font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              2
            </div>
            <h3 className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2">Adjust your driving</h3>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 max-w-xs leading-relaxed">
              Configure your annual mileage, ownership timeframe, and local fuel rates.
            </p>
          </div>
          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 font-mono tabular-nums font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              3
            </div>
            <h3 className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2">Get your report</h3>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 max-w-xs leading-relaxed">
              Review projected 5-year costs, failure probabilities, and workshop quotes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Three Core Telemetry Tools Bento Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
              Calculators &amp; Diagnostics
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mt-1">
              Everything you need before you buy or repair
            </h2>
            <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
              Three specialized calculators to expose real ownership and repair costs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: TCO Calculator */}
          <div
            onClick={() => onNavigateToTco(selectedPresetId)}
            className="group p-7 rounded-2xl bg-surface dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-zinc-700 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                  <Calculator className="w-5 h-5" />
                </div>
                <RiskBadge level="low" label="Low Risk" />
              </div>
              <h3 className="text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                5-Year True Cost to Own
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-6">
                True 5-year depreciation, fuel, insurance, and scheduled maintenance benchmarks.
              </p>

              {/* Mini Preview: Stacked Bar */}
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
                <div className="h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-800 flex overflow-hidden mb-2">
                  <div className="h-full bg-primary-600 w-[45%]" title="Depreciation (45%)" />
                  <div className="h-full bg-[#5B8CFF] w-[25%]" title="Fuel (25%)" />
                  <div className="h-full bg-emerald-500 w-[18%]" title="Insurance (18%)" />
                  <div className="h-full bg-amber-500 w-[12%]" title="Maintenance (12%)" />
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-muted dark:text-zinc-400 font-medium">Segment benchmark:</span>
                  <span className="font-bold text-ink dark:text-zinc-50 font-mono tabular-nums">$612 /mo</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-primary-400">
              <span>Open TCO calculator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Risk Matrix */}
          <div
            onClick={() => onNavigateToRisk()}
            className="group p-7 rounded-2xl bg-surface dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-zinc-700 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <RiskBadge level="moderate" label="Moderate Risk" />
              </div>
              <h3 className="text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Maintenance &amp; Powertrain Risk
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-6">
                Mileage-based component wear, replacement intervals, and estimated repair costs.
              </p>

              {/* Mini Preview: Status Matrix */}
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-zinc-300 font-sans font-medium">Timing belt / chain</span>
                  <span className="font-mono tabular-nums text-[11px] text-muted dark:text-zinc-400">75,000 mi</span>
                  <RiskBadge level="low" label="Low" />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-zinc-300 font-sans font-medium">DPF particulate filter</span>
                  <span className="font-mono tabular-nums text-[11px] text-muted dark:text-zinc-400">85,000 mi</span>
                  <RiskBadge level="moderate" label="Moderate" />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-zinc-300 font-sans font-medium">Water pump &amp; thermostat</span>
                  <span className="font-mono tabular-nums text-[11px] text-muted dark:text-zinc-400">55,000 mi</span>
                  <RiskBadge level="critical" label="Critical" />
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-primary-400">
              <span>Open risk matrix</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: OBD-II Estimator */}
          <div
            onClick={() => onNavigateToObd()}
            className="group p-7 rounded-2xl bg-surface dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-zinc-700 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <RiskBadge level="critical" label="High Risk" />
              </div>
              <h3 className="text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                OBD2 Repair Price Estimator
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-6">
                Ranked root causes, OEM parts pricing, and fair workshop labor estimates.
              </p>

              {/* Mini Preview: Code Chip */}
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono tabular-nums text-xs font-bold text-ink dark:text-zinc-50 bg-white dark:bg-[#121215] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">P0420</span>
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400">Catalyst system efficiency</span>
                </div>
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/40 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-sans font-medium">Estimated repair:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">$742 – $1,980</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-primary-400">
              <span>Open OBD2 estimator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Vehicle Telemetry Benchmarks Section */}
      <section id="telemetry-preset-benchmarks-section" className="scroll-mt-28 lg:scroll-mt-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>VEHICLE BENCHMARKS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
              Featured 5-Year Ownership Dossiers
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTco()}
            className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
          >
            <span>All <span className="font-mono tabular-nums">{VEHICLE_PRESETS.length}</span> Vehicles &amp; Engines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredPresets.map((car) => {
            const isSelected = car.id === selectedPresetId;
            return (
              <div
                key={car.id}
                onClick={() => {
                  onSelectPreset(car.id);
                  onNavigateToTco(car.id);
                }}
                className={`group p-6 rounded-2xl bg-surface dark:bg-[#121215] border transition-[transform,box-shadow,border-color] duration-200 ease-out cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-card-hover ${
                  isSelected
                    ? 'border-primary-600 ring-2 ring-primary-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                      {car.segment}
                    </span>
                    <span className="text-xs font-mono font-bold text-ink dark:text-zinc-50 tabular-nums">
                      {formatCurrency(car.purchasePriceUsd)}
                    </span>
                  </div>

                  <h3 className="text-base font-sans font-bold tracking-tight text-ink dark:text-zinc-50 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {car.name}
                  </h3>
                  <p className="text-xs text-muted dark:text-zinc-400 line-clamp-1 mb-4 font-sans font-medium">
                    {car.powertrainLabel}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs">
                    <div>
                      <span className="text-[10px] font-sans font-medium text-muted dark:text-zinc-400 block">Baseline</span>
                      <strong className="text-ink dark:text-zinc-50 text-xs font-mono tabular-nums font-bold">
                        {formatDistance(car.defaultOdometerMiles)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-medium text-muted dark:text-zinc-400 block">Economy</span>
                      <strong className="text-ink dark:text-zinc-50 text-xs font-mono tabular-nums font-bold">
                        {car.isEv ? `${car.mpgUs} kWh` : `${car.mpgUs} MPG`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-medium text-muted dark:text-zinc-400 block">Wear</span>
                      <strong
                        className={`text-xs font-mono tabular-nums font-bold ${
                          car.maintenanceWearFactor > 1.3
                            ? 'text-rose-600 dark:text-rose-400'
                            : car.maintenanceWearFactor < 0.9
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {car.maintenanceWearFactor.toFixed(2)}x
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-primary-400">
                  <span>Calculate True Cost</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Comparison Table (Stitch Section: Why drivers choose ShiftMetric) */}
      <section className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-ink dark:text-zinc-50 tracking-tight">
            Why drivers choose ShiftMetric
          </h2>
          <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-2">
            Compare how ShiftMetric stacks up against dealer quotes and online forums.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-sans uppercase tracking-wider text-muted dark:text-zinc-400">
                <th className="py-4 px-5 font-semibold w-2/5">Capability</th>
                <th className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-t-xl w-1/5">
                  <div className="flex items-center gap-1.5">
                    <span>ShiftMetric</span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] px-2 py-0.5 rounded-md font-sans font-medium">
                      verified
                    </span>
                  </div>
                </th>
                <th className="py-4 px-5 font-medium text-body dark:text-zinc-300 w-1/5">Dealer Quote</th>
                <th className="py-4 px-5 font-medium text-body dark:text-zinc-300 w-1/5">Online Forums</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs sm:text-sm font-sans">
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-zinc-50">Full 5-year cost breakdown</td>
                <td className="py-3.5 px-5 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold text-ink dark:text-zinc-50">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-zinc-50">Detailed graphs</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Partial / financing only</td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Vague estimates</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-zinc-50">Fair labor rates by region</td>
                <td className="py-3.5 px-5 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold text-ink dark:text-zinc-50">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-zinc-50">US / UK / EU rates</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Inflated dealer markups</td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Outdated anecdotal rates</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-zinc-50">Root-cause probabilities for OBD2 codes</td>
                <td className="py-3.5 px-5 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold text-ink dark:text-zinc-50">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-zinc-50">Ranked by frequency</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Diagnostic fee required</td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Endless guessing threads</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-zinc-50">Free and instant calculations</td>
                <td className="py-3.5 px-5 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold text-ink dark:text-zinc-50">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-zinc-50">Instant in seconds</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Requires in-person visit</td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Hours of reading</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-zinc-50">Multi-currency &amp; unit conversions</td>
                <td className="py-3.5 px-5 bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold text-ink dark:text-zinc-50">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-zinc-50">$, £, €, MPG, L/100km</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Single region only</td>
                <td className="py-3.5 px-5 text-muted dark:text-zinc-400">Mixed units</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Subsystem Telemetry Grid */}
      <SubsystemGrid onNavigateToRisk={onNavigateToRisk} />

      {/* 8. Pre-Inspection Workshop Checklist */}
      <PreInspectionChecklist
        presetId={selectedPresetId}
        onSelectPreset={onSelectPreset}
        onNavigateToObd={onNavigateToObd}
        onNavigateToTco={onNavigateToTco}
      />

      {/* 9. Driver Testimonials & Reviews */}
      <ReviewsSection />

      {/* 10. FAQ Accordion (Questions, answered) */}
      <section className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4">
            <span className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block mb-1">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-ink dark:text-zinc-50 tracking-tight">
              Questions, answered
            </h2>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 mt-2 leading-relaxed">
              Everything you need to know about our independent automotive datasets, pricing models, and privacy.
            </p>
          </div>
          <div className="lg:col-span-8 divide-y divide-zinc-200 dark:divide-zinc-800">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-sans font-semibold text-ink dark:text-zinc-50 text-sm sm:text-base group"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted dark:text-zinc-400 group-hover:text-ink dark:group-hover:text-zinc-200 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. Simplified From the Garage (Blog Preview) */}
      <section className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block mb-1">
              Field Notes
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-ink dark:text-zinc-50 tracking-tight">
              From the garage
            </h2>
          </div>
          <button
            type="button"
            onClick={() => (onNavigateToBlog ? onNavigateToBlog() : onNavigateToMethodology())}
            className="text-xs sm:text-sm font-sans font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition flex items-center gap-1.5"
          >
            <span>View all guides</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.slice(0, 3).map((post) => (
            <div
              key={post.id}
              onClick={() => (onNavigateToBlog ? onNavigateToBlog() : onNavigateToMethodology())}
              className="group p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-surface dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-card-hover transition-[transform,box-shadow,border-color] duration-200 ease-out cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-sans text-muted dark:text-zinc-400 mb-2">
                  <span className="font-sans font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/60">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="font-sans font-bold tracking-tight text-ink dark:text-zinc-50 text-sm sm:text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-xs font-sans text-body dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-primary-400">
                <span>Read guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12. Final CTA Band (Stitch Landing Section 10) */}
      <section className="bg-primary-600 rounded-3xl p-8 sm:p-12 text-center shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight mb-2">
            Check your car in 30 seconds
          </h2>
          <p className="text-xs sm:text-sm font-sans text-white/90 mb-6 leading-relaxed">
            Instant calculations for 120+ models across US, UK, and European markets.
          </p>
          <button
            type="button"
            onClick={() => onNavigateToTco()}
            className="bg-white text-primary-700 font-sans font-bold text-xs sm:text-sm px-7 py-3.5 rounded-xl hover:bg-primary-50 shadow-md inline-flex items-center gap-2 transition duration-200 active:scale-95"
          >
            <span>Start free check</span>
            <ArrowRight className="w-4 h-4 text-primary-700" />
          </button>
        </div>
      </section>

      {/* 13. Collapsed-by-Default SEO Reference Dossier */}
      <section className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
        <details className="group cursor-pointer">
          <summary className="flex items-center justify-between text-xs sm:text-sm font-sans font-bold text-ink dark:text-zinc-50 uppercase tracking-wider select-none list-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-primary-600 dark:bg-primary-400" />
              Automotive Total Cost of Ownership (TCO) &amp; Reliability Index Directory
            </span>
            <ChevronDown className="w-4 h-4 text-muted dark:text-zinc-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-body dark:text-zinc-300 space-y-4 leading-relaxed font-sans cursor-default">
            <p>
              ShiftMetric provides automotive cost modeling across North American (US), British (UK), and European Union (EU) jurisdictions. Our computational framework unifies empirical depreciation curves, localized fuel tariffs, regional insurance ratings, and OEM flat-rate labor estimates.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-[11px] pt-2">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <strong className="block text-ink dark:text-zinc-200 mb-1">5-Year TCO Modeling:</strong>
                Calculates residual value loss, financing interest, maintenance schedules, and localized fuel expenses across ICE, Hybrid, and Electric powertrains.
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <strong className="block text-ink dark:text-zinc-200 mb-1">Thermodynamic Wear Index:</strong>
                Adjusts mechanical component lifespan based on city vs. highway trip cycles, cold-start frequency, and oil degradation rates.
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <strong className="block text-ink dark:text-zinc-200 mb-1">OBD-II Diagnostic Telemetry:</strong>
                Maps SAE J1979 DTC fault codes to verified root-cause probabilities and regional independent vs. dealership labor rates.
              </div>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
