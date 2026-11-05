import React, { useState } from 'react';
import { BookOpen, Wrench, ShieldAlert, Cpu, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { RiskBadge } from '../components/common/OdometerPrimitives';

export const BLOG_POSTS = [
  {
    id: 'dsg-service-cost',
    title: 'The True Cost of Skipping Your DSG Transmission Service',
    category: 'Maintenance',
    readTime: '6 min read',
    date: '18 Oct 2026',
    author: 'Daniel R., Powertrain Specialist',
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
    date: '12 Oct 2026',
    author: 'Marcus K., Fleet Inspector',
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
    date: '04 Oct 2026',
    author: 'Sarah M., Master Technician',
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
            Engineering guides covering maintenance schedules, vehicle inspection, and real-world diagnostics.
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
                      level={post.id === 'dsg-service-cost' ? 'critical' : post.id === 'high-mileage-german-estate' ? 'moderate' : 'low'}
                      label={post.id === 'dsg-service-cost' ? 'Critical' : post.id === 'high-mileage-german-estate' ? 'Moderate' : 'Low'}
                    />
                  </div>
                  <span className="flex items-center gap-1 font-sans font-medium">
                    <Clock className="w-3 h-3 text-muted dark:text-zinc-400" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100 mb-3 leading-snug">
                  {post.title}
                </h2>

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
                    {post.content.split('\n\n').map((paragraph, pIdx) => {
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
