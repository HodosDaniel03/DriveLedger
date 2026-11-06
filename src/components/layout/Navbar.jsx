import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Calculator, ShieldAlert, Cpu, Gauge, Sun, Moon, Car, GitCompare, CheckCircle2, BookOpen, MessageSquare, FileText } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useTheme } from '../../context/ThemeContext';
import { useGarage } from '../../context/GarageContext';
import { getPresetById } from '../../data/vehiclePresets';

export const PRIMARY_WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', fullLabel: 'ShiftMetric Independent Platform', icon: Gauge, desc: 'Vehicle finder, 120+ models & benchmark database' },
  { id: 'tco', label: 'True Cost to Own', fullLabel: '5-Yr True Cost to Own', icon: Calculator, desc: 'Depreciation, fuel, insurance & financing curves' },
  { id: 'risk', label: 'Maintenance Check', fullLabel: 'Powertrain Risk Matrix', icon: ShieldAlert, desc: 'Component wear & thermodynamic failure risk' },
  { id: 'obd', label: 'OBD-II Estimator', fullLabel: 'OBD-II Workshop Estimator · OBD2 Repair Estimator', icon: Cpu, desc: 'Fair workshop labor & parts pricing for DTCs' },
  { id: 'compare', label: 'Compare', fullLabel: 'Vehicle Comparator', icon: GitCompare, desc: '5-year TCO break-even graph and defect comparison' },
];

export const SECONDARY_WORKSPACE_TABS = [
  { id: 'checklist', label: 'PPI Checklist', fullLabel: 'Pre-Purchase Inspection Checklist', icon: CheckCircle2, desc: 'On-site inspection checklist & printable report' },
  { id: 'methodology', label: 'Methodology', fullLabel: 'Methodology & Engineering Governance', icon: BookOpen, desc: 'Mathematical models & data sources' },
  { id: 'reviews', label: 'Reviews', fullLabel: 'Driver Reviews', icon: MessageSquare, desc: 'Verified owner feedback & reports' },
  { id: 'blog', label: 'Blog', fullLabel: 'Practical Automotive Guides', icon: FileText, desc: 'Deep-dive reliability & buying guides' },
];

export const WORKSPACE_TABS = [
  ...PRIMARY_WORKSPACE_TABS,
  ...SECONDARY_WORKSPACE_TABS,
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
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [garageDropdownOpen, setGarageDropdownOpen] = useState(false);

  const savedVehicles = garage?.savedVehicles || [];
  const isSecondaryActive = SECONDARY_WORKSPACE_TABS.some((t) => t.id === activeTab);
  const activeSecondaryTab = SECONDARY_WORKSPACE_TABS.find((t) => t.id === activeTab);

  // Close popovers on outside click or Escape key
  useEffect(() => {
    if (!garageDropdownOpen && !moreDropdownOpen) return undefined;
    const handleDocClick = (e) => {
      const target = e.target;
      if (garageDropdownOpen) {
        const isInsideGarage = target && typeof target.closest === 'function' && target.closest('#garage-dropdown-container');
        if (!isInsideGarage) setGarageDropdownOpen(false);
      }
      if (moreDropdownOpen) {
        const isInsideMore = target && typeof target.closest === 'function' && target.closest('#more-dropdown-container');
        if (!isInsideMore) setMoreDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setGarageDropdownOpen(false);
        setMoreDropdownOpen(false);
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
  }, [garageDropdownOpen, moreDropdownOpen]);

  return (
    <header className="sticky top-0 left-0 right-0 z-40 border-b border-zinc-200 bg-[#F7F7F4]/95 backdrop-blur-md dark:bg-zinc-950/95 dark:border-zinc-800 transition-colors">
      {/* Main Horizontal Row (Locked h-16 / 64px, whitespace-nowrap) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 whitespace-nowrap">
        {/* Left: Brand Logo & Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="flex items-center gap-2.5 text-ink dark:text-zinc-50 group shrink-0 focus:outline-none"
          aria-label="ShiftMetric home"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#183D22] text-white transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <Gauge className="w-4 h-4 text-white" />
          </span>
          <span className="font-sans font-bold text-base sm:text-lg tracking-tight text-ink dark:text-zinc-50">
            ShiftMetric
          </span>
        </a>

        {/* Center (Desktop & Laptop >= 1024px): Priority Plus (5 Primary Tools + "More ▾" Dropdown) */}
        <nav
          className="hidden lg:flex items-center gap-1 shrink-0"
          aria-label="Main Navigation"
        >
          <div
            role="tablist"
            aria-label="Primary Calculators"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {PRIMARY_WORKSPACE_TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => {
                    onSelectTab(t.id);
                    setMoreDropdownOpen(false);
                  }}
                  className={`inline-flex items-center px-2.5 xl:px-3 py-1.5 rounded-lg font-sans text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors duration-150 shrink-0 ${
                    active
                      ? 'bg-[#183D22] text-white font-semibold shadow-xs dark:bg-emerald-600'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="sr-only"> ({t.fullLabel})</span>
                </button>
              );
            })}
          </div>

          {/* Priority Plus "More ▾" Dropdown Menu for Secondary Pages */}
          <div id="more-dropdown-container" className="relative ml-0.5">
            <button
              type="button"
              data-testid="navbar-more-button"
              aria-haspopup="true"
              aria-expanded={moreDropdownOpen}
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-lg font-sans text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                isSecondaryActive
                  ? 'bg-[#183D22] text-white font-semibold shadow-xs dark:bg-emerald-600'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <span>{activeSecondaryTab ? activeSecondaryTab.label : 'More'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              role="menu"
              aria-label="More pages and guides"
              className={`absolute top-full right-0 mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-1.5 w-48 z-50 transition-all duration-150 ${
                moreDropdownOpen
                  ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                  : 'opacity-0 invisible -translate-y-1 pointer-events-none'
              }`}
            >
              {SECONDARY_WORKSPACE_TABS.map((t) => {
                const active = t.id === activeTab;
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      onSelectTab(t.id);
                      setMoreDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-sans text-xs font-medium text-left transition-colors duration-150 ${
                      active
                        ? 'bg-emerald-50 text-[#183D22] font-semibold dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />}
                    <span>{t.label}</span>
                    <span className="sr-only"> ({t.fullLabel})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Right Controls: Compact Unit Switcher, My Garage Badge, Theme Toggle, Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Region Switcher (US · UK · EU) */}
          <div
            role="radiogroup"
            aria-label="Units and currency"
            className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
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
                      ? 'bg-[#183D22] text-white shadow-xs dark:bg-emerald-600'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-[10px] leading-none select-none hidden xl:inline">{r.flag}</span>
                  <span className="font-sans text-[11px] font-bold">{r.label}</span>
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white text-zinc-900 font-sans text-xs font-medium hover:bg-zinc-100 transition-colors duration-150 shadow-xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Car className="w-3.5 h-3.5 text-[#183D22] dark:text-emerald-400" />
              <span className="hidden xl:inline font-sans text-xs font-medium">My Garage</span>
              <span
                data-testid="garage-count-badge"
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-mono tabular-nums font-bold bg-[#183D22] text-white dark:bg-emerald-600"
              >
                {savedVehicles.length}
              </span>
            </button>

            {/* Garage Popover Dropdown */}
            {garageDropdownOpen && (
              <div
                role="menu"
                aria-label="My Garage Saved Vehicles"
                className="absolute top-full right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xl p-3 z-50 animate-fade-in whitespace-normal"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="font-sans text-xs font-bold text-ink dark:text-zinc-50 block">
                      My Garage (<span className="font-mono tabular-nums">{savedVehicles.length}</span>)
                    </span>
                    <span className="font-sans text-[11px] text-muted dark:text-zinc-400">
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
                    <Car className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto" />
                    <p className="font-sans text-xs font-medium text-ink dark:text-zinc-200">
                      Your garage is empty
                    </p>
                    <p className="font-sans text-[11px] text-muted dark:text-zinc-400">
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
                              ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'
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
                              <span className="font-sans text-xs font-bold text-ink dark:text-zinc-50 truncate">
                                {v.name}
                              </span>
                              {isCurrent && (
                                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-sans text-muted dark:text-zinc-400">
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
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors duration-150"
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
            className="flex items-center p-0.5 rounded-lg border border-zinc-200 bg-white shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
          >
            <button
              type="button"
              title="Light mode"
              aria-label="Light mode"
              onClick={() => setTheme('light')}
              className={`p-1 rounded-md transition-colors duration-150 ${
                theme === 'light'
                  ? 'bg-zinc-100 text-amber-500 shadow-xs dark:bg-zinc-800 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
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
                  : 'text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile & Tablet (< 1024px) Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-1.5 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg focus:outline-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
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

      {/* Tablet & Mobile (< 1024px) Horizontally Scrollable Quick-Tab Bar */}
      <div
        data-testid="navbar-mobile-quick-tabs"
        className="lg:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#F7F7F4] dark:bg-zinc-950 px-4 py-1.5 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {PRIMARY_WORKSPACE_TABS.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={`mobile-quick-${t.id}`}
                type="button"
                onClick={() => {
                  onSelectTab(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-lg font-sans text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-[#183D22] text-white font-semibold dark:bg-emerald-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablet & Mobile (< 1024px) Slide-Over Drawer / Sheet */}
      {mobileMenuOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
          className="lg:hidden absolute top-full left-0 right-0 h-[calc(100vh-6.25rem)] z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div
            role="dialog"
            aria-label="Mobile Navigation Drawer"
            className="w-full max-w-sm bg-white dark:bg-[#121215] border-l border-zinc-200 dark:border-zinc-800 h-full overflow-y-auto p-5 flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-2">
                  Primary Calculators
                </span>
                <div className="flex flex-col gap-1">
                  {PRIMARY_WORKSPACE_TABS.map((t) => {
                    const IconComp = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 text-left py-2.5 px-3 rounded-xl font-sans text-sm font-medium transition-colors duration-150 ${
                          active
                            ? 'bg-emerald-50 text-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
                        <div className="min-w-0">
                          <span className="block truncate">{t.label}</span>
                          {t.desc && (
                            <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400 truncate">
                              {t.desc}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-2">
                  Guides &amp; Resources
                </span>
                <div className="flex flex-col gap-1">
                  {SECONDARY_WORKSPACE_TABS.map((t) => {
                    const IconComp = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 text-left py-2.5 px-3 rounded-xl font-sans text-sm font-medium transition-colors duration-150 ${
                          active
                            ? 'bg-emerald-50 text-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="font-sans text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Region:</span>
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
                        ? 'bg-[#183D22] text-white dark:bg-emerald-600'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {r.flag} {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
