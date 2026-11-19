import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UnitProvider, useUnits } from './context/UnitContext';
import { GarageProvider } from './context/GarageContext';
import Navbar, { WORKSPACE_TABS } from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import HomePage from './pages/HomePage';
import MaintenanceRiskMatrix from './components/calculators/MaintenanceRiskMatrix';
import ObdEstimator from './components/calculators/ObdEstimator';
import DynamicSeoHead from './components/seo/DynamicSeoHead';
import LegalModal from './components/legal/LegalModal';
import CookieConsentBanner, { openPrivacySettings } from './components/legal/CookieConsentBanner';
import {
  resolveLegalPolicyKey,
  WORKSPACE_LEGAL_NOTICE_LINE,
} from './data/legalPolicies';
import { VEHICLE_PRESETS, getPresetById } from './data/vehiclePresets';
import { OBD_CODES } from './data/obdCodes';
import { GUIDES_DATA } from './data/guidesData';
import {
  parseCompareMatchupPath,
  parseRiskMileagePath,
  isObdCompatibleWithVehicle,
} from './data/seoMatrixData';
import { parseBrandHubPath, getBrandBySlug } from './data/brandDirectory';

// Code-split calculators & editorial/catalog pages to keep initial homepage bundle lean
const TcoCalculator = lazy(() => import('./components/calculators/TcoCalculator'));
const TechnicalMethodologyGuide = lazy(() => import('./components/seo/TechnicalMethodologyGuide'));
const VehicleComparator = lazy(() => import('./components/calculators/VehicleComparator'));
const PreInspectionChecklist = lazy(() => import('./components/home/PreInspectionChecklist'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const VehiclesCatalogPage = lazy(() => import('./pages/VehiclesCatalogPage'));

const PATH_TO_TAB = {
  '/': 'overview',
  '/overview': 'overview',
  '/tco': 'tco',
  '/risk-matrix': 'risk',
  '/obd-estimator': 'obd',
  '/compare': 'compare',
  '/checklist': 'checklist',
  '/vehicles': 'vehicles',
  '/methodology': 'methodology',
  '/reviews': 'reviews',
  '/blog': 'guides',
  '/guides': 'guides',
  '/about': 'about',
  '/contact': 'contact',
};

const TAB_TO_PATH = {
  overview: '/',
  tco: '/tco',
  risk: '/risk-matrix',
  obd: '/obd-estimator',
  compare: '/compare',
  checklist: '/checklist',
  vehicles: '/vehicles',
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
  'vehicles',
  'methodology',
  'reviews',
  'blog',
  'guides',
  'about',
  'contact',
];

const HYBRID_OBD_REGEX = /^\/obd\/([^/]+)\/([^/]+)\/?$/i;
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

function safeDecodeUriComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return null;
  }
}

function parseHybridObdPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(HYBRID_OBD_REGEX);
  if (!match) return null;
  const rawPreset = safeDecodeUriComponent(match[1]);
  const rawCodeDecoded = safeDecodeUriComponent(match[2]);
  if (!rawPreset || !rawCodeDecoded) return null;
  const rawCode = rawCodeDecoded.toUpperCase();
  return {
    tab: 'obd',
    preset: VEHICLE_PRESETS.some((p) => p.id === rawPreset) ? rawPreset : null,
    code: OBD_CODES.some((c) => c.code === rawCode) ? rawCode : null,
  };
}

const CLEAN_VEHICLE_PATH_REGEX = /^\/(tco|risk-matrix|checklist)\/([^/]+)\/?$/i;

function parseCleanVehiclePath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  if (parseRiskMileagePath(pathname)) return null;
  const match = pathname.match(CLEAN_VEHICLE_PATH_REGEX);
  if (!match) return null;
  const prefix = match[1].toLowerCase();
  const decodedPreset = safeDecodeUriComponent(match[2]);
  if (!decodedPreset) return null;
  const rawPreset = decodedPreset.toLowerCase();
  const matchedPreset = VEHICLE_PRESETS.find((p) => p.id.toLowerCase() === rawPreset);
  if (!matchedPreset) return null;
  const tabMap = {
    tco: 'tco',
    'risk-matrix': 'risk',
    checklist: 'checklist',
  };
  return {
    tab: tabMap[prefix] || 'tco',
    preset: matchedPreset.id,
  };
}

function getSamplePresetIdForRegion(region) {
  const targetId = region === 'US' ? 'toyota-camry-hybrid' : 'vw-golf-20-tdi';
  return VEHICLE_PRESETS.some((p) => p.id === targetId) ? targetId : VEHICLE_PRESETS[0].id;
}

function resolveCompatibleObdCode(presetId, candidateCode) {
  const preset = getPresetById(presetId) || VEHICLE_PRESETS[0];
  const candidateObj = candidateCode
    ? OBD_CODES.find((c) => c.code === String(candidateCode).toUpperCase())
    : null;
  if (candidateObj && isObdCompatibleWithVehicle(preset, candidateObj)) {
    return candidateObj.code;
  }
  const preferred = (preset.commonObdCodes || []).find((code) => {
    const obj = OBD_CODES.find((c) => c.code === code);
    return obj && isObdCompatibleWithVehicle(preset, obj);
  });
  if (preferred) return preferred;
  const firstCompat = OBD_CODES.find((c) => isObdCompatibleWithVehicle(preset, c));
  return firstCompat ? firstCompat.code : 'P0420';
}

function isKnownApplicationPath(pathname, searchParams) {
  if (!pathname || pathname === '/') return true;
  const qTab = searchParams?.get?.('tab');
  if (qTab && VALID_TABS.includes(qTab)) return true;
  const cleanPath =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (PATH_TO_TAB[cleanPath] || PATH_TO_TAB[pathname]) return true;
  if (resolveLegalPolicyKey(pathname)) return true;
  const hybrid = parseHybridObdPath(pathname);
  if (hybrid && hybrid.preset && hybrid.code) return true;
  if (parseCompareMatchupPath(pathname)) return true;
  if (parseRiskMileagePath(pathname)) return true;
  if (parseCleanVehiclePath(pathname)) return true;
  if (parseBrandHubPath(pathname)) return true;
  const guideMatch = parseGuidePath(pathname);
  if (guideMatch) {
    if (!guideMatch.slug) return true;
    return GUIDES_DATA.some((g) => g.slug === guideMatch.slug);
  }
  return false;
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
  const cleanVehicle = parseCleanVehiclePath(pathname);
  if (cleanVehicle?.preset) return cleanVehicle.preset;
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
  const { region, setRegion } = useUnits();
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
    const cleanVehicle = parseCleanVehiclePath(location.pathname);
    if (cleanVehicle) return cleanVehicle.tab;
    const brandMatch = parseBrandHubPath(location.pathname);
    if (brandMatch) return 'vehicles';
    const cleanPath =
      location.pathname && location.pathname.length > 1 && location.pathname.endsWith('/')
        ? location.pathname.slice(0, -1)
        : location.pathname;
    return PATH_TO_TAB[cleanPath] || PATH_TO_TAB[location.pathname] || 'overview';
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
  const [isNotFoundRoute, setIsNotFoundRoute] = useState(
    () => !isKnownApplicationPath(location.pathname, searchParams)
  );
  const [hasSelectedVehicle, setHasSelectedVehicle] = useState(Boolean(initialExplicitPreset));
  const [hasSelectedObdCode, setHasSelectedObdCode] = useState(Boolean(initialExplicitCode));
  const [selectedPresetId, setSelectedPresetIdState] = useState(
    () => initialExplicitPreset || getSamplePresetIdForRegion(region)
  );
  const [secondaryPresetId, setSecondaryPresetIdState] = useState(resolveInitialSecondaryPreset);
  const [riskOdometerOverride, setRiskOdometerOverride] = useState(resolveInitialRiskOdometer);
  const [selectedObdCode, setSelectedObdCodeState] = useState(() =>
    initialExplicitCode ||
    resolveCompatibleObdCode(initialExplicitPreset || getSamplePresetIdForRegion(region), null)
  );
  const [activeGuideSlug, setActiveGuideSlug] = useState(() => parseGuidePath(location.pathname)?.slug || null);
  const [activeBrandSlug, setActiveBrandSlug] = useState(() => parseBrandHubPath(location.pathname)?.brandSlug || null);
  const [activeLegalModal, setActiveLegalModal] = useState(resolveInitialLegalModal);
  const [showCookieBannerOverride, setShowCookieBannerOverride] = useState(false);

  // Restore ?reg=US|UK|EU query parameter from shared links
  useEffect(() => {
    const regParam = searchParams.get('reg')?.toUpperCase();
    if (regParam && ['US', 'UK', 'EU'].includes(regParam) && regParam !== regionRef.current) {
      setRegion(regParam);
    }
  }, [searchParams, setRegion]);

  // Keep the unselected sample vehicle aligned with the active region (US vs UK/EU)
  useEffect(() => {
    if (!hasSelectedVehicle) {
      const sampleId = getSamplePresetIdForRegion(region);
      setSelectedPresetIdState((prev) => (prev !== sampleId ? sampleId : prev));
      if (!hasSelectedObdCode) {
        setSelectedObdCodeState((prev) => resolveCompatibleObdCode(sampleId, prev));
      }
    }
  }, [region, hasSelectedVehicle, hasSelectedObdCode]);

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
        navigate(`/compare/${nextPreset}-vs-${nextSecondaryPreset}`, { replace: true });
        return;
      }
      if (['about', 'contact', 'methodology', 'reviews'].includes(nextTab)) {
        navigate(TAB_TO_PATH[nextTab] || `/${nextTab}`, { replace: true });
        return;
      }
      if (nextTab === 'vehicles') {
        navigate('/vehicles', { replace: true });
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
      if (
        nextTab === 'obd' &&
        explicitPreset &&
        explicitCode &&
        nextPreset &&
        nextCode &&
        typeof window !== 'undefined' &&
        /^\/obd\//i.test(window.location?.pathname || '')
      ) {
        navigate(`/obd/${nextPreset}/${String(nextCode).toLowerCase()}`, { replace: true });
        return;
      }
      const targetPath = TAB_TO_PATH[nextTab] || '/tco';
      if (!explicitPreset && !explicitCode) {
        navigate(targetPath, { replace: true });
        return;
      }
      if (
        explicitPreset &&
        nextPreset &&
        (nextTab === 'tco' || nextTab === 'risk' || nextTab === 'checklist')
      ) {
        navigate(`${targetPath}/${nextPreset}`, { replace: true });
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
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
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
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    if (tabId === 'guides') {
      setActiveGuideSlug(null);
    }
    if (tabId === 'vehicles') {
      setActiveBrandSlug(null);
    }
    syncUrlParams(tabId, selectedPresetId, selectedObdCode);
    setActiveTabState(tabId);
    if (tabId !== 'risk') {
      setRiskOdometerOverride({ miles: null, slug: null });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPreset = (presetId) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const compatCode = resolveCompatibleObdCode(presetId, selectedObdCode);
    setHasSelectedVehicle(true);
    syncUrlParams(activeTab, presetId, compatCode, secondaryPresetId, true, hasSelectedObdCode);
    setSelectedPresetIdState(presetId);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    setRiskOdometerOverride({ miles: null, slug: null });
  };

  const handleSelectSecondaryPreset = (presetBId) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    setSecondaryPresetIdState(presetBId);
    if (activeTab === 'compare' && presetBId && presetBId !== selectedPresetId) {
      setHasSelectedVehicle(true);
      syncUrlParams('compare', selectedPresetId, selectedObdCode, presetBId, true, hasSelectedObdCode);
    }
  };

  const handleSelectObdCode = (code) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    setHasSelectedObdCode(true);
    syncUrlParams(activeTab, selectedPresetId, code, secondaryPresetId, hasSelectedVehicle, true);
    setSelectedObdCodeState(code);
  };

  const handleNavigateToPresetTco = (presetId) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const explicit = Boolean(presetId);
    const targetPreset = presetId || selectedPresetId;
    const compatCode = resolveCompatibleObdCode(targetPreset, selectedObdCode);
    const nextExplicitPreset = explicit || hasSelectedVehicle;
    if (explicit) {
      setHasSelectedVehicle(true);
    }
    syncUrlParams('tco', targetPreset, compatCode, secondaryPresetId, nextExplicitPreset, hasSelectedObdCode);
    setSelectedPresetIdState(targetPreset);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    setActiveTabState('tco');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToObd = (code) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const explicit = Boolean(code);
    const targetCode = code || resolveCompatibleObdCode(selectedPresetId, selectedObdCode);
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
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const targetPreset =
      presetId && VEHICLE_PRESETS.some((p) => p.id === presetId) ? presetId : selectedPresetId;
    const normalizedCode = code ? String(code).toUpperCase() : selectedObdCode;
    const targetCode = OBD_CODES.some((c) => c.code === normalizedCode)
      ? normalizedCode
      : resolveCompatibleObdCode(targetPreset, selectedObdCode);
    navigate(`/obd/${targetPreset}/${targetCode.toLowerCase()}`, {
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
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const explicitId = typeof preset === 'string' ? preset : preset?.id;
    const pId = explicitId || selectedPresetId;
    const compatCode = resolveCompatibleObdCode(pId, selectedObdCode);
    const nextExplicitPreset = Boolean(explicitId) || hasSelectedVehicle;
    if (explicitId) {
      setHasSelectedVehicle(true);
    }
    const mileageSlug = typeof preset === 'object' ? preset?.mileageSlug : null;
    const odoMiles = typeof preset === 'object' ? preset?.defaultOdometerMiles : null;
    if (mileageSlug && odoMiles) {
      navigate(`/risk-matrix/${pId}/${mileageSlug}`, { replace: false });
      setRiskOdometerOverride({ miles: odoMiles, slug: mileageSlug });
    } else {
      syncUrlParams('risk', pId, compatCode, secondaryPresetId, nextExplicitPreset, hasSelectedObdCode);
      setRiskOdometerOverride({ miles: null, slug: null });
    }
    setSelectedPresetIdState(pId);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    setActiveTabState('risk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToRiskBracket = (presetId, bracketSlug, miles) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const pId = presetId || selectedPresetId;
    const compatCode = resolveCompatibleObdCode(pId, selectedObdCode);
    setHasSelectedVehicle(true);
    setSelectedPresetIdState(pId);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    setRiskOdometerOverride({ miles: miles || null, slug: bracketSlug || null });
    navigate(`/risk-matrix/${pId}/${bracketSlug}`, { replace: false });
    setActiveTabState('risk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToChecklist = (presetId) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const explicit = Boolean(presetId);
    const targetPreset = presetId || selectedPresetId;
    const compatCode = resolveCompatibleObdCode(targetPreset, selectedObdCode);
    const nextExplicitPreset = explicit || hasSelectedVehicle;
    if (explicit) {
      setHasSelectedVehicle(true);
    }
    syncUrlParams('checklist', targetPreset, compatCode, secondaryPresetId, nextExplicitPreset, hasSelectedObdCode);
    setSelectedPresetIdState(targetPreset);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    setActiveTabState('checklist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCompare = (presetAId, presetBId) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const pA = presetAId && VEHICLE_PRESETS.some((p) => p.id === presetAId) ? presetAId : selectedPresetId;
    const pB = presetBId && VEHICLE_PRESETS.some((p) => p.id === presetBId) ? presetBId : secondaryPresetId;
    const compatCode = resolveCompatibleObdCode(pA, selectedObdCode);
    setHasSelectedVehicle(true);
    setSelectedPresetIdState(pA);
    if (compatCode !== selectedObdCode) {
      setSelectedObdCodeState(compatCode);
    }
    if (pB && pB !== pA) {
      setSecondaryPresetIdState(pB);
      navigate(`/compare/${pA}-vs-${pB}`, { replace: false });
    } else {
      navigate('/compare', { replace: false });
    }
    setActiveTabState('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToVehicles = (brandSlug = null) => {
    setIsNotFoundRoute(false);
    setActiveLegalModal(null);
    const resolvedBrand = brandSlug ? getBrandBySlug(brandSlug) : null;
    if (resolvedBrand) {
      setActiveBrandSlug(resolvedBrand.slug);
      navigate(`/vehicles/${resolvedBrand.slug}`, { replace: false });
    } else {
      setActiveBrandSlug(null);
      navigate('/vehicles', { replace: false });
    }
    setActiveTabState('vehicles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevNonLegalUrlRef = useRef(null);

  const handleOpenLegalModal = useCallback((policyKey) => {
    if (!policyKey) return;
    if (typeof window !== 'undefined' && window.history?.pushState) {
      if (!resolveLegalPolicyKey(window.location.pathname)) {
        prevNonLegalUrlRef.current = `${window.location.pathname}${window.location.search}`;
      }
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
    setIsNotFoundRoute(!isKnownApplicationPath(location.pathname, searchParams));
    const guideMatch = parseGuidePath(location.pathname);
    const hybrid = parseHybridObdPath(location.pathname);
    const matchup = parseCompareMatchupPath(location.pathname);
    const riskMileage = parseRiskMileagePath(location.pathname);
    const cleanVehicle = parseCleanVehiclePath(location.pathname);
    const brandMatch = parseBrandHubPath(location.pathname);

    if (guideMatch) {
      setActiveGuideSlug(guideMatch.slug);
    } else {
      setActiveGuideSlug(null);
    }

    if (brandMatch) {
      setActiveBrandSlug(brandMatch.brandSlug);
    } else {
      setActiveBrandSlug(null);
    }

    const qTab =
      searchParams.get('tab') ||
      (guideMatch
        ? 'guides'
        : hybrid
          ? 'obd'
          : matchup
            ? 'compare'
            : riskMileage
              ? 'risk'
              : cleanVehicle
                ? cleanVehicle.tab
                : brandMatch
                  ? 'vehicles'
                  : PATH_TO_TAB[
                      location.pathname && location.pathname.length > 1 && location.pathname.endsWith('/')
                        ? location.pathname.slice(0, -1)
                        : location.pathname
                    ] || PATH_TO_TAB[location.pathname]);
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
    } else {
      setRiskOdometerOverride({ miles: null, slug: null });
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
      setActiveLegalModal(hashPolicy || null);
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
        setIsNotFoundRoute(!isKnownApplicationPath(window.location.pathname, params));
        const regParam = params.get('reg')?.toUpperCase();
        if (regParam && ['US', 'UK', 'EU'].includes(regParam) && regParam !== regionRef.current) {
          setRegion(regParam);
        }
        const guideMatch = parseGuidePath(window.location.pathname);
        const hybrid = parseHybridObdPath(window.location.pathname);
        const matchup = parseCompareMatchupPath(window.location.pathname);
        const riskMileage = parseRiskMileagePath(window.location.pathname);
        const cleanVehicle = parseCleanVehiclePath(window.location.pathname);
        const brandMatch = parseBrandHubPath(window.location.pathname);
        if (guideMatch) {
          setActiveGuideSlug(guideMatch.slug);
        } else {
          setActiveGuideSlug(null);
        }
        if (brandMatch) {
          setActiveBrandSlug(brandMatch.brandSlug);
        } else {
          setActiveBrandSlug(null);
        }
        const qTab =
          params.get('tab') ||
          (guideMatch
            ? 'guides'
            : hybrid
              ? 'obd'
              : matchup
                ? 'compare'
                : riskMileage
                  ? 'risk'
                  : cleanVehicle
                    ? cleanVehicle.tab
                    : brandMatch
                      ? 'vehicles'
                      : PATH_TO_TAB[
                          window.location.pathname &&
                          window.location.pathname.length > 1 &&
                          window.location.pathname.endsWith('/')
                            ? window.location.pathname.slice(0, -1)
                            : window.location.pathname
                        ] || PATH_TO_TAB[window.location.pathname]) ||
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

        const qPresetB = params.get('presetB') || matchup?.presetB;
        setSecondaryPresetIdState(
          qPresetB && VEHICLE_PRESETS.some((p) => p.id === qPresetB) ? qPresetB : null
        );

        if (riskMileage?.odometerMiles) {
          setRiskOdometerOverride({ miles: riskMileage.odometerMiles, slug: riskMileage.mileageSlug });
        } else if (Number(params.get('odo')) > 0) {
          setRiskOdometerOverride({ miles: Math.round(Number(params.get('odo'))), slug: null });
        } else {
          setRiskOdometerOverride({ miles: null, slug: null });
        }

        const explicitCode = findExplicitObdCodeFromLocation(params, window.location.pathname);
        setHasSelectedObdCode(Boolean(explicitCode));
        const resolvedPreset = explicitPreset || getSamplePresetIdForRegion(regionRef.current);
        setSelectedObdCodeState(explicitCode || resolveCompatibleObdCode(resolvedPreset, null));

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
        activeBrandSlug={activeBrandSlug}
        selectedPresetId={selectedPresetId}
        secondaryPresetId={secondaryPresetId}
        mileageBracketSlug={riskOdometerOverride?.slug}
        selectedObdCode={selectedObdCode}
        activeLegalPolicy={activeLegalModal}
        hasSelectedVehicle={hasSelectedVehicle}
        hasSelectedObdCode={hasSelectedObdCode}
        isNotFound={isNotFoundRoute}
        currentPath={location.pathname}
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
        {isNotFoundRoute ? (
          <section
            data-testid="not-found-view"
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-mono font-bold">
              HTTP 404 · ROUTE NOT FOUND
            </span>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
              404 — Telemetry Route Not Found
            </h1>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed">
              The vehicle configuration or diagnostic URL you requested could not be found in the DriveLedger catalog. Select one of our primary calculators below to continue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectTab('overview');
                }}
                className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-sans text-xs font-semibold shadow-xs transition-colors"
              >
                Return to Overview
              </a>
              <a
                href="/tco"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectTab('tco');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                5-Year TCO Calculator
              </a>
              <a
                href="/risk-matrix"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectTab('risk');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                Maintenance Risk Matrix
              </a>
              <a
                href="/obd-estimator"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectTab('obd');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                OBD-II Repair Estimator
              </a>
              <a
                href="/vehicles"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToVehicles();
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                All 179+ Vehicles
              </a>
            </div>
          </section>
        ) : (
        /* Dynamic Calculator Workspace */
        <div
          key={activeTab}
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="min-h-[640px] animate-fade-in"
        >
          <Suspense
            fallback={
              <div className="min-h-[360px] flex items-center justify-center text-xs font-sans text-muted dark:text-zinc-400">
                Loading DriveLedger module…
              </div>
            }
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
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToMethodology={() => handleSelectTab('methodology')}
                onNavigateToBlog={() => handleSelectTab('guides')}
                onNavigateToGuides={() => handleSelectTab('guides')}
                onNavigateToVehicles={handleNavigateToVehicles}
                onSelectGuide={handleSelectGuide}
              />
            )}

            {/* TAB 1: 5-YEAR TRUE COST TO OWN */}
            {activeTab === 'tco' && (
              <TcoCalculator
                selectedPresetId={selectedPresetId}
                hasSelectedVehicle={hasSelectedVehicle}
                initialOdometerMiles={riskOdometerOverride?.miles}
                onSelectPreset={handleSelectPreset}
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRiskMatrix={handleNavigateToRiskMatrix}
                onNavigateToRiskBracket={handleNavigateToRiskBracket}
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToObd={handleNavigateToObd}
                onNavigateToHybridObd={handleNavigateToHybridObd}
                onNavigateToCompare={handleNavigateToCompare}
                onNavigateToVehicles={handleNavigateToVehicles}
              />
            )}

            {/* TAB 2: MAINTENANCE CHECK & POWERTRAIN WEAR RISK */}
            {activeTab === 'risk' && (
              <MaintenanceRiskMatrix
                selectedPresetId={selectedPresetId}
                hasSelectedVehicle={hasSelectedVehicle}
                onSelectPreset={handleSelectPreset}
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRisk={handleNavigateToRiskMatrix}
                onNavigateToRiskBracket={handleNavigateToRiskBracket}
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToObd={handleNavigateToObd}
                onNavigateToHybridObd={handleNavigateToHybridObd}
                onNavigateToCompare={handleNavigateToCompare}
                onNavigateToVehicles={handleNavigateToVehicles}
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
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRisk={handleNavigateToRiskMatrix}
                onNavigateToRiskBracket={handleNavigateToRiskBracket}
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToHybridObd={handleNavigateToHybridObd}
                onNavigateToCompare={handleNavigateToCompare}
                onNavigateToVehicles={handleNavigateToVehicles}
              />
            )}

            {/* TAB 4: VEHICLE COMPARATOR / SIDE-BY-SIDE COMPARISON */}
            {activeTab === 'compare' && (
              <VehicleComparator
                primaryPresetId={selectedPresetId}
                secondaryPresetId={secondaryPresetId}
                onApplyPreset={handleSelectPreset}
                onSelectSecondaryPreset={handleSelectSecondaryPreset}
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRisk={handleNavigateToRiskMatrix}
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToVehicles={handleNavigateToVehicles}
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
                onNavigateToHybridObd={handleNavigateToHybridObd}
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRisk={handleNavigateToRiskMatrix}
                onNavigateToRiskBracket={handleNavigateToRiskBracket}
                onNavigateToChecklist={handleNavigateToChecklist}
                onNavigateToCompare={handleNavigateToCompare}
                onNavigateToVehicles={handleNavigateToVehicles}
                standalone
              />
            )}

            {/* SUBPAGE: COMPLETE BRAND & MODEL HTML VEHICLE DIRECTORY & BRAND HUBS */}
            {activeTab === 'vehicles' && (
              <VehiclesCatalogPage
                activeBrandSlug={activeBrandSlug}
                onNavigateToBrand={handleNavigateToVehicles}
                onSelectPreset={handleSelectPreset}
                onNavigateToTco={handleNavigateToPresetTco}
                onNavigateToRisk={handleNavigateToRiskMatrix}
                onNavigateToChecklist={handleNavigateToChecklist}
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
          </Suspense>
        </div>
        )}

        {/* Subtle 1-Line Legal Notice Directly Below Main Calculator Workspace */}
        <p
          data-testid="workspace-legal-notice"
          className="text-[11px] font-sans text-muted dark:text-zinc-400 text-center leading-relaxed px-4 py-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-surface-subtle/60 dark:bg-zinc-900/40"
        >
          {WORKSPACE_LEGAL_NOTICE_LINE}
        </p>

        {/* Global Bottom Section (Ad Container, FAQ Accordion, Minimalist Footer, Modals) */}
        <Footer
          onSelectTab={handleSelectTab}
          onSelectPreset={handleNavigateToPresetTco}
          onSelectObdCode={handleNavigateToObd}
          onSelectHybridObd={handleNavigateToHybridObd}
          onNavigateToVehicles={handleNavigateToVehicles}
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
                const restoreUrl =
                  prevNonLegalUrlRef.current ||
                  (window.location.search ? `/${window.location.search}` : '/');
                prevNonLegalUrlRef.current = null;
                window.history.replaceState(null, '', restoreUrl);
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
