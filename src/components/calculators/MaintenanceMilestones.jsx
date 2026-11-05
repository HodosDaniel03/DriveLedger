import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, Wrench, AlertTriangle, ShieldCheck, AlertOctagon, Sparkles, Zap } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP } from '../../context/GarageContext';
import { Card, Pill } from '../common/OdometerPrimitives';
import { getPresetById } from '../../data/vehiclePresets.js';
import { resolvePowertrainType, isPureElectric } from '../../data/powertrainTypes.js';

export const ICE_MILESTONES = [
  {
    miles: 15000,
    title: '15,000 mi / 1-Year Minor Inspection',
    costRangeUsd: [120, 260],
    category: 'Routine Prevention',
    items: [
      { id: '15k-oil', name: 'Engine oil & OEM spec filter change', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-tires', name: 'Tire rotation & tread depth balance check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-brakes', name: 'Brake pad lining & rotor thickness visual inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-fluids', name: 'Top-off washer, coolant, and brake fluid reservoirs', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 30000,
    title: '30,000 mi / 2-Year Intermediate Service',
    costRangeUsd: [280, 550],
    category: 'Hydraulics & Filtration',
    items: [
      { id: '30k-brake-fluid', name: 'Brake fluid full hydraulic flush (DOT 4 / 5.1)', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-air-filters', name: 'Engine intake air filter & activated charcoal cabin filter', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-battery', name: '12V AGM auxiliary battery conductance test', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-suspension', name: 'Suspension ball joints, tie rod ends & CV boot inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 60000,
    title: '60,000 mi / 4-Year Major Service',
    costRangeUsd: [550, 1100],
    category: 'Powertrain Major Check',
    items: [
      { id: '60k-plugs', name: 'Iridium spark plugs (petrol) or fuel filter cartridge (diesel)', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      {
        id: '60k-transmission',
        name: 'Automatic / DSG transmission fluid & filter drain and fill',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "Lifetime Fluid / Sealed for Life" despite ZF 50k–60k mi mandate',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '60k-coolant', name: 'Engine coolant hydrometer acidity test & pH check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '60k-belts', name: 'Serpentine auxiliary drive belt & tensioner pulley check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 90000,
    title: '90,000 mi / 6-Year Critical Milestone',
    costRangeUsd: [850, 1850],
    category: 'Critical Engine Hardware',
    items: [
      {
        id: '90k-timing',
        name: 'Timing belt kit & water pump replacement (or chain stretch test)',
        omittedByOem: true,
        oemOmissionReason: 'Deferred by OEM to 150,000 mi or uninspected "lifetime" chain',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      {
        id: '90k-differential',
        name: 'Front & rear differential / transfer case gear oil renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealer manuals treat differentials as maintenance-free fill',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '90k-cooling-hoses', name: 'Radiator hoses, thermostat housing & heater core inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '90k-rotors', name: 'Complete brake disc rotor replacement and caliper slide lubrication', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 120000,
    title: '120,000 mi / 8-Year Longevity Refresh',
    costRangeUsd: [650, 1500],
    category: 'Emissions & Sensors',
    items: [
      { id: '120k-o2', name: 'Upstream broadband Oxygen (Lambda) sensor replacement', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      {
        id: '120k-dpf',
        name: 'DPF soot load ash measurement / chemical regeneration check',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM; dealers replace DPF only after permanent blockage lock',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL']
      },
      {
        id: '120k-pcv',
        name: 'PCV valve / oil separator diaphragm refresh',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealers replace only after rear main seal rupture or lean code P0171',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '120k-shocks', name: 'Dampers & strut top mounts rebound and leakage inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 150000,
    title: '150,000 mi / 10-Year High-Mileage Overhaul',
    costRangeUsd: [1100, 2400],
    category: 'Deep System Refresh',
    items: [
      {
        id: '150k-trans-flush',
        name: 'Complete transmission torque converter fluid exchange',
        omittedByOem: true,
        oemOmissionReason: 'Never scheduled in OEM service logs due to sealed gearbox marketing',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      {
        id: '150k-carbon',
        name: 'Direct-injection intake valve walnut shell carbon decoke',
        omittedByOem: true,
        oemOmissionReason: 'Omitted from all factory service schedules; causes P0300 misfires',
        applicablePowertrains: ['ICE_PETROL', 'HEV', 'PHEV'],
      },
      {
        id: '150k-fuel-pump',
        name: 'High-pressure fuel pump (HPFP) follower & seal renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled run-to-failure component in dealer checklists',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL'],
      },
      { id: '150k-chassis', name: 'Subframe bushings & motor mounts vibration damping test', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
];

export const EV_MILESTONES = [
  {
    miles: 15000,
    title: '15,000 mi / 1-Year Minor Inspection',
    costRangeUsd: [80, 190],
    category: 'EV Routine Prevention',
    items: [
      { id: '15k-ev-tires', name: 'EV tire rotation, alignment check & inside shoulder wear inspection', applicablePowertrains: ['EV'] },
      { id: '15k-ev-brakes', name: 'Brake pad slide pin inspection & friction sweep test', applicablePowertrains: ['EV'] },
      { id: '15k-ev-fluids', name: 'Top-off washer fluid, reservoir caps & low-temp battery cooling level', applicablePowertrains: ['EV'] },
      { id: '15k-ev-wipers', name: 'Wiper blades, safety interlock sensors & camera lens cleaning', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 30000,
    title: '30,000 mi / 2-Year Intermediate Service',
    costRangeUsd: [190, 420],
    category: 'Hydraulics, Cabin & Braking',
    items: [
      { id: '30k-ev-brake-fluid', name: 'Brake fluid full hydraulic flush (DOT 4 LV / 5.1)', applicablePowertrains: ['EV'] },
      { id: '30k-ev-cabin-filter', name: 'Cabin HEPA & activated charcoal microfilter replacement', applicablePowertrains: ['EV'] },
      { id: '30k-ev-battery', name: '12V AGM auxiliary battery conductance & state-of-health test', applicablePowertrains: ['EV'] },
      { id: '30k-ev-suspension', name: 'Suspension ball joints, high-mass hydro-bushings & CV boots inspection', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 60000,
    title: '60,000 mi / 4-Year Major Service',
    costRangeUsd: [320, 750],
    category: 'EV Powertrain & Reducer Service',
    items: [
      {
        id: '60k-ev-reduction-oil',
        name: 'Single-speed EV reduction gearbox fluid renewal & magnetic plug cleaning',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "sealed for life" despite high instant-torque gear shear',
        applicablePowertrains: ['EV'],
      },
      { id: '60k-ev-coolant', name: 'Traction battery thermal loop dielectric coolant hydrometer & pH acidity test', applicablePowertrains: ['EV'] },
      {
        id: '60k-ev-rotor-rust',
        name: 'Regenerative brake rotor de-glazing, rust removal & caliper slider service',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM; regenerative braking leaves friction discs prone to severe rust pitting',
        applicablePowertrains: ['EV'],
      },
      { id: '60k-ev-chassis-harness', name: 'High-voltage orange cable shielding, ground straps & port latch inspection', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 90000,
    title: '90,000 mi / 6-Year Critical Milestone',
    costRangeUsd: [450, 1100],
    category: 'Battery Degradation & Power Electronics',
    items: [
      { id: '90k-ev-soh', name: 'High-voltage battery capacity SoH % diagnostic scan & cell delta-V balance', applicablePowertrains: ['EV'] },
      {
        id: '90k-ev-obc-iccu',
        name: 'On-Board Charger (OBC / ICCU) thermal scan & AC/DC power electronics check',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealers replace ICCU only after complete charging breakdown',
        applicablePowertrains: ['EV'],
      },
      { id: '90k-ev-valve-actuator', name: 'Heat pump multi-way coolant switching valve (Octovalve) actuator response test', applicablePowertrains: ['EV'] },
      { id: '90k-ev-rotors', name: 'Brake disc rotor thickness verification, pad replacement & hardware renewal', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 120000,
    title: '120,000 mi / 8-Year Longevity Refresh',
    costRangeUsd: [550, 1350],
    category: 'Electrified Thermal & Chassis Refresh',
    items: [
      {
        id: '120k-ev-chiller-flush',
        name: 'High-voltage chiller loop & Octovalve dielectric coolant flush and vacuum refill',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "lifetime coolant", leading to valve motor sticking',
        applicablePowertrains: ['EV'],
      },
      { id: '120k-ev-subframe-mounts', name: 'Heavy curb-weight front/rear subframe hydro-bushings & motor mount test', applicablePowertrains: ['EV'] },
      { id: '120k-ev-shocks', name: 'Suspension dampers & strut top-mount rebound and leakage inspection', applicablePowertrains: ['EV'] },
      { id: '120k-ev-wheel-bearings', name: 'Front & rear heavy-axle wheel bearings play and acoustic telemetry check', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 150000,
    title: '150,000 mi / 10-Year High-Mileage Overhaul',
    costRangeUsd: [850, 1950],
    category: 'Deep Electrified System Overhaul',
    items: [
      {
        id: '150k-ev-power-electronics',
        name: 'Inverter DC-DC converter & high-voltage capacitor thermal degradation evaluation',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled in factory service schedules; causes loss of drive',
        applicablePowertrains: ['EV'],
      },
      { id: '150k-ev-drive-unit-seals', name: 'Drive unit input/output axle shaft oil seals & CV boot replacement', applicablePowertrains: ['EV'] },
      { id: '150k-ev-pack-integrity', name: 'Deep battery pack enclosure pressure test, breather valve & cell telemetry scan', applicablePowertrains: ['EV'] },
      { id: '150k-ev-chassis-refresh', name: 'Complete multi-link control arm hydro-bushing & ball joint assembly renewal', applicablePowertrains: ['EV'] },
    ],
  },
];

export const EV_MILESTONE_IMPACT_MAP = {
  '15k-ev-tires': { creditUsd: 50, bonusPts: 1, componentId: 'ev-torque-tires', major: false, label: 'EV Tire Rotation & Alignment' },
  '15k-ev-brakes': { creditUsd: 60, bonusPts: 1, componentId: 'ev-regen-brake-corrosion', major: false, label: 'Brake Slide Pin Sweep' },
  '15k-ev-fluids': { creditUsd: 35, bonusPts: 1, componentId: null, major: false, label: 'Coolant Level Top-Off' },
  '15k-ev-wipers': { creditUsd: 30, bonusPts: 1, componentId: null, major: false, label: 'Sensors & Wiper Service' },
  '30k-ev-brake-fluid': { creditUsd: 140, bonusPts: 2, componentId: 'ev-regen-brake-corrosion', major: true, label: 'DOT 4/5.1 Hydraulic Flush' },
  '30k-ev-cabin-filter': { creditUsd: 70, bonusPts: 1, componentId: null, major: false, label: 'HEPA Microfilter Service' },
  '30k-ev-battery': { creditUsd: 55, bonusPts: 1, componentId: null, major: false, label: '12V Auxiliary AGM Test' },
  '30k-ev-suspension': { creditUsd: 170, bonusPts: 2, componentId: 'ev-curb-suspension', major: false, label: 'Curb-Weight Bushings Check' },
  '60k-ev-reduction-oil': { creditUsd: 220, bonusPts: 4, componentId: 'ev-reduction-gear', major: true, label: 'Reduction Gear Fluid Renewal' },
  '60k-ev-coolant': { creditUsd: 160, bonusPts: 2, componentId: 'ev-thermal-heatpump', major: true, label: 'Dielectric Coolant Test' },
  '60k-ev-rotor-rust': { creditUsd: 190, bonusPts: 3, componentId: 'ev-regen-brake-corrosion', major: true, label: 'Brake De-Glazing & Rust Clean' },
  '60k-ev-chassis-harness': { creditUsd: 110, bonusPts: 2, componentId: null, major: false, label: 'HV Harness & Ground Check' },
  '90k-ev-soh': { creditUsd: 380, bonusPts: 5, componentId: 'ev-battery-soh', major: true, label: 'Battery SoH % Telemetry Scan' },
  '90k-ev-obc-iccu': { creditUsd: 310, bonusPts: 4, componentId: 'ev-obc-iccu', major: true, label: 'OBC/ICCU Power Electronics Check' },
  '90k-ev-valve-actuator': { creditUsd: 240, bonusPts: 3, componentId: 'ev-thermal-heatpump', major: false, label: 'Octovalve Switching Test' },
  '90k-ev-rotors': { creditUsd: 320, bonusPts: 4, componentId: 'ev-regen-brake-corrosion', major: true, label: 'Brake Rotor Renewal' },
  '120k-ev-chiller-flush': { creditUsd: 360, bonusPts: 5, componentId: 'ev-thermal-heatpump', major: true, label: 'Octovalve & Chiller Vacuum Flush' },
  '120k-ev-subframe-mounts': { creditUsd: 290, bonusPts: 4, componentId: 'ev-curb-suspension', major: false, label: 'High-Mass Subframe Damping Test' },
  '120k-ev-shocks': { creditUsd: 310, bonusPts: 4, componentId: 'ev-curb-suspension', major: true, label: 'Dampers & Strut Mounts' },
  '120k-ev-wheel-bearings': { creditUsd: 250, bonusPts: 3, componentId: null, major: false, label: 'Wheel Bearings Play Check' },
  '150k-ev-power-electronics': { creditUsd: 450, bonusPts: 6, componentId: 'ev-obc-iccu', major: true, label: 'Inverter & DC-DC Capacitor Scan' },
  '150k-ev-drive-unit-seals': { creditUsd: 280, bonusPts: 3, componentId: 'ev-reduction-gear', major: false, label: 'Drive Unit Shaft Seals' },
  '150k-ev-pack-integrity': { creditUsd: 420, bonusPts: 5, componentId: 'ev-battery-soh', major: true, label: 'Pack Pressure & Cell Scan' },
  '150k-ev-chassis-refresh': { creditUsd: 490, bonusPts: 6, componentId: 'ev-curb-suspension', major: true, label: 'High-Mass Suspension Overhaul' },
};

export const STANDARD_MILESTONES = ICE_MILESTONES;
STANDARD_MILESTONES.forPowertrain = (pt) => getMilestonesForPowertrain(pt);
STANDARD_MILESTONES.getEvMilestones = () => EV_MILESTONES;
STANDARD_MILESTONES.getIceMilestones = () => ICE_MILESTONES;

/**
 * Returns the powertrain-specific milestone list.
 * When isPureElectric is true, strictly suppresses 100% of internal combustion items
 * (oil, timing, plugs, transmission, DPF, PCV, GDI) and returns the EV roadmap.
 */
export function getMilestonesForPowertrain(powertrainOrVehicle) {
  const pType = resolvePowertrainType(powertrainOrVehicle);
  if (isPureElectric(pType)) {
    return EV_MILESTONES;
  }
  return ICE_MILESTONES;
}

export function filterMilestonesByPowertrain(milestones, powertrainType) {
  if (isPureElectric(powertrainType)) {
    return EV_MILESTONES;
  }
  return milestones || ICE_MILESTONES;
}

export default function MaintenanceMilestones({
  presetId = 'default-preset',
  currentOdometerMiles = 58000,
  scheduleMode = 'preventative',
  vehicle,
  powertrainType,
  drivingStyle = 'mixed',
  workshopTier = 'independent',
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const garage = useGarage();
  const [localCompletedItems, setLocalCompletedItems] = useState({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'due' | 'upcoming'

  const activePreset = vehicle || getPresetById(presetId);
  const resolvedPowertrain = powertrainType || (activePreset ? resolvePowertrainType(activePreset) : 'ICE_PETROL');
  const isEvVehicle = isPureElectric(resolvedPowertrain);

  // Wear multiplier accounting for highway vs city short-trip driving style
  const drivingWearMultiplier = useMemo(() => {
    if (drivingStyle === 'city') return 1.30;
    if (drivingStyle === 'highway') return 0.85;
    return 1.0; // mixed
  }, [drivingStyle]);

  const effectiveOdometerMiles = useMemo(() => {
    const safeOdo = Math.max(0, Number(currentOdometerMiles) || 0);
    return Math.round(safeOdo * drivingWearMultiplier);
  }, [currentOdometerMiles, drivingWearMultiplier]);

  const activeMilestones = useMemo(() => {
    return getMilestonesForPowertrain(resolvedPowertrain);
  }, [resolvedPowertrain]);

  const completedItems = garage?.isProviderActive
    ? garage.getCompletedMilestones(presetId)
    : localCompletedItems;

  const toggleItem = (itemId) => {
    if (garage?.isProviderActive) {
      garage.toggleMilestoneItem(presetId, itemId);
    } else {
      setLocalCompletedItems((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    }
  };

  // Compute live risk deduction ($) and reliability points (+pts) from checked items
  const { checkedCount, totalRiskDeductedUsd, totalPointsRestored } = useMemo(() => {
    let count = 0;
    let riskUsd = 0;
    let pts = 0;
    for (const [itemId, isDone] of Object.entries(completedItems)) {
      if (isDone) {
        count += 1;
        const impact = MILESTONE_IMPACT_MAP[itemId] || EV_MILESTONE_IMPACT_MAP[itemId];
        if (impact) {
          riskUsd += Number.isFinite(impact.creditUsd) ? Math.max(0, impact.creditUsd) : 0;
          pts += Number.isFinite(impact.bonusPts) ? Math.max(0, impact.bonusPts) : 0;
        }
      }
    }
    return {
      checkedCount: count,
      totalRiskDeductedUsd: Math.max(0, Math.round(riskUsd)),
      totalPointsRestored: Math.min(25, Math.max(0, Math.round(pts))),
    };
  }, [completedItems]);

  const filteredMilestones = activeMilestones.filter((m) => {
    const isPastDue = effectiveOdometerMiles >= m.miles;
    const isUpcoming = effectiveOdometerMiles < m.miles && m.miles - effectiveOdometerMiles <= 30000;
    if (activeFilter === 'due') return isPastDue;
    if (activeFilter === 'upcoming') return isUpcoming;
    return true;
  });

  return (
    <Card className="mt-8 border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-sm" aria-labelledby="milestones-heading">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border dark:border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="milestones-heading" className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-100 scroll-mt-28 lg:scroll-mt-32">
              Manufacturer Maintenance Milestone Roadmap
            </h2>
            <Pill tone={scheduleMode === 'oem' ? 'risk' : 'brand'}>
              {scheduleMode === 'oem' ? 'OEM Marketing View' : 'Schedule Planner'}
            </Pill>
            {isEvVehicle && (
              <Pill tone="good">
                Pure EV · <span className="font-mono tabular-nums ml-1 mr-1">0</span> ICE Fluids
              </Pill>
            )}
            {checkedCount > 0 && (
              <span
                data-testid="milestone-live-credit-badge"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <span className="font-mono tabular-nums">-{formatCurrency(totalRiskDeductedUsd)}</span> Risk Deducted · <span className="font-mono tabular-nums">+{totalPointsRestored}</span> pts Restored
                </span>
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-muted dark:text-zinc-400">
            Interactive checklist of scheduled inspections based on current odometer (<span className="font-mono tabular-nums">{formatDistance(currentOdometerMiles)}</span>). Check off completed services to dynamically reduce risk exposure.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Milestones' },
            { id: 'due', label: 'Due / Overdue' },
            { id: 'upcoming', label: 'Next 30k' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 text-xs rounded-lg font-sans font-semibold transition-colors duration-150 border ${
                activeFilter === f.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-surface-subtle text-muted border-border hover:border-border-strong hover:text-ink dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:text-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* OEM False Sense of Security Telemetry Warning Banner */}
      {scheduleMode === 'oem' ? (
        <div className="mt-5 rounded-2xl bg-amber-950 text-amber-100 p-5 border border-amber-600/40 shadow-sm">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-sans text-sm font-bold text-amber-200 tracking-tight">
                  Dealer Service Checklist: False Positive &amp; False Sense of Security
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-sans font-medium border border-amber-400/30">
                  OEM Telemetry Blindspot
                </span>
              </div>
              <p className="mt-1.5 font-sans text-xs text-amber-100/90 leading-relaxed">
                Dealership multi-point checklists prioritize superficial visual checks while omitting crucial thermodynamic wear items — such as <strong>transmission fluid changes ("sealed for life")</strong>, <strong>intake valve walnut decoking</strong>, and <strong>preventative timing assembly replacement</strong>. Vehicles stamped with "Full Dealer Service History" often suffer catastrophic gearbox, wet-belt, or valvetrain failures because factory schedules are tuned to minimize initial warranty-period fleet ownership figures rather than 150k+ mile mechanical longevity.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] font-sans font-medium text-amber-300">
                <span>⚠️ Red strikethrough items below are omitted or deferred by OEM dealer schedules.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-surface-subtle dark:bg-zinc-800/70 p-3.5 border border-border/80 dark:border-zinc-700 flex items-center justify-between text-xs font-sans text-muted dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Engineering Preventative Protocol Active:</strong> Includes all mechanical failure prevention thresholds recommended by component manufacturers (ZF, BorgWarner, Bosch).
            </span>
          </div>
          <span className="hidden sm:inline font-sans font-medium text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40">
            Zero Omitted Items
          </span>
        </div>
      )}

      {/* Roadmap Timeline */}
      <div className="mt-6 space-y-6">
        {filteredMilestones.map((m) => {
          const isOverdue = effectiveOdometerMiles >= m.miles;
          const isUpcoming = effectiveOdometerMiles < m.miles && m.miles - effectiveOdometerMiles <= 30000;
          const allChecked = m.items.every((it) => !!completedItems[it.id]);

          let statusTone = 'neutral';
          let statusLabel = 'Future Milestone';
          if (allChecked) {
            statusTone = 'good';
            statusLabel = 'Completed';
          } else if (isOverdue) {
            statusTone = 'risk';
            statusLabel = 'Action Required';
          } else if (isUpcoming) {
            statusTone = 'warn';
            statusLabel = 'Approaching Soon';
          }

          return (
            <div
              key={m.miles}
              className={`rounded-xl border p-4 transition-colors duration-150 ${
                allChecked
                  ? 'border-[#BFE8CF] bg-success-bg/40 dark:border-emerald-800/70 dark:bg-emerald-950/20'
                  : isOverdue
                  ? 'border-[#F7C1BB] bg-danger-bg/40 dark:border-red-800/70 dark:bg-red-950/20'
                  : 'border-border bg-surface-subtle dark:border-zinc-800 dark:bg-zinc-800/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60 dark:border-zinc-700/60">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono tabular-nums font-bold text-sm text-ink dark:text-zinc-100">
                    {formatDistance(m.miles)}
                  </span>
                  <span className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">· {m.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
                    Est: Indie <span className="font-mono tabular-nums">{formatCurrency(m.costRangeUsd[0])}</span> · Dealer <span className="font-mono tabular-nums">{formatCurrency(m.costRangeUsd[1])}</span>
                  </span>
                  <Pill tone={statusTone} className="text-[11px] font-medium">
                    {statusLabel}
                  </Pill>
                </div>
              </div>

              {/* Checklist items */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {m.items.map((it) => {
                  const checked = !!completedItems[it.id];
                  const isOmittedByOem = scheduleMode === 'oem' && it.omittedByOem;
                  const impact = MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id];

                  return (
                    <label
                      key={it.id}
                      className={`flex items-start gap-2.5 cursor-pointer font-sans text-xs text-body dark:text-zinc-300 hover:text-ink dark:hover:text-zinc-100 select-none p-2 rounded-lg transition-colors ${
                        isOmittedByOem
                          ? 'bg-red-50/70 border border-red-200/80 dark:bg-red-950/40 dark:border-red-800/60'
                          : checked
                          ? 'bg-emerald-50/70 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/50'
                          : 'hover:bg-surface/80 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(it.id)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong text-primary-600 focus:ring-primary-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        {isOmittedByOem ? (
                          <>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="line-through text-zinc-500 dark:text-zinc-400 font-medium decoration-red-600 decoration-2">
                                {it.name}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-sans bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40">
                                [OMITTED / DEFERRED BY OEM]
                              </span>
                            </div>
                            {it.oemOmissionReason && (
                              <p className="text-[11px] text-red-700 dark:text-red-300 font-sans font-medium mt-0.5 leading-tight">
                                ↳ {it.oemOmissionReason}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className={checked ? 'line-through text-faint dark:text-zinc-500' : 'font-medium'}>
                              {it.name}
                            </span>
                            {impact && (checked || impact.major) && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-semibold border ${
                                  checked
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60'
                                }`}
                              >
                                {checked ? '✓ ' : ''}
                                -{formatCurrency(impact.creditUsd)} · +{impact.bonusPts} pts
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
