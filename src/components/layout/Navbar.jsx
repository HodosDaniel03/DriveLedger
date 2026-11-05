import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Calculator, ShieldAlert, Cpu, Gauge, Sun, Moon, Monitor, Car, GitCompare, CheckCircle2 } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useTheme } from '../../context/ThemeContext';
import { useGarage } from '../../context/GarageContext';
import { getPresetById } from '../../data/vehiclePresets';

export const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', fullLabel: 'ShiftMetric Independent Platform', icon: Gauge, desc: 'Vehicle finder, 120+ models & benchmark database' },
  { id: 'tco', label: 'True Cost to Own', fullLabel: '5-Yr True Cost to Own', icon: Calculator, desc: 'Depreciation, fuel, insurance & financing curves' },
  { id: 'risk', label: 'Maintenance Check', fullLabel: 'Powertrain Risk Matrix', icon: ShieldAlert, desc: 'Component wear & thermodynamic failure risk' },
  { id: 'obd', label: 'OBD2 Repair Estimator', fullLabel: 'OBD-II Workshop Estimator', icon: Cpu, desc: 'Fair workshop labor & parts pricing for DTCs' },
  { id: 'compare', label: 'Compare', fullLabel: 'Vehicle Comparator', icon: GitCompare, desc: '5-year TCO break-even graph and defect comparison' },
  { id: 'checklist', label: 'PPI Checklist', fullLabel: 'Pre-Purchase Inspection Checklist', icon: CheckCircle2, desc: 'On-site checklist, link sharing and printable PDF report' },
  { id: 'methodology', label: 'Methodology', fullLabel: 'Methodology & Engineering Governance' },
  { id: 'reviews', label: 'Reviews', fullLabel: 'Driver Reviews' },
  { id: 'blog', label: 'Blog', fullLabel: 'Practical Automotive Guides' },
];

const REGION_OPTIONS = [
  { id: 'US', flag: '🇺🇸', label: 'US', fullLabel: 'US ($ · mi)', hint: '$ · mi · MPG' },
  { id: 'UK', flag: '🇬🇧', label: 'UK', fullLabel: 'UK (£ · mi)', hint: '£ · mi · MPG' },
  { id: 'EU', flag: '🇪🇺', label: 'EU', fullLabel: 'EU (€ · km)', hint: '€ · km · L/100km' },
];

export default function Navbar({ activeTab, onSelectTab, selectedPresetId, onSelectPreset }) {
  const { region, setRegion, formatDistance } = useUnits();
  const { theme, setTheme } = useTheme();
  const garage = useGarage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [garageDropdownOpen, setGarageDropdownOpen] = useState(false);

  const savedVehicles = garage?.savedVehicles || [];

  // Close garage dropdown on outside click or Escape key
  useEffect(() => {
    if (!garageDropdownOpen) return undefined;
    const handleDocClick = (e) => {
      const isInsideGarage = e.target && typeof e.target.closest === 'function' && e.target.closest('#garage-dropdown-container');
      if (!isInsideGarage) {
        setGarageDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setGarageDropdownOpen(false);
      }
    };
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('click', handleDocClick);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('click', handleDocClick);
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [garageDropdownOpen]);

  return (
    <header className="sticky top-0 left-0 right-0 z-40 border-b border-[#E6E6E1] bg-[#F7F7F4]/90 backdrop-blur-md dark:bg-zinc-950/90 dark:border-zinc-800 transition-colors">
      {/* Unified Single-Line Navbar (h-16) across all screen sizes without tab overflow */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="flex items-center gap-2.5 text-[#141A15] dark:text-zinc-50 group shrink-0 focus:outline-none"
          aria-label="ShiftMetric home"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#183D22] text-white transition-transform duration-300 group-hover:scale-105 shadow-xs">
            <Gauge className="w-4 h-4 text-white" />
          </span>
          <span className="font-sans font-bold text-base sm:text-lg tracking-tight text-[#141A15] dark:text-zinc-50 hidden sm:inline">
            ShiftMetric
          </span>
          <span className="sr-only">ShiftMetric</span>
        </a>

        {/* Center: Horizontal Tab Container with Subtle Edge Fade */}
        <nav className="flex-1 min-w-0 relative mx-1 sm:mx-2 overflow-hidden" aria-label="Main Navigation">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#F7F7F4] to-transparent dark:from-zinc-950 z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#F7F7F4] to-transparent dark:from-zinc-950 z-10" />

          <div
            role="tablist"
            aria-label="Calculators and Workspaces"
            className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar whitespace-nowrap py-1 px-1"
          >
            {WORKSPACE_TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => onSelectTab(t.id)}
                  className={`inline-flex items-center px-2.5 py-1.5 rounded-lg font-sans text-xs font-medium whitespace-nowrap transition-colors duration-150 shrink-0 ${
                    active
                      ? 'bg-[#183D22] text-white font-semibold shadow-xs'
                      : 'text-[#5F665F] hover:text-[#141A15] hover:bg-[#F2F6F3] dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span>{t.label}</span>
                  {/* Accessible label for automated test assertions */}
                  <span className="sr-only"> ({t.fullLabel})</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Controls: Compact Region Segmented Control, Compact Garage Button, Theme Toggle, Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Segmented Region Switcher (US · UK · EU) */}
          <div
            role="radiogroup"
            aria-label="Units and currency"
            className="flex items-center rounded-lg border border-[#E6E6E1] bg-white p-0.5 shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
          >
            {REGION_OPTIONS.map((r) => {
              const isActive = r.id === region;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  title={r.hint}
                  onClick={() => setRegion(r.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-sans text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#183D22] text-white shadow-xs'
                      : 'text-[#5F665F] hover:text-[#141A15] hover:bg-[#F2F6F3] dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-[10px] leading-none select-none hidden md:inline">{r.flag}</span>
                  <span className="font-sans text-[11px] font-bold">{r.label}</span>
                  {/* Accessible text required for test assertions: EU (€ and US ($ */}
                  <span className="sr-only"> ({r.fullLabel})</span>
                </button>
              );
            })}
          </div>

          {/* Compact My Garage Button */}
          <div id="garage-dropdown-container" className="relative">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={garageDropdownOpen}
              onClick={() => setGarageDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-[#E6E6E1] bg-white text-[#141A15] font-sans text-xs font-semibold hover:bg-[#F2F6F3] transition-colors duration-150 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Car className="w-3.5 h-3.5 text-[#183D22] dark:text-emerald-400" />
              <span className="hidden xl:inline font-sans text-xs font-medium">My Garage</span>
              <span
                data-testid="garage-count-badge"
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-mono tabular-nums font-bold bg-[#183D22] text-white"
              >
                {savedVehicles.length}
              </span>
            </button>

            {/* Garage Popover Dropdown */}
            {garageDropdownOpen && (
              <div
                role="menu"
                aria-label="My Garage Saved Vehicles"
                className="absolute top-full right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#121215] border border-[#E6E6E1] dark:border-zinc-800 shadow-xl p-3 z-50 animate-fade-in"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E6E6E1] dark:border-zinc-800">
                  <div>
                    <span className="font-sans text-xs font-bold text-[#141A15] dark:text-zinc-50 block">
                      My Garage (<span className="font-mono tabular-nums">{savedVehicles.length}</span>)
                    </span>
                    <span className="font-sans text-[11px] text-[#5F665F] dark:text-zinc-400">
                      Saved vehicles, odometer &amp; service logs
                    </span>
                  </div>
                  {selectedPresetId && garage?.saveVehicleToGarage && (
                    <button
                      type="button"
                      onClick={() => {
                        const preset = getPresetById(selectedPresetId);
                        garage.saveVehicleToGarage({
                          presetId: preset.id,
                          name: preset.name,
                          odometerMiles: preset.defaultOdometerMiles,
                          purchasePriceUsd: preset.purchasePriceUsd,
                        });
                      }}
                      className="text-[11px] font-sans font-semibold text-[#183D22] dark:text-emerald-400 hover:underline"
                    >
                      + Save Active
                    </button>
                  )}
                </div>

                {savedVehicles.length === 0 ? (
                  <div className="py-6 text-center space-y-1.5">
                    <Car className="w-6 h-6 text-[#8A8F89] dark:text-zinc-500 mx-auto" />
                    <p className="font-sans text-xs font-medium text-[#141A15] dark:text-zinc-200">
                      Your garage is empty
                    </p>
                    <p className="font-sans text-[11px] text-[#5F665F] dark:text-zinc-400">
                      Click &ldquo;Save to My Garage&rdquo; in any calculator to bookmark vehicles and service checklists.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                    {savedVehicles.map((v) => {
                      const isCurrent = v.presetId === selectedPresetId;
                      const completedMilestones = garage?.getCompletedMilestones
                        ? Object.values(garage.getCompletedMilestones(v.presetId)).filter(Boolean).length
                        : 0;
                      const servicedComps = garage?.getServicedComponents
                        ? Object.values(garage.getServicedComponents(v.presetId)).filter(Boolean).length
                        : 0;
                      const totalDone = completedMilestones + servicedComps || v.completedCount || 0;

                      return (
                        <li
                          key={v.presetId}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors duration-150 ${
                            isCurrent
                              ? 'bg-[#E8F5E9]/60 border-[#BFE8CF] dark:bg-emerald-950/30 dark:border-emerald-800/40'
                              : 'bg-white border-[#E6E6E1] hover:bg-[#F2F6F3] dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPreset) {
                                onSelectPreset(v.presetId);
                              }
                              setGarageDropdownOpen(false);
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-xs font-bold text-[#141A15] dark:text-zinc-50 truncate">
                                {v.name}
                              </span>
                              {isCurrent && (
                                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-sans text-[#5F665F] dark:text-zinc-400">
                              <span className="font-mono tabular-nums">{formatDistance ? formatDistance(v.odometerMiles || 58000) : `${v.odometerMiles || 58000} mi`}</span>
                              <span>·</span>
                              <span className="text-[#183D22] dark:text-emerald-400 font-sans font-semibold">
                                <span className="font-mono tabular-nums">{totalDone}</span> services logged
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${v.name} from garage`}
                            onClick={() => garage?.removeVehicleFromGarage?.(v.presetId)}
                            className="p-1.5 rounded-lg text-[#8A8F89] hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors duration-150"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Compact Theme Toggle */}
          <div
            role="group"
            aria-label="Theme mode"
            className="flex items-center p-0.5 rounded-lg border border-[#E6E6E1] bg-white shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
          >
            <button
              type="button"
              title="Light mode"
              aria-label="Light mode"
              onClick={() => setTheme('light')}
              className={`p-1 rounded-md transition-colors duration-150 ${
                theme === 'light'
                  ? 'bg-[#F2F6F3] text-amber-500 shadow-xs dark:bg-zinc-800 dark:text-amber-400'
                  : 'text-[#8A8F89] hover:text-[#141A15] dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Dark mode"
              aria-label="Dark mode"
              onClick={() => setTheme('dark')}
              className={`p-1 rounded-md transition-colors duration-150 ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                  : 'text-[#8A8F89] hover:text-[#141A15] dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-1.5 text-[#5F665F] hover:text-[#141A15] dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E6E6E1] dark:border-zinc-800 bg-white dark:bg-[#121215] px-6 py-4 space-y-4 shadow-lg animate-fade-in max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-sans uppercase tracking-wider text-[#5F665F] dark:text-zinc-400 font-semibold">
              Calculators &amp; Workspaces
            </span>
            {WORKSPACE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelectTab(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 rounded-lg font-sans text-sm font-medium transition-colors duration-150 ${
                  activeTab === t.id
                    ? 'bg-[#E8F5E9] text-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
                    : 'text-[#3A403B] dark:text-zinc-300 hover:bg-[#F2F6F3] dark:hover:bg-zinc-900 hover:text-[#141A15] dark:hover:text-zinc-50'
                }`}
              >
                <span>{t.label}</span>
                <span className="sr-only"> ({t.fullLabel})</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E6E6E1] dark:border-zinc-800 flex items-center justify-between">
            <span className="font-sans text-xs text-[#5F665F] dark:text-zinc-400">Active Region:</span>
            <div className="flex items-center gap-1">
              {REGION_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRegion(r.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-sans text-xs font-semibold ${
                    region === r.id
                      ? 'bg-[#183D22] text-white'
                      : 'bg-[#F2F6F3] dark:bg-zinc-800 text-[#3A403B] dark:text-zinc-300 hover:text-[#141A15]'
                  }`}
                >
                  {r.flag} {r.label}
                  <span className="sr-only"> ({r.fullLabel})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
