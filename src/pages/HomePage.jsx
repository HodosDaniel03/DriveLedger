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
      <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-sm border border-border dark:border-slate-800 p-6 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border dark:divide-slate-800">
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 font-code tabular-nums">120+</span>
            <span className="text-xs sm:text-small text-muted dark:text-slate-400 mt-1">Car models analysed</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 font-code tabular-nums">4,800</span>
            <span className="text-xs sm:text-small text-muted dark:text-slate-400 mt-1">OBD2 codes priced</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 font-code tabular-nums">3</span>
            <span className="text-xs sm:text-small text-muted dark:text-slate-400 mt-1">Regions: US · UK · EU</span>
          </div>
          <div className="p-4 md:p-2 text-center flex flex-col items-center">
            <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 font-code tabular-nums">0</span>
            <span className="text-xs sm:text-small text-muted dark:text-slate-400 mt-1">Sign-ups required</span>
          </div>
        </div>
      </div>

      {/* 3. How It Works (Three steps to a clear answer) */}
      <section className="bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold">
            Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-slate-100 tracking-tight mt-2">
            Three steps to a clear answer
          </h2>
          <p className="text-xs sm:text-sm text-muted dark:text-slate-400 mt-2">
            From vehicle selection to actionable cost intelligence in seconds.
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-500 font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              1
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink dark:text-slate-100 mb-2">Pick your car</h3>
            <p className="text-xs sm:text-sm text-body dark:text-slate-300 max-w-xs leading-relaxed">
              Select model, year and powertrain or pick from our verified baseline vehicle catalog.
            </p>
          </div>
          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-500 font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              2
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink dark:text-slate-100 mb-2">Adjust your driving</h3>
            <p className="text-xs sm:text-sm text-body dark:text-slate-300 max-w-xs leading-relaxed">
              Set your annual mileage, ownership period, and localized fuel or electricity tariffs.
            </p>
          </div>
          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-500 font-bold text-base flex items-center justify-center mb-4 shadow-sm">
              3
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink dark:text-slate-100 mb-2">Get your report</h3>
            <p className="text-xs sm:text-sm text-body dark:text-slate-300 max-w-xs leading-relaxed">
              Receive transparent 5-year ownership projections, failure probabilities, and workshop quotes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Three Core Telemetry Tools Bento Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
              Calculators &amp; Diagnostics
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-slate-100 mt-1">
              Everything you need before you buy or repair
            </h2>
            <p className="text-xs sm:text-sm text-muted dark:text-slate-400 mt-1">
              Three dedicated calculators designed to save you thousands in dealership markups.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: TCO Calculator */}
          <div
            onClick={() => onNavigateToTco(selectedPresetId)}
            className="group p-7 rounded-2xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5 group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-ink dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                5-Year True Cost to Own
              </h3>
              <p className="text-xs sm:text-sm text-body dark:text-slate-300 leading-relaxed mb-6">
                Calculate depreciation, fuel, insurance, and routine maintenance tailored to your driving habits.
              </p>

              {/* Mini Preview: Stacked Bar */}
              <div className="bg-surface-subtle dark:bg-slate-800/80 p-3 rounded-xl border border-border dark:border-slate-700 mb-6">
                <div className="h-2.5 rounded-full bg-surface-container dark:bg-slate-700 flex overflow-hidden mb-2">
                  <div className="h-full bg-primary-600 w-[45%]" title="Depreciation (45%)" />
                  <div className="h-full bg-[#5B8CFF] w-[25%]" title="Fuel (25%)" />
                  <div className="h-full bg-score-good w-[18%]" title="Insurance (18%)" />
                  <div className="h-full bg-score-fair w-[12%]" title="Maintenance (12%)" />
                </div>
                <div className="flex items-center justify-between text-xs font-code">
                  <span className="text-muted dark:text-slate-400">Benchmark</span>
                  <span className="font-bold text-ink dark:text-slate-100 tabular-nums">$612 /mo average</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Risk Matrix */}
          <div
            onClick={() => onNavigateToRisk()}
            className="group p-7 rounded-2xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-ink dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Maintenance &amp; Powertrain Risk
              </h3>
              <p className="text-xs sm:text-sm text-body dark:text-slate-300 leading-relaxed mb-6">
                Mileage-triggered component failure matrix based on verified real-world breakdown stats.
              </p>

              {/* Mini Preview: Status Matrix */}
              <div className="bg-surface-subtle dark:bg-slate-800/80 p-3 rounded-xl border border-border dark:border-slate-700 mb-6 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-slate-300 font-medium">Timing chain</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-bg text-success-text dark:bg-emerald-950/70 dark:text-emerald-400 text-[11px] font-semibold">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-slate-300 font-medium">DPF Filter</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-bg text-warning-text dark:bg-amber-950/70 dark:text-amber-400 text-[11px] font-semibold">
                    Attention
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-body dark:text-slate-300 font-medium">Water pump</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-bg text-warning-text dark:bg-amber-950/70 dark:text-amber-400 text-[11px] font-semibold">
                    Due soon
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: OBD-II Estimator */}
          <div
            onClick={() => onNavigateToObd()}
            className="group p-7 rounded-2xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-card-hover dark:hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-ink dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                OBD2 Repair Price Estimator
              </h3>
              <p className="text-xs sm:text-sm text-body dark:text-slate-300 leading-relaxed mb-6">
                Enter any check engine code to discover root-cause likelihoods, OEM parts cost, and fair workshop labor.
              </p>

              {/* Mini Preview: Code Chip */}
              <div className="bg-surface-subtle dark:bg-slate-800/80 p-3 rounded-xl border border-border dark:border-slate-700 mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-code text-xs font-bold text-ink dark:text-slate-100 bg-surface dark:bg-slate-900 px-2 py-0.5 rounded border border-border dark:border-slate-700">P0420</span>
                  <span className="text-[11px] text-muted dark:text-slate-400">Catalyst Efficiency</span>
                </div>
                <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1.5 rounded border border-primary-100 dark:border-primary-900/60 font-code text-xs">
                  <span className="text-primary-800 dark:text-primary-300 font-medium">Fair workshop range:</span>
                  <span className="font-bold text-primary-700 dark:text-primary-400 tabular-nums">$742 – $1,980</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Vehicle Telemetry Benchmarks Section */}
      <section id="telemetry-preset-benchmarks-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-code font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>TELEMETRY PRESET BENCHMARKS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-slate-100">
              Featured 5-Year Ownership Dossiers
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTco()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-code transition-colors"
          >
            <span>All {VEHICLE_PRESETS.length} Vehicles &amp; Engines</span>
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
                className={`group p-6 rounded-2xl bg-surface dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-card-hover ${
                  isSelected
                    ? 'border-primary-600 ring-2 ring-primary-600/20'
                    : 'border-border dark:border-slate-800 hover:border-border-strong dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-code uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-surface-subtle dark:bg-slate-800 text-body dark:text-slate-300 border border-border dark:border-slate-700">
                      {car.segment}
                    </span>
                    <span className="text-xs font-code font-bold text-ink dark:text-slate-100 tabular-nums">
                      {formatCurrency(car.purchasePriceUsd)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink dark:text-slate-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {car.name}
                  </h3>
                  <p className="text-xs text-muted dark:text-slate-400 line-clamp-1 mb-4 font-code">
                    {car.powertrainLabel}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-subtle dark:bg-slate-800/80 border border-border dark:border-slate-700 text-center font-code tabular-nums text-xs">
                    <div>
                      <span className="text-[10px] text-muted dark:text-slate-400 block">Baseline</span>
                      <strong className="text-ink dark:text-slate-100 text-xs font-bold">
                        {formatDistance(car.defaultOdometerMiles)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted dark:text-slate-400 block">Economy</span>
                      <strong className="text-ink dark:text-slate-100 text-xs font-bold">
                        {car.isEv ? `${car.mpgUs} kWh` : `${car.mpgUs} MPG`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted dark:text-slate-400 block">Wear</span>
                      <strong
                        className={`text-xs font-bold ${
                          car.maintenanceWearFactor > 1.3
                            ? 'text-score-poor'
                            : car.maintenanceWearFactor < 0.9
                            ? 'text-score-good'
                            : 'text-score-fair'
                        }`}
                      >
                        {car.maintenanceWearFactor.toFixed(2)}x
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
                  <span>Calculate True Cost</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Comparison Table (Stitch Section: Why drivers choose ShiftMetric) */}
      <section className="bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm p-6 sm:p-10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-slate-100 tracking-tight">
            Why drivers choose ShiftMetric
          </h2>
          <p className="text-xs sm:text-sm text-muted dark:text-slate-400 mt-2">
            Compare how ShiftMetric stacks up against dealer quotes and online forums.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-border dark:border-slate-800 text-xs uppercase tracking-wider text-muted dark:text-slate-400">
                <th className="py-4 px-5 font-semibold w-2/5">Capability</th>
                <th className="py-4 px-5 font-bold text-primary-700 dark:text-primary-300 bg-primary-50/60 dark:bg-primary-950/40 rounded-t-xl w-1/5">
                  <div className="flex items-center gap-1.5">
                    <span>ShiftMetric</span>
                    <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      verified
                    </span>
                  </div>
                </th>
                <th className="py-4 px-5 font-medium text-body dark:text-slate-300 w-1/5">Dealer Quote</th>
                <th className="py-4 px-5 font-medium text-body dark:text-slate-300 w-1/5">Online Forums</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-slate-800 text-xs sm:text-sm">
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-slate-100">Full 5-year cost breakdown</td>
                <td className="py-3.5 px-5 bg-primary-50/60 dark:bg-primary-950/40 font-semibold text-ink dark:text-slate-100">
                  <div className="flex items-center gap-1.5 text-score-good">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-slate-100">Detailed graphs</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Partial / financing only</td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Vague estimates</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-slate-100">Fair labor rates by region</td>
                <td className="py-3.5 px-5 bg-primary-50/60 dark:bg-primary-950/40 font-semibold text-ink dark:text-slate-100">
                  <div className="flex items-center gap-1.5 text-score-good">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-slate-100">US / UK / EU rates</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Inflated dealer markups</td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Outdated anecdotal rates</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-slate-100">Root-cause probabilities for OBD2 codes</td>
                <td className="py-3.5 px-5 bg-primary-50/60 dark:bg-primary-950/40 font-semibold text-ink dark:text-slate-100">
                  <div className="flex items-center gap-1.5 text-score-good">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-slate-100">Ranked by frequency</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Diagnostic fee required</td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Endless guessing threads</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-slate-100">Free and instant calculations</td>
                <td className="py-3.5 px-5 bg-primary-50/60 dark:bg-primary-950/40 font-semibold text-ink dark:text-slate-100">
                  <div className="flex items-center gap-1.5 text-score-good">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-slate-100">Instant in seconds</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Requires in-person visit</td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Hours of reading</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-ink dark:text-slate-100">Multi-currency &amp; unit conversions</td>
                <td className="py-3.5 px-5 bg-primary-50/60 dark:bg-primary-950/40 font-semibold text-ink dark:text-slate-100">
                  <div className="flex items-center gap-1.5 text-score-good">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-ink dark:text-slate-100">$, £, €, MPG, L/100km</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Single region only</td>
                <td className="py-3.5 px-5 text-muted dark:text-slate-400">Mixed units</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Subsystem Telemetry Grid */}
      <SubsystemGrid onNavigateToRisk={onNavigateToRisk} />

      {/* 8. Pre-Inspection Workshop Checklist */}
      <PreInspectionChecklist
        onNavigateToObd={onNavigateToObd}
        onNavigateToTco={onNavigateToTco}
      />

      {/* 9. Driver Testimonials & Reviews */}
      <ReviewsSection />

      {/* 10. FAQ Accordion (Questions, answered) */}
      <section className="bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4">
            <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block mb-1">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-slate-100 tracking-tight">
              Questions, answered
            </h2>
            <p className="text-xs sm:text-sm text-body dark:text-slate-300 mt-2 leading-relaxed">
              Everything you need to know about our independent automotive datasets, pricing models, and privacy.
            </p>
          </div>
          <div className="lg:col-span-8 divide-y divide-border dark:divide-slate-800">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-semibold text-ink dark:text-slate-100 text-sm sm:text-base group"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted dark:text-slate-400 group-hover:text-ink dark:group-hover:text-slate-200 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-body dark:text-slate-300 leading-relaxed animate-fade-in">
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
      <section className="bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block mb-1">
              Field Notes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-slate-100 tracking-tight">
              From the garage
            </h2>
          </div>
          <button
            type="button"
            onClick={() => (onNavigateToBlog ? onNavigateToBlog() : onNavigateToMethodology())}
            className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition flex items-center gap-1.5"
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
              className="group p-5 rounded-xl border border-border dark:border-slate-800 bg-surface-subtle dark:bg-slate-800/60 hover:bg-surface dark:hover:bg-slate-800 hover:border-border-strong dark:hover:border-slate-700 hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-muted dark:text-slate-400 mb-2">
                  <span className="font-semibold text-ink dark:text-slate-200 bg-surface dark:bg-slate-900 px-2 py-0.5 rounded border border-border dark:border-slate-700">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="font-bold text-ink dark:text-slate-100 text-sm sm:text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-xs text-body dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Check your car in 30 seconds
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mb-6 leading-relaxed">
            Free forever. Zero spam. Instant calculations for 120+ popular car models across US, UK, and Europe.
          </p>
          <button
            type="button"
            onClick={() => onNavigateToTco()}
            className="bg-white text-primary-700 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full hover:bg-primary-50 shadow-md inline-flex items-center gap-2 transition duration-200 active:scale-95"
          >
            <span>Start free check</span>
            <ArrowRight className="w-4 h-4 text-primary-700" />
          </button>
        </div>
      </section>
    </div>
  );
}
