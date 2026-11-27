import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  ChevronDown,
  Calculator,
  ShieldAlert,
  Cpu,
  Gauge,
  Sun,
  Moon,
  Car,
  GitCompare,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  FileText,
  Menu,
  Share2,
} from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useTheme } from '../../context/ThemeContext';
import { useGarage } from '../../context/GarageContext';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import BrandLogo from '../common/BrandLogo';

export const PRIMARY_WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', fullLabel: 'Overview · DriveLedger Independent Platform', icon: Gauge, desc: 'Vehicle finder, 179+ models & benchmark database', path: '/' },
  { id: 'tco', label: 'Cost Calculator', fullLabel: '5-Yr True Cost to Own · Cost Calculator', icon: Calculator, desc: 'Depreciation, fuel, insurance & financing curves', path: '/tco' },
  { id: 'risk', label: 'Maintenance', fullLabel: 'Powertrain Risk Matrix · Maintenance Check', icon: ShieldAlert, desc: 'Component wear & thermodynamic failure risk', path: '/risk-matrix' },
  { id: 'obd', label: 'OBD-II Lookup', fullLabel: 'OBD-II Workshop Estimator · OBD2 Repair Estimator · OBD-II Lookup', icon: Cpu, desc: 'Fair workshop labor & parts pricing for DTCs', path: '/obd-estimator' },
  { id: 'guides', label: 'Guides', fullLabel: 'Buyer Guides & Insights', icon: BookOpen, desc: 'In-depth buyer protection & inspection guides', path: '/guides' },
];

export const SECONDARY_WORKSPACE_TABS = [
  { id: 'vehicles', label: 'Vehicle Catalog', fullLabel: 'All 35 Brands & 179 Benchmarked Models', icon: Car, desc: 'Browse all 35 brands & 179 vehicle models', path: '/vehicles' },
  { id: 'compare', label: 'Compare', fullLabel: 'Vehicle Comparator', icon: GitCompare, desc: '5-year TCO break-even graph and defect comparison', path: '/compare' },
  { id: 'checklist', label: 'PPI Checklist', fullLabel: 'Pre-Purchase Inspection Checklist', icon: CheckCircle2, desc: 'On-site inspection checklist & printable report', path: '/checklist' },
  { id: 'methodology', label: 'Methodology', fullLabel: 'Methodology & Data Sources', icon: BookOpen, desc: 'Mathematical models & data sources', path: '/methodology' },
  { id: 'reviews', label: 'Reviews', fullLabel: 'Driver Reviews', icon: MessageSquare, desc: 'Owner feedback & repair quote comparisons', path: '/reviews' },
  { id: 'about', label: 'About Us', fullLabel: 'About Us & Engineering Mission', icon: FileText, desc: 'Mission, engineering team & Imprint / Legal Disclosure', path: '/about' },
  { id: 'contact', label: 'Contact', fullLabel: 'Contact Engineering Team', icon: MessageSquare, desc: 'Direct support & inquiries', path: '/contact' },
  { id: 'blog', label: 'Blog', fullLabel: 'Practical Automotive Guides', icon: FileText, desc: 'Deep-dive reliability & buying guides', path: '/guides' },
];

export const WORKSPACE_TABS = [
  ...PRIMARY_WORKSPACE_TABS,
  ...SECONDARY_WORKSPACE_TABS,
];

const REGION_OPTIONS = [
  { id: 'US', label: 'US', fullLabel: 'US ($ · mi)', hint: '$ · mi · MPG' },
  { id: 'UK', label: 'UK', fullLabel: 'UK (£ · mi)', hint: '£ · mi · MPG' },
  { id: 'EU', label: 'EU', fullLabel: 'EU (€ · km)', hint: '€ · km · L/100km' },
];

function positionPopoverFallback(triggerId, popoverId) {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof document.getElementById !== 'function'
  ) {
    return;
  }
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('position-area', 'block-end')) {
    return;
  }
  const trigger = document.getElementById(triggerId);
  const popover = document.getElementById(popoverId);
  if (
    !trigger ||
    !popover ||
    typeof trigger.getBoundingClientRect !== 'function' ||
    typeof popover.getBoundingClientRect !== 'function'
  ) {
    return;
  }
  const tRect = trigger.getBoundingClientRect();
  const pRect = popover.getBoundingClientRect();
  const vw = window.innerWidth || 1024;
  const vh = window.innerHeight || 768;

  let top = tRect.bottom + 8;
  if (pRect.height > 0 && top + pRect.height > vh - 8 && tRect.top - pRect.height - 8 >= 8) {
    top = tRect.top - pRect.height - 8;
  }
  const width = pRect.width || 220;
  const left = Math.max(8, Math.min(tRect.right - width, vw - width - 8));

  popover.style.top = `${Math.round(top)}px`;
  popover.style.left = `${Math.round(left)}px`;
}

function safelyHidePopover(popoverId) {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  const el = document.getElementById(popoverId);
  if (el && typeof el.hidePopover === 'function') {
    try {
      el.hidePopover();
    } catch {
      // Ignore if popover is already closed or unmounted
    }
  }
}

export default function Navbar({
  activeTab,
  onSelectTab,
  selectedPresetId,
  hasSelectedVehicle = Boolean(selectedPresetId),
  onSelectPreset,
}) {
  const { region, setRegion, formatDistance, formatCurrency } = useUnits();
  const { theme, setTheme } = useTheme();
  const garage = useGarage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [garageDropdownOpen, setGarageDropdownOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [drawerVehicleExpanded, setDrawerVehicleExpanded] = useState(false);
  const [garageLinkCopied, setGarageLinkCopied] = useState(false);

  const garageCopiedTimeoutRef = useRef(null);
  const mobileDialogRef = useRef(null);

  // Conditionally load @oddbird/popover-polyfill ONLY when native Popover API is absent
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof HTMLElement !== 'undefined' &&
      !Object.hasOwn(HTMLElement.prototype, 'popover')
    ) {
      import('@oddbird/popover-polyfill').catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (garageCopiedTimeoutRef.current) {
        clearTimeout(garageCopiedTimeoutRef.current);
      }
    };
  }, []);

  // Wire native popover toggle listeners + getBoundingClientRect fallback when CSS Anchor Positioning is unsupported
  useEffect(() => {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') {
      return undefined;
    }
    const morePop = document.getElementById('navbar-more-popover');
    const garagePop = document.getElementById('navbar-garage-popover');

    const handleMoreToggle = (event) => {
      const isOpen = event?.newState === 'open';
      setMoreDropdownOpen(isOpen);
      if (isOpen) {
        positionPopoverFallback('navbar-more-trigger', 'navbar-more-popover');
      }
    };

    const handleGarageToggle = (event) => {
      const isOpen = event?.newState === 'open';
      setGarageDropdownOpen(isOpen);
      if (isOpen) {
        positionPopoverFallback('navbar-garage-trigger', 'navbar-garage-popover');
      }
    };

    if (morePop && typeof morePop.addEventListener === 'function') {
      morePop.addEventListener('toggle', handleMoreToggle);
    }
    if (garagePop && typeof garagePop.addEventListener === 'function') {
      garagePop.addEventListener('toggle', handleGarageToggle);
    }

    return () => {
      if (morePop && typeof morePop.removeEventListener === 'function') {
        morePop.removeEventListener('toggle', handleMoreToggle);
      }
      if (garagePop && typeof garagePop.removeEventListener === 'function') {
        garagePop.removeEventListener('toggle', handleGarageToggle);
      }
    };
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setMobileMenuOpen(false);
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const dlg = mobileDialogRef.current || document.getElementById('mobile-nav-drawer');
      if (dlg && typeof dlg.close === 'function' && dlg.open) {
        try {
          dlg.close();
        } catch {
          // Safe guard in mock DOM
        }
      }
    }
  }, []);

  const openMobileDrawer = useCallback(() => {
    setMobileMenuOpen(true);
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const dlg = mobileDialogRef.current || document.getElementById('mobile-nav-drawer');
      if (dlg && typeof dlg.showModal === 'function' && !dlg.open) {
        try {
          dlg.showModal();
        } catch {
          // Safe guard in mock DOM
        }
      }
    }
  }, []);

  // Close mobile drawer when activeTab changes
  useEffect(() => {
    closeMobileDrawer();
  }, [activeTab, closeMobileDrawer]);

  // Light-dismiss fallback for browsers lacking <dialog closedby="any">
  useEffect(() => {
    if (!mobileMenuOpen || typeof document === 'undefined' || typeof HTMLDialogElement === 'undefined') {
      return undefined;
    }
    if ('closedBy' in HTMLDialogElement.prototype) return undefined;

    const dlg = mobileDialogRef.current || document.getElementById('mobile-nav-drawer');
    if (!dlg || typeof dlg.addEventListener !== 'function') return undefined;

    const handleBackdropClick = (e) => {
      if (e.target === dlg) {
        closeMobileDrawer();
      }
    };
    dlg.addEventListener('click', handleBackdropClick);
    return () => {
      if (typeof dlg.removeEventListener === 'function') {
        dlg.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [mobileMenuOpen, closeMobileDrawer]);

  const handleCopyShareableGarageLink = async () => {
    try {
      const url =
        typeof garage?.getShareableGarageUrl === 'function'
          ? garage.getShareableGarageUrl()
          : typeof window !== 'undefined'
            ? window.location.href
            : 'https://mydriveledger.com/';

      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== 'undefined') {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch {
      // Ignore clipboard errors in mock DOM
    }

    setGarageLinkCopied(true);
    if (garageCopiedTimeoutRef.current) {
      clearTimeout(garageCopiedTimeoutRef.current);
    }
    garageCopiedTimeoutRef.current = setTimeout(() => {
      setGarageLinkCopied(false);
    }, 2000);
  };

  const isVehicleSelected = Boolean(hasSelectedVehicle && selectedPresetId);
  const activePreset = useMemo(
    () => (isVehicleSelected ? getPresetById(selectedPresetId) : null),
    [isVehicleSelected, selectedPresetId]
  );

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
  const isSecondaryActive = SECONDARY_WORKSPACE_TABS.some((t) => t.id === activeTab && t.id !== 'blog');
  const activeSecondaryTab = SECONDARY_WORKSPACE_TABS.find((t) => t.id === activeTab && t.id !== 'blog');
  const isNativePopoverEnv = typeof HTMLElement !== 'undefined';

  return (
    <header className="sticky top-0 left-0 right-0 z-40 w-full max-w-full border-b border-border/90 bg-canvas/95 backdrop-blur-md dark:bg-[#09090B]/95 dark:border-zinc-800/90 transition-colors safe-area-x">
      {/* Strictly Single-Row Header: 56px (h-14) on mobile, 64px (h-16) on desktop (< 12% viewport height) */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-14 lg:h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Brand Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="min-h-[44px] inline-flex items-center text-ink dark:text-zinc-50 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-lg"
          aria-label="DriveLedger home"
        >
          <BrandLogo
            size="md"
            wordmarkClassName="hidden min-[340px]:inline-flex"
          />
        </a>

        {/* Single Semantic <nav> Landmark */}
        <nav aria-label="Primary" className="flex items-center gap-1 min-w-0">
          <ul className="hidden lg:flex items-center gap-0.5 whitespace-nowrap">
            {PRIMARY_WORKSPACE_TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <li key={t.id}>
                  <a
                    id={`tab-${t.id}`}
                    href={t.path || `/${t.id}`}
                    data-path={t.path || `/${t.id}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectTab(t.id);
                      setMoreDropdownOpen(false);
                      safelyHidePopover('navbar-more-popover');
                    }}
                    className="dl-nav-link whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    <span>{t.label}</span>
                    <span className="sr-only"> ({t.fullLabel})</span>
                  </a>
                </li>
              );
            })}

            {/* Secondary Pages Native Popover ("More") */}
            <li id="more-dropdown-container" className="relative ml-0.5">
              <button
                type="button"
                id="navbar-more-trigger"
                data-testid="navbar-more-button"
                popovertarget="navbar-more-popover"
                aria-controls="navbar-more-popover"
                aria-expanded={moreDropdownOpen}
                onClick={() => {
                  if (!isNativePopoverEnv) {
                    setMoreDropdownOpen((prev) => !prev);
                  }
                }}
                className={`dl-nav-link gap-1 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
                  isSecondaryActive
                    ? 'text-[#183D22] dark:text-emerald-300 font-semibold after:content-[""] after:absolute after:inset-x-2 after:bottom-0 after:border-b-[2.5px] after:border-[#183D22] dark:after:border-emerald-400'
                    : ''
                }`}
              >
                <span>{activeSecondaryTab ? activeSecondaryTab.label : 'More'}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${moreDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                id="navbar-more-popover"
                popover="auto"
                aria-label="More pages and guides"
                className="dl-nav-popover w-52 p-1.5"
              >
                <div className="flex flex-col gap-0.5">
                  {SECONDARY_WORKSPACE_TABS.map((t) => {
                    const active = t.id === activeTab && t.id !== 'blog';
                    const IconComp = t.icon;
                    const isLegacyBlogAlias = t.id === 'blog';
                    return (
                      <button
                        key={t.id}
                        id={`tab-${t.id}`}
                        type="button"
                        data-path={t.path || `/${t.id}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => {
                          onSelectTab(t.id);
                          setMoreDropdownOpen(false);
                          safelyHidePopover('navbar-more-popover');
                        }}
                        className={
                          isLegacyBlogAlias
                            ? 'sr-only'
                            : `w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 rounded-lg font-sans text-xs font-medium text-left transition-colors duration-150 ${
                                active
                                  ? 'bg-emerald-50/90 text-[#183D22] font-semibold border-l-2 border-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-400'
                                  : 'text-body hover:text-ink hover:bg-surface-subtle dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80'
                              }`
                        }
                      >
                        {IconComp && !isLegacyBlogAlias && (
                          <IconComp aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-muted dark:text-zinc-500" />
                        )}
                        <span>{t.label}</span>
                        <span className="sr-only"> ({t.fullLabel})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          </ul>
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Compact Region Switcher (US · UK · EU) */}
          <div
            role="radiogroup"
            aria-label="Units and currency"
            className="hidden lg:inline-flex items-center rounded-lg border border-border/80 bg-surface p-0.5 dark:bg-zinc-900 dark:border-zinc-800"
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
                  className={`min-h-[28px] px-2.5 py-0.5 rounded-md font-sans text-[11px] font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#183D22] text-white dark:bg-emerald-600'
                      : 'text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{r.label}</span>
                  <span className="sr-only"> ({r.fullLabel})</span>
                </button>
              );
            })}
          </div>

          {/* Garage & Compare Native Popover */}
          <div id="garage-dropdown-container" className="relative shrink-0">
            <button
              type="button"
              id="navbar-garage-trigger"
              popovertarget="navbar-garage-popover"
              aria-controls="navbar-garage-popover"
              aria-expanded={garageDropdownOpen}
              onClick={() => {
                if (!isNativePopoverEnv) {
                  setGarageDropdownOpen((prev) => !prev);
                }
              }}
              className={`min-h-[44px] lg:min-h-[34px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 lg:py-1 rounded-lg border font-sans text-xs font-medium transition-colors duration-150 ${
                activeTab === 'compare'
                  ? 'border-emerald-300 bg-emerald-50 text-[#183D22] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'border-border/90 bg-surface text-ink hover:bg-surface-subtle dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <GitCompare aria-hidden="true" className="w-3.5 h-3.5 text-[#183D22] dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-sans text-xs">Garage</span>
              <span className="sr-only">Garage &amp; Compare</span>
              <span
                data-testid="garage-count-badge"
                className="inline-flex items-center justify-center min-w-[18px] min-h-[18px] px-1 rounded-md text-[10px] font-mono tabular-nums font-bold bg-[#183D22] text-white dark:bg-emerald-600"
              >
                {savedVehicles.length}
              </span>
            </button>

            <div
              id="navbar-garage-popover"
              popover="auto"
              aria-label="Garage and Vehicle Comparator"
              className="dl-nav-popover w-80 sm:w-96 p-4 whitespace-normal"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/80 dark:border-zinc-800">
                <div>
                  <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-50 block">
                    Garage &amp; Compare (<span className="font-mono tabular-nums">{savedVehicles.length}</span>)
                  </span>
                  <span className="font-sans text-[11px] text-muted dark:text-zinc-400">
                    Saved vehicles &amp; side-by-side comparison
                  </span>
                </div>
                {isVehicleSelected && activePreset && garage?.saveVehicleToGarage && (
                  <button
                    type="button"
                    onClick={() => {
                      garage.saveVehicleToGarage({
                        presetId: activePreset.id,
                        name: activePreset.name,
                        odometerMiles: activePreset.defaultOdometerMiles,
                        purchasePriceUsd: activePreset.purchasePriceUsd,
                      });
                    }}
                    className="min-h-[32px] px-2 text-xs font-sans font-semibold text-[#183D22] dark:text-emerald-400 hover:underline shrink-0"
                  >
                    + Save Active
                  </button>
                )}
              </div>

              <div className="py-3 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('compare');
                    setGarageDropdownOpen(false);
                    safelyHidePopover('navbar-garage-popover');
                  }}
                  className="w-full min-h-[40px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#183D22] hover:bg-[#122E19] text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 font-sans text-xs font-semibold transition-colors"
                >
                  <GitCompare aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>Open Side-by-Side Comparator</span>
                </button>

                <button
                  type="button"
                  data-testid="copy-shareable-garage-link-button"
                  onClick={handleCopyShareableGarageLink}
                  className="w-full min-h-[40px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle hover:bg-surface dark:bg-zinc-900 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-sans text-xs font-medium transition-colors"
                >
                  {garageLinkCopied ? (
                    <>
                      <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                      <span>Copy Shareable Garage Link</span>
                    </>
                  )}
                </button>
              </div>

              {savedVehicles.length === 0 ? (
                <div className="pt-3 text-center space-y-1 border-t border-border/80 dark:border-zinc-800">
                  <p className="font-sans text-xs font-medium text-ink dark:text-zinc-200">
                    No saved vehicles in your garage
                  </p>
                  <p className="font-sans text-[11px] text-muted dark:text-zinc-400">
                    Save any vehicle from the calculators to bookmark and compare specs.
                  </p>
                </div>
              ) : (
                <div className="border-t border-border/80 dark:border-zinc-800 pt-2.5">
                  <ul className="divide-y divide-border/70 dark:divide-zinc-800 max-h-60 overflow-y-auto">
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
                          className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPreset) {
                                onSelectPreset(v.presetId);
                              }
                              setGarageDropdownOpen(false);
                              safelyHidePopover('navbar-garage-popover');
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-50 truncate">
                                {v.name}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 px-1.5 py-0.5 text-[10px] font-sans font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-sans text-muted dark:text-zinc-400">
                              <span className="font-mono tabular-nums">
                                {formatDistance ? formatDistance(v.odometerMiles || 58000) : `${v.odometerMiles || 58000} mi`}
                              </span>
                              <span>·</span>
                              <span className="text-[#183D22] dark:text-emerald-400 font-medium">
                                <span className="font-mono tabular-nums">{totalDone}</span> services
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${v.name} from garage`}
                            onClick={() => garage?.removeVehicleFromGarage?.(v.presetId)}
                            className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <X aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Single-Icon Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hidden lg:inline-flex min-w-[34px] min-h-[34px] items-center justify-center rounded-lg border border-border/90 bg-surface text-muted hover:text-ink hover:bg-surface-subtle dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun aria-hidden="true" className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon aria-hidden="true" className="w-4 h-4" />
            )}
          </button>

          {/* Mobile & Tablet (< 1024px) Menu Trigger (>= 44x44px touch target) */}
          <button
            type="button"
            data-testid="navbar-mobile-menu-toggle"
            onClick={() => (mobileMenuOpen ? closeMobileDrawer() : openMobileDrawer())}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 text-ink dark:text-zinc-200 rounded-lg border border-border/90 dark:border-zinc-800 bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 shrink-0 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" className="w-5 h-5" />
            ) : (
              <Menu aria-hidden="true" className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Native <dialog> Mobile Drawer (no role="dialog", no aria-modal, no body overflow lock) */}
      <dialog
        ref={mobileDialogRef}
        id="mobile-nav-drawer"
        closedby="any"
        aria-label="Mobile navigation menu"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeMobileDrawer();
          }
        }}
        className="dl-drawer-dialog lg:hidden"
      >
        <div className="ml-auto w-[min(23rem,88dvw)] h-[100dvh] bg-surface dark:bg-[#121215] border-l border-border dark:border-zinc-800 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between shadow-xl safe-area-bottom">
          <div className="space-y-5">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-zinc-800">
              <BrandLogo size="sm" />
              <button
                type="button"
                data-testid="mobile-drawer-close"
                onClick={closeMobileDrawer}
                aria-label="Close navigation menu"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 hover:bg-canvas dark:hover:bg-zinc-800 shrink-0 transition-colors"
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-Jump Calculators Strip */}
            <div className="space-y-2">
              <span className="text-xs font-sans font-semibold text-muted dark:text-zinc-400 block">
                Calculators
              </span>
              <div
                data-testid="navbar-mobile-quick-tabs"
                className="flex flex-col gap-1"
              >
                {PRIMARY_WORKSPACE_TABS.map((t) => {
                  const IconComp = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={`mobile-quick-${t.id}`}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        onSelectTab(t.id);
                        closeMobileDrawer();
                      }}
                      className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl font-sans text-sm text-left transition-colors duration-150 ${
                        active
                          ? 'bg-emerald-50/90 text-[#183D22] font-semibold border-l-[3px] border-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-400'
                          : 'text-body dark:text-zinc-300 hover:bg-surface-subtle dark:hover:bg-zinc-900 font-medium'
                      }`}
                    >
                      {IconComp && <IconComp aria-hidden="true" className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400" />}
                      <span className="truncate">{t.label}</span>
                      <span className="sr-only"> ({t.fullLabel})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Vehicle Context Switcher */}
            <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400 block">
                    Active Vehicle
                  </span>
                  <span
                    className={`text-sm font-sans truncate block mt-0.5 ${
                      isVehicleSelected && activePreset
                        ? 'font-semibold text-ink dark:text-zinc-50'
                        : 'text-muted dark:text-zinc-400'
                    }`}
                  >
                    {isVehicleSelected && activePreset ? activePreset.name : 'No vehicle selected'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerVehicleExpanded((prev) => !prev)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border dark:border-zinc-800 text-xs font-sans font-semibold text-[#183D22] dark:text-emerald-300 shrink-0"
                >
                  {drawerVehicleExpanded ? 'Done' : isVehicleSelected ? 'Switch Car' : 'Select Car'}
                </button>
              </div>

              {drawerVehicleExpanded && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={vehicleSearchQuery}
                    onChange={(e) => setVehicleSearchQuery(e.target.value)}
                    placeholder="Filter models (e.g. Golf, Camry, Model 3)..."
                    aria-label="Filter vehicle models"
                    className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-700 bg-canvas dark:bg-zinc-900 px-3 text-base font-sans text-ink dark:text-zinc-100 outline-none focus:border-primary-600"
                  />
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/60 dark:divide-zinc-800/80">
                    {filteredNavbarPresets.map((p) => (
                      <button
                        key={`drawer-preset-${p.id}`}
                        type="button"
                        onClick={() => {
                          if (onSelectPreset) onSelectPreset(p.id);
                          setDrawerVehicleExpanded(false);
                          closeMobileDrawer();
                        }}
                        className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-sans ${
                          p.id === selectedPresetId
                            ? 'bg-emerald-50/80 text-[#183D22] font-semibold dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg'
                            : 'text-ink dark:text-zinc-200 hover:bg-surface-subtle dark:hover:bg-zinc-900'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="font-mono tabular-nums text-[11px] text-muted dark:text-zinc-400 shrink-0">
                          {formatCurrency ? formatCurrency(p.purchasePriceUsd) : `$${p.purchasePriceUsd}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Directory & Resources */}
            <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-1.5">
              <span className="text-xs font-sans font-semibold text-muted dark:text-zinc-400 block mb-1">
                Directory &amp; Resources
              </span>
              <div className="flex flex-col gap-0.5">
                {SECONDARY_WORKSPACE_TABS.filter((t) => t.id !== 'blog').map((t) => {
                  const IconComp = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <a
                      key={`drawer-sec-${t.id}`}
                      href={t.path || `/${t.id}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectTab(t.id);
                        closeMobileDrawer();
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl font-sans text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-emerald-50/90 text-[#183D22] font-semibold border-l-[3px] border-[#183D22] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-400'
                          : 'text-body dark:text-zinc-300 hover:bg-surface-subtle dark:hover:bg-zinc-900 font-medium'
                      }`}
                    >
                      {IconComp && <IconComp aria-hidden="true" className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400" />}
                      <span>{t.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Region & Theme Preferences */}
            <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-sans font-semibold text-muted dark:text-zinc-400 block">
                  Region &amp; Units
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
                          : 'bg-surface-subtle dark:bg-zinc-900 border-border dark:border-zinc-800 text-ink dark:text-zinc-300'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className={`text-[10px] font-normal ${region === r.id ? 'text-emerald-100' : 'text-muted dark:text-zinc-400'}`}>
                        {r.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-semibold border transition-colors ${
                    theme === 'light'
                      ? 'bg-canvas border-border-strong text-ink dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'
                      : 'bg-surface-subtle dark:bg-zinc-900 border-border dark:border-zinc-800 text-muted dark:text-zinc-400'
                  }`}
                >
                  <Sun aria-hidden="true" className="w-4 h-4 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-semibold border transition-colors ${
                    theme === 'dark'
                      ? 'bg-zinc-800 border-emerald-500/60 text-emerald-400'
                      : 'bg-surface-subtle dark:bg-zinc-900 border-border dark:border-zinc-800 text-muted dark:text-zinc-400'
                  }`}
                >
                  <Moon aria-hidden="true" className="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Garage Quick Actions */}
            <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-sans font-semibold text-ink dark:text-zinc-100">
                  Garage &amp; Compare (<span className="font-mono tabular-nums">{savedVehicles.length}</span> saved)
                </span>
                {isVehicleSelected && activePreset && garage?.saveVehicleToGarage && (
                  <button
                    type="button"
                    onClick={() => {
                      garage.saveVehicleToGarage({
                        presetId: activePreset.id,
                        name: activePreset.name,
                        odometerMiles: activePreset.defaultOdometerMiles,
                        purchasePriceUsd: activePreset.purchasePriceUsd,
                      });
                    }}
                    className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#183D22] dark:bg-emerald-600 text-white text-xs font-sans font-semibold shrink-0"
                  >
                    + Save Car
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('compare');
                  closeMobileDrawer();
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-100 text-xs font-sans font-semibold"
              >
                <GitCompare aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Open Side-by-Side Comparator</span>
              </button>
              <button
                type="button"
                data-testid="copy-shareable-garage-link-button-mobile"
                onClick={handleCopyShareableGarageLink}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border dark:border-zinc-800 bg-surface dark:bg-zinc-900/60 text-body dark:text-zinc-200 text-xs font-sans font-medium"
              >
                {garageLinkCopied ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                    <span>Copy Shareable Garage Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
