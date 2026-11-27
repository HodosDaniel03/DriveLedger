import React, { useState, useMemo } from 'react';
import { GUIDES_DATA, ALL_GUIDES_DATA } from '../data/guidesData';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Search,
  Filter,
  Calculator,
  Wrench,
  Share2,
  Check,
} from 'lucide-react';
import { Card, PageHeader, Pill } from '../components/common/OdometerPrimitives';
import VinCheckBanner from '../components/monetization/VinCheckBanner';

export default function GuidesPage({ activeSlug, onSelectGuide, onNavigateTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [checkedItems, setCheckedItems] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  const guidesCatalog = ALL_GUIDES_DATA || GUIDES_DATA;

  // Find active guide if slug is provided
  const currentGuide = useMemo(() => {
    if (!activeSlug) return null;
    return guidesCatalog.find((g) => g.slug === activeSlug) || null;
  }, [activeSlug, guidesCatalog]);

  const categories = useMemo(() => {
    const cats = ['All'];
    guidesCatalog.forEach((g) => {
      if (!cats.includes(g.category)) cats.push(g.category);
    });
    return cats;
  }, [guidesCatalog]);

  const filteredGuides = useMemo(() => {
    return guidesCatalog.filter((g) => {
      const matchesCategory =
        selectedCategory === 'All' || g.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, guidesCatalog]);

  const toggleChecklist = (itemKey) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard
          .writeText(url)
          .then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          })
          .catch(() => {});
      }
    }
  };

  // =============================================================
  // DETAIL ARTICLE VIEW
  // =============================================================
  if (currentGuide) {
    const otherGuides = guidesCatalog.filter((g) => g.slug !== currentGuide.slug).slice(0, 2);

    return (
      <article className="max-w-4xl mx-auto space-y-8 text-ink dark:text-zinc-100">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted dark:text-zinc-400">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab?.('overview');
            }}
            className="min-h-[44px] inline-flex items-center px-1 hover:text-ink dark:hover:text-zinc-200 transition-colors"
          >
            Home
          </a>
          <span aria-hidden="true">/</span>
          <a
            href="/guides"
            onClick={(e) => {
              e.preventDefault();
              onSelectGuide?.(null);
            }}
            className="min-h-[44px] inline-flex items-center px-1 hover:text-ink dark:hover:text-zinc-200 transition-colors"
          >
            Buyer Guides &amp; Insights
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-ink dark:text-zinc-200 font-semibold truncate max-w-xs sm:max-w-md">
            {currentGuide.title}
          </span>
        </nav>

        {/* Back link & Share toolbar */}
        <div className="flex items-center justify-between border-b border-border/80 dark:border-zinc-800 pb-3">
          <a
            href="/guides"
            onClick={(e) => {
              e.preventDefault();
              onSelectGuide?.(null);
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-2 -ml-2 rounded-lg text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            <span>Back to All Guides</span>
          </a>

          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface dark:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-xs font-medium text-body dark:text-zinc-200 hover:bg-surface-subtle dark:hover:bg-zinc-700 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Share Guide</span>
              </>
            )}
          </button>
        </div>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="good">{currentGuide.category}</Pill>
            <span className="inline-flex items-center gap-1 text-xs text-muted dark:text-zinc-400">
              <Clock aria-hidden="true" className="w-3.5 h-3.5" />
              {currentGuide.readingTime}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted dark:text-zinc-400">
              <Calendar aria-hidden="true" className="w-3.5 h-3.5" />
              {currentGuide.publishedDate}
            </span>
            <span className="text-xs font-mono tabular-nums text-muted dark:text-zinc-400">
              ~{currentGuide.wordCount} words
            </span>
          </div>

          <h1 className="font-sans text-balance text-h1 font-bold tracking-tight text-ink dark:text-zinc-50">
            {currentGuide.title}
          </h1>

          <p className="text-sm sm:text-base text-pretty text-body dark:text-zinc-300 leading-relaxed max-w-[65ch]">
            {currentGuide.summary}
          </p>
        </header>

        {/* Key Takeaways Callout */}
        <section className="cq-card rounded-2xl border border-border/80 dark:border-zinc-800/90 bg-surface-subtle dark:bg-[#121215] p-5 sm:p-6 space-y-3">
          <h2 className="flex items-center gap-2 font-sans text-sm sm:text-base font-semibold text-ink dark:text-zinc-50">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Essential Takeaways &amp; Engineering Rules</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-body dark:text-zinc-300">
            {currentGuide.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Main Body Sections */}
        <div className="space-y-8 text-sm sm:text-base text-body dark:text-zinc-300 leading-relaxed">
          {currentGuide.sections.map((section, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-h3 sm:text-xl font-bold text-ink dark:text-zinc-100 tracking-tight">
                {section.heading}
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base text-pretty max-w-[68ch]">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Comparison / Data Table */}
        {currentGuide.table && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
                {currentGuide.table.title}
              </h2>
              <p className="text-xs text-muted dark:text-zinc-400 mt-1">
                {currentGuide.table.description}
              </p>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label={currentGuide.table.title}
              className="overflow-x-auto rounded-xl border border-border/80 dark:border-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 dark:focus-visible:outline-emerald-400"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-subtle dark:bg-zinc-900/80 text-ink dark:text-zinc-200 border-b border-border/80 dark:border-zinc-800">
                    {currentGuide.table.headers.map((h, i) => (
                      <th key={i} className="py-3 px-4 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 dark:divide-zinc-800 text-body dark:text-zinc-300 tabular-nums">
                  {currentGuide.table.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0
                          ? 'bg-surface dark:bg-[#121215]'
                          : 'bg-surface-subtle/50 dark:bg-zinc-900/40'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-3.5 px-4 ${
                            cIdx === 0
                              ? 'font-semibold text-ink dark:text-zinc-100'
                              : ''
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Actionable Checklist */}
        {currentGuide.checklist && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="w-5 h-5 text-primary-600 dark:text-emerald-400 shrink-0" />
                <span>{currentGuide.checklist.title}</span>
              </h2>
              <p className="text-xs text-muted dark:text-zinc-400 mt-1">
                {currentGuide.checklist.description} Tap items as you inspect.
              </p>
            </div>

            <div className="space-y-2.5">
              {currentGuide.checklist.items.map((item, iIdx) => {
                const itemKey = `${currentGuide.slug}:${iIdx}`;
                const isChecked = !!checkedItems[itemKey];
                return (
                  <label
                    key={itemKey}
                    className={`min-h-[44px] flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-surface-subtle/60 dark:bg-zinc-900/50 border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700 text-body dark:text-zinc-300'
                    }`}
                  >
                    <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecklist(itemKey)}
                        className="peer h-5 w-5 appearance-none rounded-md border border-zinc-400 dark:border-zinc-600 bg-surface dark:bg-zinc-800 checked:bg-primary-600 checked:border-primary-600 dark:checked:bg-emerald-600 dark:checked:border-emerald-600 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-emerald-400"
                      />
                      <Check
                        aria-hidden="true"
                        className="pointer-events-none absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                      />
                    </span>
                    <span className={`text-xs sm:text-sm leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>
        )}

        {/* Interactive Calculator CTA Bridge */}
        <section className="cq-card rounded-2xl border border-border/80 dark:border-zinc-800/90 bg-surface-subtle dark:bg-zinc-900/50 p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-ink dark:text-zinc-100">
            Run Empirical Numbers on Your Candidate Vehicle
          </h2>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed max-w-[65ch] text-pretty">
            Use DriveLedger free deterministic calculation engines to model multi-year depreciation curves, evaluate OBD-II diagnostic trouble codes, or generate a tailored negotiation battlecard.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('tco')}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <Calculator aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Launch TCO Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('checklist')}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-subtle dark:hover:bg-zinc-700 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-200 font-medium text-xs transition-colors"
            >
              <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Pre-Purchase Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('obd')}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-subtle dark:hover:bg-zinc-700 border border-border/80 dark:border-zinc-700 text-ink dark:text-zinc-200 font-medium text-xs transition-colors"
            >
              <Wrench aria-hidden="true" className="w-3.5 h-3.5" />
              <span>OBD-II Code Lookup</span>
            </button>
          </div>
        </section>

        {/* Official carVertical Vehicle History Verification Card */}
        <VinCheckBanner
          placement="buyer-guide"
          vehicleName="your candidate vehicle"
          className="my-6"
        />

        {/* FAQ Accordion */}
        {currentGuide.faqs && currentGuide.faqs.length > 0 && (
          <Card aria-labelledby="guide-faq-heading" className="space-y-3">
            <h2 id="guide-faq-heading" className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-border/80 dark:divide-zinc-800">
              {currentGuide.faqs.map((faq, fIdx) => (
                <details
                  key={faq.question}
                  open={fIdx === 0}
                  className="dl-disclosure group"
                >
                  <summary className="min-h-[48px] py-3.5 flex items-center justify-between gap-4 text-left font-sans font-semibold text-sm text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
                    <span>{faq.question}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <div className="pb-4 text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed max-w-[68ch] text-pretty">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </Card>
        )}

        {/* Related Guides Footer */}
        {otherGuides.length > 0 && (
          <section className="space-y-4 border-t border-border/80 dark:border-zinc-800 pt-8">
            <h2 className="text-base sm:text-lg font-bold text-ink dark:text-zinc-100">
              Explore More Buyer Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherGuides.map((guide) => (
                <Card
                  key={guide.slug}
                  interactive
                  className="relative focus-within:ring-2 focus-within:ring-primary-600/40 dark:focus-within:ring-emerald-500/40 space-y-2.5 group"
                >
                  <Pill tone="neutral">{guide.category}</Pill>
                  <h3 className="font-bold text-sm sm:text-base text-ink dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                    <a
                      href={`/guides/${guide.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectGuide?.(guide.slug);
                      }}
                      className="after:content-[''] after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {guide.title}
                    </a>
                  </h3>
                  <p className="text-xs text-muted dark:text-zinc-400 line-clamp-2">
                    {guide.summary}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-emerald-400 pt-1">
                    <span>Read Guide</span>
                    <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    );
  }

  // =============================================================
  // HUB VIEW (LIST OF ALL GUIDES)
  // =============================================================
  return (
    <div className="max-w-6xl mx-auto space-y-8 text-ink dark:text-zinc-100">
      {/* Hub Header */}
      <PageHeader
        title="Buyer Guides & Insights"
        subtitle="In-depth engineering analyses, pre-purchase inspection protocols, and financial ownership frameworks written by master technicians to protect used car buyers from costly surprises."
        className="mb-0"
      />

      {/* Filter Bar & Search */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search aria-hidden="true" className="w-4 h-4 text-muted dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search buyer guides"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by title, component, or category..."
              className="min-h-[44px] w-full pl-10 pr-4 py-2 rounded-xl text-base sm:text-sm bg-surface-subtle dark:bg-zinc-900 border border-border dark:border-zinc-700 text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:border-primary-600 dark:focus:border-emerald-500"
            />
          </div>
          {/* Category count indicator */}
          <span className="text-xs font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0">
            Showing {filteredGuides.length} of {guidesCatalog.length} guides
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/80 dark:border-zinc-800">
          <span className="text-xs text-muted dark:text-zinc-400 font-semibold mr-1 flex items-center gap-1">
            <Filter aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3.5 py-2 inline-flex items-center rounded-xl text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-primary-600 dark:bg-emerald-600 border-primary-600 dark:border-emerald-500 text-white'
                    : 'bg-surface-subtle dark:bg-zinc-800/80 border-border/80 dark:border-zinc-700 text-body dark:text-zinc-300 hover:border-border-strong dark:hover:border-zinc-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredGuides.map((guide) => (
          <Card
            key={guide.slug}
            interactive
            className="relative flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary-600/40 dark:focus-within:ring-emerald-500/40 group"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <Pill tone="good">{guide.category}</Pill>
                <span className="inline-flex items-center gap-1 text-muted dark:text-zinc-400 text-xs shrink-0">
                  <Clock aria-hidden="true" className="w-3.5 h-3.5" />
                  {guide.readingTime}
                </span>
              </div>

              <h2 className="text-lg font-bold text-ink dark:text-zinc-50 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                <a
                  href={`/guides/${guide.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectGuide?.(guide.slug);
                  }}
                  className="after:content-[''] after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {guide.title}
                </a>
              </h2>

              <p className="text-xs sm:text-sm text-body dark:text-zinc-300 line-clamp-3 leading-relaxed">
                {guide.summary}
              </p>

              {/* Key Takeaway preview (hairline separated, unboxed) */}
              <div className="pt-3 border-t border-border/60 dark:border-zinc-800/80 text-xs text-body dark:text-zinc-300">
                <span className="font-semibold text-ink dark:text-zinc-200 block mb-1">
                  Key Highlight:
                </span>
                <p className="line-clamp-2 text-muted dark:text-zinc-400">
                  {guide.keyTakeaways[0]}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/80 dark:border-zinc-800 mt-5 flex items-center justify-between">
              <span className="text-xs text-muted dark:text-zinc-400 font-mono tabular-nums">
                ~{guide.wordCount} words
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-emerald-400 group-hover:underline">
                <span>Read Full Guide</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Official carVertical Vehicle History Banner */}
      <VinCheckBanner
        placement="buyer-guide"
        className="mt-6"
      />

      {filteredGuides.length === 0 && (
        <Card className="text-center py-12 space-y-3">
          <BookOpen aria-hidden="true" className="w-8 h-8 text-muted dark:text-zinc-500 mx-auto" />
          <p className="text-sm font-semibold text-ink dark:text-zinc-200">
            No guides match your search criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center rounded-xl border border-border dark:border-zinc-700 text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:bg-surface-subtle dark:hover:bg-zinc-800 transition-colors"
          >
            Reset Filters
          </button>
        </Card>
      )}
    </div>
  );
}
