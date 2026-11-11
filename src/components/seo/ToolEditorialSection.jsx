import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Wrench,
  Calculator,
  ShieldCheck,
  TrendingDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Collapse } from '../common/OdometerPrimitives';

const EDITORIAL_CONTENT = {
  tco: {
    title: 'How the 5-Year True Cost to Own Calculator Works & Key Cost Factors',
    subtitle: 'Actuarial depreciation models, mileage risk coefficients, and regional workshop labor economics',
    pillars: [
      {
        heading: 'Depreciation Curves & Mileage Elasticity Methodology',
        icon: TrendingDown,
        text: `Automotive depreciation is the single largest financial outlay of vehicle ownership, typically accounting for 38% to 52% of total 5-year True Cost to Own (TCO). Rather than applying a misleading linear percentage drop, DriveLedger utilizes segment-specific logarithmic residual retention curves calibrated against historical wholesale auction datasets and annual mileage intensity. Vehicle residual value at year t is formulated as V(t) = P0 × Rseg(t) × [1 - α × ((Mann - 12,500) / 12,500)]^t, where P0 represents capitalized acquisition cost, Rseg(t) is the baseline 10-year empirical residual retention vector, and α = 0.045 is the empirical mileage elasticity coefficient. High annual mileage accelerates secondary-market discounting due to mechanical wear liabilities, whereas vehicles logging under 8,000 miles per year preserve substantial residual equity. Furthermore, our amortization schedule calculates exact reducing-balance financing interest, highlighting the negative equity window common during the initial 24 to 36 months of extended-term auto loans.`,
      },
      {
        heading: 'Real-World Maintenance & Regional Workshop Economics',
        icon: Wrench,
        text: `Pre-Emptive Fluid Servicing: Despite manufacturer marketing claims of "lifetime" automatic transmission fluids (ATF) and dual-clutch fluids, transmission oil undergoes shear degradation and thermal oxidation. Flushing fluids and replacing sump filters every 40,000 to 60,000 miles prevents $3,000+ valve body and clutch pack failures. Urban Driving Cycle Surcharge: Short trips under 15 minutes prevent motor oil from exceeding 90°C, causing fuel dilution and carbon accumulation. We apply a 1.35x to 1.55x wear multiplier to exhaust and induction subsystems for predominantly city-driven vehicles. Regional Labor Disparity: Independent repair specialists charge $95–$145/hr in the US (£65–£95/hr UK, €55–€85/hr EU), whereas franchised dealerships charge $160–$220/hr in the US (£120–£175/hr UK, €110–€160/hr EU). Budgeting an emergency maintenance reserve of $60 to $90 per month prevents high-interest repair debt.`,
      },
    ],
    faqs: [
      {
        q: 'How does vehicle mileage alter depreciation curves compared to age alone?',
        a: 'Age causes cosmetic and rubber degradation, but mileage directly correlates with powertrain wear and impending scheduled major revisions. Exceeding 15,000 annual miles increases second-hand buyer risk pricing, shifting the depreciation curve downward by 4.5% per 10,000 miles of deviation.',
      },
      {
        q: 'What is the difference between Cash Outflow and Economic Cost to Own?',
        a: 'Cash Outflow measures total bank deductions (down payment + loan installments + fuel + insurance + repairs). Economic TCO calculates true balance-sheet wealth loss by replacing loan principal with actual market depreciation loss plus financing interest.',
      },
      {
        q: 'Why do franchised dealerships charge 40–80% higher maintenance rates?',
        a: 'Dealerships carry substantial real estate overhead, dedicated manufacturer diagnostic tooling licenses, and factory training mandates. For post-warranty vehicles, certified independent specialists offer equivalent mechanical competency at significantly lower hourly rates.',
      },
      {
        q: 'How do regional fuel prices and insurance brackets influence rankings?',
        a: 'High-efficiency hybrids and diesels deliver major cost advantages in high-fuel-cost regions (such as the UK and EU), whereas low insurance risk groups can offset slight fuel consumption penalties over a 5-year ownership horizon.',
      },
    ],
  },

  obd: {
    title: 'How the OBD-II Workshop Repair Estimator Works & Diagnostic Protocols',
    subtitle: 'SAE J2012 fault code architectures, Bayesian root cause probability, and parts vs labor splits',
    pillars: [
      {
        heading: 'Diagnostic Trouble Code (DTC) Methodology & Probability Weights',
        icon: Calculator,
        text: `An OBD-II Diagnostic Trouble Code (DTC) defined under SAE J2012 and ISO 15031 standards does not indicate that a specific component has failed; it signals that a monitored sensor voltage, frequency, or duty cycle departed from calibrated engineering thresholds. Simplistic code scanners encourage premature parts swapping. DriveLedger estimation engine uses Bayesian probability weighting across real-world workshop work orders to separate root causes by statistical frequency. For instance, code P2002 (Diesel Particulate Filter Efficiency Below Threshold) is caused by a drifted $90 exhaust differential pressure sensor or split silicone sensor line in over 60% of cases, rather than a clogged $1,800 DPF filter core. Similarly, lean condition code P0171 frequently stems from a $15 torn PCV diaphragm or intake boot vacuum leak rather than a faulty mass airflow (MAF) sensor. Our estimator presents stratified pricing across DIY parts cost ($0 labor), Independent Repair Specialists ($95–$135/hr), and Franchised Dealerships ($160–$220/hr).`,
      },
      {
        heading: 'Practical Workshop Troubleshooting & Freeze-Frame Protocols',
        icon: Wrench,
        text: `Freeze-Frame Capture: Always record ECU freeze-frame telemetry (coolant temperature, short/long-term fuel trims, engine RPM, vehicle speed) before clearing DTCs. This snapshot reveals whether faults occur under heavy load or cold idle. First-Principles Vacuum Smoke Testing: Before replacing oxygen sensors or fuel pumps for lean/rich codes, perform a smoke test of the intake manifold and vacuum lines to identify unmetered air leaks. Readiness Monitor Integrity: Clearing codes resets internal Inspection/Maintenance (I/M) readiness monitors. Driving 50–100 miles through a complete drive cycle (cold start, highway cruise, deceleration) is mandatory to set readiness flags before statutory emissions testing.`,
      },
    ],
    faqs: [
      {
        q: 'Why do workshops charge a diagnostic fee when parts stores scan codes for free?',
        a: 'Parts store code scans merely retrieve the DTC number. Professional diagnosis involves verifying wiring harnesses, testing sensor waveforms with an oscilloscope, and verifying mechanical actuator movement before approving parts replacement.',
      },
      {
        q: 'What is the difference between Pending, Confirmed, and Permanent codes?',
        a: 'A pending code is logged on the first drive cycle fault; if the fault repeats on the subsequent cycle, it illuminates the Check Engine Light and becomes confirmed. Permanent codes are stored in non-volatile memory and can only be cleared by the ECU after verifying the repair.',
      },
      {
        q: 'Is it safe to drive with a steady Check Engine Light versus a flashing light?',
        a: 'A steady amber light indicates a non-emergency emissions or sensor fault that requires scheduled attention. A flashing Check Engine Light signals severe engine misfire dumping raw fuel into the exhaust, which can melt the catalytic converter within minutes. Pull over immediately.',
      },
      {
        q: 'How do live sensor Parameter IDs (PIDs) prevent unnecessary repairs?',
        a: 'By monitoring live sensor PIDs (e.g., comparing upstream and downstream O2 sensor voltages or reading absolute fuel rail pressure), technicians confirm whether a component is electrically alive and physically responding before ordering replacements.',
      },
    ],
  },

  checklist: {
    title: 'How the Pre-Purchase Inspection (PPI) Checklist Works & Negotiation Strategies',
    subtitle: 'Cold-start forensic verification, structural chassis checks, and data-backed price deductions',
    pillars: [
      {
        heading: 'Multi-Point Verification & Cold-Start Protocol',
        icon: ShieldCheck,
        text: `A thorough Pre-Purchase Inspection (PPI) is the most critical safeguard when purchasing a used vehicle. DriveLedger PPI framework organizes vehicle evaluation into a chronological, cold-to-hot inspection sequence across powertrain, transmission, steering/chassis, structural bodywork, and diagnostic electronics. Inspecting a vehicle completely cold is paramount: starting an engine that has sat overnight exposes worn timing chain tensioner rattle (common on direct-injected engines), hydraulic valve lifter tick, failing high-pressure fuel pump seals, and exhaust smoke plumes before components thermally expand. Blue smoke indicates valve stem seal or piston ring oil consumption; dense white sweet-smelling smoke indicates coolant head gasket failure; dark black smoke reveals unburned fuel from leaking fuel injectors. Furthermore, our checklist cross-examines physical wear on pedals, steering wheels, and seat bolsters against the instrument cluster mileage and electronic control unit (ECU) engine hour registers.`,
      },
      {
        heading: 'Data-Driven Negotiation & Defect Flagging Strategies',
        icon: Calculator,
        text: `The Strict Walk-Away Criteria: Never attempt to negotiate minor discounts on flood damage, chassis frame rail kink marks, welded A/B pillars, or active metal shavings in the engine oil filter. Terminate negotiations immediately. Data-Driven Offer Deductions: Flag every verifiable defect in our interactive checklist. Rather than arguing subjectively with a seller, present our itemized Negotiation Battlecard showing estimated part and labor costs to justify your opening offer. The 20-Minute Operational Test Drive: Ensure the test drive lasts at least 20 minutes to verify coolant reaches 90°C and transmission oil reaches full operating temperature, checking for torque converter shudder and dual-clutch low-speed judder.`,
      },
    ],
    faqs: [
      {
        q: 'Why must a used car inspection begin with a completely cold engine?',
        a: 'Dishonest sellers often warm up vehicles before prospective buyers arrive to mask rough cold idle, timing chain slap, depleted battery cranking speed, and worn starter motor friction. Always request that the engine remain untouched before arrival.',
      },
      {
        q: 'How can a buyer detect hidden bodywork collision repairs without professional tools?',
        a: 'Inspect panel gaps for uniform width, check factory paint overspray on rubber door seals, verify VIN stamp integrity on the firewall and strut towers, and look for mismatched bolt head tooling marks on front fenders and hood hinges.',
      },
      {
        q: 'What should you do if an OBD-II scanner indicates readiness monitors are "Not Ready"?',
        a: 'Incomplete readiness monitors suggest the seller recently cleared active trouble codes to hide a Check Engine Light. Require the seller to allow a 50-mile drive cycle and re-scan before concluding purchase negotiations.',
      },
      {
        q: 'How should flagged checklist defects be presented during price negotiation?',
        a: 'Present defects objectively as scheduled maintenance investments required to bring the vehicle to roadworthy condition, deducting the exact projected repair total from the asking price.',
      },
    ],
  },
};

export default function ToolEditorialSection({
  tool = 'tco',
  vehicleName = '',
  activeCode = '',
  className = '',
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const data = EDITORIAL_CONTENT[tool] || EDITORIAL_CONTENT.tco;

  // Generate Schema.org FAQPage structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <section
      aria-label="Editorial Methodology and Technical Context"
      className={`mt-12 bg-surface dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-border dark:border-zinc-800 shadow-sm space-y-8 ${className}`}
    >
      {/* Schema.org FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <div className="space-y-2 border-b border-border dark:border-zinc-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary-50 dark:bg-emerald-950/60 text-primary-700 dark:text-emerald-300 border border-primary-100 dark:border-emerald-800">
          <Info className="w-3.5 h-3.5" />
          Technical Methodology &amp; Engineering White Paper
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-zinc-50 tracking-tight">
          {data.title} {vehicleName ? `(${vehicleName})` : ''} {activeCode ? `[${activeCode}]` : ''}
        </h2>
        <p className="text-xs sm:text-sm text-muted dark:text-zinc-400">
          {data.subtitle}
        </p>
      </div>

      {/* Methodology Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-canvas dark:bg-zinc-900/60 border border-border dark:border-zinc-800 space-y-3"
            >
              <div className="flex items-center gap-2.5 font-bold text-sm text-ink dark:text-zinc-100">
                <div className="p-2 rounded-xl bg-primary-50 dark:bg-zinc-800 text-primary-600 dark:text-emerald-400">
                  <Icon className="w-4 h-4" />
                </div>
                <span>{pillar.heading}</span>
              </div>
              <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed">
                {pillar.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base sm:text-lg font-bold text-ink dark:text-zinc-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
          Frequently Asked Questions &amp; Practical Advice
        </h3>

        <div className="divide-y divide-border dark:divide-zinc-800">
          {data.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left font-semibold text-xs sm:text-sm text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-muted transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>
                <Collapse open={isOpen} id={`tool-faq-${tool}-${idx}`}>
                  <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed pt-2">
                    {faq.a}
                  </p>
                </Collapse>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
