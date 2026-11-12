import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, Calculator, ShieldAlert, Cpu, Gauge, Sun, Moon, Car, GitCompare, CheckCircle2, BookOpen, MessageSquare, FileText, Search } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useTheme } from '../../context/ThemeContext';
import { useGarage } from '../../context/GarageContext';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';

export const PRIMARY_WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', fullLabel: 'DriveLedger Independent Platform', icon: Gauge, desc: 'Vehicle finder, 120+ models & benchmark database', path: '/' },
  { id: 'tco', label: 'True Cost to Own', fullLabel: '5-Yr True Cost to Own', icon: Calculator, desc: 'Depreciation, fuel, insurance & financing curves', path: '/tco' },
  { id: 'risk', label: 'Maintenance Check', fullLabel: 'Powertrain Risk Matrix', icon: ShieldAlert, desc: 'Component wear & thermodynamic failure risk', path: '/risk-matrix' },
  { id: 'obd', label: 'OBD-II Estimator', fullLabel: 'OBD-II Workshop Estimator · OBD2 Repair Estimator', icon: Cpu, desc: 'Fair workshop labor & parts pricing for DTCs', path: '/obd-estimator' },
  { id: 'compare', label: 'Compare', fullLabel: 'Vehicle Comparator', icon: GitCompare, desc: '5-year TCO break-even graph and defect comparison', path: '/compare' },
  { id: 'guides', label: 'Guides', fullLabel: 'Buyer Guides & Insights', icon: BookOpen, desc: 'In-depth buyer protection & inspection guides', path: '/guides' },
];

export const SECONDARY_WORKSPACE_TABS = [
  { id: 'checklist', label: 'PPI Checklist', fullLabel: 'Pre-Purchase Inspection Checklist', icon: CheckCircle2, desc: 'On-site inspection checklist & printable report', path: '/checklist' },
  { id: 'about', label: 'About Us', fullLabel: 'About Us & Company Overview', icon: FileText, desc: 'Mission, engineering team & Impresszum', path: '/about' },
  { id: 'contact', label: 'Contact', fullLabel: 'Contact Engineering Team', icon: MessageSquare, desc: 'Direct support & inquiries', path: '/contact' },
  { id: 'methodology', label: 'Methodology', fullLabel: 'Methodology & Data Sources', icon: BookOpen, desc: 'Mathematical models & data sources', path: '/methodology' },
  { id: 'reviews', label: 'Reviews', fullLabel: 'Driver Reviews', icon: MessageSquare, desc: 'Owner feedback & repair quote comparisons', path: '/reviews' },
  { id: 'blog', label: 'Blog', fullLabel: 'Practical Automotive Guides', icon: FileText, desc: 'Deep-dive reliability & buying guides', path: '/guides' },
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
  const { region, setRegion, formatDistance, formatCurrency } = useUnits();
  const { theme, setTheme } = useTheme();
  const garage = useGarage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [garageDropdownOpen, setGarageDropdownOpen] = useState(false);
  const [vehicleSwitcherOpen, setVehicleSwitcherOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [drawerVehicleExpanded, setDrawerVehicleExpanded] = useState(false);

  const drawerRef = useRef(null);
  const mobileTabRefs = useRef({});

  const activePreset = useMemo(() => getPresetById(selectedPresetId), [selectedPresetId]);
  const filteredNavbarPresets = useMemo(() => {
    const q = vehicleSearchQuery.trim().toLowerCase();
    if (!q) return VEHICLE_PRESETS.slice(0, 12);
    return VEHICLE_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelName.toLowerCase().includes(q) ||
        (p.engineCode && p.engineCode.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [vehicleSearchQuery]);

  const savedVehicles = garage?.savedVehicles || [];
  const isSecondaryActive = SECONDARY_WORKSPACE_TABS.some((t) => t.id === activeTab);
  const activeSecondaryTab = SECONDARY_WORKSPACE_TABS.find((t) => t.id === activeTab);

  // Close mobile drawer when activeTab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Scroll active mobile quick-tab into center view
  useEffect(() => {
    const btn = mobileTabRefs.current?.[activeTab];
    if (btn && typeof btn.scrollIntoView === 'function') {
      try {
        btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      } catch (_err) {
        // Ignore in headless/mock DOM environments
      }
    }
  }, [activeTab]);

  // Body scroll lock & Focus trap / Escape key for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) {
      if (typeof document !== 'undefined' && document.body && document.body.style) {
        document.body.style.overflow = '';
      }
      return undefined;
    }

    if (typeof document !== 'undefined' && document.body && document.body.style) {
      document.body.style.overflow = 'hidden';
    }

    const handleDrawerKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key === 'Tab' && drawerRef.current && typeof drawerRef.current.querySelectorAll === 'function') {
        try {
          const focusables = drawerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus?.();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus?.();
          }
        } catch (_err) {
          // Ignore in mock DOM
        }
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleDrawerKeyDown);
    }
    return () => {
      if (typeof document !== 'undefined' && document.body && document.body.style) {
        document.body.style.overflow = '';
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleDrawerKeyDown);
      }
    };
  }, [mobileMenuOpen]);

  // Close popovers on outside click or Escape key
  useEffect(() => {
    if (!garageDropdownOpen && !moreDropdownOpen && !vehicleSwitcherOpen) return undefined;
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
      if (vehicleSwitcherOpen) {
        const isInsideVehicle = target && typeof target.closest === 'function' && target.closest('#navbar-vehicle-switcher-container');
        if (!isInsideVehicle) setVehicleSwitcherOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setGarageDropdownOpen(false);
        setMoreDropdownOpen(false);
        setVehicleSwitcherOpen(false);
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
  }, [garageDropdownOpen, moreDropdownOpen, vehicleSwitcherOpen]);

  return (
    <header className="sticky top-0 left-0 right-0 z-40 w-full max-w-full border-b border-zinc-200 bg-[#F7F7F4]/95 backdrop-blur-md dark:bg-zinc-950/95 dark:border-zinc-800 transition-colors safe-area-x">
      {/* Main Horizontal Row: h-14 on mobile, h-16 on desktop, no outer whitespace-nowrap */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-14 lg:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left: Brand Logo & Wordmark (wordmark hidden below 360px to guarantee room on tiny screens) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="min-h-[44px] flex items-center group shrink-0 focus:outline-none"
          aria-label="DriveLedger home"
        >
          {/* Screens >= 360px: Full Brand Logo */}
          <span className="hidden min-[360px]:inline-flex items-center transition-opacity duration-200 group-hover:opacity-90">
            <img
              src="/driveledger-logo.png"
              alt="DriveLedger"
              className="h-7 sm:h-8 w-auto object-contain dark:hidden"
            />
            <img
              src="/driveledger-logo-dark.png"
              alt="DriveLedger"
              className="h-7 sm:h-8 w-auto object-contain hidden dark:block"
            />
          </span>

          {/* Screens < 360px: Icon Only */}
          <span className="inline-flex min-[360px]:hidden items-center transition-transform duration-200 group-hover:scale-105">
            <img
              src="/driveledger-icon.png"
              alt="DriveLedger"
              className="h-7 w-auto object-contain"
            />
          </span>
          <span className="sr-only">DriveLedger</span>
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
                  data-path={t.path || `/${t.id}`}
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
                    data-path={t.path || `/${t.id}`}
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

        {/* Right Controls: Mobile shows compact vehicle selector + hamburger; Desktop shows full bar */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 flex-1 lg:flex-initial">
          {/* Desktop Segmented Region Switcher (US · UK · EU) - hidden on mobile (in drawer instead) */}
          <div
            role="radiogroup"
            aria-label="Units and currency"
            className="hidden lg:flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
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

          {/* Global Active Vehicle Quick-Switcher Pill & Popover (compact on mobile, 44px touch target) */}
          <div id="navbar-vehicle-switcher-container" className="relative min-w-0 shrink">
            <button
              type="button"
              data-testid="navbar-active-vehicle-picker"
              aria-haspopup="true"
              aria-expanded={vehicleSwitcherOpen}
              title={`Active vehicle: ${activePreset.name} — Click to switch`}
              onClick={() => {
                setVehicleSwitcherOpen((prev) => !prev);
                setGarageDropdownOpen(false);
                setMoreDropdownOpen(false);
              }}
              className="min-h-[44px] lg:min-h-0 inline-flex items-center gap-1.5 px-2.5 py-2 lg:py-1 rounded-lg border border-emerald-200/90 bg-emerald-50/70 text-[#183D22] font-sans text-xs font-semibold hover:bg-emerald-100/80 transition-colors duration-150 shadow-xs dark:bg-emerald-950/35 dark:border-emerald-800/50 dark:text-emerald-300 dark:hover:bg-emerald-950/60 min-w-0 max-w-full"
            >
              <Car className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#183D22] dark:text-emerald-400 shrink-0" />
              <span className="min-w-0 max-w-[95px] min-[390px]:max-w-[110px] min-[420px]:max-w-[135px] sm:max-w-[160px] truncate">
                {activePreset.shortName || activePreset.name}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 lg:w-3 lg:h-3 shrink-0 transition-transform duration-150 ${vehicleSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {vehicleSwitcherOpen && (
              <div
                role="dialog"
                aria-label="Global Active Vehicle Switcher"
                className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-96 max-h-[80dvh] flex flex-col rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xl p-3.5 z-50 animate-fade-in whitespace-normal"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="min-w-0">
                    <span className="font-sans text-[11px] uppercase tracking-wider font-bold text-muted dark:text-zinc-400 block">
                      Active Vehicle Context
                    </span>
                    <span className="font-sans text-xs font-bold text-ink dark:text-zinc-50 truncate block mt-0.5">
                      {activePreset.name}
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-mono tabular-nums font-bold shrink-0">
                    {formatCurrency ? formatCurrency(activePreset.purchasePriceUsd) : `$${activePreset.purchasePriceUsd}`}
                  </span>
                </div>

                {/* Quick Search Input (16px on mobile to prevent iOS auto-zoom) */}
                <div className="relative mt-2.5">
                  <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={vehicleSearchQuery}
                    onChange={(e) => setVehicleSearchQuery(e.target.value)}
                    placeholder="Quick switch model (e.g. Golf, BMW, Tesla)..."
                    className="w-full h-11 sm:h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pl-9 pr-8 text-base sm:text-xs font-sans text-ink dark:text-zinc-100 placeholder:text-faint focus:border-[#183D22] dark:focus:border-emerald-500 outline-none"
                  />
                  {vehicleSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setVehicleSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
                    >
                      <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>

                {/* Preset List */}
                <ul className="mt-2 space-y-1 max-h-60 overflow-y-auto pr-0.5">
                  {filteredNavbarPresets.map((p) => {
                    const isCurrent = p.id === selectedPresetId;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPreset) onSelectPreset(p.id);
                            setVehicleSwitcherOpen(false);
                            setVehicleSearchQuery('');
                          }}
                          className={`w-full min-h-[44px] flex items-center justify-between gap-2 p-2 rounded-xl text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50 font-semibold text-[#183D22] dark:text-emerald-300'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-ink dark:text-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-sans font-bold">{p.name}</div>
                            <div className="text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
                              {p.powerHp} HP · {p.fuelType} · {p.engineCode}
                            </div>
                          </div>
                          <span className="font-mono tabular-nums text-[11px] font-bold text-ink dark:text-zinc-300 shrink-0">
                            {formatCurrency ? formatCurrency(p.purchasePriceUsd) : `$${p.purchasePriceUsd}`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Quick Jump Links for Active Car */}
                <div className="mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-1.5 text-xs sm:text-[11px] font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('tco');
                      setVehicleSwitcherOpen(false);
                    }}
                    className="flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-semibold text-center transition-colors"
                  >
                    5-Yr TCO
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('risk');
                      setVehicleSwitcherOpen(false);
                    }}
                    className="flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-semibold text-center transition-colors"
                  >
                    Wear &amp; Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('compare');
                      setVehicleSwitcherOpen(false);
                    }}
                    className="flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-semibold text-center transition-colors"
                  >
                    Compare
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Compact My Garage Button - hidden on mobile (in drawer instead) */}
          <div id="garage-dropdown-container" className="hidden lg:block relative">
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

          {/* Desktop Compact Theme Toggle - hidden on mobile (in drawer instead) */}
          <div
            role="group"
            aria-label="Theme mode"
            className="hidden lg:flex items-center p-0.5 rounded-lg border border-zinc-200 bg-white shadow-xs dark:bg-zinc-900 dark:border-zinc-800"
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

          {/* Mobile & Tablet (< 1024px) Hamburger Menu Button (min 44x44px touch target) */}
          <button
            type="button"
            data-testid="navbar-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 rounded-lg focus:outline-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
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

      {/* Tablet & Mobile (< 1024px) Contained Horizontally Scrollable Quick-Tab Pill Bar */}
      <div className="relative lg:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#F7F7F4] dark:bg-zinc-950 w-full max-w-full overflow-hidden">
        <div
          data-testid="navbar-mobile-quick-tabs"
          className="w-full px-4 pr-10 py-1.5 overflow-x-auto no-scrollbar snap-x snap-mandatory flex items-center gap-2"
        >
          {PRIMARY_WORKSPACE_TABS.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={`mobile-quick-${t.id}`}
                ref={(el) => {
                  if (el) mobileTabRefs.current[t.id] = el;
                }}
                type="button"
                onClick={() => {
                  onSelectTab(t.id);
                  setMobileMenuOpen(false);
                }}
                className={`snap-start min-h-[38px] px-3.5 py-1.5 rounded-lg font-sans text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-[#183D22] text-white font-semibold dark:bg-emerald-600 shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Right-edge fade gradient to indicate horizontal scrollability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#F7F7F4] via-[#F7F7F4]/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80"
        />
      </div>

      {/* Tablet & Mobile (< 1024px) Full-Height Slide-In Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
          className="lg:hidden fixed inset-0 top-0 left-0 right-0 bottom-0 h-[100dvh] z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
            className="w-full max-w-sm bg-white dark:bg-[#121215] border-l border-zinc-200 dark:border-zinc-800 h-full overflow-y-auto p-4 sm:p-5 flex flex-col justify-between shadow-2xl safe-area-bottom"
          >
            <div className="space-y-5">
              {/* Drawer Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center">
                    <img
                      src="/driveledger-logo.png"
                      alt="DriveLedger"
                      className="h-7 w-auto object-contain dark:hidden"
                    />
                    <img
                      src="/driveledger-logo-dark.png"
                      alt="DriveLedger"
                      className="h-7 w-auto object-contain hidden dark:block"
                    />
                    <span className="sr-only">DriveLedger</span>
                  </div>
                  <span className="font-sans text-[11px] text-muted dark:text-zinc-400 block truncate">
                    Navigation &amp; Preferences
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Vehicle Selector inside Drawer */}
              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/25 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#183D22] dark:text-emerald-400 block">
                      Active Vehicle
                    </span>
                    <span className="text-xs font-sans font-bold text-ink dark:text-zinc-50 truncate block">
                      {activePreset.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerVehicleExpanded((prev) => !prev)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/60 text-xs font-sans font-semibold text-[#183D22] dark:text-emerald-300 shrink-0"
                  >
                    {drawerVehicleExpanded ? 'Done' : 'Switch Car'}
                  </button>
                </div>

                {drawerVehicleExpanded && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                    <input
                      type="text"
                      value={vehicleSearchQuery}
                      onChange={(e) => setVehicleSearchQuery(e.target.value)}
                      placeholder="Filter models (e.g. Golf, Camry, Model 3)..."
                      className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-base font-sans text-ink dark:text-zinc-100 outline-none"
                    />
                    <div className="max-h-44 overflow-y-auto space-y-1">
                      {filteredNavbarPresets.map((p) => (
                        <button
                          key={`drawer-preset-${p.id}`}
                          type="button"
                          onClick={() => {
                            if (onSelectPreset) onSelectPreset(p.id);
                            setDrawerVehicleExpanded(false);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-sans ${
                            p.id === selectedPresetId
                              ? 'bg-[#183D22] text-white font-semibold dark:bg-emerald-600'
                              : 'bg-white/80 dark:bg-zinc-900/80 text-ink dark:text-zinc-200 hover:bg-white'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="font-mono tabular-nums text-[11px] shrink-0">
                            {formatCurrency ? formatCurrency(p.purchasePriceUsd) : `$${p.purchasePriceUsd}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Calculators */}
              <div>
                <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-2">
                  Primary Calculators
                </span>
                <div className="flex flex-col gap-1">
                  {PRIMARY_WORKSPACE_TABS.map((t) => {
                    const IconComp = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <a
                        key={t.id}
                        href={t.path || `/${t.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`min-h-[48px] flex items-center gap-3 text-left py-2.5 px-3 rounded-xl font-sans text-sm font-medium transition-colors duration-150 ${
                          active
                            ? 'bg-emerald-50 text-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
                        <div className="min-w-0">
                          <span className="block truncate">{t.label}</span>
                          {t.desc && (
                            <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400 truncate">
                              {t.desc}
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Guides & Resources ("More" items) */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-2">
                  More Guides &amp; Resources
                </span>
                <div className="flex flex-col gap-1">
                  {SECONDARY_WORKSPACE_TABS.map((t) => {
                    const IconComp = t.icon;
                    const active = activeTab === t.id;
                    return (
                      <a
                        key={t.id}
                        href={t.path || `/${t.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`min-h-[44px] flex items-center gap-3 text-left py-2.5 px-3 rounded-xl font-sans text-sm font-medium transition-colors duration-150 ${
                          active
                            ? 'bg-emerald-50 text-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4 shrink-0" />}
                        <span>{t.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Full-Width US / UK / EU Segmented Unit Control */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                  Units &amp; Currency Region
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {REGION_OPTIONS.map((r) => (
                    <button
                      key={`drawer-region-${r.id}`}
                      type="button"
                      onClick={() => setRegion(r.id)}
                      className={`min-h-[44px] flex flex-col items-center justify-center px-2 py-1.5 rounded-xl font-sans text-xs font-semibold border transition-colors ${
                        region === r.id
                          ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{r.flag} {r.label}</span>
                      <span className={`text-[10px] font-normal ${region === r.id ? 'text-emerald-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {r.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full-Width Theme Toggle & My Garage Quick Access */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                    Display Theme
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 w-44">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-sans text-xs font-semibold border ${
                        theme === 'light'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-zinc-800 dark:border-amber-500/60 dark:text-amber-300'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-sans text-xs font-semibold border ${
                        theme === 'dark'
                          ? 'bg-zinc-800 border-emerald-500/60 text-emerald-400'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* My Garage in Mobile Drawer */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-sans font-bold text-ink dark:text-zinc-100 block">
                      My Garage ({savedVehicles.length} saved)
                    </span>
                    <span className="text-[11px] font-sans text-muted dark:text-zinc-400 block truncate">
                      Bookmark vehicles &amp; service logs
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
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#183D22] dark:bg-emerald-600 text-white text-xs font-sans font-semibold shrink-0"
                    >
                      + Save Car
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
