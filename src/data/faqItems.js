/**
 * DriveLedger | Core Engineering & Financial FAQ Items
 * Extracted into a pure data module so DynamicSeoHead can emit FAQPage structured data
 * without pulling TechnicalMethodologyGuide into the initial homepage bundle.
 */

export const FAQ_ITEMS = [
  {
    question:
      'How does DriveLedger calculate non-linear 5-year and 10-year vehicle depreciation?',
    answer:
      'Unlike simplistic linear calculators that subtract a flat percentage per year, DriveLedger uses a segment-specific logarithmic residual retention curve calibrated against wholesale auction data and mileage intensity. Vehicle value at year t is modeled as V(t) = P₀ × R(t) × (1 - α · ΔM)^t, where P₀ is initial acquisition cost, R(t) is the baseline segment retention factor at year t, ΔM is the annual mileage variance relative to the 12,500-mile baseline, and α = 0.045 is the empirical odometer elasticity coefficient.',
  },
  {
    question:
      'Why do short urban trips apply a 1.35x to 1.55x wear penalty to modern powertrains?',
    answer:
      'Cold starts and sub-15-minute urban driving cycles prevent engine oil from reaching its 90°C–105°C water/fuel vaporization threshold and prevent exhaust gas temperatures (EGT) from reaching the 580°C required for active Diesel Particulate Filter (DPF) regeneration. Unburned fuel condenses on cold cylinder walls and scrapes into the sump, diluting oil viscosity and chemically attacking Belt-in-Oil (wet belt) elastomers and timing chain pins. Simultaneously, urban stop-and-go traffic multiplies Dual-Mass Flywheel (DMF) and dual-clutch (DSG/PDK) micro-slip thermal cycles by over 400% per mile compared to steady highway cruising.',
  },
  {
    question:
      'What is a "First-Principles Live Telemetry Check" before approving an OBD-II workshop quote?',
    answer:
      'A Diagnostic Trouble Code (DTC) such as P2002, P0171, or P0420 does not condemn a specific part; it only reports that a sensor signal crossed an engineering threshold. First-principles diagnostics uses SAE J1979 Mode $01 and Mode $06 live Parameter IDs (PIDs) to test the physical system before buying parts. For example, checking DPF Differential Pressure at Key-ON Engine-OFF isolates a drifted $110 pressure sensor from an $1,800 DPF monolith, and comparing Short-Term + Long-Term Fuel Trims (STFT/LTFT) at 750 RPM idle versus 2,500 RPM immediately distinguishes an intake vacuum leak from a failing fuel pump or MAF sensor.',
  },
  {
    question:
      'How do US MPG, UK Imperial MPG, and European L/100km conversions work in DriveLedger?',
    answer:
      'DriveLedger stores canonical telemetry in USD, statute miles (1 mi = 1.609344 km), and US Gallons (3.78541178 Litres). Because a UK Imperial Gallon equals 4.54609 Litres, 1 MPG (US) equals exactly 1.20095 MPG (UK). For European metric consumption, L/100km is inversely proportional to fuel economy and is computed via the exact physical constant 235.21458 / MPG (US). Switching the top navigation unit pill updates every currency figure, odometer reading, and fuel consumption metric at 60fps without rounding drift.',
  },
  {
    question:
      'Why does DriveLedger recommend servicing "lifetime" automatic transmission fluids at 40k–60k miles?',
    answer:
      'Automakers often define "lifetime fill" as the duration of the factory powertrain warranty (typically 5 years or 60,000 miles). In practice, automatic transmission fluid (ATF) and dual-clutch wet fluid accumulate clutch friction material and experience shear viscosity loss from thermal cycling above 110°C. Replacing fluid and sump filters every 38,000–40,000 miles on DSG/PDK/S-Tronic gearboxes and every 55,000–60,000 miles on ZF 8HP / 9G-Tronic / 10R80 torque converter transmissions prevents $2,400+ mechatronic valve body failures.',
  },
  {
    question:
      'What is the difference between Total Cash Outflow and Net Economic True Cost to Own (TCO)?',
    answer:
      'Total Cash Outflow measures every dollar, pound, or euro that leaves your bank account during the ownership horizon: Down Payment + Monthly Principal & Interest Loan Payments + Fuel/Electricity + Insurance + Maintenance & Repairs. Net Economic TCO replaces principal loan repayments with actual Depreciation Loss (Purchase Price minus Resale Residual Value at year N) plus Financing Interest and operating expenses, representing your true net wealth reduction per mile or kilometer driven.',
  },
];
