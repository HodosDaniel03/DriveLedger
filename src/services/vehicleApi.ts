/**
 * ShiftMetric — External Automotive API Client
 * Integrates Free NHTSA APIs (vPIC, Recalls, Complaints) and EPA FuelEconomy.gov API
 */

export interface NhtsaRecallItem {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence?: string;
  remedy?: string;
  notes?: string;
}

export interface NhtsaComplaintSample {
  crash: boolean;
  fire: boolean;
  numberOfInjuries: number;
  dateOfIncident?: string;
  summary: string;
  component: string;
}

export interface NhtsaComplaintSummary {
  totalCount: number;
  topComponents: Array<{ component: string; count: number }>;
  sampleComplaints: NhtsaComplaintSample[];
}

export interface EpaFuelEconomyResult {
  source: string;
  combinedMpg: number;
  cityMpg: number;
  highwayMpg: number;
  lPer100Km: number;
  kwhPer100Km?: number;
  fuelType: string;
  co2TailpipeGpm?: number;
  vehicleDescription?: string;
}

export interface NhtsaModelItem {
  makeId: number;
  makeName: string;
  modelId: number;
  modelName: string;
}

const NHTSA_VPIC_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_RECALLS_BASE = 'https://api.nhtsa.gov/recalls';
const NHTSA_COMPLAINTS_BASE = 'https://api.nhtsa.gov/complaints';
const EPA_BASE = 'https://www.fueleconomy.gov/ws/rest';

/**
 * Normalizes query string parameters for URL construction
 */
function cleanParam(val: string | number): string {
  return encodeURIComponent(String(val).trim());
}

/**
 * Converts MPG (US) to L/100km
 */
export function convertMpgToL100Km(mpg: number): number {
  if (!mpg || mpg <= 0) return 0;
  return Number((235.214583 / mpg).toFixed(1));
}

/**
 * Fetches vehicle models for a given make (and optional year) from NHTSA vPIC API
 */
export async function fetchNhtsaModels(
  make: string,
  year?: number,
  signal?: AbortSignal
): Promise<NhtsaModelItem[]> {
  const url = year
    ? `${NHTSA_VPIC_BASE}/getmodelsformakeyear/make/${cleanParam(make)}/modelyear/${year}?format=json`
    : `${NHTSA_VPIC_BASE}/getmodelsformake/make/${cleanParam(make)}?format=json`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`NHTSA vPIC request failed with status: ${response.status}`);
  }
  const data = await response.json();
  const results = data.Results || [];

  return results.map((item: any) => ({
    makeId: item.Make_ID,
    makeName: item.Make_Name,
    modelId: item.Model_ID,
    modelName: item.Model_Name,
  }));
}

/**
 * Decodes a 17-character VIN using NHTSA vPIC API
 */
export async function decodeVinNhtsa(vin: string, signal?: AbortSignal): Promise<any> {
  const cleanVin = cleanParam(vin.trim().toUpperCase());
  const url = `${NHTSA_VPIC_BASE}/decodevinvalues/${cleanVin}?format=json`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`NHTSA VIN decode failed with status: ${response.status}`);
  }
  const data = await response.json();
  return data.Results?.[0] || null;
}

/**
 * Fetches factory recalls for make, model, and year from NHTSA Recalls API
 */
export async function fetchNhtsaRecalls(
  make: string,
  model: string,
  year: number,
  signal?: AbortSignal
): Promise<NhtsaRecallItem[]> {
  const url = `${NHTSA_RECALLS_BASE}/recallsByVehicle?make=${cleanParam(make)}&model=${cleanParam(model)}&modelYear=${year}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`NHTSA Recalls API failed with status: ${response.status}`);
  }
  const data = await response.json();
  const rawList = data.results || [];

  return rawList.map((r: any) => ({
    campaignNumber: r.NHTSACampaignNumber || r.campaignNumber || 'N/A',
    component: r.Component || r.component || 'Unknown Component',
    summary: r.Summary || r.summary || '',
    consequence: r.Conequence || r.Consequence || r.consequence || '',
    remedy: r.Remedy || r.remedy || '',
    notes: r.Notes || r.notes || '',
  }));
}

/**
 * Fetches owner complaints for make, model, and year from NHTSA Complaints API
 */
export async function fetchNhtsaComplaints(
  make: string,
  model: string,
  year: number,
  signal?: AbortSignal
): Promise<NhtsaComplaintSummary> {
  const url = `${NHTSA_COMPLAINTS_BASE}/complaintsByVehicle?make=${cleanParam(make)}&model=${cleanParam(model)}&modelYear=${year}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`NHTSA Complaints API failed with status: ${response.status}`);
  }
  const data = await response.json();
  const rawList = data.results || [];

  // Aggregate complaints by component
  const componentCounts: Record<string, number> = {};
  const sampleComplaints: NhtsaComplaintSample[] = [];

  for (const c of rawList) {
    const compName = (c.components || c.component || 'Other').trim();
    componentCounts[compName] = (componentCounts[compName] || 0) + 1;

    if (sampleComplaints.length < 5) {
      sampleComplaints.push({
        crash: Boolean(c.crash),
        fire: Boolean(c.fire),
        numberOfInjuries: Number(c.numberOfInjuries || 0),
        dateOfIncident: c.dateOfIncident || undefined,
        summary: (c.summary || '').trim(),
        component: compName,
      });
    }
  }

  const topComponents = Object.entries(componentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([component, count]) => ({ component, count }));

  return {
    totalCount: data.count || rawList.length,
    topComponents,
    sampleComplaints,
  };
}

/**
 * Fetches EPA FuelEconomy.gov official ratings for make, model, and year
 */
export async function fetchEpaFuelEconomy(
  make: string,
  model: string,
  year: number,
  signal?: AbortSignal
): Promise<EpaFuelEconomyResult | null> {
  // Step 1: Query vehicle options list
  const optionsUrl = `${EPA_BASE}/vehicle/menu/options?year=${year}&make=${cleanParam(make)}&model=${cleanParam(model)}`;
  const optResponse = await fetch(optionsUrl, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!optResponse.ok) {
    throw new Error(`EPA FuelEconomy options lookup failed: ${optResponse.status}`);
  }

  const optData = await optResponse.json();
  let items = optData.menuItem;
  if (!items) return null;
  if (!Array.isArray(items)) {
    items = [items];
  }
  if (items.length === 0) return null;

  const firstOption = items[0];
  const vehicleId = firstOption.value;

  // Step 2: Fetch detailed telemetry for the chosen vehicle ID
  const detailUrl = `${EPA_BASE}/vehicle/${cleanParam(vehicleId)}`;
  const detailResponse = await fetch(detailUrl, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!detailResponse.ok) {
    throw new Error(`EPA vehicle details lookup failed: ${detailResponse.status}`);
  }

  const details = await detailResponse.json();
  const combMpg = Number(details.comb08) || Number(details.comb08U) || 28;
  const cityMpg = Number(details.city08) || Number(details.city08U) || 24;
  const hwyMpg = Number(details.highway08) || Number(details.highway08U) || 34;
  const fuelType = details.fuelType || 'Gasoline';

  // For EVs / PHEVs, EPA provides cityE / combE (kWh/100mi)
  let kwhPer100Km: number | undefined;
  if (details.combE && Number(details.combE) > 0) {
    // 1 kWh/100mi = 0.621371 kWh/100km
    kwhPer100Km = Number((Number(details.combE) * 0.621371).toFixed(1));
  }

  return {
    source: 'EPA FuelEconomy.gov Official Database',
    combinedMpg: combMpg,
    cityMpg: cityMpg,
    highwayMpg: hwyMpg,
    lPer100Km: convertMpgToL100Km(combMpg),
    kwhPer100Km,
    fuelType,
    co2TailpipeGpm: details.co2TailpipeGpm ? Number(details.co2TailpipeGpm) : undefined,
    vehicleDescription: firstOption.text,
  };
}

export { vehicleDataService, VehicleDataService } from './vehicleDataService.js';

