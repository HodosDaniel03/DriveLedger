/**
 * Mercedes-Benz — Detailed Generation, Engine & Known Issues Database
 */

export const mercedesData = {
  id: 'mercedes-benz',
  name: 'Mercedes-Benz',
  group: 'German',
  country: 'Germany',
  countryFlag: '🇩🇪',
  models: [
    {
      id: 'mercedes-c-class',
      name: 'C-Class',
      brand: 'Mercedes-Benz',
      segment: 'D-Segment Premium Compact Executive',
      generations: [
        {
          id: 'c-class-w205',
          name: 'C-Class W205 / S205',
          generationCode: 'W205',
          years: { from: 2014, to: 2021 },
          bodyTypes: ['sedan', 'wagon', 'coupe'],
          platform: 'MRA',
          modelKnownIssues: [],
          engines: [
            {
              id: 'mercedes-c220d-om654-w205',
              name: 'Mercedes-Benz C 220 d W205 2.0d OM654 (194 HP)',
              engineCode: 'OM654 2.0 Turbodiesel',
              fuelType: 'Diesel',
              powerHp: 194,
              torqueNm: 400,
              displacementCc: 1950,
              years: { from: 2018, to: 2021 },
              transmission: ['9-speed automatic (9G-TRONIC)'],
              criticalDefectTag: '🚨 ROCKER ARM NEEDLE BEARING DISINTEGRATION & COOLANT VALVE',
              epaEfficiency: {
                combinedMpg: 46,
                cityMpg: 39,
                highwayMpg: 53,
                lPer100Km: 5.1,
              },
              knownIssues: [
                {
                  id: 'om654-camshaft-rocker-bearings',
                  name: 'Camshaft rocker arm needle bearing disintegration and camshaft lobe scouring',
                  severity: 'critical',
                  category: 'engine',
                  criticalMileage: {
                    minKm: 120000,
                    maxKm: 170000,
                    display: '120,000 - 170,000 km',
                  },
                  symptoms: 'Rhythmic metallic tapping from cylinder head proportional to engine speed; fine metallic glitter in oil filter pleats.',
                  prevention: 'Preemptively fit updated OEM rocker arm assemblies at 130,000 km; strictly observe 15,000 km oil changes with MB 229.71 oil.',
                  repairCost: {
                    parts: { min: 850, max: 1600 },
                    labor: { min: 650, max: 1200 },
                    currency: 'EUR',
                    formattedUsd: '$1,650 - $3,100',
                    formattedEur: '€1,500 - €2,800',
                    formattedHuf: '600,000 - 1,120,000 Ft',
                  },
                  affectedComponents: ['Rocker Arm Needle Bearings', 'Camshaft Assemblies', 'Hydraulic Lifters'],
                  obdCodes: ['P0016', 'P0300'],
                },
                {
                  id: 'om654-vacuum-coolant-pump',
                  name: 'Vacuum-controlled switchable coolant pump leak and glycol intrusion into vacuum circuit',
                  severity: 'high',
                  category: 'cooling',
                  criticalMileage: {
                    minKm: 80000,
                    maxKm: 130000,
                    display: '80,000 - 130,000 km',
                  },
                  symptoms: 'Unexplained coolant loss, vacuum solenoid failure, and turbo boost control faults from coolant ingestion into vacuum lines.',
                  prevention: 'Replace switchable coolant pump with revised gasket assembly and change vacuum switchover valves upon first sign of fluid loss.',
                  repairCost: {
                    parts: { min: 280, max: 550 },
                    labor: { min: 220, max: 450 },
                    currency: 'EUR',
                    formattedUsd: '$550 - $1,100',
                    formattedEur: '€500 - €1,000',
                    formattedHuf: '200,000 - 400,000 Ft',
                  },
                  affectedComponents: ['Vacuum Controlled Coolant Pump', 'Vacuum Switch Solenoid Valves'],
                  obdCodes: ['P0128', 'P2681'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
