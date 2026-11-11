import React, { useState, useMemo } from 'react';
import { GUIDES_DATA } from '../data/guidesData';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Search,
  Filter,
  Calculator,
  Wrench,
  Car,
  Share2,
  Check,
} from 'lucide-react';
import { Collapse } from '../components/common/OdometerPrimitives';
import VinCheckBanner from '../components/monetization/VinCheckBanner';

export default function GuidesPage({ activeSlug, onSelectGuide, onNavigateTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Find active guide if slug is provided
  const currentGuide = useMemo(() => {
    if (!activeSlug) return null;
    return GUIDES_DATA.find((g) => g.slug === activeSlug) || null;
  }, [activeSlug]);

  const categories = useMemo(() => {
    const cats = ['All'];
    GUIDES_DATA.forEach((g) => {
      if (!cats.includes(g.category)) cats.push(g.category);
    });
    return cats;
  }, []);

  const filteredGuides = useMemo(() => {
    return GUIDES_DATA.filter((g) => {
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
  }, [searchQuery, selectedCategory]);

  const toggleChecklist = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        });
      }
    }
  };

  // -------------------------------------------------------------
  // DETAIL ARTICLE VIEW
  // -------------------------------------------------------------
  if (currentGuide) {
    const otherGuides = GUIDES_DATA.filter((g) => g.slug !== currentGuide.slug).slice(0, 2);

    return (
      <article className="min-h-screen bg-canvas dark:bg-[#09090B] text-ink dark:text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted dark:text-zinc-400">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('overview')}
              className="hover:text-ink dark:hover:text-zinc-200 transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onSelectGuide && onSelectGuide(null)}
              className="hover:text-ink dark:hover:text-zinc-200 transition-colors"
            >
              Buyer Guides &amp; Insights
            </button>
            <span>/</span>
            <span className="text-ink dark:text-zinc-200 font-semibold truncate max-w-xs sm:max-w-md">
              {currentGuide.title}
            </span>
          </nav>

          {/* Back button & Share toolbar */}
          <div className="flex items-center justify-between border-b border-border dark:border-zinc-800 pb-4">
            <button
              type="button"
              onClick={() => onSelectGuide && onSelectGuide(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Guides
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-800 border border-border dark:border-zinc-700 text-xs font-medium text-body dark:text-zinc-300 hover:bg-canvas transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Guide</span>
                </>
              )}
            </button>
          </div>

          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {currentGuide.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted dark:text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                {currentGuide.readingTime}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                {currentGuide.publishedDate}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-canvas dark:bg-zinc-800 text-muted dark:text-zinc-400 border border-border dark:border-zinc-700">
                ~{currentGuide.wordCount} words
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-zinc-50 leading-tight">
              {currentGuide.title}
            </h1>

            <p className="text-base sm:text-lg text-body dark:text-zinc-300 leading-relaxed">
              {currentGuide.summary}
            </p>
          </header>

          {/* Key Takeaways Callout */}
          <section className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-300 font-bold text-sm tracking-wide uppercase">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Essential Takeaways &amp; Engineering Rules
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
              {currentGuide.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Main Body Sections */}
          <div className="space-y-8 text-sm sm:text-base text-body dark:text-zinc-300 leading-relaxed">
            {currentGuide.sections.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-zinc-100 tracking-tight">
                  {section.heading}
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          {/* Comparison / Data Table */}
          {currentGuide.table && (
            <section className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-border dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
                  {currentGuide.table.title}
                </h3>
                <p className="text-xs text-muted dark:text-zinc-400 mt-1">
                  {currentGuide.table.description}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border dark:border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas dark:bg-zinc-800/80 text-ink dark:text-zinc-200 border-b border-border dark:border-zinc-800">
                      {currentGuide.table.headers.map((h, i) => (
                        <th key={i} className="py-3 px-4 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-zinc-800 text-body dark:text-zinc-300">
                    {currentGuide.table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx % 2 === 0
                            ? 'bg-surface dark:bg-zinc-900'
                            : 'bg-canvas/50 dark:bg-zinc-900/50'
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-3.5 px-4 ${
                              cIdx === 0
                                ? 'font-bold text-ink dark:text-zinc-100'
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
            </section>
          )}

          {/* Actionable Checklist */}
          {currentGuide.checklist && (
            <section className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-border dark:border-zinc-800 shadow-sm space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 text-primary-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Interactive Inspection Checklist
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
                  {currentGuide.checklist.title}
                </h3>
                <p className="text-xs text-muted dark:text-zinc-400 mt-1">
                  {currentGuide.checklist.description} Tap items as you inspect.
                </p>
              </div>

              <div className="space-y-2.5">
                {currentGuide.checklist.items.map((item, iIdx) => {
                  const isChecked = !!checkedItems[iIdx];
                  return (
                    <div
                      key={iIdx}
                      onClick={() => toggleChecklist(iIdx)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-canvas dark:bg-zinc-800/60 border-border dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-body dark:text-zinc-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-zinc-400 dark:border-zinc-600 bg-surface dark:bg-zinc-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs sm:text-sm leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Interactive Calculator CTA Bridge */}
          <section className="bg-canvas dark:bg-zinc-900/60 rounded-3xl p-6 sm:p-8 border border-border dark:border-zinc-800 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-ink dark:text-zinc-100">
              Run Empirical Numbers on Your Candidate Vehicle
            </h3>
            <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed">
              Use DriveLedger free deterministic calculation engines to model multi-year depreciation curves, evaluate OBD-II diagnostic trouble codes, or generate a tailored negotiation battlecard.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('tco')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs transition-all shadow-sm"
              >
                <Calculator className="w-3.5 h-3.5" />
                Launch TCO Calculator
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('checklist')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-canvas border border-border dark:border-zinc-700 text-ink dark:text-zinc-200 font-medium text-xs transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pre-Purchase Checklist
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('obd')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-canvas border border-border dark:border-zinc-700 text-ink dark:text-zinc-200 font-medium text-xs transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                OBD-II Code Lookup
              </button>
            </div>
          </section>

          {/* Official carVertical Vehicle History Verification Card */}
          <VinCheckBanner
            placement="buyer-guide"
            vehicleName="a candidate vehicle"
            headline="Run an Independent carVertical History Audit"
            description="Cross-reference digital odometer readings, verify hidden structural collision records, and uncover secondary ECU tampering before purchasing."
          />

          {/* FAQ Accordion */}
          {currentGuide.faqs && currentGuide.faqs.length > 0 && (
            <section className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-border dark:border-zinc-800 shadow-sm space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-zinc-100">
                Frequently Asked Questions
              </h3>
              <div className="divide-y divide-border dark:divide-zinc-800">
                {currentGuide.faqs.map((faq, fIdx) => {
                  const isOpen = openFaqIndex === fIdx;
                  return (
                    <div key={fIdx} className="py-4">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between text-left font-semibold text-xs sm:text-sm text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 text-muted transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-primary-600 dark:text-emerald-400' : ''
                          }`}
                        />
                      </button>
                      <Collapse open={isOpen} id={`guide-faq-${fIdx}`}>
                        <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed pt-2">
                          {faq.answer}
                        </p>
                      </Collapse>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related Guides Footer */}
          {otherGuides.length > 0 && (
            <section className="space-y-4 border-t border-border dark:border-zinc-800 pt-8">
              <h3 className="text-base sm:text-lg font-bold text-ink dark:text-zinc-100">
                Explore More Buyer Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherGuides.map((guide) => (
                  <div
                    key={guide.slug}
                    onClick={() => onSelectGuide && onSelectGuide(guide.slug)}
                    className="p-5 rounded-2xl bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all space-y-2 group"
                  >
                    <span className="text-[11px] font-semibold text-primary-600 dark:text-emerald-400 uppercase tracking-wide">
                      {guide.category}
                    </span>
                    <h4 className="font-bold text-sm text-ink dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors">
                      {guide.title}
                    </h4>
                    <p className="text-xs text-muted dark:text-zinc-400 line-clamp-2">
                      {guide.summary}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-emerald-400 pt-1">
                      Read Guide <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    );
  }

  // -------------------------------------------------------------
  // HUB VIEW (LIST OF ALL 6 GUIDES)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-canvas dark:bg-[#09090B] text-ink dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hub Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Automotive Due Diligence &amp; Field Guides
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink dark:text-zinc-50">
            Buyer Guides &amp; Insights
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-body dark:text-zinc-300 leading-relaxed">
            In-depth engineering analyses, pre-purchase inspection protocols, and financial ownership frameworks written by master technicians to protect used car buyers from costly surprises.
          </p>
        </header>

        {/* Filter Bar & Search */}
        <div className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 border border-border dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-muted dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides by title, component, or category..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-canvas dark:bg-zinc-800/80 border border-border dark:border-zinc-700 text-ink dark:text-zinc-100 placeholder-muted dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* Category count indicator */}
            <span className="text-xs text-muted dark:text-zinc-400 shrink-0">
              Showing {filteredGuides.length} of {GUIDES_DATA.length} guides
            </span>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border dark:border-zinc-800">
            <span className="text-xs text-muted dark:text-zinc-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-canvas dark:bg-zinc-800/80 text-body dark:text-zinc-300 hover:bg-surface-subtle border border-border dark:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide.slug}
              className="bg-surface dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-border dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {guide.category}
                  </span>
                  <span className="flex items-center gap-1 text-muted dark:text-zinc-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.readingTime}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-ink dark:text-zinc-50 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {guide.title}
                </h2>

                <p className="text-xs sm:text-sm text-body dark:text-zinc-300 line-clamp-3 leading-relaxed">
                  {guide.summary}
                </p>

                {/* Key Takeaway preview */}
                <div className="p-3 rounded-2xl bg-canvas dark:bg-zinc-800/50 border border-border dark:border-zinc-800/80 text-xs text-body dark:text-zinc-300">
                  <span className="font-semibold text-ink dark:text-zinc-200 block mb-1">
                    Key Highlight:
                  </span>
                  <p className="line-clamp-2 text-muted dark:text-zinc-400">
                    {guide.keyTakeaways[0]}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border dark:border-zinc-800 mt-6 flex items-center justify-between">
                <span className="text-[11px] text-muted dark:text-zinc-400 font-mono">
                  ~{guide.wordCount} words
                </span>
                <a
                  href={`/guides/${guide.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof onSelectGuide === 'function') {
                      onSelectGuide(guide.slug);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-emerald-400 group-hover:underline"
                >
                  Read Full Guide
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Official carVertical Vehicle History Banner */}
        <VinCheckBanner
          placement="buyer-guide"
          headline="Verify Used Vehicle History Before You Buy"
          description="Check chronological mileage records, structural damage repair photos, salvage title status, and stolen vehicle registries with an official carVertical audit."
        />

        {filteredGuides.length === 0 && (
          <div className="text-center py-16 bg-surface dark:bg-zinc-900 rounded-3xl border border-border dark:border-zinc-800 space-y-3">
            <BookOpen className="w-8 h-8 text-muted dark:text-zinc-500 mx-auto" />
            <p className="text-sm font-semibold text-ink dark:text-zinc-200">
              No guides match your search criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
