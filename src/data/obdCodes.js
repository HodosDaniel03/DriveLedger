/**
 * ShiftMetric — 20 High-CPC OBD-II Diagnostic Dossiers & Live PID Telemetry Database
 * Includes First-Principles Live Telemetry Checks to prevent unnecessary parts replacement.
 */

export const LABOR_RATE_TIERS = [
  {
    id: 'dealership',
    label: 'Main Dealership',
    shortLabel: 'Dealership',
    rateUsdPerHr: 185,
    partsMarkupFactor: 1.25, // OEM counter retail pricing
    description: 'Factory ISTA/ODIS/IDS diagnostics + genuine OEM boxed components',
  },
  {
    id: 'independent',
    label: 'Independent Specialist',
    shortLabel: 'Independent',
    rateUsdPerHr: 115,
    partsMarkupFactor: 1.0, // OE-Supplier (Bosch, Continental, Pierburg, ZF) pricing
    description: 'Marque specialist technician + Tier-1 OEM supplier components',
  },
  {
    id: 'diy',
    label: 'DIY Garage (Parts Only)',
    shortLabel: 'DIY Garage',
    rateUsdPerHr: 0,
    partsMarkupFactor: 0.85, // Direct wholesale parts pricing, $0 labor
    description: 'Owner diagnostic verification via OBD-II scanner + wholesale parts',
  },
];

export const OBD_SYSTEM_CATEGORIES = [
  'All Systems',
  'Emissions & Exhaust',
  'Forced Induction & Air',
  'Fuel & Air Induction',
  'Engine Mechanical & Ignition',
  'Transmission & Drivetrain',
  'Cooling & Thermal',
  'Hybrid & Network Telemetry',
];

export const OBD_CODES = [
  {
    code: 'P0420',
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    systemCategory: 'Emissions & Exhaust',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Illuminated Check Engine Light (MIL) without immediate drivability loss',
      'Sulfur / rotten-egg exhaust odor after highway load',
      'Failed state/MOT/TÜV OBD emissions readiness inspection',
      'Slight reduction in high-RPM exhaust flow if monolith is partially melted',
    ],
    laborHoursRange: [1.0, 3.8],
    partsCostRangeUsd: [95, 1650],
    rootCauses: [
      {
        cause: 'Degraded Three-Way Catalytic Converter Cerium/Platinum Washcoat (Bank 1)',
        probabilityPct: 54,
        partsCostUsd: [680, 1650],
        laborHours: [2.2, 3.8],
        componentNote: 'Verify upstream misfires or oil consumption first so the new catalyst is not poisoned.',
      },
      {
        cause: 'Downstream Post-Cat Oxygen Sensor (B1S2) Lazy Voltage Switching',
        probabilityPct: 24,
        partsCostUsd: [95, 220],
        laborHours: [0.8, 1.3],
        componentNote: 'Aging zirconia sensor reports false oscillation mimicking oxygen breakthrough.',
      },
      {
        cause: 'Exhaust Manifold Flex-Pipe or Flange Pinhole Leak Upstream of B1S2',
        probabilityPct: 15,
        partsCostUsd: [60, 290],
        laborHours: [1.0, 2.0],
        componentNote: 'Venturi effect draws ambient oxygen into exhaust stream between sensors.',
      },
      {
        cause: 'Unresolved Rich/Lean Fuel Trim or Coolant/Oil Contamination',
        probabilityPct: 7,
        partsCostUsd: [110, 420],
        laborHours: [1.2, 2.5],
        componentNote: 'Leaking injector or burning >1 qt/1,500 mi coats catalyst substrate in phosphorus.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'O2 Sensor B1S1 (Upstream Equivalence Ratio / mA)',
        'O2 Sensor B1S2 (Downstream Voltage 0.1V–0.9V)',
        'Catalyst Temperature Bank 1 Sensor 1 (°C)',
      ],
      baselineValues:
        'At 2,200 RPM steady cruise (catalyst >450°C), upstream B1S1 should rapidly oscillate (0.1V–0.85V) while downstream B1S2 must remain steady between 0.65V and 0.78V.',
      diagnosticProtocol:
        'Graph B1S1 and B1S2 simultaneously after a 10-minute highway warmup. If B1S2 mirrors the rapid sine-wave frequency of B1S1, oxygen storage capacity (OSC) is depleted. Before condemning a $1,500 converter, perform a propane enrichment/snap-throttle test to confirm B1S2 holds 0.85V.',
      costTrapWarning:
        '31% of P0420 catalytic converter replacements fail within 14 months because workshops skip checking Long-Term Fuel Trims (LTFT) or exhaust flange leaks.',
    },
  },
  {
    code: 'P2002',
    title: 'Diesel Particulate Filter (DPF) Efficiency Below Threshold (Bank 1)',
    systemCategory: 'Emissions & Exhaust',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Flashing glow-plug / DPF warning lamp and forced ECU limp-home torque derate',
      'Cooling fans running at 100% duty cycle for 5 minutes after engine shutdown',
      'Elevated idle speed (950–1,050 RPM) and acrid hot exhaust smell from frequent aborted regens',
      'Rising crankcase oil level on dipstick due to post-injection diesel fuel dilution',
    ],
    laborHoursRange: [1.2, 6.5],
    partsCostRangeUsd: [85, 2450],
    rootCauses: [
      {
        cause: 'Failed DPF Differential Pressure Sensor (G450) or Cracked Silicone Impulse Hose',
        probabilityPct: 44,
        partsCostUsd: [85, 240],
        laborHours: [0.8, 1.5],
        componentNote: 'Exhaust condensation freezes/corrodes piezoresistive membrane in pressure sensor.',
      },
      {
        cause: 'Soot/Ash-Loaded DPF Requiring Off-Car Pneumatic/Thermal Flush or Replacement',
        probabilityPct: 32,
        partsCostUsd: [450, 2450],
        laborHours: [3.5, 6.5],
        componentNote: 'Caused by repeated urban short trips or failed thermostat preventing >75°C coolant temp.',
      },
      {
        cause: 'Split Intercooler Boost Hose or Stuck EGR Valve Causing Excess Soot Generation',
        probabilityPct: 16,
        partsCostUsd: [160, 580],
        laborHours: [1.8, 3.5],
        componentNote: 'Rich air-fuel ratio under boost fills the DPF 4x faster than normal regeneration capacity.',
      },
      {
        cause: 'Cracked Ceramic DPF Monolith Substrate (Soot inside Tailpipe)',
        probabilityPct: 8,
        partsCostUsd: [1150, 2450],
        laborHours: [3.5, 6.0],
        componentNote: 'If black soot coats the rear tailpipe tip on a DPF diesel, the internal silicon-carbide wall is cracked.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'DPF Differential Pressure (kPa / mbar)',
        'DPF Soot Mass Calculated vs. Measured (g)',
        'DPF Oil Ash Residue Mass (g / L)',
        'Exhaust Gas Temp (EGT) Sensors 1, 2 & 3 (°C)',
      ],
      baselineValues:
        'Key ON / Engine OFF: 0.0 kPa. Warm Idle (800 RPM): 0.5 to 1.8 kPa (5–18 mbar). 2,500 RPM no-load: < 6.5 kPa (65 mbar).',
      diagnosticProtocol:
        'Check DPF Differential Pressure PID with Key ON, Engine OFF first—if it reads -3 kPa or +8 kPa with the engine stopped, the $110 pressure sensor is drifted, NOT the $1,800 DPF! Next, verify Coolant Temp reaches >82°C; a stuck-open thermostat (P0128) silently blocks all ECU DPF regenerations.',
      costTrapWarning:
        'Never authorize an $1,800+ DPF replacement without first inspecting the differential pressure sensor zero-offset and rubber reference hoses.',
    },
  },
  {
    code: 'P0299',
    title: 'Turbocharger / Supercharger "A" Underboost Condition',
    systemCategory: 'Forced Induction & Air',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Sudden loss of power under highway acceleration or uphill load (ECU cuts boost)',
      'Audible whooshing / hissing air leak under boost between 1,800 and 3,200 RPM',
      'Metallic wastegate rattle on deceleration or sluggish low-RPM spool',
      'Power temporarily returns after cycling ignition OFF and ON',
    ],
    laborHoursRange: [1.0, 6.0],
    partsCostRangeUsd: [65, 2200],
    rootCauses: [
      {
        cause: 'Split Charge-Air / Intercooler Boost Hose or Ruptured Diverter Valve Diaphragm',
        probabilityPct: 42,
        partsCostUsd: [65, 280],
        laborHours: [1.0, 2.2],
        componentNote: 'Pressurized boost air escapes between turbo compressor outlet and throttle body.',
      },
      {
        cause: 'Carbon-Stuck Variable Nozzle Turbine (VNT) Vanes or Worn Wastegate Flapper Bushing',
        probabilityPct: 28,
        partsCostUsd: [480, 2200],
        laborHours: [3.5, 6.0],
        componentNote: 'Common on 2.0T EA888/B48 wastegate pivots and TDI/EcoBlue VNT mechanisms.',
      },
      {
        cause: 'Faulty N75 Boost Pressure Solenoid Converter or Cracked Vacuum Actuator Line',
        probabilityPct: 20,
        partsCostUsd: [75, 210],
        laborHours: [0.8, 1.5],
        componentNote: 'Loss of vacuum or PWM control prevents turbo actuator from pulling full boost stroke.',
      },
      {
        cause: 'Clogged DPF / Catalyst Creating Excessive Exhaust Backpressure',
        probabilityPct: 10,
        partsCostUsd: [350, 1400],
        laborHours: [2.0, 4.5],
        componentNote: 'High turbine outlet backpressure stalls compressor wheel acceleration.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Commanded Boost Pressure / MAP Desired (kPa)',
        'Actual Manifold Absolute Pressure / MAP Actual (kPa)',
        'Wastegate / VNT Actuator Duty Cycle (%)',
        'Barometric Pressure (kPa)',
      ],
      baselineValues:
        'At 3rd-gear full-throttle pull (2,000–3,500 RPM), Actual MAP must track Commanded MAP within ±12 kPa within 1.5 seconds while Wastegate Duty settles at 55%–75%.',
      diagnosticProtocol:
        'Log Commanded vs. Actual MAP during a 2,000-to-3,500 RPM pull while monitoring Mass Air Flow (MAF g/s). If Actual MAP is 40 kPa low AND MAF g/s is higher than expected (with negative fuel trims), boost is leaking out of a charge pipe after the MAF sensor. Do not replace the turbocharger!',
      costTrapWarning:
        'Over 40% of P0299 fault codes are caused by a $90 diverter valve or $120 intercooler O-ring/hose—not a blown $2,000 turbocharger.',
    },
  },
  {
    code: 'P0171',
    title: 'Fuel Trim System Too Lean (Bank 1)',
    systemCategory: 'Fuel & Air Induction',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Rough, hunting, or surging idle speed when engine is fully warm',
      'Hesitation or flat spot on initial throttle tip-in',
      'High-pitched whistling noise from engine bay (ruptured PCV membrane)',
      'Pinging / pre-ignition knock under high-load acceleration',
    ],
    laborHoursRange: [1.0, 3.5],
    partsCostRangeUsd: [45, 680],
    rootCauses: [
      {
        cause: 'Unmetered Intake Vacuum Leak (Cracked Breather Hose, Intake Gasket, or Brake Booster Line)',
        probabilityPct: 45,
        partsCostUsd: [45, 260],
        laborHours: [1.0, 2.5],
        componentNote: 'Air enters downstream of the MAF sensor, forcing ECU to add +20% fuel at idle.',
      },
      {
        cause: 'Ruptured Crankcase PCV Oil Separator Diaphragm (Common on VW/Audi/BMW/Ford)',
        probabilityPct: 26,
        partsCostUsd: [110, 320],
        laborHours: [1.0, 2.0],
        componentNote: 'Torn internal fluorosilicone valve pulls crankcase air directly into intake manifold.',
      },
      {
        cause: 'Contaminated Hot-Wire Mass Air Flow (MAF) Sensor Element',
        probabilityPct: 19,
        partsCostUsd: [95, 280],
        laborHours: [0.5, 1.0],
        componentNote: 'Under-reports incoming air mass under load (lean trim increases with RPM).',
      },
      {
        cause: 'Weak Low-Pressure In-Tank Fuel Pump or Clogged Fuel Filter',
        probabilityPct: 10,
        partsCostUsd: [220, 680],
        laborHours: [1.8, 3.5],
        componentNote: 'Starves engine of fuel volume at high RPM / high load.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Short-Term Fuel Trim Bank 1 — STFT (%)',
        'Long-Term Fuel Trim Bank 1 — LTFT (%)',
        'Mass Air Flow Rate — MAF (g/s)',
      ],
      baselineValues:
        'Combined Fuel Trim (STFT + LTFT) should remain within ±8%. P0171 triggers when LTFT consistently exceeds +20% to +25%.',
      diagnosticProtocol:
        'Perform the 2-Minute Idle vs. 2,500 RPM Fuel Trim Test: Note STFT + LTFT at warm idle (750 RPM), then hold engine at 2,500 RPM in Park/Neutral for 30 seconds. If Total Trim drops from +24% at idle down to +4% at 2,500 RPM, you have a 100% confirmed vacuum/PCV leak. If Total Trim WORSENS at 2,500 RPM, suspect a dirty MAF sensor or weak fuel delivery.',
      costTrapWarning:
        'Workshops frequently sell oxygen sensors for P0171. The O2 sensor is almost never faulty—it is accurately reporting excess oxygen from an intake leak.',
    },
  },
  {
    code: 'P0300',
    title: 'Random / Multiple Cylinder Misfire Detected',
    systemCategory: 'Engine Mechanical & Ignition',
    severity: 'CRITICAL - STOP DRIVING',
    symptoms: [
      'Flashing Check Engine Light under load (raw fuel entering hot catalytic converter)',
      'Pronounced engine vibration, stumbling, and exhaust popping',
      'Hard cold starts followed by rough idle for 30–60 seconds',
      'Strong smell of unburned gasoline from tailpipe',
    ],
    laborHoursRange: [1.2, 5.5],
    partsCostRangeUsd: [120, 1450],
    rootCauses: [
      {
        cause: 'Worn Spark Plugs & Failing Ignition Coil Packs (Thermal Breakdown)',
        probabilityPct: 38,
        partsCostUsd: [140, 460],
        laborHours: [1.0, 2.2],
        componentNote: 'High secondary ignition resistance causes spark blowout under turbo boost.',
      },
      {
        cause: 'Heavy GDI Intake Valve Carbon Coking Restricting Cold-Start Airflow Tumble',
        probabilityPct: 27,
        partsCostUsd: [220, 650],
        laborHours: [3.0, 5.5],
        componentNote: 'Requires intake manifold removal and walnut-shell media blasting.',
      },
      {
        cause: 'Vacuum / PCV Leak or EGR Stuck Open Affecting All Cylinders Equally',
        probabilityPct: 21,
        partsCostUsd: [90, 380],
        laborHours: [1.2, 2.5],
        componentNote: 'Global air/fuel ratio imbalance affects every cylinder rather than one.',
      },
      {
        cause: 'Leaking Direct-Injection Piezo/Solenoid Fuel Injectors or Low Fuel Rail Pressure',
        probabilityPct: 14,
        partsCostUsd: [380, 1450],
        laborHours: [2.5, 5.0],
        componentNote: 'Fouled injector pintle drips fuel after shutdown and sprays poorly when cold.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Mode $06 Cylinder Misfire Counters (Cylinders 1–6)',
        'Freeze-Frame Coolant Temp (°C) & Engine Load (%) at Misfire',
        'Fuel Rail Pressure Actual vs. Desired (MPa / bar)',
      ],
      baselineValues:
        'Mode $06 EWMA misfire counts should be 0–2 per driving cycle. Freeze-frame reveals whether misfire occurs only at cold start (<35°C) or under high boost load (>75%).',
      diagnosticProtocol:
        'Read Mode $06 per-cylinder misfire counters before buying parts. If misfires occur ONLY during the first 45 seconds of a cold start on a GDI engine, suspect intake valve carbon buildup or a leaking injector. If misfires spike ONLY at high load/boost, suspect spark plug gap erosion or ignition coils.',
      costTrapWarning:
        'Driving with a flashing MIL (P0300) for even 10 miles can melt a $1,600 catalytic converter core above 1,000°C.',
    },
  },
  {
    code: 'P0401',
    title: 'Exhaust Gas Recirculation (EGR) Flow Insufficient Detected',
    systemCategory: 'Emissions & Exhaust',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Check Engine Light illuminated after steady 45–65 mph cruise',
      'Increased diesel combustion knock or gasoline part-throttle pinging',
      'Failed NOx emissions inspection and reduced fuel economy',
      'Occasional hesitation during light throttle transitions',
    ],
    laborHoursRange: [1.5, 5.5],
    partsCostRangeUsd: [95, 1150],
    rootCauses: [
      {
        cause: 'Carbon & Oil-Soot Clogged EGR Cooler Passages and Intake Ports',
        probabilityPct: 48,
        partsCostUsd: [95, 480],
        laborHours: [2.0, 4.5],
        componentNote: 'PCV oil vapors mix with EGR soot to form thick asphalt-like restriction.',
      },
      {
        cause: 'Stuck or Carbon-Bound Electronic EGR Valve Pintle / Position Sensor',
        probabilityPct: 32,
        partsCostUsd: [180, 680],
        laborHours: [1.8, 4.0],
        componentNote: 'Stepper motor cannot overcome hardened carbon ring on valve seat.',
      },
      {
        cause: 'Blocked Differential Pressure Feedback EGR (DPFE) Sensor Passages or Vacuum Solenoid',
        probabilityPct: 14,
        partsCostUsd: [85, 240],
        laborHours: [1.0, 1.8],
        componentNote: 'Sensor ports plug with condensate, blinding the ECU to actual EGR flow.',
      },
      {
        cause: 'Failed Low-Pressure EGR Cooler Bypass Flap (TDI / EcoBlue)',
        probabilityPct: 6,
        partsCostUsd: [390, 1150],
        laborHours: [3.5, 5.5],
        componentNote: 'Seized stainless shaft on integrated EGR cooler housing.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Commanded EGR Duty Cycle (%) vs. Actual EGR Position (%)',
        'Mass Air Flow (MAF g/s) Response to EGR Opening',
        'Manifold Absolute Pressure (MAP kPa) Delta',
      ],
      baselineValues:
        'When EGR is commanded from 0% to 40% at warm idle, fresh intake air measured by the MAF sensor must drop by 30%–45% immediately as inert exhaust gas displaces fresh air.',
      diagnosticProtocol:
        'Monitor MAF (g/s) while EGR opens. If Actual EGR Position PID tracks Commanded EGR (e.g. 38%), yet MAF g/s does not drop at all, the EGR valve is moving mechanically but the EGR cooler or intake manifold passage is 100% plugged with carbon. Cleaning the passage saves replacing a working EGR valve!',
      costTrapWarning:
        'Replacing the EGR valve without cleaning the EGR cooler matrix and manifold neck causes P0401 to return within 500 miles.',
    },
  },
  {
    code: 'P0087',
    title: 'Fuel Rail / System Pressure — Too Low',
    systemCategory: 'Fuel & Air Induction',
    severity: 'CRITICAL - STOP DRIVING',
    symptoms: [
      'Immediate limp mode and severe power cut under acceleration',
      'Extended cranking time (5–8 seconds) before engine fires',
      'Engine stalling under highway passing or uphill load',
      'Risk of catastrophic injector starvation on common-rail diesel systems',
    ],
    laborHoursRange: [1.0, 6.5],
    partsCostRangeUsd: [65, 2850],
    rootCauses: [
      {
        cause: 'Restricted Fuel Filter or Failing Low-Pressure Lift Pump in Fuel Tank',
        probabilityPct: 39,
        partsCostUsd: [65, 490],
        laborHours: [1.0, 2.8],
        componentNote: 'Always verify low-pressure supply (4.5–6.0 bar) before condemning the HPFP.',
      },
      {
        cause: 'Worn High-Pressure Fuel Pump (HPFP) Cam Follower / Roller Tappet or Metering Solenoid (N290)',
        probabilityPct: 33,
        partsCostUsd: [340, 1650],
        laborHours: [2.2, 5.0],
        componentNote: 'Inspect fuel filter housing for metallic glitter on Bosch CP4 diesel pumps.',
      },
      {
        cause: 'Drifted Fuel Rail High-Pressure Sensor (G247) or Pressure Relief Valve Leaking to Return',
        probabilityPct: 18,
        partsCostUsd: [95, 290],
        laborHours: [1.0, 2.0],
        componentNote: 'Mechanical rail relief valve weakens and dumps high pressure back to tank.',
      },
      {
        cause: 'Excessive Injector Back-Leakage (Worn Piezo/Solenoid Control Valve)',
        probabilityPct: 10,
        partsCostUsd: [420, 2850],
        laborHours: [2.5, 6.5],
        componentNote: 'Single injector dumping rail volume into the return line prevents rail pressure build.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Fuel Rail Pressure Commanded / Specified (MPa / bar)',
        'Fuel Rail Pressure Actual (MPa / bar)',
        'Low-Pressure Fuel Supply / Lift Pump Duty Cycle (%)',
        'HPFP Fuel Volume Regulator Control Current (mA / %)',
      ],
      baselineValues:
        'GDI Idle: 4.0–5.5 MPa (40–55 bar); Full Load: 15–35 MPa. Common-Rail Diesel Idle: 25–32 MPa (250–320 bar); Full Load: 160–200 MPa (1,600–2,000 bar).',
      diagnosticProtocol:
        'Compare Commanded vs. Actual Fuel Rail Pressure during cranking and full-load acceleration while watching Low-Pressure Pump Duty Cycle. If Low-Pressure Duty Cycle maxes out at >85% before high-pressure drops, a clogged $65 fuel filter or weak lift pump is starving the HPFP.',
      costTrapWarning:
        'On 2.0 TDI / EcoBlue / BMW / Ford diesels, remove the HPFP metering valve to check for micron metal shavings before cranking repeatedly—catching swarf early saves $4,000 in injectors.',
    },
  },
  {
    code: 'P0700',
    title: 'Transmission Control System (MIL Illumination Request / TCM Fault)',
    systemCategory: 'Transmission & Drivetrain',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Harsh gear engagements, delayed Reverse/Drive engagement, or flashing PRNDL indicator',
      'Transmission locked in 2nd or 3rd gear fail-safe mode (even or odd gear loss on DSG)',
      'Slipping RPM flare between shifts under moderate throttle',
      'Check Engine Light accompanied by wrench / drivetrain malfunction message',
    ],
    laborHoursRange: [1.5, 7.5],
    partsCostRangeUsd: [180, 2650],
    rootCauses: [
      {
        cause: 'DSG / S-Tronic / Automatic Mechatronic Valve Body Solenoid or Pressure Accumulator Fault',
        probabilityPct: 44,
        partsCostUsd: [580, 2250],
        laborHours: [3.5, 6.5],
        componentNote: 'Fine metallic clutch debris fouls PWM pressure control solenoids.',
      },
      {
        cause: 'Degraded / Low ATF or Dual-Clutch Fluid & Clogged Internal Sump Filter',
        probabilityPct: 28,
        partsCostUsd: [180, 440],
        laborHours: [1.5, 2.8],
        componentNote: 'Thermal fluid breakdown reduces hydraulic clamping pressure.',
      },
      {
        cause: 'Turbine Input / Output Shaft Speed Sensor (Hall-Effect) Signal Dropout',
        probabilityPct: 18,
        partsCostUsd: [210, 620],
        laborHours: [2.0, 4.5],
        componentNote: 'Lead-frame conductor strip fault inside transmission pan (ZF / 9G / 10R80 / DSG).',
      },
      {
        cause: 'Low 12V Battery Voltage or Corroded TCM Ground Strap During Cranking',
        probabilityPct: 10,
        partsCostUsd: [160, 350],
        laborHours: [0.8, 1.5],
        componentNote: 'Mechatronic hydraulic pump draws 30A+; voltage dips <9.8V trigger P0700.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'TCM Specific Sub-Fault Code (e.g., P17BF, P0730, P0715)',
        'Transmission Fluid Temperature — TFT (°C)',
        'Clutch 1 & Clutch 2 Actual vs. Specified Pressure (bar)',
        'TCM Supply Voltage Terminal 30 (V)',
      ],
      baselineValues:
        'P0700 is a generic ECM gateway flag meaning "Read the TCM memory." Normal ATF operating temp is 75°C–105°C; mechatronic accumulator pressure holds 42–60 bar.',
      diagnosticProtocol:
        'Generic basic OBD-II readers only show P0700 from the Engine ECU. You MUST query Module 02 (Transmission Control Module) to extract the specific hydraulic or speed-sensor sub-code, and log Input vs. Output Shaft RPM to distinguish a $250 speed sensor / fluid service from a $2,500 clutch pack.',
      costTrapWarning:
        'Never approve a full transmission rebuild based solely on P0700—in 46% of cases, a mechatronic solenoid repair kit or fluid/conductor plate service resolves the fault.',
    },
  },
  {
    code: 'P2463',
    title: 'Diesel Particulate Filter Restriction — Soot Accumulation Too High',
    systemCategory: 'Emissions & Exhaust',
    severity: 'CRITICAL - STOP DRIVING',
    symptoms: [
      'Severe limp-home power restriction (3,000 RPM hard limit, turbo disabled)',
      'Solid DPF warning icon + Check Engine Light + Flashing Glow Plug light',
      'Active road regeneration locked out by ECU due to thermal fire-safety threshold (>45g soot)',
      'Noticeably higher fuel consumption and sluggish throttle response',
    ],
    laborHoursRange: [1.5, 5.5],
    partsCostRangeUsd: [95, 1950],
    rootCauses: [
      {
        cause: 'Interrupted Urban Regens Pushing Soot Mass Past Active Lockout Threshold (40g–45g)',
        probabilityPct: 49,
        partsCostUsd: [95, 320],
        laborHours: [1.5, 2.5],
        componentNote: 'Recoverable via forced bi-directional service regeneration + oil change if <45g.',
      },
      {
        cause: 'Failed Thermostat (Coolant <75°C) or Faulty Exhaust Gas Temp Sensor (EGT) Blocking Regens',
        probabilityPct: 26,
        partsCostUsd: [120, 380],
        laborHours: [1.5, 3.0],
        componentNote: 'ECU refuses to initiate DPF burn if EGT sensor or coolant thermostat is out of range.',
      },
      {
        cause: 'Boost Leak or Leaking Injector Overwhelming DPF with Heavy Black Soot',
        probabilityPct: 15,
        partsCostUsd: [180, 890],
        laborHours: [2.0, 4.5],
        componentNote: 'Fix the rich combustion root cause first or DPF will reload in 150 miles.',
      },
      {
        cause: 'End-of-Life Non-Combustible Oil Ash Saturation (>175g / 80g limit)',
        probabilityPct: 10,
        partsCostUsd: [650, 1950],
        laborHours: [3.5, 5.5],
        componentNote: 'Ash from engine oil additives cannot be burned off; requires off-car DPF flush or new core.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'DPF Soot Mass Calculated (g) vs. Soot Mass Measured (g)',
        'Distance Since Last Successful Regeneration (mi / km)',
        'Engine Coolant Temperature (°C)',
        'Exhaust Gas Temperature Bank 1 Sensors 1–4 (°C)',
      ],
      baselineValues:
        'Normal soot load cycles between 6g (post-regen) and 24g (regen trigger). Service forced regen is permitted between 24g and 42g; >45g triggers thermal runaway lockout.',
      diagnosticProtocol:
        'Check "Soot Mass Calculated" vs. "Soot Mass Measured" (derived from differential pressure). If Measured Soot is 42g but Differential Pressure at idle is only 1.1 kPa (normal), reset DPF learned values and initiate a stationary service regen via OBD-II after verifying oil dilution is safe.',
      costTrapWarning:
        'If a workshop performs a forced DPF regen without fixing the underlying failed thermostat or EGT sensor, P2463 will return within 2 weeks.',
    },
  },
  {
    code: 'P0128',
    title: 'Coolant Thermostat (Coolant Temp Below Thermostat Regulating Temperature)',
    systemCategory: 'Cooling & Thermal',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Temperature gauge takes >12 minutes to reach center or drops during highway coasting',
      'Lukewarm cabin heater output during winter driving',
      'Reduced fuel economy (ECU stays in cold-enrichment fuel map)',
      'Secondary DPF soot accumulation on diesels because ECU blocks regens below 75°C',
    ],
    laborHoursRange: [1.2, 4.5],
    partsCostRangeUsd: [55, 680],
    rootCauses: [
      {
        cause: 'Thermostat Wax Pellet or Electronic Map-Controlled Thermostat Stuck Partially Open',
        probabilityPct: 74,
        partsCostUsd: [55, 480],
        laborHours: [1.5, 4.0],
        componentNote: 'Rubber seal delamination allows constant coolant bypass to the main radiator.',
      },
      {
        cause: 'Electronic Rotary Coolant Control Valve Failure (VW/Audi EA888, Mazda SkyActiv, BMW B48)',
        probabilityPct: 18,
        partsCostUsd: [280, 680],
        laborHours: [2.5, 4.5],
        componentNote: 'Mechatronic thermal management module defaults to full-cooling fail-safe.',
      },
      {
        cause: 'Drifted Engine Coolant Temperature (ECT) NTC Thermistor Sensor',
        probabilityPct: 8,
        partsCostUsd: [40, 110],
        laborHours: [0.8, 1.2],
        componentNote: 'Sensor reports 12°C lower than actual cylinder head temperature.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Engine Coolant Temperature — ECT (°C / °F)',
        'Radiator Outlet Coolant Temperature (°C / °F)',
        'Ambient Air Temperature (°C / °F)',
      ],
      baselineValues:
        'After a 12-hour cold soak, ECT and Ambient Air Temp must match within ±2°C. During warmup, ECT should climb at ~8°C–12°C per minute until reaching 87°C–98°C.',
      diagnosticProtocol:
        'Compare ECT and Radiator Outlet Temp during the first 6 minutes after a cold start. Radiator Outlet Temp should remain near ambient until ECT reaches ~88°C. If Radiator Outlet Temp rises in lockstep with Engine ECT from 35°C upward, the thermostat is mechanically stuck open.',
      costTrapWarning:
        'Ignoring P0128 on a modern diesel or GDI engine accelerates cylinder wall wear, oil fuel dilution, and DPF clogging.',
    },
  },
  {
    code: 'P0455',
    title: 'Evaporative Emission (EVAP) System Leak Detected — Gross / Large Leak',
    systemCategory: 'Emissions & Exhaust',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Check Engine Light 1–3 days after refueling',
      'Faint smell of raw fuel vapor near rear wheel arch or engine bay',
      'Hard starting immediately after filling the fuel tank to full (if purge valve is stuck open)',
      'Automatic emission readiness monitor fails to complete EVAP test',
    ],
    laborHoursRange: [0.5, 2.5],
    partsCostRangeUsd: [25, 340],
    rootCauses: [
      {
        cause: 'Canister Purge Solenoid Valve Stuck Open Under Intake Vacuum',
        probabilityPct: 44,
        partsCostUsd: [45, 165],
        laborHours: [0.6, 1.2],
        componentNote: 'Common on Ford EcoBoost, GM, Hyundai, and VW; causes rough restart after refueling.',
      },
      {
        cause: 'Degraded Fuel Filler Cap O-Ring Seal or Capless Fuel Filler Flap Debris',
        probabilityPct: 31,
        partsCostUsd: [25, 140],
        laborHours: [0.3, 1.0],
        componentNote: 'Fails to hold tank vacuum/pressure during overnight EVAP leak check.',
      },
      {
        cause: 'EVAP Canister Vent Control Solenoid Stuck Open (Rear Underbody Dust Intrusion)',
        probabilityPct: 18,
        partsCostUsd: [65, 220],
        laborHours: [0.8, 1.8],
        componentNote: 'Road grit prevents vent plunger from sealing the charcoal canister for testing.',
      },
      {
        cause: 'Cracked Charcoal Canister Housing or Vapor Line',
        probabilityPct: 7,
        partsCostUsd: [150, 340],
        laborHours: [1.2, 2.5],
        componentNote: 'Detected via low-pressure nitrogen/mineral-oil smoke test.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'EVAP Canister Purge Commanded Duty Cycle (%)',
        'Fuel Tank Vapor Pressure Sensor (Pa / inH2O)',
        'Short-Term Fuel Trim — STFT (%) at Idle',
      ],
      baselineValues:
        'With Purge Commanded at 0% (closed) and Vent Valve Open, Fuel Tank Pressure must equal 0 Pa atmospheric. If tank pressure pulls negative at 0% purge, the purge valve is leaking.',
      diagnosticProtocol:
        'Disconnect the vapor hose from the tank side of the under-hood EVAP Purge Valve while idling with Purge Duty Cycle at 0%. Place your finger over the valve port—if you feel intake manifold suction when commanded 0%, the $65 purge solenoid is stuck open.',
      costTrapWarning:
        'Do not pay for a $250 smoke-machine diagnostic before performing the 60-second under-hood purge valve suction test.',
    },
  },
  {
    code: 'P0016',
    title: 'Crankshaft Position — Camshaft Position Correlation (Bank 1 Sensor A)',
    systemCategory: 'Engine Mechanical & Ignition',
    severity: 'CRITICAL - STOP DRIVING',
    symptoms: [
      'Metallic timing chain rattle for 2–4 seconds on cold start',
      'Extended cranking or no-start condition if timing jumped >2 teeth',
      'Reduced upper-RPM power and rough idle',
      'High risk of piston-to-valve contact if chain tensioner fails completely',
    ],
    laborHoursRange: [1.0, 9.5],
    partsCostRangeUsd: [75, 1650],
    rootCauses: [
      {
        cause: 'Elongated Timing Chain, Worn Plastic Guides, or Failed Hydraulic Tensioner',
        probabilityPct: 56,
        partsCostUsd: [420, 1650],
        laborHours: [5.5, 9.5],
        componentNote: 'Accelerated by extended 15k-mile oil intervals and soot/sludge wear.',
      },
      {
        cause: 'Sludge-Clogged Variable Valve Timing (VVT) Oil Control Solenoid or Filter Screen',
        probabilityPct: 26,
        partsCostUsd: [75, 240],
        laborHours: [0.8, 1.8],
        componentNote: 'Restricted oil pressure prevents cam phaser from returning to base lock pin.',
      },
      {
        cause: 'Worn Camshaft Phaser / Adjuster Sprocket Locking Pin',
        probabilityPct: 12,
        partsCostUsd: [320, 980],
        laborHours: [4.5, 8.0],
        componentNote: 'Internal vane chamber leaks oil pressure at hot idle.',
      },
      {
        cause: 'Metallic Debris on Magnetic Reluctor Ring or Camshaft Hall Sensor',
        probabilityPct: 6,
        partsCostUsd: [55, 160],
        laborHours: [0.6, 1.2],
        componentNote: 'Skews phase correlation square-wave edge timing.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Camshaft Phase Adaptation Intake Bank 1 (°CRK)',
        'Camshaft Position Actual vs. Specified (°)',
        'VVT Oil Control Solenoid Duty Cycle (%)',
      ],
      baselineValues:
        'New timing chain phase adaptation is 0.0° to -1.5°. Warning threshold is ±4.0°; P0016 triggers when phase deviation exceeds ±6.0° to ±8.5°.',
      diagnosticProtocol:
        'At warm idle (oil >80°C), read Camshaft Phase Adaptation Angle and compare Specified vs. Actual Cam Angle. Remove and inspect the VVT Oil Control Valve solenoid first (15 minutes)—if the fine mesh screen is packed with varnish or metallic flakes, clean/replace it before tearing down the timing cover.',
      costTrapWarning:
        'If Phase Adaptation exceeds ±5.5° accompanied by cold-start chain slap, stop driving immediately—replacing a stretched chain ($1,300) prevents a $6,500 bent-valve engine replacement.',
    },
  },
  {
    code: 'P2015',
    title: 'Intake Manifold Runner Position Sensor/Switch Circuit Range/Performance',
    systemCategory: 'Fuel & Air Induction',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Check Engine Light illuminated at startup (self-test sweep out of range)',
      'Slightly softer low-RPM torque below 2,500 RPM or reduced top-end pull',
      'Audible clicking from intake manifold vacuum/electric flap actuator',
      'Rough cold idle due to disrupted intake tumble swirl',
    ],
    laborHoursRange: [1.0, 4.5],
    partsCostRangeUsd: [45, 780],
    rootCauses: [
      {
        cause: 'Worn Plastic Stop-Limit Arm on Intake Flap Actuator Motor (V157 — VW/Audi 2.0 TDI)',
        probabilityPct: 45,
        partsCostUsd: [45, 220],
        laborHours: [0.8, 1.5],
        componentNote: 'An anodized CNC aluminum limit bracket ($45) permanently restores the 0V–5V stop position.',
      },
      {
        cause: 'Carbon-Seized Swirl/Tumble Flaps or Broken Plastic Vacuum Lever (EA888 / Mercedes M272 / BMW)',
        probabilityPct: 37,
        partsCostUsd: [260, 780],
        laborHours: [2.8, 4.5],
        componentNote: 'Plastic pivot arm snaps or vacuum diaphragm leaks.',
      },
      {
        cause: 'Failed Hall-Effect Runner Position Potentiometer or Cracked Vacuum Solenoid Hose',
        probabilityPct: 18,
        partsCostUsd: [75, 240],
        laborHours: [1.0, 2.0],
        componentNote: 'Sensor voltage falls outside 0.45V–4.55V calibration window.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Intake Manifold Runner Control (IMRC) Commanded (%)',
        'Intake Manifold Runner Position Actual (%) / Voltage (V)',
      ],
      baselineValues:
        'Closed Rest Stop: 0.0% (0.50V ±0.15V). Full Open (>3,000 RPM): 99.2% (4.50V ±0.15V). P2015 triggers when motor over-travels past the worn plastic stop to 0.18V.',
      diagnosticProtocol:
        'Watch the IMRC Position Voltage PID during Key-ON and Key-OFF self-test sweep while observing the external manifold actuator lever. On 2.0 TDI aluminum manifolds, if the motor sweeps smoothly but travels 3mm too far at rest, a $45 CNC stop bracket cures P2015 in 20 minutes without replacing the $850 manifold.',
      costTrapWarning:
        'Main dealerships routinely quote $1,100+ for a complete intake manifold assembly when only the external actuator stop or vacuum solenoid has failed.',
    },
  },
  {
    code: 'P0101',
    title: 'Mass or Volume Air Flow (MAF) "A" Circuit Range/Performance',
    systemCategory: 'Forced Induction & Air',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Hesitation, bucking, or flat spot during acceleration',
      'Harsh automatic transmission upshifts (TCM uses MAF load calculation for line pressure)',
      'Black smoke on acceleration or unstable idle',
      'Reduced fuel economy by 10%–18%',
    ],
    laborHoursRange: [0.5, 2.2],
    partsCostRangeUsd: [40, 340],
    rootCauses: [
      {
        cause: 'Silicone / Oil Film Contamination on Hot-Film MAF Sensor Platinum Element',
        probabilityPct: 46,
        partsCostUsd: [40, 240],
        laborHours: [0.4, 0.8],
        componentNote: 'Frequently caused by over-oiled aftermarket cotton gauze air filters.',
      },
      {
        cause: 'Unmetered Air Leak in Accordion Intake Boot Between MAF and Turbo/Throttle Body',
        probabilityPct: 34,
        partsCostUsd: [55, 210],
        laborHours: [0.8, 1.8],
        componentNote: 'ECU compares MAF airflow against MAP/RPM volumetric efficiency calculation.',
      },
      {
        cause: 'Stuck EGR Valve or Blocked Breather Causing Abnormal Airflow Correlation',
        probabilityPct: 20,
        partsCostUsd: [110, 340],
        laborHours: [1.2, 2.2],
        componentNote: 'On diesels, P0101 is triggered when EGR flow does not match expected fresh-air displacement.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Mass Air Flow Rate — MAF (g/s)',
        'Engine Speed — RPM',
        'Absolute Load Value (%) & Intake Air Temp (°C)',
      ],
      baselineValues:
        'Warm idle (no AC load) MAF in g/s should approximately equal Engine Displacement in Liters (e.g., a 2.0L engine idles at ~2.0 to 2.6 g/s). At 5,500 RPM WOT, peak g/s ≈ 0.80 × Horsepower.',
      diagnosticProtocol:
        'Check MAF g/s at warm idle and during a 2nd-gear full-throttle pull to 5,000 RPM. A healthy 200 HP engine must reach ~155–165 g/s near redline. If it plateaus at 105 g/s, clean the sensor with dedicated MAF spray first and re-log before purchasing a replacement Bosch/Hitachi sensor.',
      costTrapWarning:
        'Never install cheap unbranded $28 aftermarket MAF sensors—their thermistor calibration curves are frequently off by 15%+, causing transmission shift shock.',
    },
  },
  {
    code: 'U0100',
    title: 'Lost Communication With ECM/PCM "A" (CAN-Bus High-Speed Telemetry Fault)',
    systemCategory: 'Hybrid & Network Telemetry',
    severity: 'CRITICAL - STOP DRIVING',
    symptoms: [
      'Intermittent crank / no-start with cooling fans running at full speed on Key-ON',
      'Multiple Christmas-tree warning lights (ABS, ESP, Airbag, Transmission) simultaneously',
      'Gear selector locked in Park or sudden loss of instrument cluster RPM/Speed',
      'Diagnostic scanner intermittently fails to connect to Engine Control Module',
    ],
    laborHoursRange: [1.5, 5.5],
    partsCostRangeUsd: [35, 1450],
    rootCauses: [
      {
        cause: 'Corroded Main Chassis-to-Engine Ground Strap or Failing ECM Power Supply Relay (Terminal 30)',
        probabilityPct: 48,
        partsCostUsd: [35, 160],
        laborHours: [1.0, 2.5],
        componentNote: 'A $25 relay or corroded ground pin causes the ECM to drop offline while other modules stay awake.',
      },
      {
        cause: 'Chafed Twisted-Pair CAN-High / CAN-Low Wiring Harness Near Gearbox or Wiper Scuttle',
        probabilityPct: 31,
        partsCostUsd: [60, 320],
        laborHours: [2.0, 4.5],
        componentNote: 'Vibration rubs insulation against subframe bracket.',
      },
      {
        cause: 'Water Intrusion in Under-Cowl ECM Connector Pins or Failing 12V AGM Battery',
        probabilityPct: 14,
        partsCostUsd: [180, 450],
        laborHours: [1.5, 3.0],
        componentNote: 'Blocked sunroof/scuttle drains submerge the ECU plug in rainwater.',
      },
      {
        cause: 'Internal ECM PCB Solder Joint / Transceiver Failure',
        probabilityPct: 7,
        partsCostUsd: [480, 1450],
        laborHours: [2.0, 4.0],
        componentNote: 'Only condemn ECM after confirming power, ground, and 60-ohm CAN bus termination.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Control Module Voltage — PID $42 (V)',
        'Gateway Installation List / CAN-Bus Node Status',
        'DLC Pin 6 (CAN-High) & Pin 14 (CAN-Low) Resistance (Ω)',
      ],
      baselineValues:
        'With 12V battery disconnected, resistance between OBD-II Port Pin 6 and Pin 14 MUST equal 60 Ω (two 120 Ω terminating resistors in parallel). Key-ON CAN-High = ~2.65V, CAN-Low = ~2.35V.',
      diagnosticProtocol:
        'Before allowing any shop to order a $1,400 Engine Computer (ECM), measure resistance across OBD-II Pin 6 and Pin 14 with battery disconnected. If it reads 120 Ω, one terminating line is open. Next, load-test the ECM main power relay and ground pins with a 55W halogen bulb.',
      costTrapWarning:
        'Over 75% of condemned "bad ECUs" tested on bench rigs have zero internal defects—the fault was a $30 ECM power relay or corroded ground point.',
    },
  },
  {
    code: 'P0442',
    title: 'Evaporative Emission (EVAP) System Leak Detected — Small Leak (0.040" Orifice)',
    systemCategory: 'Emissions & Exhaust',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Check Engine Light with zero impact on engine performance or fuel economy',
      'Triggers specifically after overnight ambient temperature swings',
      'Prevents emissions readiness pass until EVAP monitor completes',
    ],
    laborHoursRange: [0.5, 2.2],
    partsCostRangeUsd: [22, 260],
    rootCauses: [
      {
        cause: 'Micro-Cracked Fuel Filler Cap Gasket or Corrosion on Metal Filler Neck Lip',
        probabilityPct: 52,
        partsCostUsd: [22, 65],
        laborHours: [0.2, 0.5],
        componentNote: 'Fine rust scale on filler lip prevents airtight seal during 0.040" leak check.',
      },
      {
        cause: 'Weeping EVAP Purge Valve or Hairline Split in Rubber EVAP Hose Clamps',
        probabilityPct: 31,
        partsCostUsd: [45, 160],
        laborHours: [0.8, 1.8],
        componentNote: 'Elastomer hoses dry-rot near exhaust heat shields or rear subframe.',
      },
      {
        cause: 'Stickiness in Leak Detection Pump (LDP) or Canister Vent Valve Seal',
        probabilityPct: 17,
        partsCostUsd: [85, 260],
        laborHours: [1.0, 2.2],
        componentNote: 'Common on Chrysler/BMW/VW natural vacuum leak detection (NVLD) modules.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Mode $06 EVAP Monitor Test ID $3A / $3B (0.040" Leak Decay Rate)',
        'Fuel Tank Pressure Sensor Voltage (V)',
      ],
      baselineValues:
        'Mode $06 shows exact vacuum decay slope relative to the 1.0mm (0.040") reference orifice threshold.',
      diagnosticProtocol:
        'Inspect and clean the fuel filler neck sealing rim with a Scotch-Brite pad, apply a light film of silicone grease to the gas cap O-ring, and run an active OBD-II EVAP Service Bay Test before paying for smoke testing.',
      costTrapWarning:
        'A $25 OEM fuel cap or cleaning rust from the filler neck lip resolves over half of all P0442 faults.',
    },
  },
  {
    code: 'P0113',
    title: 'Intake Air Temperature (IAT) Sensor 1 Circuit High (Bank 1)',
    systemCategory: 'Forced Induction & Air',
    severity: 'MODERATE - EMISSIONS/EFFICIENCY',
    symptoms: [
      'Hard cold starting and rich fuel mixture smell',
      'Disabled turbo boost protection or erratic idle speed',
      'Cooling fan running continuously as a fail-safe',
    ],
    laborHoursRange: [0.4, 1.5],
    partsCostRangeUsd: [30, 220],
    rootCauses: [
      {
        cause: 'Unplugged or Broken Wire on IAT / Combined MAF-IAT Sensor Connector',
        probabilityPct: 58,
        partsCostUsd: [30, 85],
        laborHours: [0.4, 1.0],
        componentNote: 'Often left unplugged or strained after an air filter inspection.',
      },
      {
        cause: 'Open-Circuit NTC Thermistor Inside Integrated MAF/MAP Sensor',
        probabilityPct: 42,
        partsCostUsd: [65, 220],
        laborHours: [0.5, 1.5],
        componentNote: 'Open circuit pulls 5V reference high, making ECU read -40°C (-40°F).',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Intake Air Temperature — IAT (°C / °F)',
        'Ambient Air Temperature (°C / °F)',
      ],
      baselineValues:
        'Normal range: -20°C to +65°C. An open circuit or broken wire displays exactly -40°C (-40°F) on live OBD-II telemetry.',
      diagnosticProtocol:
        'Read the IAT PID with Key ON. If it reads -40°C (-40°F), unplug the sensor connector and jumper the two IAT pins with a paperclip. If the live PID jumps from -40°C to +140°C, the wiring to the ECU is 100% intact and only the sensor is open-circuit.',
      costTrapWarning:
        'The 30-second paperclip jumper test proves immediately whether you need a sensor or a wiring repair.',
    },
  },
  {
    code: 'P0301',
    title: 'Cylinder 1 Misfire Detected (Single-Cylinder Ignition / Fuel / Mechanical)',
    systemCategory: 'Engine Mechanical & Ignition',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Rhythmic dead-miss vibration at idle and under load',
      'Flashing Check Engine Light under acceleration (ECU disables Cylinder 1 injector to save catalyst)',
      'Rough cold start that partially clears or persists when warm',
    ],
    laborHoursRange: [0.8, 4.5],
    partsCostRangeUsd: [45, 890],
    rootCauses: [
      {
        cause: 'Failed Cylinder 1 Ignition Coil Pack or Cracked Spark Plug Insulator',
        probabilityPct: 55,
        partsCostUsd: [45, 180],
        laborHours: [0.5, 1.2],
        componentNote: 'Direct-mount pencil coils fail from cylinder head heat cycling.',
      },
      {
        cause: 'Clogged or Leaking Cylinder 1 Direct-Injection Fuel Injector',
        probabilityPct: 25,
        partsCostUsd: [160, 540],
        laborHours: [1.8, 3.8],
        componentNote: 'Pintle carbon restriction causes lean misfire in Cylinder 1 only.',
      },
      {
        cause: 'Intake Valve Carbon Deposit or Burnt Exhaust Valve / Low Compression in Cyl 1',
        probabilityPct: 20,
        partsCostUsd: [280, 890],
        laborHours: [2.5, 4.5],
        componentNote: 'Verify with relative compression cranking test.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Mode $06 Cylinder 1 vs. Cylinder 2 Misfire Counter',
        'Short-Term Fuel Trim (%) under Misfire',
      ],
      baselineValues:
        'Zero misfire counts after coil/plug swap.',
      diagnosticProtocol:
        'Perform the Zero-Cost Coil Swap Test: Swap the Ignition Coil from Cylinder 1 to Cylinder 2, and the Spark Plug from Cylinder 1 to Cylinder 3. Clear codes and road-test while watching Mode $06 Misfire Counters. If the misfire moves to P0302, buy a $55 coil. If it moves to P0303, buy spark plugs. If it stays on P0301, test the fuel injector and compression.',
      costTrapWarning:
        'Swapping Coil 1 and Coil 2 takes 5 minutes and eliminates all guesswork before spending money at a workshop.',
    },
  },
  {
    code: 'P20EE',
    title: 'SCR NOx Catalyst Efficiency Below Threshold (Bank 1 — AdBlue / DEF System)',
    systemCategory: 'Emissions & Exhaust',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Dashboard countdown warning: "No Engine Start in 650 Miles (1,000 km) — AdBlue Fault"',
      'Check Engine Light + DEF / AdBlue wrench symbol',
      'White crystallized urea deposits around exhaust AdBlue dosing injector',
    ],
    laborHoursRange: [1.2, 4.5],
    partsCostRangeUsd: [120, 1850],
    rootCauses: [
      {
        cause: 'Crystallized / Clogged AdBlue (DEF) Dosing Injector Nozzle on Downpipe',
        probabilityPct: 42,
        partsCostUsd: [120, 380],
        laborHours: [1.0, 2.0],
        componentNote: 'Short trips prevent exhaust from reaching >200°C, leaving solid white urea crystals on injector tip.',
      },
      {
        cause: 'Drifted Downstream NOx Sensor (Bank 1 Sensor 2) or Outdated ECU Calibration',
        probabilityPct: 33,
        partsCostUsd: [320, 780],
        laborHours: [1.2, 2.5],
        componentNote: 'Often covered by OEM emissions software update + NOx sensor replacement.',
      },
      {
        cause: 'Degraded / Stale AdBlue Fluid or Weak AdBlue Tank Reductant Pump Pressure (<4.5 bar)',
        probabilityPct: 17,
        partsCostUsd: [240, 1250],
        laborHours: [1.5, 3.8],
        componentNote: 'Urea concentration must be 32.5% ±0.7% (refractometer test).',
      },
      {
        cause: 'Sulfur-Poisoned or Aged SCR Catalyst Brick',
        probabilityPct: 8,
        partsCostUsd: [850, 1850],
        laborHours: [2.5, 4.5],
        componentNote: 'Usually recoverable via high-temp highway thermal desulfation drive.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'Upstream NOx Sensor B1S1 (ppm) vs. Downstream NOx Sensor B1S2 (ppm)',
        'Reductant (AdBlue) Pressure (bar / kPa)',
        'NOx Conversion Efficiency Calculated (%)',
      ],
      baselineValues:
        'Once SCR catalyst temp exceeds 220°C, AdBlue pressure should hold 4.8–5.5 bar and Downstream NOx ppm must drop to <15% of Upstream NOx ppm (>85% conversion).',
      diagnosticProtocol:
        'Unbolt the AdBlue injector from the exhaust pipe (2 bolts) and inspect for white rock-like urea crust. Dissolve crystals in warm distilled water, test spray pattern, and check if an OEM ECU software TSB exists for P20EE before replacing the $1,600 SCR catalyst.',
      costTrapWarning:
        'Almost half of P20EE faults are caused by a crusted AdBlue injector nozzle or degraded fluid—not a failed SCR catalytic converter.',
    },
  },
  {
    code: 'P0A80',
    title: 'Replace Hybrid / EV High-Voltage Battery Pack (Module Voltage Delta Exceeded)',
    systemCategory: 'Hybrid & Network Telemetry',
    severity: 'HIGH - LIMP MODE RISK',
    symptoms: [
      'Master Warning Triangle + "Check Hybrid System" message',
      'Rear HV battery cooling fan running loudly at maximum speed continuously',
      'State of Charge (SoC %) gauge fluctuating rapidly from 80% to 20% in minutes',
      'Loss of EV electric-only propulsion and disabled regenerative braking',
    ],
    laborHoursRange: [2.5, 7.5],
    partsCostRangeUsd: [180, 3850],
    rootCauses: [
      {
        cause: 'Weak / High-Internal-Resistance Individual NiMH/Li-Ion Cell Blocks & Corroded Copper Busbars',
        probabilityPct: 52,
        partsCostUsd: [450, 2100],
        laborHours: [3.5, 6.5],
        componentNote: 'Center modules run hottest; specialist module reconditioning + nickel-plated busbars restores pack balance.',
      },
      {
        cause: 'Dust-Clogged HV Battery Cooling Blower Fan & Intake Screen Causing Thermal Shutdown',
        probabilityPct: 26,
        partsCostUsd: [85, 290],
        laborHours: [1.2, 2.5],
        componentNote: 'Pet hair or lint starves pack of cooling air, spiking module temps >48°C.',
      },
      {
        cause: 'Full HV Traction Battery Assembly Replacement (OEM New / Remanufactured)',
        probabilityPct: 22,
        partsCostUsd: [1850, 3850],
        laborHours: [3.5, 7.5],
        componentNote: 'Required when multiple cell blocks exhibit self-discharge.',
      },
    ],
    liveTelemetryCheck: {
      pidsToMonitor: [
        'HV Battery Block Voltages 1 through 14/28 (V)',
        'Max Block Voltage minus Min Block Voltage — Delta-V (V)',
        'HV Battery Internal Resistance R1–R14 (Ω)',
        'HV Battery Inlet & Module Temps 1–3 (°C)',
      ],
      baselineValues:
        'Under full acceleration or regenerative braking, all battery block voltages must track within 0.25V (Delta-V < 0.30V). P0A80 triggers when Delta-V exceeds 1.2V.',
      diagnosticProtocol:
        'Log Battery Block Voltages 1–14 during a brisk acceleration and regen braking cycle. Frequently only 1 or 2 center modules dip by 1.5V or a corroded voltage-sense wire pin creates a false voltage drop, allowing a $650 specialist module/busbar service instead of a $3,800 dealership pack.',
      costTrapWarning:
        'Always check HV battery cooling fan airflow and copper voltage-sensing harness corrosion before condemning the entire traction battery.',
    },
  },
];

/**
 * Pure helper to calculate workshop cost estimates for a given OBD-II code and labor rate tier.
 */
export function calculateObdWorkshopEstimate(obdCodeObj, tierId = 'independent') {
  const tier = LABOR_RATE_TIERS.find((t) => t.id === tierId) || LABOR_RATE_TIERS[1];
  const [minHours, maxHours] = obdCodeObj.laborHoursRange;
  const [minPartsBase, maxPartsBase] = obdCodeObj.partsCostRangeUsd;

  const minPartsUsd = Math.round(minPartsBase * tier.partsMarkupFactor);
  const maxPartsUsd = Math.round(maxPartsBase * tier.partsMarkupFactor);

  const minLaborUsd = Math.round(minHours * tier.rateUsdPerHr);
  const maxLaborUsd = Math.round(maxHours * tier.rateUsdPerHr);

  const minTotalUsd = minPartsUsd + minLaborUsd;
  const maxTotalUsd = maxPartsUsd + maxLaborUsd;

  // Probability-weighted expected repair cost across all root causes
  let weightedExpectedUsd = 0;
  let weightedPartsUsd = 0;
  let weightedLaborUsd = 0;

  for (const rc of obdCodeObj.rootCauses) {
    const prob = (rc.probabilityPct || 0) / 100;
    const avgParts = ((rc.partsCostUsd[0] + rc.partsCostUsd[1]) / 2) * tier.partsMarkupFactor;
    const avgLabor = ((rc.laborHours[0] + rc.laborHours[1]) / 2) * tier.rateUsdPerHr;
    weightedPartsUsd += prob * avgParts;
    weightedLaborUsd += prob * avgLabor;
    weightedExpectedUsd += prob * (avgParts + avgLabor);
  }

  return {
    tierId: tier.id,
    tierLabel: tier.label,
    rateUsdPerHr: tier.rateUsdPerHr,
    minPartsUsd,
    maxPartsUsd,
    minLaborUsd,
    maxLaborUsd,
    minTotalUsd,
    maxTotalUsd,
    weightedPartsUsd: Math.round(weightedPartsUsd),
    weightedLaborUsd: Math.round(weightedLaborUsd),
    weightedExpectedUsd: Math.round(weightedExpectedUsd),
  };
}
