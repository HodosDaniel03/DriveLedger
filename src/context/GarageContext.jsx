import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { VEHICLE_PRESETS } from '../data/vehiclePresets.js';

export const GARAGE_STORAGE_KEY = 'shiftmetric_garage_v1';

/**
 * Maps individual milestone checklist item IDs to their corresponding
 * Powertrain Telemetry Dossier component ID, risk reserve credit ($ USD),
 * and reliability score bonus (+pts).
 */
export const MILESTONE_IMPACT_MAP = {
  '15k-oil': { creditUsd: 85, bonusPts: 2, componentId: null, major: false, label: 'Oil & Filter Service' },
  '15k-tires': { creditUsd: 40, bonusPts: 1, componentId: null, major: false, label: 'Tire Balance Check' },
  '15k-brakes': { creditUsd: 55, bonusPts: 1, componentId: 'suspension-brakes-chassis', major: false, label: 'Brake Inspection' },
  '15k-fluids': { creditUsd: 35, bonusPts: 1, componentId: null, major: false, label: 'Fluid Top-Off' },
  '30k-brake-fluid': { creditUsd: 140, bonusPts: 2, componentId: 'suspension-brakes-chassis', major: true, label: 'DOT 4/5.1 Hydraulic Flush' },
  '30k-air-filters': { creditUsd: 65, bonusPts: 1, componentId: null, major: false, label: 'Intake & Cabin Filtration' },
  '30k-battery': { creditUsd: 50, bonusPts: 1, componentId: null, major: false, label: '12V AGM Conductance Test' },
  '30k-suspension': { creditUsd: 160, bonusPts: 2, componentId: 'suspension-brakes-chassis', major: false, label: 'Chassis & Ball Joint Check' },
  '60k-plugs': { creditUsd: 190, bonusPts: 3, componentId: 'gdi-intake-pcv-ignition', major: true, label: 'Spark Plugs / Fuel Filter' },
  '60k-transmission': { creditUsd: 420, bonusPts: 6, componentId: 'drivetrain-dmf-dsg', major: true, label: 'DSG / ATF Fluid & Filter' },
  '60k-coolant': { creditUsd: 150, bonusPts: 2, componentId: 'hv-battery-thermal-loop', major: true, label: 'Coolant Acidity & Loop Check' },
  '60k-belts': { creditUsd: 130, bonusPts: 2, componentId: 'timing-assembly', major: false, label: 'Auxiliary Belt & Tensioner' },
  '90k-timing': { creditUsd: 620, bonusPts: 8, componentId: 'timing-assembly', major: true, label: 'Timing Belt & Water Pump' },
  '90k-differential': { creditUsd: 210, bonusPts: 3, componentId: 'drivetrain-dmf-dsg', major: true, label: 'Differential / Transfer Oil' },
  '90k-cooling-hoses': { creditUsd: 180, bonusPts: 2, componentId: 'hv-battery-thermal-loop', major: false, label: 'Thermostat & Cooling Hoses' },
  '90k-rotors': { creditUsd: 340, bonusPts: 4, componentId: 'suspension-brakes-chassis', major: true, label: 'Brake Rotors & Pads Renewal' },
  '120k-o2': { creditUsd: 160, bonusPts: 2, componentId: 'dpf-egr-scr-injectors', major: false, label: 'Upstream Lambda Sensor' },
  '120k-dpf': { creditUsd: 540, bonusPts: 7, componentId: 'dpf-egr-scr-injectors', major: true, label: 'DPF Ash & Regen Service' },
  '120k-pcv': { creditUsd: 260, bonusPts: 4, componentId: 'gdi-intake-pcv-ignition', major: true, label: 'PCV Diaphragm / Oil Separator' },
  '120k-shocks': { creditUsd: 310, bonusPts: 4, componentId: 'suspension-brakes-chassis', major: true, label: 'Dampers & Strut Mounts' },
  '150k-trans-flush': { creditUsd: 480, bonusPts: 6, componentId: 'drivetrain-dmf-dsg', major: true, label: 'Full Torque Converter Exchange' },
  '150k-carbon': { creditUsd: 390, bonusPts: 5, componentId: 'gdi-intake-pcv-ignition', major: true, label: 'GDI Intake Walnut Decoke' },
  '150k-fuel-pump': { creditUsd: 460, bonusPts: 6, componentId: 'hpfp-turbo-vnt', major: true, label: 'HPFP Follower & Seal Renewal' },
  '150k-chassis': { creditUsd: 280, bonusPts: 3, componentId: 'suspension-brakes-chassis', major: false, label: 'Subframe & Motor Mounts' },
};

/**
 * Maps major milestone items to the primary component ID they satisfy in the Risk Matrix
 */
export const COMPONENT_MILESTONE_TRIGGERS = {
  'timing-assembly': ['90k-timing'],
  'drivetrain-dmf-dsg': ['60k-transmission', '150k-trans-flush'],
  'dpf-egr-scr-injectors': ['120k-dpf'],
  'hpfp-turbo-vnt': ['150k-fuel-pump'],
  'suspension-brakes-chassis': ['30k-brake-fluid', '90k-rotors', '120k-shocks'],
  'hv-battery-thermal-loop': ['60k-coolant', '90k-cooling-hoses'],
  'gdi-intake-pcv-ignition': ['120k-pcv', '150k-carbon'],
  // EV Component Triggers (supports checklist item IDs and milestone interval triggers)
  'ev-battery-soh': ['90k-ev-soh', '150k-ev-pack-integrity', 'ev-mile-60k', 'ev-mile-120k'],
  'ev-obc-iccu': ['90k-ev-obc-iccu', '150k-ev-power-electronics', 'ev-mile-60k', 'ev-mile-120k'],
  'ev-thermal-heatpump': ['60k-ev-coolant', '90k-ev-valve-actuator', '120k-ev-chiller-flush', 'ev-mile-30k', 'ev-mile-60k', 'ev-mile-90k', 'ev-mile-120k'],
  'ev-reduction-gear': ['60k-ev-reduction-oil', '150k-ev-drive-unit-seals', 'ev-mile-60k', 'ev-mile-120k'],
  'ev-curb-suspension': ['30k-ev-suspension', '120k-ev-subframe-mounts', '120k-ev-shocks', '150k-ev-chassis-refresh', 'ev-mile-30k', 'ev-mile-60k', 'ev-mile-90k', 'ev-mile-120k', 'ev-mile-150k'],
  'ev-torque-tires': ['15k-ev-tires', 'ev-mile-15k', 'ev-mile-30k', 'ev-mile-60k'],
  'ev-regen-brake-corrosion': ['15k-ev-brakes', '30k-ev-brake-fluid', '60k-ev-rotor-rust', '90k-ev-rotors', 'ev-mile-15k', 'ev-mile-30k', 'ev-mile-60k', 'ev-mile-90k', 'ev-mile-120k', 'ev-mile-150k'],
};

/**
 * Parses ?garage= query parameter into structured saved vehicle entries.
 * Skips unrecognized or invalid preset IDs.
 */
export function parseGarageParam(rawParam) {
  if (!rawParam || typeof rawParam !== 'string') return [];
  const entries = rawParam.split(',');
  const parsed = [];
  const seenPresetIds = new Set();

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(':');
    const presetId = parts[0]?.trim().toLowerCase();
    if (!presetId || seenPresetIds.has(presetId)) continue;

    const preset = VEHICLE_PRESETS.find((p) => p.id.toLowerCase() === presetId);
    if (!preset) continue;

    seenPresetIds.add(presetId);

    let purchasePriceUsd = preset.purchasePriceUsd;
    if (parts.length > 1) {
      const parsedPrice = Number(parts[1]);
      if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
        purchasePriceUsd = Math.round(parsedPrice);
      }
    }

    let odometerMiles = preset.defaultOdometerMiles;
    if (parts.length > 2) {
      const parsedMiles = Number(parts[2]);
      if (Number.isFinite(parsedMiles) && parsedMiles >= 0) {
        odometerMiles = Math.round(parsedMiles);
      }
    }

    parsed.push({
      presetId: preset.id,
      name: preset.name,
      odometerMiles,
      purchasePriceUsd,
      scheduleMode: 'preventative',
      completedCount: 0,
      savedAt: new Date().toISOString(),
    });
  }

  return parsed;
}

/**
 * Merges newly parsed garage vehicles into existing savedVehicles with deduplication.
 */
export function mergeGarageVehicles(existingVehicles = [], incomingVehicles = []) {
  if (!Array.isArray(incomingVehicles) || incomingVehicles.length === 0) {
    return Array.isArray(existingVehicles) ? [...existingVehicles] : [];
  }
  const merged = Array.isArray(existingVehicles) ? [...existingVehicles] : [];
  for (const inc of incomingVehicles) {
    const existingIndex = merged.findIndex((v) => v.presetId === inc.presetId);
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        purchasePriceUsd: inc.purchasePriceUsd || merged[existingIndex].purchasePriceUsd,
        odometerMiles: inc.odometerMiles || merged[existingIndex].odometerMiles,
      };
    } else {
      merged.push(inc);
    }
  }
  return merged;
}

/**
 * Extracts garage parameter string from window.location or arbitrary URL safely.
 */
export function extractGarageParamFromUrl(customUrl) {
  try {
    if (customUrl) {
      const search = customUrl.includes('?') ? customUrl.split('?')[1]?.split('#')[0] : customUrl;
      const params = new URLSearchParams(search);
      return params.get('garage');
    }
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const val = params.get('garage');
        if (val) return val;
      }
      if (window.location.hash && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const params = new URLSearchParams(hashQuery);
        const val = params.get('garage');
        if (val) return val;
      }
    }
  } catch {
    // Ignore in SSR / restricted environments
  }
  return null;
}

/**
 * Generates full shareable URL containing ?garage=...
 */
export function getShareableGarageUrl(savedVehicles = [], baseUrl) {
  let origin = 'https://mydriveledger.com';
  let pathname = '/';
  if (baseUrl) {
    try {
      const u = new URL(baseUrl, 'https://mydriveledger.com');
      origin = u.origin;
      pathname = u.pathname;
    } catch {}
  } else if (typeof window !== 'undefined' && window.location) {
    origin = window.location.origin || 'https://mydriveledger.com';
    pathname = window.location.pathname || '/';
  }

  if (!Array.isArray(savedVehicles) || savedVehicles.length === 0) {
    return `${origin}${pathname}`;
  }

  const tokens = savedVehicles
    .filter((v) => v && (v.presetId || v.id))
    .map((v) => {
      const id = (v.presetId || v.id).trim().toLowerCase();
      const price = Math.round(Number(v.purchasePriceUsd) || 0);
      const miles = Math.round(Number(v.odometerMiles) || 0);
      return `${id}:${price}:${miles}`;
    });

  if (tokens.length === 0) {
    return `${origin}${pathname}`;
  }

  return `${origin}${pathname}?garage=${tokens.join(',')}`;
}

const DEFAULT_GARAGE_STATE = {
  selectedPresetId: null,
  completedMilestonesByPreset: {},
  servicedComponentsByPreset: {},
  savedVehicles: [],
};

function loadGarageState() {
  let state = DEFAULT_GARAGE_STATE;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(GARAGE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state = {
            selectedPresetId:
              typeof parsed.selectedPresetId === 'string' ? parsed.selectedPresetId : null,
            completedMilestonesByPreset:
              parsed.completedMilestonesByPreset && typeof parsed.completedMilestonesByPreset === 'object'
                ? parsed.completedMilestonesByPreset
                : {},
            servicedComponentsByPreset:
              parsed.servicedComponentsByPreset && typeof parsed.servicedComponentsByPreset === 'object'
                ? parsed.servicedComponentsByPreset
                : {},
            savedVehicles: Array.isArray(parsed.savedVehicles) ? parsed.savedVehicles : [],
          };
        }
      }
    }
  } catch {
    // Ignore storage read errors in SSR / restricted test environments
  }

  // Check URL parameter on initial load
  const garageParam = extractGarageParamFromUrl();
  if (garageParam) {
    const incoming = parseGarageParam(garageParam);
    if (incoming.length > 0) {
      state.savedVehicles = mergeGarageVehicles(state.savedVehicles, incoming);
      if (!state.selectedPresetId) {
        state.selectedPresetId = incoming[0].presetId;
      }
    }
  }

  return state;
}

const GarageContext = createContext({
  isProviderActive: false,
  selectedPresetId: null,
  setSelectedPresetId: () => {},
  selectVehicle: () => {},
  completedMilestonesByPreset: {},
  servicedComponentsByPreset: {},
  savedVehicles: [],
  toggleMilestoneItem: () => {},
  toggleServicedComponent: () => {},
  saveVehicleToGarage: () => {},
  removeVehicleFromGarage: () => {},
  getCompletedMilestones: () => ({}),
  getServicedComponents: () => ({}),
  getShareableGarageUrl: () => 'https://mydriveledger.com/',
});

export function GarageProvider({ children }) {
  const [garageState, setGarageState] = useState(loadGarageState);

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(garageState));
      }
    } catch {
      // Ignore storage write errors in SSR / restricted test environments
    }
  }, [garageState]);

  useEffect(() => {
    const garageParam = extractGarageParamFromUrl();
    if (garageParam) {
      const incoming = parseGarageParam(garageParam);
      if (incoming.length > 0) {
        setGarageState((prev) => {
          const merged = mergeGarageVehicles(prev.savedVehicles, incoming);
          return {
            ...prev,
            savedVehicles: merged,
            selectedPresetId: prev.selectedPresetId || incoming[0].presetId,
          };
        });
      }
    }
  }, []);

  const toggleMilestoneItem = useCallback((presetId, itemId) => {
    if (!presetId || !itemId) return;
    setGarageState((prev) => {
      const currentForPreset = prev.completedMilestonesByPreset[presetId] || {};
      const nextChecked = !currentForPreset[itemId];
      const nextForPreset = {
        ...currentForPreset,
        [itemId]: nextChecked,
      };
      const nextCompletedByPreset = {
        ...prev.completedMilestonesByPreset,
        [presetId]: nextForPreset,
      };
      const completedCount = Object.values(nextForPreset).filter(Boolean).length;
      const nextSavedVehicles = prev.savedVehicles.map((v) =>
        v.presetId === presetId ? { ...v, completedCount } : v
      );
      return {
        ...prev,
        completedMilestonesByPreset: nextCompletedByPreset,
        savedVehicles: nextSavedVehicles,
      };
    });
  }, []);

  const toggleServicedComponent = useCallback((presetId, componentId) => {
    if (!presetId || !componentId) return;
    setGarageState((prev) => {
      const currentForPreset = prev.servicedComponentsByPreset[presetId] || {};
      const nextServiced = !currentForPreset[componentId];
      const nextForPreset = {
        ...currentForPreset,
        [componentId]: nextServiced,
      };
      return {
        ...prev,
        servicedComponentsByPreset: {
          ...prev.servicedComponentsByPreset,
          [presetId]: nextForPreset,
        },
      };
    });
  }, []);

  const saveVehicleToGarage = useCallback((vehicleData) => {
    if (!vehicleData || !vehicleData.presetId) return;
    setGarageState((prev) => {
      const presetId = vehicleData.presetId;
      const milestones = prev.completedMilestonesByPreset[presetId] || {};
      const serviced = prev.servicedComponentsByPreset[presetId] || {};
      const completedCount =
        typeof vehicleData.completedCount === 'number'
          ? vehicleData.completedCount
          : Object.values(milestones).filter(Boolean).length +
            Object.values(serviced).filter(Boolean).length;

      const entry = {
        presetId,
        name: vehicleData.name || presetId,
        odometerMiles: Number(vehicleData.odometerMiles) || 58000,
        purchasePriceUsd: Number(vehicleData.purchasePriceUsd) || 28000,
        scheduleMode: vehicleData.scheduleMode || 'preventative',
        completedCount,
        savedAt: vehicleData.savedAt || new Date().toISOString(),
      };

      const existsIndex = prev.savedVehicles.findIndex((v) => v.presetId === presetId);
      let nextSavedVehicles;
      if (existsIndex >= 0) {
        nextSavedVehicles = [...prev.savedVehicles];
        nextSavedVehicles[existsIndex] = entry;
      } else {
        nextSavedVehicles = [entry, ...prev.savedVehicles];
      }

      return {
        ...prev,
        selectedPresetId: presetId,
        savedVehicles: nextSavedVehicles,
      };
    });
  }, []);

  const setSelectedPresetId = useCallback((presetId) => {
    if (!presetId) return;
    setGarageState((prev) => {
      if (prev.selectedPresetId === presetId) return prev;
      return {
        ...prev,
        selectedPresetId: presetId,
      };
    });
  }, []);

  const selectVehicle = setSelectedPresetId;

  const removeVehicleFromGarage = useCallback((presetId) => {
    if (!presetId) return;
    setGarageState((prev) => ({
      ...prev,
      savedVehicles: prev.savedVehicles.filter((v) => v.presetId !== presetId),
    }));
  }, []);

  const getCompletedMilestones = useCallback(
    (presetId) => {
      if (!presetId) return {};
      return garageState.completedMilestonesByPreset[presetId] || {};
    },
    [garageState.completedMilestonesByPreset]
  );

  const getServicedComponents = useCallback(
    (presetId) => {
      if (!presetId) return {};
      return garageState.servicedComponentsByPreset[presetId] || {};
    },
    [garageState.servicedComponentsByPreset]
  );

  const getShareableUrl = useCallback(
    (customVehicles, baseUrl) => {
      const list = Array.isArray(customVehicles) ? customVehicles : garageState.savedVehicles;
      return getShareableGarageUrl(list, baseUrl);
    },
    [garageState.savedVehicles]
  );

  const value = useMemo(
    () => ({
      isProviderActive: true,
      selectedPresetId: garageState.selectedPresetId,
      setSelectedPresetId,
      selectVehicle,
      completedMilestonesByPreset: garageState.completedMilestonesByPreset,
      servicedComponentsByPreset: garageState.servicedComponentsByPreset,
      savedVehicles: garageState.savedVehicles,
      toggleMilestoneItem,
      toggleServicedComponent,
      saveVehicleToGarage,
      removeVehicleFromGarage,
      getCompletedMilestones,
      getServicedComponents,
      getShareableGarageUrl: getShareableUrl,
    }),
    [
      garageState,
      setSelectedPresetId,
      selectVehicle,
      toggleMilestoneItem,
      toggleServicedComponent,
      saveVehicleToGarage,
      removeVehicleFromGarage,
      getCompletedMilestones,
      getServicedComponents,
      getShareableUrl,
    ]
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  return useContext(GarageContext);
}

export default GarageContext;
