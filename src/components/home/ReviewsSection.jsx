import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, FileText, Plus } from 'lucide-react';
import CommunityInvoiceModal, { loadCommunityInvoices } from './CommunityInvoiceModal';
import { RiskBadge } from '../common/OdometerPrimitives';

const REVIEWS = [];

export default function ReviewsSection({
  communityInvoices: externalInvoices,
  onOpenInvoiceModal,
  onInvoiceSubmitted,
}) {
  const [localInvoices, setLocalInvoices] = useState(() => loadCommunityInvoices());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLocalInvoices(loadCommunityInvoices());
  }, [externalInvoices]);

  const activeCommunityInvoices = externalInvoices !== undefined ? externalInvoices : localInvoices;
  const allReviews = [...activeCommunityInvoices, ...REVIEWS];

  const handleOpenModal = () => {
    if (onOpenInvoiceModal) {
      onOpenInvoiceModal();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleLocalInvoiceSubmitted = (newEntry) => {
    const refreshed = loadCommunityInvoices();
    setLocalInvoices(refreshed);
    if (onInvoiceSubmitted) {
      onInvoiceSubmitted(newEntry);
    }
  };

  return (
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
            Community Cost Notes &amp; Quote Benchmarks
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 mt-1">
            Owner Feedback &amp; Workshop Quote Comparisons
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeCommunityInvoices.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted dark:text-zinc-400 font-sans font-medium">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-sans font-medium">
                <span className="font-mono tabular-nums">{activeCommunityInvoices.length}</span> saved in your browser
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-subtle dark:bg-zinc-800 hover:bg-primary-50 dark:hover:bg-zinc-700 text-primary-700 dark:text-primary-300 border border-border dark:border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compare Workshop Quote</span>
          </button>
        </div>
      </div>

      {allReviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-ink dark:text-zinc-100 mb-1.5">
            Be the first to share your experience or compare a workshop quote
          </h3>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-300 leading-relaxed mb-5">
            DriveLedger is a newly launched independent project — we do not display fabricated testimonials. You can compare your repair quote against our regional cost estimates and save your notes locally in your browser.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-sans font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Compare &amp; Save a Repair Quote</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {allReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ease-out flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                {/* Rating Stars & Community Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1 text-amber-500 shrink-0">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  {rev.isCommunitySubmission ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium shrink-0">
                      <FileText className="w-2.5 h-2.5" />
                      <span><span className="font-mono tabular-nums">${Number(rev.amountPaid || 0).toLocaleString()}</span> Quote</span>
                    </span>
                  ) : (
                    <RiskBadge level="low" label="Saved Note" />
                  )}
                </div>

                {/* Savings / Benchmark Hook */}
                <div className="mb-2 text-xs font-sans font-bold text-success-text dark:text-emerald-400 truncate">
                  {rev.savingsText}
                </div>

                {rev.assembly && (
                  <div className="mb-2 text-[11px] font-sans font-medium text-primary-600 dark:text-primary-400 truncate">
                    Service: {rev.assembly}
                  </div>
                )}

                {/* Review Text */}
                <p className="text-xs text-body dark:text-zinc-300 leading-relaxed mb-4">
                  "{rev.review}"
                </p>
              </div>

              {/* Author & Vehicle Metadata */}
              <div className="pt-3 border-t border-border dark:border-zinc-800 text-xs min-w-0">
                <div className="font-bold text-ink dark:text-zinc-100 flex items-center justify-between gap-2 min-w-0">
                  <span className="truncate">{rev.name}</span>
                  <span className="text-[10px] font-code tabular-nums text-muted dark:text-zinc-400 flex items-center gap-1 shrink-0">
                    {rev.verifiedOdometer}
                  </span>
                </div>
                <div className="text-[11px] text-muted dark:text-zinc-400 truncate mt-0.5">
                  {rev.vehicle} · {rev.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!onOpenInvoiceModal && (
        <CommunityInvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onInvoiceSubmitted={handleLocalInvoiceSubmitted}
        />
      )}
    </section>
  );
}
