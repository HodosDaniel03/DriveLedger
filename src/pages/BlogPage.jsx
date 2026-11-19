import React, { useState } from 'react';
import { BookOpen, Wrench, ShieldAlert, Cpu, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { RiskBadge } from '../components/common/OdometerPrimitives';
import VinCheckBanner from '../components/monetization/VinCheckBanner';
import AffiliateCTA from '../components/monetization/AffiliateCTA';
import { ALL_GUIDES_DATA } from '../data/guidesData';

export const BLOG_POSTS = (ALL_GUIDES_DATA || []).map((g) => ({
  id: g.slug,
  guideSlug: g.slug,
  title: g.title,
  category:
    g.category.includes('OBD') || g.category.includes('Diagnostic')
      ? 'Diagnostics'
      : g.category.includes('Maintenance')
        ? 'Maintenance'
        : 'Buying Guide',
  readTime: g.readingTime || '7 min read',
  date: g.publishedDate || 'March 2026',
  author: g.author || 'DriveLedger Engineering Team',
  riskLevel: g.category.includes('OBD') ? 'low' : g.category.includes('Model') ? 'moderate' : 'critical',
  riskLabel: g.heroBadge || g.category,
  summary: g.summary,
  keyPoints: g.keyTakeaways || [],
  content: (g.sections || []).map((s) => `### ${s.heading}\n\n${s.content}`).join('\n\n'),
  table: g.table,
  checklist: g.checklist,
  faqs: g.faqs,
  wordCount: g.wordCount,
  relatedTab: g.category.includes('OBD') ? 'obd' : g.category.includes('Maintenance') ? 'risk' : 'tco',
  relatedCta: g.category.includes('OBD')
    ? 'Look Up OBD-II Repair Estimator'
    : g.category.includes('Maintenance')
      ? 'View Powertrain Maintenance Matrix'
      : 'Calculate 5-Year True Cost to Own',
}));

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
