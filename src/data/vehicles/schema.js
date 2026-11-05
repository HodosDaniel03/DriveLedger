import { z } from 'zod';

/**
 * Zod Schema for Vehicle Known Issues (Red Flags / Common Defects)
 * & Automotive Technical Specifications
 */

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const ComponentCategorySchema = z.enum([
  'engine',
  'fuel_system',
  'timing',
  'transmission',
  'electrical',
  'suspension',
  'cooling',
  'exhaust_aftertreatment',
  'battery_hv',
  'brakes',
  'body_chassis',
]);

export const CriticalMileageSchema = z.object({
  minKm: z.number().nonnegative(),
  maxKm: z.number().positive(),
  display: z.string().min(1),
}).refine((data) => data.minKm <= data.maxKm, {
  message: 'minKm must be less than or equal to maxKm',
});

export const CostBandSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
}).refine((data) => data.min <= data.max, {
  message: 'Cost minimum cannot exceed maximum',
});

export const RepairCostSchema = z.object({
  parts: CostBandSchema,
  labor: CostBandSchema,
  currency: z.enum(['USD', 'EUR', 'HUF']).default('EUR'),
  formattedUsd: z.string().min(1),
  formattedEur: z.string().min(1),
  formattedHuf: z.string().min(1),
});

export const KnownIssueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  severity: SeveritySchema,
  category: ComponentCategorySchema,
  criticalMileage: CriticalMileageSchema,
  symptoms: z.string().min(5),
  prevention: z.string().min(5),
  repairCost: RepairCostSchema,
  affectedComponents: z.array(z.string()).min(1),
  obdCodes: z.array(z.string()).default([]),
});

export const EpaEfficiencySchema = z.object({
  combinedMpg: z.number().positive(),
  cityMpg: z.number().positive(),
  highwayMpg: z.number().positive(),
  lPer100Km: z.number().positive(),
  kwhPer100Km: z.number().positive().optional(),
  annualFuelCostUsd: z.number().positive().optional(),
});

export const EngineVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  engineCode: z.string().min(1),
  fuelType: z.enum(['Diesel', 'Gasoline', 'Hybrid', 'Plug-in Hybrid', 'Electric']),
  powerHp: z.number().positive(),
  torqueNm: z.number().positive().optional(),
  displacementCc: z.number().positive().optional(),
  years: z.object({
    from: z.number().int().min(1980),
    to: z.number().int().min(1980).nullable(),
  }),
  transmission: z.array(z.string()).min(1),
  criticalDefectTag: z.string().min(1),
  knownIssues: z.array(KnownIssueSchema).min(1),
  epaEfficiency: EpaEfficiencySchema,
  defaultOdometerMiles: z.number().nonnegative().optional(),
  annualDistanceMiles: z.number().positive().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const ModelGenerationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  generationCode: z.string().min(1),
  years: z.object({
    from: z.number().int().min(1980),
    to: z.number().int().min(1980).nullable(),
  }),
  bodyTypes: z.array(z.string()).min(1),
  platform: z.string().optional(),
  modelKnownIssues: z.array(KnownIssueSchema).default([]),
  engines: z.array(EngineVariantSchema).min(1),
});

export const VehicleModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  segment: z.string().min(1),
  generations: z.array(ModelGenerationSchema).min(1),
});

export const VehicleBrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: z.string().min(1),
  country: z.string().min(1),
  countryFlag: z.string().min(1),
  models: z.array(VehicleModelSchema).min(1),
});

export const NhtsaRecallItemSchema = z.object({
  campaignNumber: z.string(),
  component: z.string(),
  summary: z.string(),
  consequence: z.string().optional(),
  remedy: z.string().optional(),
  notes: z.string().optional(),
});

export const NhtsaComplaintSummarySchema = z.object({
  totalCount: z.number().nonnegative(),
  topComponents: z.array(
    z.object({
      component: z.string(),
      count: z.number().nonnegative(),
    })
  ),
  sampleComplaints: z.array(
    z.object({
      crash: z.boolean(),
      fire: z.boolean(),
      numberOfInjuries: z.number().nonnegative(),
      dateOfIncident: z.string().optional(),
      summary: z.string(),
      component: z.string(),
    })
  ),
});

export const UnifiedVehicleIntelligenceSchema = z.object({
  brand: z.string(),
  model: z.string(),
  generation: z.string().optional(),
  engine: EngineVariantSchema.optional(),
  knownIssues: z.array(KnownIssueSchema),
  nhtsaRecalls: z.array(NhtsaRecallItemSchema),
  nhtsaComplaints: NhtsaComplaintSummarySchema,
  fuelEconomy: z.object({
    source: z.string(),
    combinedMpg: z.number().positive(),
    cityMpg: z.number().positive(),
    highwayMpg: z.number().positive(),
    lPer100Km: z.number().positive(),
    kwhPer100Km: z.number().positive().optional(),
    fuelType: z.string(),
  }),
  metadata: z.object({
    source: z.enum(['memory-cache', 'storage-cache', 'live-api', 'curated-fallback']),
    responseTimeMs: z.number().nonnegative(),
    timestamp: z.number().positive(),
  }),
});
