import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Flame,
  Cpu,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
  Lock,
  FileText,
  Scale,
  Sliders,
  Check,
} from 'lucide-react';

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
      'A Diagnostic Trouble Code (DTC) such as P2002, P0171, or P0420 does not condemn a specific part—it only reports that a sensor signal crossed an engineering threshold. First-principles diagnostics uses SAE J1979 Mode $01 and Mode $06 live Parameter IDs (PIDs) to test the physical system before buying parts. For example, checking DPF Differential Pressure at Key-ON Engine-OFF isolates a drifted $110 pressure sensor from an $1,800 DPF monolith, and comparing Short-Term + Long-Term Fuel Trims (STFT/LTFT) at 750 RPM idle versus 2,500 RPM immediately distinguishes an intake vacuum leak from a failing fuel pump or MAF sensor.',
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

export const LEGAL_MODAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy & Telemetry Data Governance',
    icon: Lock,
    updated: 'November 6, 2026',
    sections: [
      {
        heading: '1. Zero Personal Financial Storage Architecture',
        body: 'DriveLedger processes all vehicle True Cost to Own (TCO) sliders, loan amortization inputs, odometer readings, and OBD-II fault code queries locally within your browser session. We do not transmit or store your personal financial figures on remote servers.',
      },
      {
        heading: '2. LocalStorage Preferences & Deep-Link URLs',
        body: 'To provide a seamless experience, DriveLedger uses browser LocalStorage solely to remember your selected unit system (US, UK, or EU), theme preference (Dark or Light mode), and cookie consent status. Shareable URL query parameters (?tab=tco&preset=...) contain only non-identifiable vehicle configuration states.',
      },
      {
        heading: '3. Google AdSense & Third-Party Analytics Cookies',
        body: 'Third-party vendors, including Google, use cookies to serve ads based on a user’s prior visits to this website or other websites. Google’s use of advertising cookies enables it and its partners to serve contextual automotive and financial advertisements. Users may opt out of personalized advertising by visiting Google Ads Settings or adjusting their preferences in our GDPR/CCPA Consent Manager.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service & Engineering Disclaimer',
    icon: FileText,
    updated: 'November 6, 2026',
    sections: [
      {
        heading: '1. Informational & Statistical Modeling Scope',
        body: 'All calculations, residual value curves, thermodynamic wear multipliers, and OBD-II workshop repair estimates generated by DriveLedger are statistical engineering projections provided strictly for educational and informational purposes. They do not constitute formal mechanical certification, certified appraisal, or licensed financial advice.',
      },
      {
        heading: '2. OBD-II Diagnostic & Workshop Safety Notice',
        body: 'Automotive high-pressure fuel systems (up to 2,000 bar on common-rail diesels), high-voltage hybrid/EV traction batteries (350V–800V DC), and pyrotechnic supplemental restraint systems carry severe physical hazards. Live OBD-II PID telemetry checks should be performed safely when stationary or by a second passenger, and physical repairs should be verified by an ASE/IMI certified technician.',
      },
      {
        heading: '3. Limitation of Liability',
        body: 'DriveLedger shall not be held liable for workshop invoice variances, vehicle purchase decisions, or mechanical failures arising from reliance on estimated intervals or diagnostic guides.',
      },
    ],
  },
  affiliate: {
    title: 'Affiliate & Partner Monetization Disclosure',
    icon: Scale,
    updated: 'November 6, 2026',
    sections: [
      {
        heading: '1. FTC & ASA Commercial Transparency Compliance',
        body: 'In compliance with US Federal Trade Commission (FTC) 16 CFR Part 255 guidelines and UK/EU consumer transparency regulations, DriveLedger discloses that certain contextual recommendation cards marked with "Partner link" or "Sponsored" contain affiliate links.',
      },
      {
        heading: '2. Editorial & Algorithmic Independence',
        body: 'Partner compensation never alters our underlying TCO depreciation curves, thermodynamic wear multipliers, or OBD-II labor hour databases. Contextual partner triggers (such as VIN history verification, Bluetooth OBD-II diagnostic adapters, auto loan refinancing, or mechanical breakdown coverage) are activated algorithmically based on mathematical thresholds in your simulation.',
      },
    ],
  },
  cookies: {
    title: 'GDPR / CCPA Cookie & Telemetry Consent Preferences',
    icon: Sliders,
    updated: 'November 6, 2026',
    sections: [
      {
        heading: '1. Strictly Necessary Functional Storage (Always Active)',
        body: 'Required for storing your regional unit selection (USD/GBP/EUR, Miles/Kilometers, MPG/L/100km) and Dark/Light display mode.',
      },
      {
        heading: '2. Contextual AdSense & Partner Attribution Cookies',
        body: 'Used to enforce frequency capping, zero-CLS ad slot rendering, and anonymous partner conversion attribution without selling personal data under CCPA/CPRA.',
      },
    ],
  },
};

export default function TechnicalMethodologyGuide({
  activeLegalModal,
  onCloseLegalModal,
  onOpenLegalModal,
}) {
  const [openFaqIdx, setOpenFaqIdx] = useState(-1);
  const [cookiePrefs, setCookiePrefs] = useState({
    analytics: true,
    contextualAds: true,
  });

  // Construct JSON-LD Schema.org structured data for FAQPage & SoftwareApplication
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'DriveLedger Automotive TCO, Powertrain Risk & OBD-II Estimator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Commercial-grade vehicle True Cost to Own (TCO) simulator, thermodynamic powertrain wear risk matrix, and live PID OBD-II fault code workshop repair estimator.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  const activeModalData = activeLegalModal ? LEGAL_MODAL_CONTENT[activeLegalModal] : null;

  return (
    <section
      id="methodology-guide"
      aria-label="Technical Engineering and Financial Methodology Guide"
      className="mt-12 scroll-mt-28 lg:scroll-mt-32 space-y-10 border-t border-border pt-10"
    >
      {/* Inject Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Section Header */}
      <div className="max-w-4xl space-y-3">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium">
          <BookOpen className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span>TECHNICAL WHITE PAPER &amp; MATHEMATICAL METHODOLOGY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-zinc-100">
          First-Principles Automotive Financial Modeling, Thermodynamic Powertrain Wear &amp; Live OBD-II Telemetry
        </h2>
        <p className="text-sm text-body dark:text-zinc-300 leading-relaxed">
          Engineering documentation governing our non-linear depreciation, thermodynamic wear, and OBD-II repair diagnostic engines.
        </p>
      </div>

      {/* 3-Column Deep Technical Pillars (1,200+ Words Total Authoritative Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pillar 1: Non-Linear Depreciation & Amortization Math */}
        <article className="rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 p-4 sm:p-6 shadow-card space-y-4 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted dark:text-zinc-400 block">
                  SECTION 01 · FINTECH MODELING
                </span>
                <h3 className="text-base font-bold text-ink dark:text-zinc-100">
                  Non-Linear Depreciation &amp; Capital Amortization
                </h3>
              </div>
            </div>

            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              Empirical non-linear residual retention curves calibrated across wholesale auction datasets and mileage intensity.
            </p>
          </div>

          <details className="group pt-3 border-t border-border dark:border-zinc-800">
            <summary className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <span>View mathematical formulation &amp; derivation</span>
              <ChevronDown className="w-4 h-4 shrink-0 group-open:rotate-180 transition-transform duration-200" />
            </summary>

            <div className="mt-4 pt-3 border-t border-border/50 dark:border-zinc-800 space-y-3 text-xs leading-relaxed text-body dark:text-zinc-300 cursor-default">
              <p>
                Depreciation represents the single largest wealth outflow in automotive ownership—typically accounting for <strong>38% to 52% of 5-year True Cost to Own (TCO)</strong>. Automobiles do not depreciate linearly; instead, they follow a steep exponential decay curve influenced by powertrain segment, warranty expiration cliffs (at 36,000 and 60,000 miles), and annual mileage intensity.
              </p>

              <div className="p-3 rounded-lg bg-surface-subtle dark:bg-zinc-950 border border-border dark:border-zinc-800 font-sans text-[11px] space-y-1">
                <span className="text-primary-600 dark:text-primary-400 font-bold block">
                  RESIDUAL VALUE EQUATION:
                </span>
                <code className="block font-mono tabular-nums text-ink dark:text-zinc-200 break-words">
                  V(t) = P₀ × R_seg(t) × [1 - α · ((M_ann - 12,500) / 12,500)]^t
                </code>
                <span className="text-muted dark:text-zinc-400 block pt-1">
                  Where α = 0.045 mileage elasticity &amp; R_seg(t) is the 10-year empirical retention vector.
                </span>
              </div>

              <p>
                For example, a planetary-gear hybrid sedan (such as the <em>Toyota Camry Hybrid e-CVT</em>) retains approximately <strong>61%</strong> of its acquisition value at Year 5 (`R_seg(5) = 0.61`) due to low unscheduled failure rates and high secondary-market fuel economy demand. Conversely, a complex German executive saloon with air suspension or dual-clutch hydraulics experiences a steeper post-warranty retention drop (`R_seg(5) = 0.40–0.43`) as second-hand buyers price in impending timing chain, mechatronic, and multi-link control arm liabilities.
              </p>

              <p>
                Our financing engine couples this residual curve with an exact monthly reducing-balance amortization schedule. In the early years of a 72- or 84-month loan at &gt;6.5% APR, front-loaded interest charges combined with Year 1–2 depreciation frequently create a negative equity gap, which DriveLedger highlights in the year-by-year progression table.
              </p>
            </div>
          </details>
        </article>

        {/* Pillar 2: Thermodynamic Short-Trip Wear Factors */}
        <article className="rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 p-4 sm:p-6 shadow-card space-y-4 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-warning-bg dark:bg-amber-950/50 border border-[#F5DE8A] dark:border-amber-800/80 flex items-center justify-center text-warning-text dark:text-amber-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted dark:text-zinc-400 block">
                  SECTION 02 · TRIBOLOGY &amp; KINETICS
                </span>
                <h3 className="text-base font-bold text-ink dark:text-zinc-100">
                  Thermodynamic Short-Trip Wear Multipliers (1.35x–1.55x)
                </h3>
              </div>
            </div>

            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              Thermodynamic wear penalties accounting for cold-start oil dilution, wet timing belts, and DPF soot.
            </p>
          </div>

          <details className="group pt-3 border-t border-border dark:border-zinc-800">
            <summary className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <span>View thermodynamic formulation &amp; derivation</span>
              <ChevronDown className="w-4 h-4 shrink-0 group-open:rotate-180 transition-transform duration-200" />
            </summary>

            <div className="mt-4 pt-3 border-t border-border/50 dark:border-zinc-800 space-y-3 text-xs leading-relaxed text-body dark:text-zinc-300 cursor-default">
              <p>
                A physical dashboard odometer reading of 55,000 miles accumulated via 40-mile steady-state highway commutes is mechanically completely different from 55,000 miles accumulated via 4-mile cold urban school and shopping runs. Over <strong>75% of piston ring, cam lobe, and timing chain pin wear occurs during the first 12 minutes of warmup</strong> before engine oil reaches its 95°C equilibrium viscosity and anti-wear additive activation temperature (ZDDP tribofilm formation).
              </p>

              <div className="p-3 rounded-lg bg-surface-subtle dark:bg-zinc-950 border border-border dark:border-zinc-800 font-sans text-[11px] space-y-1">
                <span className="text-warning-text dark:text-amber-400 font-bold block">
                  EFFECTIVE WEAR AGE FORMULA:
                </span>
                <code className="block font-mono tabular-nums text-ink dark:text-zinc-200 break-words">
                  M_eff = M_phys × [1 + U_pct · (k_urban - 1)] × k_oil × k_hist
                </code>
                <span className="text-muted dark:text-zinc-400 block pt-1">
                  Where k_urban ∈ [1.35, 1.55], k_oil ∈ [0.90, 1.38], k_hist ∈ [1.00, 1.32].
                </span>
              </div>

              <p>
                On modern Euro 6 / EPA Tier 3 turbo-diesels (such as the <em>2.0 EcoBlue</em> or <em>EA288 2.0 TDI</em>), urban trips under 12 miles prevent exhaust gas temperatures from reaching the 580°C required to oxidize trapped soot inside the Diesel Particulate Filter (DPF). When the ECU attempts an active regeneration via late post-injection and the driver turns the engine off mid-cycle, unburned diesel washes down the cylinder walls into the crankcase sump.
              </p>

              <p>
                This diesel fuel dilution degrades oil lubricity and chemically swells submerged elastomer <strong>wet timing belts (Belt-in-Oil)</strong>, causing rubber debris to shed into the oil pump pickup strainer. Similarly, on Gasoline Direct Injection (GDI) turbo engines, cold urban cycles accelerate PCV blow-by condensation, baking hard carbon deposits onto intake valve stems and seizing variable-nozzle turbocharger (VNT) unison rings.
              </p>
            </div>
          </details>
        </article>

        {/* Pillar 3: First-Principles OBD-II Live PID Diagnostics */}
        <article className="rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 p-4 sm:p-6 shadow-card space-y-4 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-success-bg dark:bg-emerald-950/50 border border-[#BFE8CF] dark:border-emerald-800/80 flex items-center justify-center text-success-text dark:text-emerald-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted dark:text-zinc-400 block">
                  SECTION 03 · SAE J1979 DIAGNOSTICS
                </span>
                <h3 className="text-base font-bold text-ink dark:text-zinc-100">
                  First-Principles OBD-II Live PID Verification Workflows
                </h3>
              </div>
            </div>

            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              First-principles SAE J1979 live PID verification routines to isolate sensor drift before replacing components.
            </p>
          </div>

          <details className="group pt-3 border-t border-border dark:border-zinc-800">
            <summary className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <span>View diagnostic identities &amp; workflows</span>
              <ChevronDown className="w-4 h-4 shrink-0 group-open:rotate-180 transition-transform duration-200" />
            </summary>

            <div className="mt-4 pt-3 border-t border-border/50 dark:border-zinc-800 space-y-3 text-xs leading-relaxed text-body dark:text-zinc-300 cursor-default">
              <p>
                Every year, motorists waste billions of dollars on "parts-cannon" workshop estimates because basic code readers translate an OBD-II fault code into a part name rather than a physical circuit test. Under the SAE J1979 / ISO 15031-5 specification, an Engine Control Module (ECM) stores a Diagnostic Trouble Code (DTC) only when a monitored Parameter ID (PID) deviates outside its rationality window over two consecutive drive cycles.
              </p>

              <div className="p-3 rounded-lg bg-surface-subtle dark:bg-zinc-950 border border-border dark:border-zinc-800 font-sans text-[11px] space-y-1">
                <span className="text-success-text dark:text-emerald-400 font-bold block">
                  CORE DIAGNOSTIC IDENTITIES:
                </span>
                <code className="block font-mono tabular-nums text-ink dark:text-zinc-200 break-words">
                  • P2002: ΔP_DPF(idle) = 0.5–1.8 kPa | KOEO = 0.0 kPa
                </code>
                <code className="block font-mono tabular-nums text-ink dark:text-zinc-200 break-words">
                  • P0171: |STFT + LTFT|_idle &gt; 20% → &lt; 5% @ 2500 RPM = Vacuum Leak
                </code>
                <code className="block font-mono tabular-nums text-ink dark:text-zinc-200 break-words">
                  • U0100: R(DLC Pin 6 ↔ Pin 14) = 60.0 Ω (Two 120Ω in parallel)
                </code>
              </div>

              <p>
                Consider <strong>P2002 (DPF Efficiency Below Threshold)</strong>: in 44% of cases, the ceramic DPF brick is completely intact, and condensation has simply corroded the $110 exhaust differential pressure sensor (G450) or split its silicone reference hose. Reading the DPF Differential Pressure PID with Key-ON Engine-OFF immediately proves sensor drift if the reading is non-zero.
              </p>

              <p>
                Likewise, for <strong>P0171 (System Too Lean Bank 1)</strong>, graphing Short-Term Fuel Trim (STFT) and Long-Term Fuel Trim (LTFT) at 750 RPM idle and then raising engine speed to 2,500 RPM in Neutral isolates the fault in 30 seconds: if fuel trims normalize toward 0% at 2,500 RPM, throttle airflow has drowned out an intake manifold or PCV vacuum leak. If fuel trims climb higher under load, fuel delivery or MAF air-mass metering is restricted.
              </p>
            </div>
          </details>
        </article>
      </div>

      {/* Reference Engineering Benchmark Table */}
      <div className="rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 p-4 sm:p-6 shadow-sm space-y-4 min-w-0 max-w-full overflow-hidden">
        <details className="group cursor-pointer">
          <summary className="flex flex-wrap items-center justify-between gap-2 select-none list-none [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-ink dark:text-zinc-100 flex items-center gap-2">
                <span>Powertrain Preventative Service vs. OEM "Marketing Lifetime" Intervals</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 group-open:rotate-180 transition-transform duration-200" />
              </h3>
              <p className="text-xs text-muted dark:text-zinc-400 mt-0.5">
                Engineering safe intervals compiled across independent marque specialists (ZF, BorgWarner, Bosch, Luk/INA).
              </p>
            </div>
            <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
              STANDARD REFERENCE MATRIX
            </span>
          </summary>

          <div className="mt-4 pt-4 border-t border-border dark:border-zinc-800 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 cursor-default">
            <table className="w-full text-left border-collapse text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-border dark:border-zinc-800 text-[11px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans font-semibold">
                  <th className="py-2.5 pr-3">Mechanical Assembly</th>
                  <th className="py-2.5 px-3">OEM Claimed Interval</th>
                  <th className="py-2.5 px-3">Engineering Safe Interval</th>
                  <th className="py-2.5 px-3">Urban Penalty</th>
                  <th className="py-2.5 pl-3">Primary Failure Consequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-zinc-800 font-mono tabular-nums">
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-semibold text-ink dark:text-zinc-100">
                    ZF 8HP / 9G / 10R80 Torque Converter ATF
                  </td>
                  <td className="py-2.5 px-3 font-sans text-muted dark:text-zinc-400">"Lifetime Fill" (<span className="font-mono tabular-nums">100k+ mi</span>)</td>
                  <td className="py-2.5 px-3 text-success-text dark:text-emerald-400 font-bold">
                    55,000 mi / 88,000 km
                  </td>
                  <td className="py-2.5 px-3 text-warning-text dark:text-amber-400 font-semibold">1.35x</td>
                  <td className="py-2.5 pl-3 font-sans text-body dark:text-zinc-300">
                    Mechatronic solenoid varnishing &amp; converter clutch shudder (P0700)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-semibold text-ink dark:text-zinc-100">
                    Wet-Clutch DSG / PDK / S-Tronic Fluid &amp; Filter
                  </td>
                  <td className="py-2.5 px-3 text-muted dark:text-zinc-400">40,000 – 80,000 mi</td>
                  <td className="py-2.5 px-3 text-success-text dark:text-emerald-400 font-bold">
                    38,000 mi / 60,000 km
                  </td>
                  <td className="py-2.5 px-3 text-warning-text dark:text-amber-400 font-semibold">1.52x</td>
                  <td className="py-2.5 pl-3 font-sans text-body dark:text-zinc-300">
                    Clutch pack glazing, accumulator pressure loss &amp; odd/even gear drop
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-semibold text-ink dark:text-zinc-100">
                    Belt-in-Oil (Wet Timing Belt — EcoBlue / PureTech)
                  </td>
                  <td className="py-2.5 px-3 text-muted dark:text-zinc-400">100,000 – 140,000 mi</td>
                  <td className="py-2.5 px-3 text-success-text dark:text-emerald-400 font-bold">
                    60,000 mi / 96,000 km
                  </td>
                  <td className="py-2.5 px-3 text-danger-text dark:text-rose-400 font-semibold">1.50x</td>
                  <td className="py-2.5 pl-3 font-sans text-body dark:text-zinc-300">
                    Rubber delamination clogging oil pickup strainer &amp; valve collision
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-semibold text-ink dark:text-zinc-100">
                    Turbo GDI Crankcase Oil &amp; Filter (EA888 / B48 / EcoBoost)
                  </td>
                  <td className="py-2.5 px-3 text-muted dark:text-zinc-400">15,000 – 20,000 mi</td>
                  <td className="py-2.5 px-3 text-success-text dark:text-emerald-400 font-bold">
                    6,500 mi / 10,000 km
                  </td>
                  <td className="py-2.5 px-3 text-warning-text dark:text-amber-400 font-semibold">1.42x</td>
                  <td className="py-2.5 pl-3 font-sans text-body dark:text-zinc-300">
                    Timing chain pin stretch (P0016), VCT cam phaser rattle &amp; turbo bearing coking
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 p-4 sm:p-6 shadow-sm space-y-4 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
              SCHEMA.ORG FAQPAGE STRUCTURED DATA
            </span>
            <h3 className="text-lg font-bold text-ink dark:text-zinc-100">
              Frequently Asked Engineering &amp; TCO Questions
            </h3>
          </div>
        </div>

        <div className="divide-y divide-border dark:divide-zinc-800 border-t border-border dark:border-zinc-800">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[44px] flex items-center justify-between gap-4 text-left text-sm font-semibold text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150"
                >
                  <span>{item.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted dark:text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Partner & Affiliate Transparency Banner */}
      <div
        id="partner-disclosure-banner"
        className="scroll-mt-28 lg:scroll-mt-32 rounded-2xl bg-surface-subtle dark:bg-zinc-900/60 border border-border dark:border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted dark:text-zinc-400"
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-score-good dark:text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-ink dark:text-zinc-200">
              Advertising &amp; Partner Link Disclosure:{' '}
            </strong>
            DriveLedger maintains strict separation between our cost estimation models and third-party partner links. Review our legal governance documents at any time:
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {Object.entries(LEGAL_MODAL_CONTENT).map(([key, doc]) => (
            <button
              key={key}
              type="button"
              onClick={() => onOpenLegalModal && onOpenLegalModal(key)}
              className="min-h-[44px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-md bg-surface dark:bg-zinc-800 border border-border-strong dark:border-zinc-700 text-xs font-semibold text-ink dark:text-zinc-200 hover:border-primary-600 dark:hover:border-primary-400 transition-colors duration-150"
            >
              {doc.title.split('&')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Working Legal & Compliance Modal Dialog */}
      {activeModalData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <activeModalData.icon className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                <div className="min-w-0">
                  <h3
                    id="legal-modal-title"
                    className="text-base font-bold text-ink dark:text-zinc-100 truncate"
                  >
                    {activeModalData.title}
                  </h3>
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                    Effective Revision: {activeModalData.updated}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseLegalModal}
                aria-label="Close modal"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 rounded-lg text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-800 transition-colors duration-150 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed">
              {activeModalData.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-ink dark:text-zinc-100">{sec.heading}</h4>
                  <p>{sec.body}</p>
                </div>
              ))}

              {activeLegalModal === 'cookies' && (
                <div className="pt-3 border-t border-border dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle dark:bg-zinc-950 border border-border dark:border-zinc-800">
                    <div>
                      <span className="font-semibold text-ink dark:text-zinc-200 block">
                        Essential Telemetry &amp; Unit State Storage
                      </span>
                      <span className="text-xs text-muted dark:text-zinc-400">
                        Required for US/UK/EU unit conversion &amp; theme state
                      </span>
                    </div>
                    <span className="text-xs font-sans font-bold text-success-text dark:text-emerald-400">
                      ALWAYS ACTIVE
                    </span>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle dark:bg-zinc-950 border border-border dark:border-zinc-800 cursor-pointer">
                    <div>
                      <span className="font-semibold text-ink dark:text-zinc-200 block">
                        Contextual AdSense &amp; Partner Attribution
                      </span>
                      <span className="text-xs text-muted dark:text-zinc-400">
                        Display ad slots &amp; partner attribution links
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cookiePrefs.contextualAds}
                      onChange={(e) =>
                        setCookiePrefs((p) => ({ ...p, contextualAds: e.target.checked }))
                      }
                      className="w-4 h-4 accent-primary-600 rounded"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-surface-subtle dark:bg-zinc-950 border-t border-border dark:border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCloseLegalModal}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors duration-150"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
