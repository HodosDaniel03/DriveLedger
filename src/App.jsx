import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UnitProvider } from './context/UnitContext';
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
import LegalModal from './components/legal/LegalModal';
import CookieConsentBanner from './components/legal/CookieConsentBanner';
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
  '/blog': 'blog',
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
  blog: '/blog',
};

const HYBRID_OBD_REGEX = /^\/obd\/([^/]+)\/([^/]+)$/i;

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

function ShiftMetricWorkspace() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive initial tab from URL query param, programmatic SEO paths, or pathname
  const resolveInitialTab = () => {
    const qTab = searchParams.get('tab');
    if (qTab && ['overview', 'tco', 'risk', 'obd', 'compare', 'checklist', 'methodology', 'reviews', 'blog'].includes(qTab)) {
      return qTab;
    }
    const hybrid = parseHybridObdPath(location.pathname);
    if (hybrid) return 'obd';
    const matchup = parseCompareMatchupPath(location.pathname);
    if (matchup) return 'compare';
    const riskMileage = parseRiskMileagePath(location.pathname);
    if (riskMileage) return 'risk';
    return PATH_TO_TAB[location.pathname] || 'overview';
  };

  const resolveInitialPreset = () => {
    const qPreset = searchParams.get('preset') || searchParams.get('presetA');
    if (qPreset && VEHICLE_PRESETS.some((p) => p.id === qPreset)) return qPreset;
    const qEngine = searchParams.get('engine');
    if (qEngine) {
      const match = VEHICLE_PRESETS.find(
        (p) => p.id === qEngine || p.engineCode?.toLowerCase().includes(qEngine.toLowerCase())
      );
      if (match) return match.id;
    }
    const hybrid = parseHybridObdPath(location.pathname);
    if (hybrid?.preset) return hybrid.preset;
    const matchup = parseCompareMatchupPath(location.pathname);
    if (matchup?.presetA) return matchup.presetA;
    const riskMileage = parseRiskMileagePath(location.pathname);
    if (riskMileage?.preset) return riskMileage.preset;
    return VEHICLE_PRESETS[0].id;
  };

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

  const resolveInitialObdCode = () => {
    const qCode = searchParams.get('code')?.toUpperCase();
    if (qCode && OBD_CODES.some((c) => c.code === qCode)) return qCode;
    const hybrid = parseHybridObdPath(location.pathname);
    if (hybrid?.code) return hybrid.code;
    return 'P2002';
  };

  const resolveInitialLegalModal = () => {
    const hashVal =
      location.hash || (typeof window !== 'undefined' ? window.location.hash : '');
    return resolveLegalPolicyKey(hashVal);
  };

  const [activeTab, setActiveTabState] = useState(resolveInitialTab);
  const [selectedPresetId, setSelectedPresetIdState] = useState(resolveInitialPreset);
  const [secondaryPresetId, setSecondaryPresetIdState] = useState(resolveInitialSecondaryPreset);
  const [riskOdometerOverride, setRiskOdometerOverride] = useState(resolveInitialRiskOdometer);
  const [selectedObdCode, setSelectedObdCodeState] = useState(resolveInitialObdCode);
  const [activeLegalModal, setActiveLegalModal] = useState(resolveInitialLegalModal);
  const [showCookieBannerOverride, setShowCookieBannerOverride] = useState(false);

  // Keep URL query parameters synchronized for programmatic SEO & deep-link sharing
  const syncUrlParams = useCallback(
    (nextTab, nextPreset, nextCode, nextSecondaryPreset = secondaryPresetId) => {
      if (nextTab === 'compare' && nextSecondaryPreset && nextSecondaryPreset !== nextPreset) {
        const params = new URLSearchParams();
        params.set('tab', 'compare');
        params.set('presetA', nextPreset);
        params.set('presetB', nextSecondaryPreset);
        navigate(`/compare/${nextPreset}-vs-${nextSecondaryPreset}?${params.toString()}`, { replace: true });
        return;
      }
      const targetPath = TAB_TO_PATH[nextTab] || '/tco';
      const params = new URLSearchParams();
      params.set('tab', nextTab);
      params.set('preset', nextPreset);
      params.set('code', nextCode);
      navigate(`${targetPath}?${params.toString()}`, { replace: true });
    },
    [navigate, secondaryPresetId]
  );

  const handleSelectTab = (tabId) => {
    syncUrlParams(tabId, selectedPresetId, selectedObdCode);
    setActiveTabState(tabId);
    if (tabId !== 'risk') {
      setRiskOdometerOverride({ miles: null, slug: null });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPreset = (presetId) => {
    syncUrlParams(activeTab, presetId, selectedObdCode);
    setSelectedPresetIdState(presetId);
    setRiskOdometerOverride({ miles: null, slug: null });
  };

  const handleSelectSecondaryPreset = (presetBId) => {
    setSecondaryPresetIdState(presetBId);
    if (activeTab === 'compare' && presetBId && presetBId !== selectedPresetId) {
      syncUrlParams('compare', selectedPresetId, selectedObdCode, presetBId);
    }
  };

  const handleSelectObdCode = (code) => {
    syncUrlParams(activeTab, selectedPresetId, code);
    setSelectedObdCodeState(code);
  };

  const handleNavigateToPresetTco = (presetId) => {
    const targetPreset = presetId || selectedPresetId;
    syncUrlParams('tco', targetPreset, selectedObdCode);
    setSelectedPresetIdState(targetPreset);
    setActiveTabState('tco');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToObd = (code) => {
    const targetCode = code || selectedObdCode;
    syncUrlParams('obd', selectedPresetId, targetCode);
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
    setSelectedPresetIdState(targetPreset);
    setSelectedObdCodeState(targetCode);
    setActiveTabState('obd');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToRiskMatrix = (preset) => {
    const pId = preset?.id || selectedPresetId;
    syncUrlParams('risk', pId, selectedObdCode);
    setSelectedPresetIdState(pId);
    setActiveTabState('risk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize state when location or search parameters change via router
  useEffect(() => {
    const hybrid = parseHybridObdPath(location.pathname);
    const matchup = parseCompareMatchupPath(location.pathname);
    const riskMileage = parseRiskMileagePath(location.pathname);

    const qTab =
      searchParams.get('tab') ||
      (hybrid ? 'obd' : matchup ? 'compare' : riskMileage ? 'risk' : PATH_TO_TAB[location.pathname]);
    if (qTab && ['overview', 'tco', 'risk', 'obd', 'compare', 'checklist', 'methodology', 'reviews', 'blog'].includes(qTab)) {
      setActiveTabState((prev) => (prev !== qTab ? qTab : prev));
    }

    const qPreset =
      searchParams.get('preset') ||
      searchParams.get('presetA') ||
      hybrid?.preset ||
      matchup?.presetA ||
      riskMileage?.preset;
    if (qPreset && VEHICLE_PRESETS.some((p) => p.id === qPreset)) {
      setSelectedPresetIdState((prev) => (prev !== qPreset ? qPreset : prev));
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

    const qCode = searchParams.get('code')?.toUpperCase() || hybrid?.code;
    if (qCode && OBD_CODES.some((c) => c.code === qCode)) {
      setSelectedObdCodeState((prev) => (prev !== qCode ? qCode : prev));
    }

    const hashPolicy = resolveLegalPolicyKey(
      location.hash || (typeof window !== 'undefined' ? window.location.hash : '')
    );
    if (hashPolicy) {
      setActiveLegalModal(hashPolicy);
    }
  }, [location.pathname, location.hash, searchParams]);

  // Sync if user navigates via browser back/forward (popstate) or URL hashchange (#privacy, #terms, etc.)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const handleHashChange = () => {
      const policyKey = resolveLegalPolicyKey(window.location.hash);
      setActiveLegalModal(policyKey);
    };
    const handlePopState = () => {
      const applyPopState = () => {
        const params = new URLSearchParams(window.location.search || '');
        const hybrid = parseHybridObdPath(window.location.pathname);
        const qTab =
          params.get('tab') ||
          (hybrid ? 'obd' : PATH_TO_TAB[window.location.pathname]) ||
          'overview';
        setActiveTabState(
          ['overview', 'tco', 'risk', 'obd', 'compare', 'checklist', 'methodology', 'reviews', 'blog'].includes(qTab)
            ? qTab
            : 'overview'
        );

        const qPreset = params.get('preset') || params.get('presetA') || hybrid?.preset;
        setSelectedPresetIdState(
          qPreset && VEHICLE_PRESETS.some((p) => p.id === qPreset)
            ? qPreset
            : VEHICLE_PRESETS[0].id
        );

        const qCode = params.get('code')?.toUpperCase() || hybrid?.code;
        setSelectedObdCodeState(
          qCode && OBD_CODES.some((c) => c.code === qCode) ? qCode : 'P2002'
        );

        const hashPolicy = resolveLegalPolicyKey(window.location.hash);
        setActiveLegalModal(hashPolicy);
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

  return (
    <div id="top" className="min-h-screen scroll-pt-28 lg:scroll-pt-32 bg-canvas text-body selection:bg-primary-100 selection:text-primary-800 antialiased dark:bg-[#09090B] dark:text-zinc-300">
      <ScrollToTop />
      {/* Dynamic Programmatic SEO Meta Tags & Schema.org JSON-LD */}
      <DynamicSeoHead
        activeTab={activeTab}
        selectedPresetId={selectedPresetId}
        secondaryPresetId={secondaryPresetId}
        mileageBracketSlug={riskOdometerOverride?.slug}
        selectedObdCode={selectedObdCode}
      />

      {/* Sticky Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Content Container */}
      <main className="mx-auto max-w-[1380px] min-h-[85vh] px-6 lg:px-10 pt-8 pb-16 space-y-12">
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
              onSelectPreset={handleSelectPreset}
              onNavigateToTco={handleNavigateToPresetTco}
              onNavigateToRisk={handleNavigateToRiskMatrix}
              onNavigateToObd={handleNavigateToObd}
              onNavigateToChecklist={() => handleSelectTab('checklist')}
              onNavigateToMethodology={() => handleSelectTab('methodology')}
              onNavigateToBlog={() => handleSelectTab('blog')}
            />
          )}

          {/* TAB 1: 5-YEAR TRUE COST TO OWN */}
          {activeTab === 'tco' && (
            <TcoCalculator
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onNavigateToRiskMatrix={() => handleSelectTab('risk')}
              onNavigateToObd={handleNavigateToObd}
            />
          )}

          {/* TAB 2: MAINTENANCE CHECK & POWERTRAIN WEAR RISK */}
          {activeTab === 'risk' && (
            <MaintenanceRiskMatrix
              selectedPresetId={selectedPresetId}
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
          onOpenLegalModal={setActiveLegalModal}
          onOpenCookiePreferences={() => setShowCookieBannerOverride(true)}
          hideFaq={activeTab === 'overview' || activeTab === 'methodology'}
        />
      </main>

      {/* Comprehensive Legal & Regulatory Modal Suite */}
      {activeLegalModal && (
        <LegalModal
          activePolicy={activeLegalModal}
          onSelectPolicy={(policyKey) => {
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}#${policyKey}`
              );
            }
            setActiveLegalModal(policyKey);
          }}
          onClose={() => {
            if (
              typeof window !== 'undefined' &&
              window.location.hash &&
              window.history?.replaceState
            ) {
              window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}`
              );
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
          <ShiftMetricWorkspace />
        </GarageProvider>
      </UnitProvider>
    </ThemeProvider>
  );
}
