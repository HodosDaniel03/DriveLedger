import React, { useState } from 'react';
import { BookOpen, Wrench, ShieldAlert, Cpu, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { RiskBadge } from '../components/common/OdometerPrimitives';
import VinCheckBanner from '../components/monetization/VinCheckBanner';
import AffiliateCTA from '../components/monetization/AffiliateCTA';

export const BLOG_POSTS = [
  {
    id: 'odometer-rollback-warning-signs',
    title: 'How to Spot Odometer Rollback Before Buying a Used Car (Physical & Digital Checks)',
    category: 'Buying Guide',
    readTime: '7 min read',
    date: 'March 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'critical',
    riskLabel: 'Critical',
    summary:
      'Learn how to combine physical cabin wear inspection, OBD-II module mileage cross-checks, and VIN history reports to detect rolled-back odometers.',
    keyPoints: [
      'Digital instrument clusters can be altered in minutes using cheap OBD tools, but secondary ECUs often retain true mileage.',
      'Compare pedal rubber, steering wheel grain, and driver seat bolster wear against the displayed odometer.',
      'Cross-reference national inspection logs, insurance records, and cross-border VIN history reports before paying a deposit.',
      'A 60,000-mile rollback can push you unexpectedly into overdue timing chain, DPF, or transmission service windows.',
    ],
    content: `
Odometer fraud remains one of the costliest risks in the used-car market. Because modern digital instrument clusters can be altered via the diagnostic port, an artificially low mileage reading not only inflates the purchase price by thousands of dollars—it also hides critical preventative maintenance deadlines.

### 1. Physical Wear vs. Displayed Mileage
Before plugging in any diagnostic tool, evaluate high-contact cabin touchpoints:
1. **Brake and clutch pedal pads**: Heavy rubber wear or exposed metal beneath 60,000 miles (100,000 km) is an immediate warning sign, whereas brand-new pedal rubbers on a 5-year-old car may indicate a cover-up.
2. **Steering wheel and gear selector**: Matte leather typically develops a glossy sheen between 75,000 and 100,000 miles of regular use.
3. **Driver’s seat outer bolster**: Repeated entry and exit compresses the foam and creases the stitching proportionally to short-trip urban cycles.

### 2. Cross-Checking Secondary Control Modules (ECUs)
When a basic mileage blocker or cluster programmer alters the dashboard display, it often leaves the original distance counter intact inside secondary control units. Using a multi-system OBD-II scanner, compare the instrument cluster value against:
- **Transmission Control Module (TCM)**: Many ZF and DSG gearboxes log total operating hours and distance independently.
- **Diesel Particulate Filter (DPF) counter**: Look at "distance since last regeneration" and total calculated oil ash mass.
- **ABS / ESP module and immobilizer key data**: Often store separate mileage stamps when fault codes are recorded.

### 3. Running a Multi-Country VIN History Check
Paper service books are easily forged with custom rubber stamps. Before finalizing a purchase, run the 17-character VIN through an independent vehicle history database (such as carVertical) to verify chronological odometer readings across annual roadworthiness inspections, dealership warranty visits, and insurance claims.
    `,
    relatedTab: 'tco',
    relatedCta: 'Calculate 5-Year True Cost to Own',
  },
  {
    id: 'used-bmw-3-series-buying-checklist',
    title: 'Used BMW 3 Series (F30 / G20) Buying Checklist: Service Intervals & VIN History',
    category: 'Buying Guide',
    readTime: '8 min read',
    date: 'March 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
    summary:
      'What to check on a used BMW 320d (B47) or 330i (B48) before buying: cooling system plastics, ZF 8HP fluid intervals, and historical mileage verification.',
    keyPoints: [
      'B47 diesel and B48 petrol engines are significantly more durable than earlier N47/N20 units, but require strict 8,000–10,000 mile oil changes.',
      'BMW calls ZF 8-speed automatic transmission fluid "lifetime," whereas ZF recommends servicing it every 50,000–75,000 miles (80,000–120,000 km).',
      'Inspect plastic coolant flanges and oil filter housing gaskets on B48 engines past 55,000 miles.',
      'Former corporate lease and fleet cars frequently cover high highway mileage—always verify chronological odometer records by VIN.',
    ],
    content: `
The post-2015 BMW 3 Series (F30 LCI and G20 generations) equipped with modular B47 (2.0L diesel) and B48 (2.0L turbo petrol) powertrains offers an appealing balance of fuel economy and driving dynamics. However, buying a 4-to-8-year-old example requires verifying both mechanical condition and historical provenance.

### 1. Oil Filter Housing & Coolant Flange Inspection (B48 Petrol)
On B48 4-cylinder turbo engines (320i, 330i), the composite oil filter housing and cylinder-head coolant return flange experience thermal cycling embrittlement around 60,000–80,000 miles. Check for dried pinkish/white coolant crust around the housing beneath the intake manifold before negotiating price.

### 2. EGR Cooler Recalls & DPF Health (B47 Diesel)
Many B47 320d models were subject to factory recalls for Exhaust Gas Recirculation (EGR) cooler glycol seepage. Confirm via the VIN recall registry that the updated EGR unit has been installed, and verify via OBD-II that DPF differential backpressure is within specification at idle.

### 3. ZF 8HP Transmission Service Reality
While dealership brochures label the 8-speed Steptronic gearbox "sealed for life," the transmission manufacturer (ZF Friedrichshafen) specifies a fluid and pan/filter renewal between 80,000 and 120,000 km (50,000–75,000 miles). Budgeting $550–$750 for this service preserves shift quality past 120,000 miles.

### 4. Fleet Provenance & Mileage Verification
Because the 320d Touring and 330i Saloon are staples of European and UK executive leasing fleets, many cover 25,000+ miles per year in their first three years before being exported or wholesaled. Always compare the seller's claimed mileage against a chronological VIN history report and digital iDrive service entries.
    `,
    relatedTab: 'risk',
    relatedCta: 'View Powertrain Maintenance Matrix',
  },
  {
    id: 'imported-used-car-history-check',
    title: 'Buying an Imported Used Car: Why Cross-Border Mileage & Damage Checks Matter',
    category: 'Buying Guide',
    readTime: '6 min read',
    date: 'February 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'critical',
    riskLabel: 'Critical',
    summary:
      'When a used vehicle crosses national borders, domestic registration checks often start with a blank slate. Here is how to uncover prior salvage and mileage records.',
    keyPoints: [
      'National roadworthiness databases (such as MOT, TÜV, or RDW) rarely share historical odometer logs automatically when a car is exported.',
      'Total-loss or flood-damaged vehicles are frequently repaired cheaply in transit hubs and re-registered with clean local paperwork.',
      'Always inspect paint thickness in door jambs and structural B-pillars alongside a multi-country VIN history check.',
      'Verify that emission equipment (DPF, AdBlue/SCR, catalytic converters) has not been coded out prior to import.',
    ],
    content: `
Cross-border used car trade is a normal part of the European and North American automotive market. Well-maintained lease returns from Germany, Belgium, the Netherlands, or out-of-state auctions can make solid purchases—provided their pre-export history is transparent.

### Why Domestic Checks Miss Pre-Import History
When a vehicle is imported and registered in a new country, the local transport authority records its odometer reading on the day of first domestic inspection. Any mileage rollbacks or severe insurance write-offs that occurred *before* the border crossing will not appear on a purely domestic registration lookup.

### 3 Essential Steps Before Buying an Import:
1. **Request the original export certificate and foreign inspection sheet**: Look for the last foreign TÜV, Dekra, APK, or Contrôle Technique document showing the date and mileage prior to export.
2. **Run an international VIN check**: Use a cross-border vehicle history platform (like carVertical) that aggregates insurance total-loss registries, police theft databases, and dealership records across multiple countries.
3. **Measure structural paint depth**: Use a digital paint thickness gauge on the roof pillars, rear quarter panels, and inner door sills. Readings above 200–300 microns indicate body filler from past collision repair.
    `,
    relatedTab: 'tco',
    relatedCta: 'Run Pre-Purchase Cost Analysis',
  },
  {
    id: 'dsg-service-cost',
    title: 'The True Cost of Skipping Your DSG Transmission Service',
    category: 'Maintenance',
    readTime: '6 min read',
    date: 'February 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'critical',
    riskLabel: 'Critical',
    summary:
      'Skipping the 40,000-mile fluid renewal triggers costly $2,500+ mechatronic unit failure.',
    keyPoints: [
      'Micro-clutch wear debris clogs delicate hydraulic mechatronic solenoids.',
      'Preventative fluid replacement costs $240–$320 at independent shops.',
      'Replacing a damaged mechatronic unit costs $1,800–$2,800 plus labor.',
      'Recommended service interval is strictly every 40,000 miles (60,000 km).',
    ],
    content: `
Modern dual-clutch transmissions (like Volkswagen's 6-speed DQ250 and 7-speed DQ381, Audi's S-Tronic, and BMW's DKG) rely on a wet clutch pack immersed in hydraulic fluid. Every time the car pulls away or shifts gears, microscopic friction material sheds into the oil.

In regular driving, this debris is captured by the transmission filter. But past 40,000 miles, the fluid suffers thermal degradation and shear breakdown. Fine metallic particles bypass saturated filters and accumulate around the sensitive electromechanical solenoids in the mechatronic valve body.

### Symptoms of Overdue DSG Fluid:
1. **Harsh 1st-to-2nd gear engagement** from cold start.
2. **Hesitation or jerkiness** when reversing up a slight incline.
3. **Flashing gear indicator** or intermittent limp-mode warnings.

### The Financial Reality:
- Preventative fluid renewal (6L OE fluid + filter + adaptation): **$260 - $340**.
- Reconditioned mechatronic unit with programming: **$1,900 - $2,600**.
- Complete replacement transmission assembly: **$4,500+**.

The takeaway is simple: servicing your dual-clutch gearbox on time is the single highest-ROI maintenance decision you can make on a modern vehicle.
    `,
    relatedTab: 'risk',
    relatedCta: 'Check Transmission Wear Matrix',
  },
  {
    id: 'high-mileage-german-estate',
    title: '5 Red Flags to Check on a High-Mileage German Estate',
    category: 'Buying Guide',
    readTime: '8 min read',
    date: 'January 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
    summary:
      'Key pre-purchase red flags to inspect on high-mileage German estate cars before buying.',
    keyPoints: [
      'Cold-start rattle indicates worn timing chain tensioner liability.',
      'Overnight rear sag reveals leaking air suspension bellows.',
      'Soot around turbo flange exposes exhaust backpressure leaks.',
      'Coolant reservoir oil film signals failing oil cooler core.',
    ],
    content: `
German estate cars (Tourings, Avants, and Variants) make fantastic long-distance cruisers, but their sophisticated engineering means neglected maintenance cascades into enormous repair bills.

### 1. The Cold-Start Timing Chain Rattle
Always inspect the car when the engine is completely cold. A momentary 1-second chatter is normal as hydraulic pressure builds. A rattle lasting 3 seconds or longer indicates stretched chain links or a failing hydraulic tensioner. Fixing this before the chain skips timing will save your engine.

### 2. Rear Suspension Sag (Air Suspension Bellows)
Many wagons feature rear self-leveling air springs. When the rubber cracks with age, the car sinks on one side overnight. An overworked compressor will soon burn out, turning a $300 air spring replacement into a $1,200 compressor overhaul.

### 3. Oil Filter Housing & Cooler Gasket Seepage
Look beneath the oil filter housing with a flashlight. Oil pooling in the engine "V" or dripping onto the front serpentine belt will swell the rubber belt, risking belt failure and catastrophic engine intake ingestion.

### 4. DPF Ash Load and Regeneration History
Ask the seller for an OBD2 live diagnostic readout. A DPF with calculated ash mass over 60 grams is near the end of its physical lifespan and will require professional off-car baking or replacement.

### 5. Inconsistent Service Records
Check receipts, not just dealer stamps. Look for specific line items: transmission fluid, differential fluid, and brake fluid flushes.
    `,
    relatedTab: 'tco',
    relatedCta: 'Calculate 5-Year True Cost to Own',
  },
  {
    id: 'decoding-p0420-catalyst',
    title: 'Decoding P0420: Why You Probably Don’t Need a New Catalytic Converter',
    category: 'Diagnostics',
    readTime: '5 min read',
    date: 'January 2026',
    author: 'DriveLedger Editorial',
    riskLevel: 'low',
    riskLabel: 'Low',
    summary:
      'Diagnose oxygen sensors and exhaust leaks before replacing an expensive catalytic converter.',
    keyPoints: [
      'Downstream oxygen sensor drift causes 40% of false codes.',
      'Exhaust pinholes suck fresh air, tricking the ECU sensor.',
      'Unresolved misfires rapidly destroy replacement catalytic converters.',
      'Verify live sensor voltages with scanner before ordering parts.',
    ],
    content: `
P0420 is the most commonly triggered OBD-II trouble code in the automotive industry. It simply means the downstream oxygen sensor (after the catalyst) is cycling too similarly to the upstream sensor (before the catalyst), indicating the converter is not storing sufficient oxygen.

However, the catalytic converter itself is rarely the root cause of the initial failure—it is usually the victim of an upstream condition or a faulty sensor signal.

### Step 1: Check for Exhaust Leaks First ($20–$50)
A tiny hairline crack in the exhaust manifold, flex pipe, or flange gasket draws in atmospheric oxygen due to exhaust pulse venturi effects. The downstream O2 sensor detects this extra oxygen and triggers P0420, even though the catalyst is completely healthy.

### Step 2: Test Downstream O2 Sensor Switching ($80–$140)
With a $25 wireless OBD2 scanner and a phone app, view the downstream sensor voltage at steady 2,000 RPM:
- **Healthy catalyst**: voltage stays relatively stable between 0.6V and 0.8V.
- **Lazy sensor**: slow voltage response or erratic dropouts below 0.1V.

### Step 3: Verify Fuel Trims
If Long-Term Fuel Trim (LTFT) is higher than +10% (lean) or lower than -10% (rich), correct the vacuum leak or failing fuel injector before replacing the converter. Otherwise, raw fuel will overheat and destroy the replacement unit within 1,000 miles.
    `,
    relatedTab: 'obd',
    relatedCta: 'Look Up P0420 Repair Estimator',
  },
];

export default function BlogPage({ onNavigateToTco, onNavigateToRisk, onNavigateToObd }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  const categories = ['All', 'Maintenance', 'Buying Guide', 'Diagnostics'];

  const filteredPosts =
    selectedCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === selectedCategory);

  const handleCtaClick = (tabId) => {
    if (tabId === 'tco' && onNavigateToTco) onNavigateToTco();
    else if (tabId === 'risk' && onNavigateToRisk) onNavigateToRisk();
    else if (tabId === 'obd' && onNavigateToObd) onNavigateToObd();
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-surface dark:bg-[#121215] rounded-2xl border border-border dark:border-zinc-800 p-8 sm:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Independent Automotive Field Notes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-zinc-100 mb-3 font-h1">
            From the Garage
          </h1>
          <p className="text-sm text-body dark:text-zinc-300 leading-relaxed">
            Practical guides covering used-car history verification, maintenance schedules, and workshop diagnostics.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-subtle dark:bg-zinc-800 text-muted dark:text-zinc-300 border border-border dark:border-zinc-700 hover:text-ink dark:hover:text-zinc-100 hover:border-border-strong dark:hover:border-zinc-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const isExpanded = expandedArticleId === post.id;
          return (
            <article
              key={post.id}
              className="bg-surface dark:bg-[#121215] rounded-2xl border border-border dark:border-zinc-800 p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-[transform,box-shadow] duration-200 ease-out"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-muted dark:text-zinc-400 mb-4 pb-3 border-b border-border/70 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-[11px]">
                      {post.category}
                    </span>
                    <RiskBadge
                      level={post.riskLevel || 'low'}
                      label={post.riskLabel || 'Low'}
                    />
                  </div>
                  <span className="flex items-center gap-1 font-sans font-medium">
                    <Clock className="w-3 h-3 text-muted dark:text-zinc-400" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100 mb-2 leading-snug">
                  {post.title}
                </h2>

                <div className="text-[11px] font-sans text-muted dark:text-zinc-400 mb-3">
                  <span>{post.author}</span>
                  <span> · </span>
                  <span>{post.date}</span>
                </div>

                <p className="text-sm text-body dark:text-zinc-300 leading-relaxed mb-5">
                  {post.summary}
                </p>

                {/* Key Takeaways */}
                <div className="bg-surface-subtle dark:bg-zinc-800/80 rounded-xl p-4 border border-border/70 dark:border-zinc-700 mb-5">
                  <span className="text-xs font-bold text-ink dark:text-zinc-100 uppercase tracking-wider block mb-2 font-micro">
                    Key takeaways:
                  </span>
                  <ul className="space-y-1.5 text-xs text-body dark:text-zinc-300">
                    {post.keyPoints.map((kp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-score-good shrink-0 mt-0.5" />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expanded Article Content */}
                {isExpanded && (
                  <div className="pt-4 border-t border-border dark:border-zinc-800 text-sm text-body dark:text-zinc-300 leading-relaxed space-y-4 mb-5 animate-fade-in">
                    {post.content.trim().split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={pIdx} className="font-bold text-base text-ink dark:text-zinc-100 pt-2">
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                        return (
                          <div key={pIdx} className="bg-canvas dark:bg-zinc-950 p-3 rounded-lg border border-border/60 dark:border-zinc-800 text-xs">
                            <pre className="whitespace-pre-wrap font-sans text-body dark:text-zinc-300">{paragraph}</pre>
                          </div>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}

                    <div className="pt-3">
                      {post.category === 'Diagnostics' ? (
                        <AffiliateCTA
                          type="obd-scanner"
                          vehicleName="a used vehicle"
                          purchasePriceUsd={24500}
                          activeCode="P0420"
                        />
                      ) : (
                        <VinCheckBanner
                          placement="buyer-guide"
                          vehicleName="a used vehicle"
                          purchasePriceUsd={24500}
                          headline="Run an Independent carVertical History Audit"
                          description="Verify chronological mileage records, inspect previous structural collision damage photos, and check international theft registries before signing an agreement."
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setExpandedArticleId(isExpanded ? null : post.id)}
                  className="text-xs font-semibold text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {isExpanded ? 'Show less ↑' : 'Read full guide →'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCtaClick(post.relatedTab)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors"
                >
                  <span>{post.relatedCta}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
