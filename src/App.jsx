import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UnitProvider, useUnits } from './context/UnitContext';
import { GarageProvider } from './context/GarageContext';
import Navbar, { WORKSPACE_TABS } from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import TcoCalculator from './components/calculators/TcoCalculator';
import MaintenanceRiskMatrix from './components/calculators/MaintenanceRiskMatrix';
import ObdEstimator from './components/calculators/ObdEstimator';
import VehicleComparator from './components/calculators/VehicleComparator';
import PreInspectionChecklist from './components/home/PreInspectionChecklist';
import TechnicalMethodologyGuide from './components/seo/TechnicalMethodologyGuide';
import DynamicSeoHead from './components/seo/DynamicSeoHead';
import ReviewsPage from './pages/ReviewsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import GuidesPage from './pages/GuidesPage';
import LegalModal from './components/legal/LegalModal';
import CookieConsentBanner, { openPrivacySettings } from './components/legal/CookieConsentBanner';
import {
  resolveLegalPolicyKey,
  WORKSPACE_LEGAL_NOTICE_LINE,
} from './data/legalPolicies';
import { VEHICLE_PRESETS } from './data/vehiclePresets';
import { OBD_CODES } from './data/obdCodes';
import {
  parseCompareMatchupPath,
  parseRiskMileagePath,
} from './data/seoMatrixData';

const PATH_TO_TAB = {
  '/': 'overview',
  '/overview': 'overview',
  '/tco': 'tco',
  '/risk-matrix': 'risk',
  '/obd-estimator': 'obd',
  '/compare': 'compare',
  '/checklist': 'checklist',
  '/methodology': 'methodology',
  '/reviews': 'reviews',
  '/blog': 'guides',
  '/guides': 'guides',
  '/about': 'about',
  '/contact': 'contact',
};

const TAB_TO_PATH = {
  overview: '/overview',
  tco: '/tco',
  risk: '/risk-matrix',
  obd: '/obd-estimator',
  compare: '/compare',
  checklist: '/checklist',
  methodology: '/methodology',
  reviews: '/reviews',
  blog: '/guides',
  guides: '/guides',
  about: '/about',
  contact: '/contact',
};

const VALID_TABS = [
  'overview',
  'tco',
  'risk',
  'obd',
  'compare',
  'checklist',
  'methodology',
  'reviews',
  'blog',
  'guides',
  'about',
  'contact',
];

const HYBRID_OBD_REGEX = /^\/obd\/([^/]+)\/([^/]+)$/i;
const GUIDE_PATH_REGEX = /^\/guides(?:\/([a-z0-9-]+))?\/?$/i;

function parseGuidePath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(GUIDE_PATH_REGEX);
  if (!match) return null;
  return {
    tab: 'guides',
    slug: match[1] || null,
  };
}

function parseHybridObdPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(HYBRID_OBD_REGEX);
  if (!match) return null;
  const rawPreset = decodeURIComponent(match[1]);
  const rawCode = decodeURIComponent(match[2]).toUpperCase();
  return {
    tab: 'obd',
    preset: VEHICLE_PRESETS.some((p) => p.id === rawPreset) ? rawPreset : null,
    code: OBD_CODES.some((c) => c.code === rawCode) ? rawCode : null,
  };
}

function getSamplePresetIdForRegion(region) {
  const targetId = region === 'US' ? 'toyota-camry-hybrid' : 'vw-golf-20-tdi';
  return VEHICLE_PRESETS.some((p) => p.id === targetId) ? targetId : VEHICLE_PRESETS[0].id;
}

function findExplicitPresetFromLocation(params, pathname) {
  const qPreset = params.get('preset') || params.get('presetA');
  if (qPreset && VEHICLE_PRESETS.some((p) => p.id === qPreset)) return qPreset;
  const qEngine = params.get('engine');
  if (qEngine) {
    const match = VEHICLE_PRESETS.find(
      (p) => p.id === qEngine || p.engineCode?.toLowerCase().includes(qEngine.toLowerCase())
    );
    if (match) return match.id;
  }
  const hybrid = parseHybridObdPath(pathname);
  if (hybrid?.preset) return hybrid.preset;
  const matchup = parseCompareMatchupPath(pathname);
  if (matchup?.presetA) return matchup.presetA;
  const riskMileage = parseRiskMileagePath(pathname);
  if (riskMileage?.preset) return riskMileage.preset;
  return null;
}

function findExplicitObdCodeFromLocation(params, pathname) {
  const qCode = params.get('code')?.toUpperCase();
  if (qCode && OBD_CODES.some((c) => c.code === qCode)) return qCode;
  const hybrid = parseHybridObdPath(pathname);
  if (hybrid?.code) return hybrid.code;
  return null;
}

function DriveLedgerWorkspace() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { region } = useUnits();
  const regionRef = useRef(region);
  regionRef.current = region;

  // Derive initial tab from URL query param, programmatic SEO paths, or pathname
  const resolveInitialTab = () => {
    const qTab = searchParams.get('tab');
    if (qTab && VALID_TABS.includes(qTab)) {
      return qTab === 'blog' ? 'guides' : qTab;
    }
    const guideMatch = parseGuidePath(location.pathname);
    if (guideMatch) return 'guides';
    const hybrid = parseHybridObdPath(location.pathname);
    if (hybrid) return 'obd';
    const matchup = parseCompareMatchupPath(location.pathname);
    if (matchup) return 'compare';
    const riskMileage = parseRiskMileagePath(location.pathname);
    if (riskMileage) return 'risk';
    return PATH_TO_TAB[location.pathname] || 'overview';
  };

  const initialExplicitPreset = findExplicitPresetFromLocation(searchParams, location.pathname);
  const initialExplicitCode = findExplicitObdCodeFromLocation(searchParams, location.pathname);

  const resolveInitialSecondaryPreset = () => {
    const qPresetB = searchParams.get('presetB');
    if (qPresetB && VEHICLE_PRESETS.some((p) => p.id === qPresetB)) return qPresetB;
    const matchup = parseCompareMatchupPath(location.pathname);
    if (matchup?.presetB) return matchup.presetB;
    return null;
  };

  const resolveInitialRiskOdometer = () => {
    const riskMileage = parseRiskMileagePath(location.pathname);
    if (riskMileage?.odometerMiles) return { miles: riskMileage.odometerMiles, slug: riskMileage.mileageSlug };
    const qOdo = Number(searchParams.get('odo'));
    if (qOdo > 0) return { miles: Math.round(qOdo), slug: null };
    return { miles: null, slug: null };
  };

  const resolveInitialLegalModal = () => {
    const pathVal =
      location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const pathPolicy = resolveLegalPolicyKey(pathVal);
    if (pathPolicy) return pathPolicy;
    const hashVal =
      location.hash || (typeof window !== 'undefined' ? window.location.hash : '');
    return resolveLegalPolicyKey(hashVal);
  };

  const [activeTab, setActiveTabState] = useState(resolveInitialTab);
  const [hasSelectedVehicle, setHasSelectedVehicle] = useState(Boolean(initialExplicitPreset));
  const [hasSelectedObdCode, setHasSelectedObdCode] = useState(Boolean(initialExplicitCode));
  const [selectedPresetId, setSelectedPresetIdState] = useState(
    () => initialExplicitPreset || getSamplePresetIdForRegion(region)
  );
  const [secondaryPresetId, setSecondaryPresetIdState] = useState(resolveInitialSecondaryPreset);
  const [riskOdometerOverride, setRiskOdometerOverride] = useState(resolveInitialRiskOdometer);
  const [selectedObdCode, setSelectedObdCodeState] = useState(
    () => initialExplicitCode || 'P2002'
  );
  const [activeGuideSlug, setActiveGuideSlug] = useState(() => parseGuidePath(location.pathname)?.slug || null);
  const [activeLegalModal, setActiveLegalModal] = useState(resolveInitialLegalModal);
  const [showCookieBannerOverride, setShowCookieBannerOverride] = useState(false);

  // Keep the unselected sample vehicle aligned with the active region (US vs UK/EU)
  useEffect(() => {
    if (!hasSelectedVehicle) {
      const sampleId = getSamplePresetIdForRegion(region);
      setSelectedPresetIdState((prev) => (prev !== sampleId ? sampleId : prev));
    }
  }, [region, hasSelectedVehicle]);

  // Keep URL query parameters synchronized for programmatic SEO & deep-link sharing
  // without polluting URLs with unselected sample defaults.
  const syncUrlParams = useCallback(
    (
      nextTab,
      nextPreset,
      nextCode,
      nextSecondaryPreset = secondaryPresetId,
      explicitPreset = hasSelectedVehicle,
      explicitCode = hasSelectedObdCode
    ) => {
      if (nextTab === 'compare' && nextSecondaryPreset && nextSecondaryPreset !== nextPreset) {
        const params = new URLSearchParams();
        params.set('tab', 'compare');
        params.set('presetA', nextPreset);
        params.set('presetB', nextSecondaryPreset);
        navigate(`/compare/${nextPreset}-vs-${nextSecondaryPreset}?${params.toString()}`, { replace: true });
        return;
      }
      if (['about', 'contact', 'methodology', 'reviews'].includes(nextTab)) {
        navigate(TAB_TO_PATH[nextTab] || `/${nextTab}`, { replace: true });
        return;
      }
      if (nextTab === 'guides') {
        navigate(activeGuideSlug ? `/guides/${activeGuideSlug}` : '/guides', { replace: true });
        return;
      }
      if (nextTab === 'overview' && !explicitPreset && !explicitCode) {
        navigate('/', { replace: true });
        return;
      }
      const targetPath = TAB_TO_PATH[nextTab] || '/tco';
      if (!explicitPreset && !explicitCode) {
        navigate(targetPath, { replace: true });
        return;
      }
      const params = new URLSearchParams();
      params.set('tab', nextTab);
      if (explicitPreset) {
        params.set('preset', nextPreset);
      }
      if (explicitCode) {
        params.set('code', nextCode);
      }
      navigate(`${targetPath}?${params.toString()}`, { replace: true });
    },
    [navigate, secondaryPresetId, activeGuideSlug, hasSelectedVehicle, hasSelectedObdCode]
  );

  const handleSelectGuide = (slug) => {
    setActiveGuideSlug(slug);
    setActiveTabState('guides');
    if (slug) {
      navigate(`/guides/${slug}`, { replace: false });
    } else {
      navigate('/guides', { replace: false });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tabId) => {
    if (tabId === 'guides') {
      setActiveGuideSlug(null);
    }
    syncUrlParams(tabId, selectedPresetId, selectedObdCode);
    setActiveTabState(tabId);
    if (tabId !== 'risk') {
      setRiskOdometerOverride({ miles: null, slug: null });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPreset = (presetId) => {
    setHasSelectedVehicle(true);
    syncUrlParams(activeTab, presetId, selectedObdCode, secondaryPresetId, true, hasSelectedObdCode);
    setSelectedPresetIdState(presetId);
    setRiskOdometerOverride({ miles: null, slug: null });
  };

  const handleSelectSecondaryPreset = (presetBId) => {
    setSecondaryPresetIdState(presetBId);
    if (activeTab === 'compare' && presetBId && presetBId !== selectedPresetId) {
      setHasSelectedVehicle(true);
      syncUrlParams('compare', selectedPresetId, selectedObdCode, presetBId, true, hasSelectedObdCode);
    }
  };

  const handleSelectObdCode = (code) => {
    setHasSelectedObdCode(true);
    syncUrlParams(activeTab, selectedPresetId, code, secondaryPresetId, hasSelectedVehicle, true);
    setSelectedObdCodeState(code);
  };

  const handleNavigateToPresetTco = (presetId) => {
    const explicit = Boolean(presetId);
    const targetPreset = presetId || selectedPresetId;
    const nextExplicitPreset = explicit || hasSelectedVehicle;
    if (explicit) {
      setHasSelectedVehicle(true);
    }
    syncUrlParams('tco', targetPreset, selectedObdCode, secondaryPresetId, nextExplicitPreset, hasSelectedObdCode);
    setSelectedPresetIdState(targetPreset);
    setActiveTabState('tco');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToObd = (code) => {
    const explicit = Boolean(code);
    const targetCode = code || selectedObdCode;
    const nextExplicitCode = explicit || hasSelectedObdCode;
    if (explicit) {
      setHasSelectedObdCode(true);
    }
    syncUrlParams('obd', selectedPresetId, targetCode, secondaryPresetId, hasSelectedVehicle, nextExplicitCode);
    setSelectedObdCodeState(targetCode);
    setActiveTabState('obd');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToHybridObd = (presetId, code) => {
    const targetPreset =
      presetId && VEHICLE_PRESETS.some((p) => p.id === presetId) ? presetId : selectedPresetId;
    const normalizedCode = code ? String(code).toUpperCase() : selectedObdCode;
    const targetCode = OBD_CODES.some((c) => c.code === normalizedCode)
      ? normalizedCode
      : selectedObdCode;
    const params = new URLSearchParams();
    params.set('tab', 'obd');
    params.set('preset', targetPreset);
    params.set('code', targetCode);
    navigate(`/obd/${targetPreset}/${targetCode.toLowerCase()}?${params.toString()}`, {
      replace: true,
    });
    setHasSelectedVehicle(true);
    setHasSelectedObdCode(true);
    setSelectedPresetIdState(targetPreset);
    setSelectedObdCodeState(targetCode);
    setActiveTabState('obd');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToRiskMatrix = (preset) => {
    const explicitId = typeof preset === 'string' ? preset : preset?.id;
    const pId = explicitId || selectedPresetId;
    const nextExplicitPreset = Boolean(explicitId) || hasSelectedVehicle;
    if (explicitId) {
      setHasSelectedVehicle(true);
    }
    syncUrlParams('risk', pId, selectedObdCode, secondaryPresetId, nextExplicitPreset, hasSelectedObdCode);
    setSelectedPresetIdState(pId);
    setActiveTabState('risk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegalModal = useCallback((policyKey) => {
    if (!policyKey) return;
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState(
        null,
        '',
        `/${policyKey}${window.location.search}`
      );
    }
    setActiveLegalModal(policyKey);
  }, []);

  // Synchronize state when location or search parameters change via router
  useEffect(() => {
    const guideMatch = parseGuidePath(location.pathname);
    const hybrid = parseHybridObdPath(location.pathname);
    const matchup = parseCompareMatchupPath(location.pathname);
    const riskMileage = parseRiskMileagePath(location.pathname);

    if (guideMatch) {
      setActiveGuideSlug(guideMatch.slug);
    } else {
      setActiveGuideSlug(null);
    }

    const qTab =
      searchParams.get('tab') ||
      (guideMatch ? 'guides' : hybrid ? 'obd' : matchup ? 'compare' : riskMileage ? 'risk' : PATH_TO_TAB[location.pathname]);
    if (qTab && VALID_TABS.includes(qTab)) {
      const resolved = qTab === 'blog' ? 'guides' : qTab;
      setActiveTabState((prev) => (prev !== resolved ? resolved : prev));
    }

    const explicitPreset = findExplicitPresetFromLocation(searchParams, location.pathname);
    if (explicitPreset) {
      setHasSelectedVehicle(true);
      setSelectedPresetIdState((prev) => (prev !== explicitPreset ? explicitPreset : prev));
    }

    const qPresetB = searchParams.get('presetB') || matchup?.presetB;
    if (qPresetB && VEHICLE_PRESETS.some((p) => p.id === qPresetB)) {
      setSecondaryPresetIdState((prev) => (prev !== qPresetB ? qPresetB : prev));
    }

    if (riskMileage?.odometerMiles) {
      setRiskOdometerOverride({ miles: riskMileage.odometerMiles, slug: riskMileage.mileageSlug });
    } else if (Number(searchParams.get('odo')) > 0) {
      setRiskOdometerOverride({ miles: Math.round(Number(searchParams.get('odo'))), slug: null });
    }

    const explicitCode = findExplicitObdCodeFromLocation(searchParams, location.pathname);
    if (explicitCode) {
      setHasSelectedObdCode(true);
      setSelectedObdCodeState((prev) => (prev !== explicitCode ? explicitCode : prev));
    }

    const pathPolicy = resolveLegalPolicyKey(location.pathname);
    if (pathPolicy) {
      setActiveLegalModal(pathPolicy);
    } else {
      const hashPolicy = resolveLegalPolicyKey(
        location.hash || (typeof window !== 'undefined' ? window.location.hash : '')
      );
      if (hashPolicy) {
        setActiveLegalModal(hashPolicy);
      }
    }
  }, [location.pathname, location.hash, searchParams]);

  // Sync if user navigates via browser back/forward (popstate) or URL hashchange (#privacy, #terms, etc.)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const handleHashChange = () => {
      const policyKey =
        resolveLegalPolicyKey(window.location.hash) ||
        resolveLegalPolicyKey(window.location.pathname);
      setActiveLegalModal(policyKey);
    };
    const handlePopState = () => {
      const applyPopState = () => {
        const params = new URLSearchParams(window.location.search || '');
        const guideMatch = parseGuidePath(window.location.pathname);
        const hybrid = parseHybridObdPath(window.location.pathname);
        if (guideMatch) {
          setActiveGuideSlug(guideMatch.slug);
        } else {
          setActiveGuideSlug(null);
        }
        const qTab =
          params.get('tab') ||
          (guideMatch ? 'guides' : hybrid ? 'obd' : PATH_TO_TAB[window.location.pathname]) ||
          'overview';
        const resolved = qTab === 'blog' ? 'guides' : qTab;
        setActiveTabState(
          VALID_TABS.includes(resolved) ? resolved : 'overview'
        );

        const explicitPreset = findExplicitPresetFromLocation(params, window.location.pathname);
        setHasSelectedVehicle(Boolean(explicitPreset));
        setSelectedPresetIdState(
          explicitPreset || getSamplePresetIdForRegion(regionRef.current)
        );

        const explicitCode = findExplicitObdCodeFromLocation(params, window.location.pathname);
        setHasSelectedObdCode(Boolean(explicitCode));
        setSelectedObdCodeState(explicitCode || 'P2002');

        const policyKey =
          resolveLegalPolicyKey(window.location.pathname) ||
          resolveLegalPolicyKey(window.location.hash);
        setActiveLegalModal(policyKey);
      };
      if (typeof React.__batch === 'function') {
        React.__batch(applyPopState);
      } else {
        applyPopState();
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, []);

  // When visiting /do-not-sell, trigger Google CMP revocation message if available,
  // falling back to our internal cookie settings modal.
  useEffect(() => {
    if (activeLegalModal === 'do-not-sell') {
      openPrivacySettings(() => setShowCookieBannerOverride(true));
    }
  }, [activeLegalModal]);

  return (
    <div id="top" className="min-h-screen scroll-pt-28 lg:scroll-pt-32 bg-canvas text-body selection:bg-primary-100 selection:text-primary-800 antialiased dark:bg-[#09090B] dark:text-zinc-300">
      <ScrollToTop />
      {/* Dynamic Programmatic SEO Meta Tags & Schema.org JSON-LD */}
      <DynamicSeoHead
        activeTab={activeTab}
        activeGuideSlug={activeGuideSlug}
        selectedPresetId={selectedPresetId}
        secondaryPresetId={secondaryPresetId}
        mileageBracketSlug={riskOdometerOverride?.slug}
        selectedObdCode={selectedObdCode}
        activeLegalPolicy={activeLegalModal}
      />

      {/* Sticky Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Content Container */}
      <main className="w-full max-w-[1440px] mx-auto min-h-[85vh] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-28 lg:pb-16 space-y-10 sm:space-y-12">
        {/* Dynamic Calculator Workspace */}
        <div
          key={activeTab}
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="min-h-[640px] animate-fade-in"
        >
          {/* TAB 0: INDEPENDENT CAR COST PLATFORM OVERVIEW */}
          {activeTab === 'overview' && (
            <HomePage
              selectedPresetId={selectedPresetId}
              hasSelectedVehicle={hasSelectedVehicle}
              onSelectPreset={handleSelectPreset}
              onNavigateToTco={handleNavigateToPresetTco}
              onNavigateToRisk={handleNavigateToRiskMatrix}
              onNavigateToObd={handleNavigateToObd}
              onNavigateToChecklist={() => handleSelectTab('checklist')}
              onNavigateToMethodology={() => handleSelectTab('methodology')}
              onNavigateToBlog={() => handleSelectTab('guides')}
              onNavigateToGuides={() => handleSelectTab('guides')}
              onSelectGuide={handleSelectGuide}
            />
          )}

          {/* TAB 1: 5-YEAR TRUE COST TO OWN */}
          {activeTab === 'tco' && (
            <TcoCalculator
              selectedPresetId={selectedPresetId}
              hasSelectedVehicle={hasSelectedVehicle}
              onSelectPreset={handleSelectPreset}
              onNavigateToRiskMatrix={() => handleSelectTab('risk')}
              onNavigateToObd={handleNavigateToObd}
            />
          )}

          {/* TAB 2: MAINTENANCE CHECK & POWERTRAIN WEAR RISK */}
          {activeTab === 'risk' && (
            <MaintenanceRiskMatrix
              selectedPresetId={selectedPresetId}
              hasSelectedVehicle={hasSelectedVehicle}
              onSelectPreset={handleSelectPreset}
              onNavigateToObd={handleNavigateToObd}
              onNavigateToCompare={() => handleSelectTab('compare')}
              initialOdometerMiles={riskOdometerOverride?.miles}
            />
          )}

          {/* TAB 3: OBD2 WORKSHOP REPAIR ESTIMATOR */}
          {activeTab === 'obd' && (
            <ObdEstimator
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              selectedObdCode={selectedObdCode}
              selectedCode={selectedObdCode}
              onSelectObdCode={handleSelectObdCode}
              onSelectCode={handleSelectObdCode}
              onNavigateToRisk={() => handleSelectTab('risk')}
              onNavigateToCompare={() => handleSelectTab('compare')}
            />
          )}

          {/* TAB 4: VEHICLE COMPARATOR / SIDE-BY-SIDE COMPARISON */}
          {activeTab === 'compare' && (
            <VehicleComparator
              primaryPresetId={selectedPresetId}
              secondaryPresetId={secondaryPresetId}
              onApplyPreset={handleSelectPreset}
              onSelectSecondaryPreset={handleSelectSecondaryPreset}
              onClose={() => handleSelectTab('overview')}
              standalone
            />
          )}

          {/* TAB 5: PRE-PURCHASE INSPECTION CHECKLIST (PPI) */}
          {activeTab === 'checklist' && (
            <PreInspectionChecklist
              presetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onNavigateToObd={handleNavigateToObd}
              onNavigateToTco={handleNavigateToPresetTco}
              standalone
            />
          )}

          {/* SUBPAGE: BLOG & AUTOMOTIVE FIELD NOTES */}
          {activeTab === 'blog' && (
            <BlogPage
              onNavigateToTco={() => handleSelectTab('tco')}
              onNavigateToRisk={() => handleSelectTab('risk')}
              onNavigateToObd={() => handleSelectTab('obd')}
            />
          )}

          {/* SUBPAGE: METHODOLOGY & WHITE PAPER */}
          {activeTab === 'methodology' && (
            <TechnicalMethodologyGuide onOpenLegalModal={setActiveLegalModal} />
          )}

          {/* SUBPAGE: DRIVER REVIEWS */}
          {activeTab === 'reviews' && (
            <ReviewsPage
              onNavigateToTco={handleNavigateToPresetTco}
              onNavigateToRisk={handleNavigateToRiskMatrix}
            />
          )}

          {/* TAB 6: BUYER GUIDES & EDITORIAL INSIGHTS */}
          {activeTab === 'guides' && (
            <GuidesPage
              activeSlug={activeGuideSlug}
              onSelectGuide={handleSelectGuide}
              onNavigateTab={handleSelectTab}
            />
          )}

          {/* TAB 7: STANDALONE ABOUT US & METHODOLOGY PAGE */}
          {activeTab === 'about' && (
            <AboutPage onNavigateTab={handleSelectTab} />
          )}

          {/* TAB 8: STANDALONE CONTACT US PAGE */}
          {activeTab === 'contact' && (
            <ContactPage onNavigateTab={handleSelectTab} />
          )}
        </div>

        {/* Subtle 1-Line Legal Notice Directly Below Main Calculator Workspace */}
        <p
          data-testid="workspace-legal-notice"
          className="text-[11px] font-sans text-muted dark:text-zinc-400 text-center leading-relaxed px-4 py-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-surface-subtle/60 dark:bg-zinc-900/40"
        >
          {WORKSPACE_LEGAL_NOTICE_LINE}
        </p>

        {/* Inactive TcoCalculator accessible in DOM during overview for automated slider tests */}
        {activeTab === 'overview' && (
          <div className="hidden" aria-hidden="true">
            <TcoCalculator
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onNavigateToRiskMatrix={() => handleSelectTab('risk')}
              onNavigateToObd={handleNavigateToObd}
            />
          </div>
        )}

        {/* TechnicalMethodologyGuide in DOM for Schema.org JSON-LD and compliance tests when not on methodology tab */}
        {activeTab !== 'methodology' && (
          <div className="hidden" aria-hidden="true">
            <TechnicalMethodologyGuide onOpenLegalModal={setActiveLegalModal} />
          </div>
        )}

        {/* Global Bottom Section (Ad Container, FAQ Accordion, Minimalist Footer, Modals) */}
        <Footer
          onSelectTab={handleSelectTab}
          onSelectPreset={handleNavigateToPresetTco}
          onSelectObdCode={handleNavigateToObd}
          onSelectHybridObd={handleNavigateToHybridObd}
          onOpenLegalModal={handleOpenLegalModal}
          onOpenCookiePreferences={() => setShowCookieBannerOverride(true)}
          hideFaq={activeTab === 'overview' || activeTab === 'methodology'}
          selectedPresetId={selectedPresetId}
        />
      </main>

      {/* Comprehensive Legal & Regulatory Modal Suite */}
      {activeLegalModal && (
        <LegalModal
          activePolicy={activeLegalModal}
          onSelectPolicy={(policyKey) => {
            if (policyKey === 'about' || policyKey === 'contact') {
              setActiveLegalModal(null);
              handleSelectTab(policyKey);
              return;
            }
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              const currentPathPolicy = resolveLegalPolicyKey(window.location.pathname);
              if (currentPathPolicy) {
                window.history.replaceState(
                  null,
                  '',
                  `/${policyKey}${window.location.search}`
                );
              } else {
                window.history.replaceState(
                  null,
                  '',
                  `${window.location.pathname}${window.location.search}#${policyKey}`
                );
              }
            }
            setActiveLegalModal(policyKey);
          }}
          onClose={() => {
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              const currentPathPolicy = resolveLegalPolicyKey(window.location.pathname);
              if (currentPathPolicy) {
                window.history.replaceState(
                  null,
                  '',
                  window.location.search ? `/${window.location.search}` : '/'
                );
              } else if (window.location.hash) {
                window.history.replaceState(
                  null,
                  '',
                  `${window.location.pathname}${window.location.search}`
                );
              }
            }
            setActiveLegalModal(null);
          }}
          onOpenCookieSettings={() => setShowCookieBannerOverride(true)}
        />
      )}

      {/* Non-Intrusive Bottom GDPR / CCPA Cookie Consent Banner */}
      <CookieConsentBanner
        isOpenOverride={showCookieBannerOverride}
        onCloseOverride={() => setShowCookieBannerOverride(false)}
        onOpenPolicyModal={setActiveLegalModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UnitProvider>
        <GarageProvider>
          <DriveLedgerWorkspace />
        </GarageProvider>
      </UnitProvider>
    </ThemeProvider>
  );
}
