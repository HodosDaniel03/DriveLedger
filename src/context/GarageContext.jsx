import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
};

const DEFAULT_GARAGE_STATE = {
  completedMilestonesByPreset: {},
  servicedComponentsByPreset: {},
  savedVehicles: [],
};

function loadGarageState() {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(GARAGE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
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
  return DEFAULT_GARAGE_STATE;
}

const GarageContext = createContext({
  isProviderActive: false,
  completedMilestonesByPreset: {},
  servicedComponentsByPreset: {},
  savedVehicles: [],
  toggleMilestoneItem: () => {},
  toggleServicedComponent: () => {},
  saveVehicleToGarage: () => {},
  removeVehicleFromGarage: () => {},
  getCompletedMilestones: () => ({}),
  getServicedComponents: () => ({}),
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
        savedVehicles: nextSavedVehicles,
      };
    });
  }, []);

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

  const value = useMemo(
    () => ({
      isProviderActive: true,
      completedMilestonesByPreset: garageState.completedMilestonesByPreset,
      servicedComponentsByPreset: garageState.servicedComponentsByPreset,
      savedVehicles: garageState.savedVehicles,
      toggleMilestoneItem,
      toggleServicedComponent,
      saveVehicleToGarage,
      removeVehicleFromGarage,
      getCompletedMilestones,
      getServicedComponents,
    }),
    [
      garageState,
      toggleMilestoneItem,
      toggleServicedComponent,
      saveVehicleToGarage,
      removeVehicleFromGarage,
      getCompletedMilestones,
      getServicedComponents,
    ]
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  return useContext(GarageContext);
}

export default GarageContext;
