import React from 'react';
import {
  ShieldCheck,
  Calculator,
  Wrench,
  Scale,
  TrendingDown,
  Globe,
  FileText,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Award,
  AlertTriangle,
} from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';
import { Card, PageHeader } from '../components/common/OdometerPrimitives';

export default function AboutPage({ onNavigateTab }) {
  const handleNav = (tab) => {
    if (typeof onNavigateTab === 'function') {
      onNavigateTab(tab);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-ink dark:text-zinc-100">
      {/* Hero Section */}
      <div className="space-y-4">
        <BrandLogo size="lg" />
        <PageHeader
          title="About DriveLedger"
          subtitle="DriveLedger (mydriveledger.com) is an independent engineering and automotive financial analytics platform empowering used car buyers and fleet managers with transparent ownership models and repair estimates."
          className="mb-0 max-w-3xl"
        />
      </div>

      {/* Core Mission & Brand Identity */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-primary-600 dark:text-emerald-400 shrink-0">
            <Award aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-zinc-100">Our Mission &amp; Principles</h2>
            <p className="text-xs sm:text-sm text-muted dark:text-zinc-400">Zero dealer kickbacks, zero paywalls, 100% deterministic mathematics</p>
          </div>
        </div>
        <p className="text-sm text-body dark:text-zinc-300 leading-relaxed max-w-[68ch] text-pretty">
          The modern automotive marketplace is opaque. Dealership finance managers conceal true ownership depreciation behind monthly installment payment tricks, while aftermarket warranty vendors inflate failure probabilities to sell high-margin policies. DriveLedger was founded on a singular premise: <strong>car buyers deserve uncompromised, actuarial-grade financial clarity before signing a contract.</strong>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>100% Free &amp; Open</span>
            </div>
            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              All 5-year TCO models, risk matrices, and OBD-II repair calculators are free for public use with zero paywalls or mandatory account signups.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>No Dealership Affiliation</span>
            </div>
            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              We accept zero sponsorship from automobile manufacturers, franchised dealer networks, or captive auto lenders. Our algorithms remain strictly neutral.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Empirical Calibration</span>
            </div>
            <p className="text-xs text-body dark:text-zinc-300 leading-relaxed">
              Our formulas are derived from empirical wholesale salvage auction trends, OEM workshop manual labor times, and verified failure databases.
            </p>
          </div>
        </div>
      </Card>

      {/* Comprehensive TCO & Repair Cost Methodology */}
      <section className="space-y-6">
        <div className="border-b border-border/80 dark:border-zinc-800 pb-4">
          <h2 className="text-h2 font-bold text-ink dark:text-zinc-50 tracking-tight">
            Our TCO &amp; Repair Cost Methodology
          </h2>
          <p className="text-muted dark:text-zinc-400 text-xs sm:text-sm mt-1">
            A comprehensive breakdown of our actuarial depreciation curves, mileage risk weighting, and regional labor rate models.
          </p>
        </div>

        {/* Pillar 1: Actuarial Depreciation Curves */}
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
              <TrendingDown aria-hidden="true" className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
              1. Actuarial Depreciation Curves &amp; Used Vehicle Offsets
            </h3>
          </div>
          <p className="text-body dark:text-zinc-300 text-sm leading-relaxed max-w-[68ch] text-pretty">
            Automotive depreciation is the single largest financial expense of vehicle ownership, often accounting for 40% to 55% of the total 5-year cost to own. Traditional consumer calculators apply simplistic linear percentage decreases that fail to represent real-world market dynamics. DriveLedger models depreciation as a multi-stage non-linear decay function calibrated against historical secondary transaction records:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-body dark:text-zinc-300">
            <li className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60">
              <span className="font-bold text-ink dark:text-zinc-100 block mb-1">Years 1–3: The Showroom Cliff</span>
              A brand new vehicle sheds approximately <strong className="font-mono tabular-nums">20% to 25%</strong> of its capitalized acquisition value during Year 1, followed by <strong className="font-mono tabular-nums">12% to 15%</strong> in Year 2 and <strong className="font-mono tabular-nums">10% to 12%</strong> in Year 3.
            </li>
            <li className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60">
              <span className="font-bold text-ink dark:text-zinc-100 block mb-1">Years 4–10: Asymptotic Stabilization</span>
              Post-warranty vehicles enter an asymptotic residual plateau where depreciation stabilizes to between <strong className="font-mono tabular-nums">3% and 7% annually</strong>, driven predominantly by physical condition rather than age.
            </li>
            <li className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60">
              <span className="font-bold text-ink dark:text-zinc-100 block mb-1">The 5% Residual Salvage Floor</span>
              Regardless of accumulated mileage (even at 500,000+ miles), our valuation model enforces a <strong>guaranteed <span className="font-mono tabular-nums">5%</span> residual floor</strong> representing scrap metal recovery and core parts salvage equity.
            </li>
          </ul>
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
            <strong>The Used Vehicle Offset Advantage:</strong> When purchasing a 4- to 6-year-old vehicle with 60,000 miles, our engine does NOT subject the buyer to a simulated new-car 20% showroom depreciation penalty. The calculation resumes along the stabilized secondary slope, proving mathematically why purchasing lightly used vehicles delivers superior capital efficiency. Furthermore, hybrid powertrains (HEV) receive an actuarial retention bonus reflecting elevated secondary market demand.
          </div>
        </Card>

        {/* Pillar 2: Mileage Risk Weighting & Thermodynamic Multipliers */}
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-primary-600 dark:text-emerald-400 shrink-0">
              <Wrench aria-hidden="true" className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
              2. Mileage Risk Weighting &amp; Thermodynamic Urban Multipliers
            </h3>
          </div>
          <p className="text-body dark:text-zinc-300 text-sm leading-relaxed max-w-[68ch] text-pretty">
            Mechanical wear is not a simple linear function of distance. Operating an engine under sustained highway cruising conditions exerts vastly less mechanical wear per mile than stop-and-go urban commutes characterized by incomplete thermal warm-up cycles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-body dark:text-zinc-300">
            <div className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
              <span className="font-bold text-ink dark:text-zinc-100 block">Annual Distance Elasticity Coefficient</span>
              <p className="leading-relaxed">
                Our baseline model is calibrated to a standard annual intensity of <span className="font-mono tabular-nums">12,500</span> miles (<span className="font-mono tabular-nums">20,000</span> km). Annual mileage exceeding this benchmark applies an empirical elasticity coefficient of <code className="text-primary-600 dark:text-emerald-400 font-mono">α = 0.045</code>, compounding secondary-market depreciation discounts due to impending scheduled major revisions.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
              <span className="font-bold text-ink dark:text-zinc-100 block">Thermodynamic Urban Wear Surcharge (1.35x–1.55x)</span>
              <p className="leading-relaxed">
                Short urban trips under 15 minutes prevent engine oil from surpassing 90°C, precipitating crankcase fuel dilution, EGR soot accumulation, and premature Diesel Particulate Filter (DPF) clogging. For urban usage profiles, DriveLedger injects a <strong className="font-mono tabular-nums">1.35x to 1.55x wear multiplier</strong> across exhaust aftertreatment, dual-mass flywheels, and starter systems.
              </p>
            </div>
          </div>
        </Card>

        {/* Pillar 3: Regional Labor Rates Architecture */}
        <Card className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Globe aria-hidden="true" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
                3. Regional Labor Rates Architecture (US, UK, EU)
              </h3>
              <p className="text-xs text-muted dark:text-zinc-400">Real-world workshop labor rates and parts allocation</p>
            </div>
          </div>
          <p className="text-body dark:text-zinc-300 text-sm leading-relaxed max-w-[68ch] text-pretty">
            Repair expenses vary dramatically based on geographical location and service tier. DriveLedger maintains active labor rate matrices across the United States, United Kingdom, and European Union, segmenting repair projections into three distinct tiers: Franchised Dealership, Certified Independent Specialist, and DIY Home Mechanic:
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Regional workshop labor rates"
            className="overflow-x-auto rounded-xl border border-border/80 dark:border-zinc-800"
          >
            <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
              <thead>
                <tr className="border-b border-border/80 dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900/70 text-ink dark:text-zinc-100 font-sans">
                  <th className="py-3 px-4 font-semibold">Region / Market</th>
                  <th className="py-3 px-4 font-semibold">Franchised Dealership</th>
                  <th className="py-3 px-4 font-semibold">Independent Specialist</th>
                  <th className="py-3 px-4 font-semibold">DIY Home Garage</th>
                  <th className="py-3 px-4 font-semibold">Typical Parts vs Labor Split</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 dark:divide-zinc-800 text-body dark:text-zinc-300">
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-ink dark:text-zinc-100">United States (USD)</td>
                  <td className="py-3.5 px-4">$160 – $220 / hr</td>
                  <td className="py-3.5 px-4">$95 – $135 / hr</td>
                  <td className="py-3.5 px-4">$0 / hr (parts only)</td>
                  <td className="py-3.5 px-4">45% Parts / 55% Labor</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-ink dark:text-zinc-100">United Kingdom (GBP)</td>
                  <td className="py-3.5 px-4">£120 – £175 / hr</td>
                  <td className="py-3.5 px-4">£65 – £95 / hr</td>
                  <td className="py-3.5 px-4">£0 / hr (parts only)</td>
                  <td className="py-3.5 px-4">40% Parts / 60% Labor</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-ink dark:text-zinc-100">European Union (EUR)</td>
                  <td className="py-3.5 px-4">€110 – €160 / hr</td>
                  <td className="py-3.5 px-4">€55 – €85 / hr</td>
                  <td className="py-3.5 px-4">€0 / hr (parts only)</td>
                  <td className="py-3.5 px-4">50% Parts / 50% Labor</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted dark:text-zinc-400 leading-relaxed">
            Every OBD-II diagnostic dossier in our catalog couples OEM standard repair times (Flat Rate Hours, FRH) with genuine parts prices and regional labor rates. This granular transparency prevents car owners from being overcharged by unscrupulous service advisors.
          </p>
        </Card>
      </section>

      {/* Editorial Transparency & Commercial Independence */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0">
            <Scale aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-zinc-100">Editorial Transparency Standards</h2>
            <p className="text-xs sm:text-sm text-muted dark:text-zinc-400">Strict commercial separation and ethical integrity</p>
          </div>
        </div>
        <div className="space-y-4 text-sm text-body dark:text-zinc-300 leading-relaxed">
          <p className="max-w-[68ch] text-pretty">
            To maintain absolute credibility, DriveLedger maintains an impermeable firewall between commercial operations and mathematical calculations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
              <span className="font-bold block text-xs sm:text-sm text-primary-600 dark:text-emerald-400">
                Commercial Firewall
              </span>
              <p className="text-xs leading-relaxed">
                Our monetization relies on clearly marked affiliate partnerships (such as carVertical VIN history checks and Amazon OBD diagnostic scanners) and context-relevant advertising. No affiliate partner can purchase favorable TCO scores or suppress high-risk failure warnings.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-2">
              <span className="font-bold block text-xs sm:text-sm text-primary-600 dark:text-emerald-400">
                Nominative Fair Use
              </span>
              <p className="text-xs leading-relaxed">
                All vehicle manufacturer names, model designations, and logos are referenced strictly under nominative fair use for identification and historical comparative analysis. DriveLedger is not endorsed by or affiliated with any vehicle manufacturer.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Operator Imprint / Legal Disclosure & Legal Information */}
      <section className="bg-surface-subtle dark:bg-[#121215] rounded-2xl p-6 sm:p-8 border border-border/80 dark:border-zinc-800 space-y-4 text-xs text-muted dark:text-zinc-400">
        <div className="flex items-center gap-2 font-bold text-ink dark:text-zinc-200 text-sm">
          <FileText aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
          <span>Operator Imprint / Legal Disclosure &amp; Regulatory Information</span>
        </div>
        <p className="leading-relaxed">
          In compliance with the European Union e-Commerce Directive (2000/31/EC), the Hungarian Act CVIII of 2001 on Electronic Commerce Services, and international digital media transparency frameworks:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-ink dark:text-zinc-300">
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Service Provider:</span>
            DriveLedger Analytics Platform
          </div>
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Official Domain:</span>
            mydriveledger.com
          </div>
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Contact Email:</span>
            contact@mydriveledger.com
          </div>
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Hosting Infrastructure:</span>
            Cloudflare Pages (Global Anycast Edge)
          </div>
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Data Protection Officer:</span>
            legal@mydriveledger.com
          </div>
          <div>
            <span className="block text-muted dark:text-zinc-400 font-semibold">Applicable Jurisdiction:</span>
            European Union / Hungary
          </div>
        </div>
      </section>

      {/* Interactive Quick Links */}
      <section className="text-center pt-2 space-y-4">
        <h3 className="text-lg font-bold text-ink dark:text-zinc-100">Explore Our Diagnostic &amp; Financial Engines</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleNav('tco')}
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            <Calculator aria-hidden="true" className="w-4 h-4" />
            <span>Launch 5-Year TCO Calculator</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleNav('checklist')}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-100 font-medium text-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
            <span>Pre-Purchase Inspection Checklist</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav('contact')}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-100 font-medium text-sm transition-colors cursor-pointer"
          >
            <HelpCircle aria-hidden="true" className="w-4 h-4" />
            <span>Contact Our Engineering Team</span>
          </button>
        </div>
      </section>
    </div>
  );
}
