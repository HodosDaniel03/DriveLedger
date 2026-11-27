import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  ShieldAlert,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import HeroVehicleFinder from '../components/home/HeroVehicleFinder';
import SubsystemGrid from '../components/home/SubsystemGrid';
import ReviewsSection from '../components/home/ReviewsSection';
import VehicleImageResolver from '../components/common/vehicle/VehicleImageResolver.jsx';
import { VEHICLE_PRESETS, getPresetById } from '../data/vehiclePresets';
import { generatePpiChecklist } from '../data/breakEvenAndPpi';
import { useUnits } from '../context/UnitContext';
import { GUIDES_DATA } from '../data/guidesData';
import { RiskBadge } from '../components/common/OdometerPrimitives';
import { BrandQuickJumpIndex } from '../components/seo/VehicleInternalLinks';

const UNIVERSAL_PPI_PREVIEW_ITEMS = [
  {
    id: 'universal-obd-scan',
    title: 'OBD-II DTC & Freeze Frame Live Data Scan',
    focus: 'Scan active, stored, and pending DTCs and verify distance since codes were last cleared before buying.',
    riskLabel: 'Critical / Mandatory',
    riskLevel: 'critical',
    isModelSpecific: false,
    estSaving: '$600 – $2,400',
  },
  {
    id: 'universal-cold-start',
    title: 'Cold Start, Blowby & Fluid Condition Check',
    focus: 'Start the engine completely cold, listen for timing chain or valvetrain noise, and inspect oil and coolant.',
    riskLabel: 'Moderate / Important',
    riskLevel: 'moderate',
    isModelSpecific: false,
    estSaving: '$500 – $1,800',
  },
  {
    id: 'universal-body-chassis',
    title: 'Paint Thickness, Structural Chassis & Road Test',
    focus: 'Verify uniform panel paint depth (80–140 µm), matching glass stamps, smooth shifts, and straight braking.',
    riskLabel: 'Critical / Resale Value',
    riskLevel: 'critical',
    isModelSpecific: false,
    estSaving: '$1,000 – $3,500',
  },
];

const DISCOVERY_HUB_TABS = [
  { id: 'why', label: 'Why DriveLedger' },
  { id: 'ppi', label: 'Inspection Checklist' },
  { id: 'subsystems', label: 'Subsystems Watch' },
  { id: 'quotes', label: 'Workshop Quotes' },
  { id: 'guides', label: 'Buyer Guides' },
];

export default function HomePage({
  selectedPresetId,
  hasSelectedVehicle = Boolean(selectedPresetId),
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToObd,
  onNavigateToChecklist,
  onNavigateToMethodology,
  onNavigateToBlog,
  onNavigateToGuides,
  onNavigateToVehicles,
  onSelectGuide,
}) {
  const { formatCurrency, formatDistance, formatEfficiency } = useUnits();
  const [selectedBodyStyle, setSelectedBodyStyle] = useState('all');
  const [activeHubTab, setActiveHubTab] = useState('why');
  const hubContainerRef = useRef(null);

  const isVehicleSelected = Boolean(hasSelectedVehicle && selectedPresetId);
  const activePreset = useMemo(
    () => (isVehicleSelected ? getPresetById(selectedPresetId) : null),
    [isVehicleSelected, selectedPresetId]
  );

  const previewPpiItems = useMemo(() => {
    if (!activePreset) return UNIVERSAL_PPI_PREVIEW_ITEMS;
    return generatePpiChecklist(
      activePreset,
      Math.round((activePreset.defaultOdometerMiles || 60000) * 1.609344)
    ).slice(0, 3);
  }, [activePreset]);

  // Synchronize Find-in-Page (`beforematch`) across hidden="until-found" tab panels
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const hubEl =
      hubContainerRef.current ||
      (typeof document.getElementById === 'function' ? document.getElementById('home-discovery-hub') : null);
    if (!hubEl) return undefined;

    if (typeof HTMLElement !== 'undefined' && !('onbeforematch' in HTMLElement.prototype) && typeof hubEl.querySelectorAll === 'function') {
      const panels = hubEl.querySelectorAll('[data-hub-panel]');
      panels.forEach((panel) => {
        if (panel.getAttribute('data-hub-panel') === activeHubTab) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
      return undefined;
    }

    if (typeof hubEl.addEventListener !== 'function') return undefined;
    const handleBeforeMatch = (event) => {
      const target = event?.target;
      if (!target || typeof target.closest !== 'function') return;
      const panel = target.closest('[data-hub-panel]');
      const matchedTab = panel?.getAttribute('data-hub-panel');
      if (matchedTab) {
        setActiveHubTab(matchedTab);
      }
    };

    hubEl.addEventListener('beforematch', handleBeforeMatch);
    return () => {
      if (typeof hubEl.removeEventListener === 'function') {
        hubEl.removeEventListener('beforematch', handleBeforeMatch);
      }
    };
  }, [activeHubTab]);

  // Exclusive <details name="home-faq"> fallback for browsers without native HTMLDetailsElement.prototype.name
  useEffect(() => {
    if (
      typeof document === 'undefined' ||
      typeof HTMLDetailsElement === 'undefined' ||
      Object.hasOwn(HTMLDetailsElement.prototype, 'name')
    ) {
      return undefined;
    }
    const handleToggle = (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (details.getAttribute('name') !== 'home-faq') return;
      for (const other of document.querySelectorAll('details[name="home-faq"]')) {
        if (other !== details) other.open = false;
      }
    };
    document.addEventListener('toggle', handleToggle, { capture: true });
    return () => document.removeEventListener('toggle', handleToggle, { capture: true });
  }, []);

  const POPULAR_BODY_TYPES = useMemo(() => [
    { id: 'all', label: 'All Body Styles', count: VEHICLE_PRESETS.length },
    { id: 'sedan', label: 'Sedans', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'sedan').length },
    { id: 'suv', label: 'SUVs & Crossovers', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'suv').length },
    { id: 'hatchback', label: 'Hatchbacks', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'hatchback').length },
    { id: 'wagon', label: 'Wagons & Estates', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'wagon').length },
    { id: 'truck', label: 'Trucks', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'truck').length },
    { id: 'coupe', label: 'Coupes', count: VEHICLE_PRESETS.filter((p) => p.bodyType === 'coupe' || p.segment?.toLowerCase().includes('coupe')).length },
  ], []);

  const displayedVehicles = useMemo(() => {
    if (selectedBodyStyle === 'all') {
      return [
        VEHICLE_PRESETS.find((p) => p.id === 'vw-golf-20-tdi') || VEHICLE_PRESETS[1],
        VEHICLE_PRESETS.find((p) => p.id === 'bmw-320d-b47') || VEHICLE_PRESETS[10],
        VEHICLE_PRESETS.find((p) => p.id === 'peugeot-208-12-puretech') || VEHICLE_PRESETS[15],
        VEHICLE_PRESETS.find((p) => p.id === 'toyota-corolla-18-hybrid') || VEHICLE_PRESETS[20],
        VEHICLE_PRESETS.find((p) => p.id === 'skoda-octavia-20-tdi') || VEHICLE_PRESETS[6],
        VEHICLE_PRESETS.find((p) => p.id === 'tesla-model-3-lr') || VEHICLE_PRESETS[25],
      ];
    }
    const filtered = VEHICLE_PRESETS.filter((p) => {
      if (selectedBodyStyle === 'coupe') {
        return p.bodyType === 'coupe' || p.segment?.toLowerCase().includes('coupe');
      }
      return p.bodyType === selectedBodyStyle;
    });
    return filtered.slice(0, 6);
  }, [selectedBodyStyle]);

  const faqs = [
    {
      q: 'How accurate are the cost estimates?',
      a: 'Our cost models combine factory depreciation curves, regional insurance group tables, typical real-world fuel economy figures, and average regional labor rates updated regularly.',
    },
    {
      q: 'Where do the repair prices come from?',
      a: 'We aggregate OEM component catalog prices and regional flat-rate book labor times across Independent, Dealership, and DIY repair tiers.',
    },
    {
      q: 'Do I need to create an account or sign up?',
      a: 'No. DriveLedger is 100% free, independent, and requires zero sign-up or personal credit card info.',
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

  const handleHubTabKeyDown = (e, idx) => {
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % DISCOVERY_HUB_TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + DISCOVERY_HUB_TABS.length) % DISCOVERY_HUB_TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = DISCOVERY_HUB_TABS.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetTab = DISCOVERY_HUB_TABS[nextIdx];
      setActiveHubTab(targetTab.id);
      if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
        const btn = document.getElementById(`hub-tab-${targetTab.id}`);
        btn?.focus?.();
      }
    }
  };

  return (
    <div className="space-y-14 sm:space-y-16">
      {/* =====================================================================
          SECTION 1: Hero + Instant Vehicle Finder
         ===================================================================== */}
      <HeroVehicleFinder
        selectedPresetId={selectedPresetId}
        hasSelectedVehicle={hasSelectedVehicle}
        onSelectPreset={onSelectPreset}
        onNavigateToTco={onNavigateToTco}
        onNavigateToRisk={onNavigateToRisk}
        onNavigateToObd={onNavigateToObd}
      />

      {/* =====================================================================
          SECTION 2: Three Core Tools (Clean 3-Column Bento)
         ===================================================================== */}
      <section aria-labelledby="core-tools-heading">
        <div className="mb-6 max-w-2xl">
          <h2 id="core-tools-heading" className="text-h2 font-sans font-bold tracking-tight text-ink dark:text-zinc-50 text-balance">
            Everything you need before you buy or repair
          </h2>
          <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1.5">
            Three specialized calculators built to expose real 5-year ownership and workshop costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tool 1: 5-Year True Cost to Own */}
          <article
            data-interactive="true"
            className="relative cq-card group p-6 rounded-2xl bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800 shadow-card sm:hover:-translate-y-0.5 sm:hover:shadow-card-hover hover:border-border-strong dark:hover:border-zinc-700 transition-[transform,box-shadow,border-color] duration-200 ease-out flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary-600/40 dark:focus-within:ring-emerald-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-subtle dark:bg-zinc-900 flex items-center justify-center text-primary-600 dark:text-emerald-400 mb-4">
                <Calculator aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="text-h3 font-sans font-semibold text-ink dark:text-zinc-50 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                5-Year True Cost to Own
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-5">
                Depreciation curves, fuel, insurance, financing, and scheduled service benchmarks.
              </p>

              {/* Concise Tint Preview (no inner border box) */}
              <div className="bg-surface-subtle dark:bg-zinc-900/80 p-3.5 rounded-xl mb-5">
                <div className="h-2 rounded-full bg-border dark:bg-zinc-800 flex overflow-hidden mb-2.5">
                  <div className="h-full bg-[#183D22] w-[45%]" title="Depreciation (45%)" />
                  <div className="h-full bg-[#3B82F6] w-[25%]" title="Fuel (25%)" />
                  <div className="h-full bg-[#10B981] w-[18%]" title="Insurance (18%)" />
                  <div className="h-full bg-[#F59E0B] w-[12%]" title="Maintenance (12%)" />
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-muted dark:text-zinc-400">Segment median</span>
                  <span className="font-semibold text-ink dark:text-zinc-50 font-mono tabular-nums">{formatCurrency(612)}/mo</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTco()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-surface-subtle group-hover:bg-[#183D22] dark:bg-zinc-900 dark:group-hover:bg-emerald-700 text-xs font-sans font-semibold text-ink group-hover:text-white dark:text-zinc-200 dark:group-hover:text-white flex items-center justify-between transition-colors duration-150 cursor-pointer after:content-[''] after:absolute after:inset-0 focus-visible:outline-none"
            >
              <span>Open TCO calculator</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </article>

          {/* Tool 2: Maintenance & Powertrain Risk */}
          <article
            data-interactive="true"
            className="relative cq-card group p-6 rounded-2xl bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800 shadow-card sm:hover:-translate-y-0.5 sm:hover:shadow-card-hover hover:border-border-strong dark:hover:border-zinc-700 transition-[transform,box-shadow,border-color] duration-200 ease-out flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary-600/40 dark:focus-within:ring-emerald-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-subtle dark:bg-zinc-900 flex items-center justify-center text-primary-600 dark:text-emerald-400 mb-4">
                <ShieldAlert aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="text-h3 font-sans font-semibold text-ink dark:text-zinc-50 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                Maintenance &amp; Powertrain Risk
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-5">
                Mileage-adjusted component wear, urban duty penalties, and preventative horizons.
              </p>

              {/* Concise Tint Preview */}
              <div className="bg-surface-subtle dark:bg-zinc-900/80 px-3.5 py-2.5 rounded-xl mb-5 divide-y divide-border/60 dark:divide-zinc-800/80 text-xs">
                <div className="flex items-center justify-between py-1.5 first:pt-0">
                  <span className="text-body dark:text-zinc-300 font-sans">Timing assembly</span>
                  <span className="font-mono tabular-nums text-muted dark:text-zinc-400">{formatDistance(75000)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 last:pb-0">
                  <span className="text-body dark:text-zinc-300 font-sans">Water pump &amp; belt</span>
                  <span className="font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">{formatDistance(55000)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToRisk()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-surface-subtle group-hover:bg-[#183D22] dark:bg-zinc-900 dark:group-hover:bg-emerald-700 text-xs font-sans font-semibold text-ink group-hover:text-white dark:text-zinc-200 dark:group-hover:text-white flex items-center justify-between transition-colors duration-150 cursor-pointer after:content-[''] after:absolute after:inset-0 focus-visible:outline-none"
            >
              <span>Open risk matrix</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </article>

          {/* Tool 3: OBD2 Repair Price Estimator */}
          <article
            data-interactive="true"
            className="relative cq-card group p-6 rounded-2xl bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800 shadow-card sm:hover:-translate-y-0.5 sm:hover:shadow-card-hover hover:border-border-strong dark:hover:border-zinc-700 transition-[transform,box-shadow,border-color] duration-200 ease-out flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary-600/40 dark:focus-within:ring-emerald-500/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-subtle dark:bg-zinc-900 flex items-center justify-center text-primary-600 dark:text-emerald-400 mb-4">
                <Cpu aria-hidden="true" className="w-5 h-5" />
              </div>
              <h3 className="text-h3 font-sans font-semibold text-ink dark:text-zinc-50 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                OBD2 Repair Price Estimator
              </h3>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed mb-5">
                Ranked root causes, live PID checks, and fair independent vs. dealer labor pricing.
              </p>

              {/* Concise Tint Preview */}
              <div className="bg-surface-subtle dark:bg-zinc-900/80 p-3.5 rounded-xl mb-5 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-ink dark:text-zinc-50">P0420</span>
                  <span className="text-muted dark:text-zinc-400 truncate">Catalyst system efficiency</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-zinc-800/80">
                  <span className="text-muted dark:text-zinc-400">Fair repair range</span>
                  <span className="font-semibold text-[#183D22] dark:text-emerald-400 font-mono tabular-nums">
                    {formatCurrency(742)} – {formatCurrency(1980)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToObd()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-surface-subtle group-hover:bg-[#183D22] dark:bg-zinc-900 dark:group-hover:bg-emerald-700 text-xs font-sans font-semibold text-ink group-hover:text-white dark:text-zinc-200 dark:group-hover:text-white flex items-center justify-between transition-colors duration-150 cursor-pointer after:content-[''] after:absolute after:inset-0 focus-visible:outline-none"
            >
              <span>Open OBD2 estimator</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </article>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: Featured Vehicles & Body Style Explorer
         ===================================================================== */}
      <section id="telemetry-preset-benchmarks-section" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <span className="sr-only">TELEMETRY PRESET BENCHMARKS</span>
            <h2 className="text-h2 font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
              Browse Popular Vehicles
            </h2>
            <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
              Filter 179+ benchmarked configurations by body style and jump straight into analysis.
            </p>
          </div>
          <a
            href="/vehicles"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToVehicles) onNavigateToVehicles();
              else onNavigateToTco();
            }}
            className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            <span>All <span className="font-mono tabular-nums">{VEHICLE_PRESETS.length}</span> Vehicles &amp; Engines</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Single-Row Scrollable Body Style Filter Chips on Mobile, Wrapped on Desktop */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap mb-6">
          {POPULAR_BODY_TYPES.map((bt) => {
            const isActive = selectedBodyStyle === bt.id;
            return (
              <button
                key={bt.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedBodyStyle(bt.id)}
                className={`min-h-[44px] sm:min-h-[38px] shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-colors duration-150 border cursor-pointer ${
                  isActive
                    ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                    : 'bg-surface dark:bg-[#121215] text-body dark:text-zinc-300 border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700'
                }`}
              >
                <span>{bt.label}</span>
                <span className={`ml-1.5 text-[11px] font-mono tabular-nums ${isActive ? 'text-emerald-100' : 'text-muted dark:text-zinc-400'}`}>
                  {bt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3-Column Airy Vehicle Grid with Reserved aspect-[16/10] Media & @container Queries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVehicles.map((car) => {
            const isSelected = hasSelectedVehicle && car.id === selectedPresetId;
            return (
              <article
                key={car.id}
                className={`cq-card group rounded-2xl bg-surface dark:bg-[#121215] border transition-colors duration-150 flex flex-col justify-between shadow-card overflow-hidden ${
                  isSelected
                    ? 'border-primary-600 ring-2 ring-primary-600/20'
                    : 'border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700'
                }`}
              >
                {/* Reserved Aspect-Ratio Frame (Zero CLS, Max 1 Price Badge) */}
                <div className="aspect-[16/10] w-full overflow-hidden bg-surface-subtle dark:bg-zinc-900 relative border-b border-border/70 dark:border-zinc-800">
                  <VehicleImageResolver vehicle={car} variant="card" className="w-full h-full" interactive />
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-mono font-semibold text-ink dark:text-zinc-50 bg-surface/95 dark:bg-zinc-900/95 px-2.5 py-1 rounded-lg border border-border/80 dark:border-zinc-700/80 backdrop-blur-xs tabular-nums">
                      {formatCurrency(car.purchasePriceUsd)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-sans font-semibold tracking-tight text-ink dark:text-zinc-50">
                      <a
                        href={`/tco/${car.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectPreset(car.id);
                          onNavigateToTco(car.id);
                        }}
                        className="min-h-[44px] sm:min-h-0 inline-flex items-center hover:text-primary-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                      >
                        {car.name}
                      </a>
                    </h3>
                    <p className="text-xs text-muted dark:text-zinc-400 truncate mt-0.5 font-sans">
                      {car.segment} · {car.powertrainLabel || `${car.powerHp} HP · ${car.fuelType}`}
                    </p>

                    {/* Clean Hairline Metrics Strip (No Nested Bordered Box) */}
                    <div className="cq-metrics-row mt-4 py-3 border-y border-border/70 dark:border-zinc-800 text-xs">
                      <div className="min-w-0">
                        <span className="text-[11px] font-sans text-muted dark:text-zinc-400 block truncate">Odometer</span>
                        <strong className="text-ink dark:text-zinc-50 text-xs font-mono tabular-nums font-semibold block truncate mt-0.5">
                          {formatDistance(car.defaultOdometerMiles)}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-sans text-muted dark:text-zinc-400 block truncate">Economy</span>
                        <strong className="text-ink dark:text-zinc-50 text-xs font-mono tabular-nums font-semibold block truncate mt-0.5">
                          {formatEfficiency(car.mpgUs, car.isEv)}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-sans text-muted dark:text-zinc-400 block truncate">Service / yr</span>
                        <strong className="text-[#183D22] dark:text-emerald-400 text-xs font-mono tabular-nums font-semibold block truncate mt-0.5">
                          {formatCurrency(car.baseAnnualMaintenanceUsd)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Direct Entry Actions: 1 Primary CTA + 1 Quiet Secondary Link */}
                  <div className="cq-actions-row mt-4">
                    <a
                      href={`/tco/${car.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectPreset(car.id);
                        onNavigateToTco(car.id);
                      }}
                      className="flex-1 min-h-[44px] sm:min-h-[38px] bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-sans font-semibold text-xs py-2 px-3.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calculator aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                      <span>Calculate True Cost</span>
                    </a>
                    <a
                      href={`/risk-matrix/${car.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectPreset(car.id);
                        onNavigateToRisk(car);
                      }}
                      className="min-h-[44px] sm:min-h-[38px] bg-surface-subtle hover:bg-canvas dark:bg-zinc-900 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-sans font-medium text-xs py-2 px-3.5 rounded-xl border border-border/80 dark:border-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Risk Matrix</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: Interactive Proof & Discovery Hub (Tabbed Progressive Disclosure)
         ===================================================================== */}
      <section
        id="home-discovery-hub"
        ref={hubContainerRef}
        aria-labelledby="discovery-hub-heading"
        className="rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-card overflow-hidden"
      >
        <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-0 border-b border-border/80 dark:border-zinc-800">
          <div className="max-w-2xl mb-4">
            <h2 id="discovery-hub-heading" className="text-h2 font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
              How DriveLedger compares &amp; protects buyers
            </h2>
            <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
              Explore our independent methodology, pre-purchase inspection checks, subsystem telemetry, and verified workshop quotes.
            </p>
          </div>

          {/* Single-Row Scrollable Tablist with Non-Color Underline Indicator */}
          <div
            role="tablist"
            aria-label="Platform insights and buyer tools"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0"
          >
            {DISCOVERY_HUB_TABS.map((tab, idx) => {
              const isSelected = activeHubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`hub-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveHubTab(tab.id)}
                  onKeyDown={(e) => handleHubTabKeyDown(e, idx)}
                  className="dl-hub-tab whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel 1: Why DriveLedger (How It Works + Platform Stats + Comparison Table) */}
        <div
          role="tabpanel"
          aria-labelledby="hub-tab-why"
          data-hub-panel="why"
          tabIndex={activeHubTab === 'why' ? 0 : undefined}
          {...(activeHubTab !== 'why' ? { hidden: 'until-found' } : {})}
        >
          <div className="p-5 sm:p-8 space-y-8">
            {/* 3-Step Workflow + 4 Key Platform Metrics (Hairline Divided, Zero Nested Boxes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-border/80 dark:border-zinc-800">
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-surface-subtle dark:bg-zinc-900 text-[#183D22] dark:text-emerald-400 font-mono tabular-nums font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-sans font-semibold text-ink dark:text-zinc-50">Pick your car</h3>
                  <p className="text-xs font-sans text-body dark:text-zinc-400 leading-relaxed mt-0.5">
                    Select any of 179+ benchmarked powertrains or enter a custom listing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-surface-subtle dark:bg-zinc-900 text-[#183D22] dark:text-emerald-400 font-mono tabular-nums font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-sans font-semibold text-ink dark:text-zinc-50">Adjust your driving</h3>
                  <p className="text-xs font-sans text-body dark:text-zinc-400 leading-relaxed mt-0.5">
                    Set annual distance, urban duty share, financing terms, and local fuel tariffs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-surface-subtle dark:bg-zinc-900 text-[#183D22] dark:text-emerald-400 font-mono tabular-nums font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-sans font-semibold text-ink dark:text-zinc-50">Review the numbers</h3>
                  <p className="text-xs font-sans text-body dark:text-zinc-400 leading-relaxed mt-0.5">
                    See 5-year depreciation, failure probabilities, and fair specialist repair ranges.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-border/80 dark:border-zinc-800">
              <div>
                <span className="text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums block">179+</span>
                <span className="text-xs font-sans text-muted dark:text-zinc-400">Car models analysed</span>
              </div>
              <div>
                <span className="text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums block">629</span>
                <span className="text-xs font-sans text-muted dark:text-zinc-400">Vehicle × OBD2 dossiers</span>
              </div>
              <div>
                <span className="text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums block">3</span>
                <span className="text-xs font-sans text-muted dark:text-zinc-400">Regions: US · UK · EU</span>
              </div>
              <div>
                <span className="text-metric-l font-bold text-ink dark:text-zinc-50 font-mono tabular-nums block">0</span>
                <span className="text-xs font-sans text-muted dark:text-zinc-400">Sign-ups required</span>
              </div>
            </div>

            {/* Clean Comparison Table */}
            <div>
              <h3 className="text-h3 font-sans font-semibold text-ink dark:text-zinc-50 mb-4">
                Why drivers choose DriveLedger
              </h3>
              <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[580px]">
                  <thead>
                    <tr className="border-b border-border dark:border-zinc-800 text-xs font-sans text-muted dark:text-zinc-400">
                      <th className="py-3 pr-4 font-semibold w-2/5">Capability</th>
                      <th className="py-3 px-4 font-semibold text-[#183D22] dark:text-emerald-400 bg-surface-subtle/70 dark:bg-emerald-950/20 rounded-t-lg w-1/5">
                        DriveLedger
                      </th>
                      <th className="py-3 px-4 font-medium w-1/5">Dealer Quote</th>
                      <th className="py-3 pl-4 font-medium w-1/5">Online Forums</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70 dark:divide-zinc-800 text-xs sm:text-sm font-sans">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink dark:text-zinc-100">Full 5-year cost breakdown</td>
                      <td className="py-3 px-4 bg-surface-subtle/50 dark:bg-emerald-950/15 font-medium text-ink dark:text-zinc-50">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Detailed curves</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted dark:text-zinc-400">Financing only</td>
                      <td className="py-3 pl-4 text-muted dark:text-zinc-400">Vague estimates</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink dark:text-zinc-100">Fair labor rates by region</td>
                      <td className="py-3 px-4 bg-surface-subtle/50 dark:bg-emerald-950/15 font-medium text-ink dark:text-zinc-50">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>US / UK / EU rates</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted dark:text-zinc-400">Franchise markups</td>
                      <td className="py-3 pl-4 text-muted dark:text-zinc-400">Anecdotal threads</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink dark:text-zinc-100">OBD2 root-cause probabilities</td>
                      <td className="py-3 px-4 bg-surface-subtle/50 dark:bg-emerald-950/15 font-medium text-ink dark:text-zinc-50">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Ranked by frequency</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted dark:text-zinc-400">Diagnostic fee first</td>
                      <td className="py-3 pl-4 text-muted dark:text-zinc-400">Guesswork</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-ink dark:text-zinc-100">Multi-currency &amp; unit sync</td>
                      <td className="py-3 px-4 bg-surface-subtle/50 dark:bg-emerald-950/15 font-medium text-ink dark:text-zinc-50">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>$, £, €, MPG, L/100km</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted dark:text-zinc-400">Single market</td>
                      <td className="py-3 pl-4 text-muted dark:text-zinc-400">Mixed units</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Pre-Purchase Inspection (PPI) Preview (preserves data-testid="homepage-ppi-preview") */}
        <div
          role="tabpanel"
          aria-labelledby="hub-tab-ppi"
          data-hub-panel="ppi"
          tabIndex={activeHubTab === 'ppi' ? 0 : undefined}
          {...(activeHubTab !== 'ppi' ? { hidden: 'until-found' } : {})}
        >
          <div data-testid="homepage-ppi-preview" className="p-5 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border/80 dark:border-zinc-800">
              <div>
                <h3 className="text-h3 font-sans font-semibold tracking-tight text-ink dark:text-zinc-50">
                  {isVehicleSelected && activePreset
                    ? `Pre-Purchase Inspection Points for ${activePreset.name}`
                    : 'Universal Pre-Purchase Inspection Points'}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
                  {isVehicleSelected && activePreset
                    ? 'Top engine-specific red flags to verify in person before signing a purchase agreement.'
                    : 'Essential on-site checks to verify before buying any used car — select a model to unlock engine-specific red flags.'}
                </p>
              </div>
              <a
                href={isVehicleSelected && activePreset ? `/checklist/${activePreset.id}` : '/checklist'}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateToChecklist) {
                    onNavigateToChecklist(isVehicleSelected && activePreset ? activePreset.id : undefined);
                  } else {
                    onNavigateToRisk();
                  }
                }}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-5 py-2.5 font-sans text-xs sm:text-sm font-semibold transition-colors shrink-0"
              >
                <span>Open Full Interactive PPI Checklist</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/80 dark:divide-zinc-800 pt-5">
              {previewPpiItems.map((item) => {
                const rawSaving = String(item.estSaving || '');
                const nums = rawSaving.match(/\d[\d,]*/g);
                const localizedSaving =
                  nums && nums.length >= 2
                    ? (() => {
                        const isEur = rawSaving.includes('€') || /eur/i.test(rawSaving);
                        const factor = isEur ? 1 / 0.92 : 1.0;
                        const loUsd = Math.round((Number(nums[0].replace(/,/g, '')) || 400) * factor);
                        const hiUsd = Math.round((Number(nums[1].replace(/,/g, '')) || 1400) * factor);
                        return `${formatCurrency(loUsd)} – ${formatCurrency(hiUsd)}`;
                      })()
                    : rawSaving;
                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 md:py-0 md:px-5 md:first:pl-0 md:last:pr-0 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400 truncate">
                          {item.riskLabel || (item.isModelSpecific ? 'Known Model Defect' : 'Standard Check')}
                        </span>
                        <RiskBadge
                          level={item.riskLevel === 'critical' ? 'critical' : item.riskLevel === 'low' ? 'low' : 'moderate'}
                          label={item.isModelSpecific ? 'Model Defect' : 'Standard'}
                        />
                      </div>
                      <h4 className="font-sans text-sm font-semibold text-ink dark:text-zinc-50 leading-snug">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 font-sans text-xs text-body dark:text-zinc-300 leading-relaxed">
                        {item.focus}
                      </p>
                    </div>
                    {localizedSaving && (
                      <div className="mt-3 pt-2.5 border-t border-border/60 dark:border-zinc-800 flex items-center justify-between text-xs font-sans">
                        <span className="text-muted dark:text-zinc-400">Negotiating leverage</span>
                        <span className="font-mono tabular-nums font-semibold text-rose-700 dark:text-rose-400">
                          {localizedSaving}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel 3: Mechanical Subsystems Watch */}
        <div
          role="tabpanel"
          aria-labelledby="hub-tab-subsystems"
          data-hub-panel="subsystems"
          tabIndex={activeHubTab === 'subsystems' ? 0 : undefined}
          {...(activeHubTab !== 'subsystems' ? { hidden: 'until-found' } : {})}
        >
          <div className="p-5 sm:p-8">
            <SubsystemGrid embedded onNavigateToRisk={onNavigateToRisk} />
          </div>
        </div>

        {/* Panel 4: Verified Workshop Quotes */}
        <div
          role="tabpanel"
          aria-labelledby="hub-tab-quotes"
          data-hub-panel="quotes"
          tabIndex={activeHubTab === 'quotes' ? 0 : undefined}
          {...(activeHubTab !== 'quotes' ? { hidden: 'until-found' } : {})}
        >
          <div className="p-5 sm:p-8">
            <ReviewsSection embedded />
          </div>
        </div>

        {/* Panel 5: Technical Buyer Guides */}
        <div
          role="tabpanel"
          aria-labelledby="hub-tab-guides"
          data-hub-panel="guides"
          tabIndex={activeHubTab === 'guides' ? 0 : undefined}
          {...(activeHubTab !== 'guides' ? { hidden: 'until-found' } : {})}
        >
          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
              <div>
                <h3 className="text-h3 font-sans font-semibold tracking-tight text-ink dark:text-zinc-50">
                  Automotive Cost &amp; Diagnostic Guides
                </h3>
                <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
                  Deep-dive pre-purchase inspection protocols and powertrain reliability reports.
                </p>
              </div>
              <a
                href="/guides"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateToGuides) onNavigateToGuides();
                  else if (onNavigateToBlog) onNavigateToBlog();
                  else onNavigateToMethodology();
                }}
                className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                <span>View all 10 buyer guides</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(GUIDES_DATA || []).slice(0, 3).map((guide) => (
                <a
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSelectGuide) {
                      onSelectGuide(guide.slug);
                    } else if (onNavigateToGuides) {
                      onNavigateToGuides();
                    } else if (onNavigateToBlog) {
                      onNavigateToBlog();
                    }
                  }}
                  className="cq-card group p-5 rounded-xl border border-border/80 dark:border-zinc-800 bg-surface-subtle/70 hover:bg-surface dark:bg-zinc-900/60 dark:hover:bg-zinc-900 sm:hover:shadow-card-hover sm:hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200 ease-out cursor-pointer flex flex-col justify-between text-left no-underline"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-sans text-muted dark:text-zinc-400 mb-2">
                      <span className="font-medium text-ink dark:text-zinc-300">{guide.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="w-3 h-3" />
                        {guide.readingTime || `${guide.readingTimeMinutes || 9} min read`}
                      </span>
                    </div>
                    <h4 className="font-sans font-semibold tracking-tight text-ink dark:text-zinc-50 text-sm sm:text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors mb-1.5">
                      {guide.title}
                    </h4>
                    <p className="text-xs font-sans text-body dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/70 dark:border-zinc-800 flex items-center justify-between text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400">
                    <span>Read guide</span>
                    <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: Concise FAQ + Final CTA + Collapsed SEO Directory
         ===================================================================== */}
      <section
        aria-labelledby="home-faq-heading"
        className="bg-surface dark:bg-[#121215] rounded-2xl border border-border/80 dark:border-zinc-800 shadow-card p-6 sm:p-8 lg:p-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Heading + Single Restrained Final CTA */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            <div>
              <h2 id="home-faq-heading" className="text-h2 font-sans font-bold text-ink dark:text-zinc-50 tracking-tight">
                Questions, answered
              </h2>
              <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-400 mt-2 leading-relaxed text-pretty">
                How our independent depreciation curves, repair datasets, and regional models work.
              </p>
            </div>

            <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900/80 p-5 space-y-3">
              <h3 className="text-base font-sans font-semibold text-ink dark:text-zinc-50 tracking-tight">
                Check your car in 30 seconds
              </h3>
              <p className="text-xs font-sans text-body dark:text-zinc-400 leading-relaxed">
                Instant projections across 179+ models for US, UK, and European drivers.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToTco()}
                className="w-full sm:w-auto min-h-[44px] bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-sans font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Start free check</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Native Exclusive <details name="home-faq"> Accordions */}
          <div className="lg:col-span-8 divide-y divide-border/80 dark:divide-zinc-800">
            {faqs.map((faq, idx) => (
              <details
                key={faq.q}
                name="home-faq"
                open={idx === 0}
                className="dl-disclosure group"
              >
                <summary className="min-h-[48px] py-3.5 first:pt-0 flex items-center justify-between gap-4 text-left font-sans font-semibold text-ink dark:text-zinc-50 text-sm sm:text-base hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
                  <span>{faq.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="pb-4 text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed max-w-[65ch] text-pretty">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Tucked SEO Reference Dossier & 35-Brand Directory (Native <details> — Find-in-Page & Crawler Accessible) */}
        <div className="mt-8 pt-6 border-t border-border/80 dark:border-zinc-800">
          <details className="dl-disclosure group">
            <summary className="min-h-[44px] flex items-center justify-between gap-3 text-xs sm:text-sm font-sans font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
              <span>Automotive Total Cost of Ownership (TCO) &amp; 35-Brand Reliability Directory</span>
              <ChevronDown
                aria-hidden="true"
                className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="pt-5 space-y-6 text-xs text-body dark:text-zinc-300 leading-relaxed font-sans">
              <p className="max-w-[75ch]">
                DriveLedger provides automotive cost modeling across North American (US), British (UK), and European Union (EU) jurisdictions. Our computational framework unifies empirical depreciation curves, localized fuel tariffs, regional insurance ratings, and OEM flat-rate labor estimates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/80 dark:divide-zinc-800">
                <div className="py-3 first:pt-0 md:py-0 md:pr-5">
                  <strong className="block text-ink dark:text-zinc-200 mb-1">5-Year TCO Modeling</strong>
                  Calculates residual value loss, financing interest, maintenance schedules, and localized fuel expenses across ICE, Hybrid, and Electric powertrains.
                </div>
                <div className="py-3 md:py-0 md:px-5">
                  <strong className="block text-ink dark:text-zinc-200 mb-1">Thermodynamic Wear Index</strong>
                  Adjusts mechanical component lifespan based on city vs. highway trip cycles, cold-start frequency, and oil degradation rates.
                </div>
                <div className="py-3 last:pb-0 md:py-0 md:pl-5">
                  <strong className="block text-ink dark:text-zinc-200 mb-1">OBD-II Diagnostic Lookup</strong>
                  Maps SAE J1979 DTC fault codes to estimated root-cause probabilities and regional independent vs. dealership labor rates.
                </div>
              </div>

              <BrandQuickJumpIndex onNavigateToVehicles={onNavigateToVehicles} />
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
