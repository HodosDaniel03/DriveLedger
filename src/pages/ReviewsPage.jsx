import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  FileText,
  Calculator,
} from 'lucide-react';
import ReviewsSection from '../components/home/ReviewsSection';
import CommunityInvoiceModal, { loadCommunityInvoices } from '../components/home/CommunityInvoiceModal';

export default function ReviewsPage({ onNavigateToTco, onNavigateToRisk }) {
  const [communityInvoices, setCommunityInvoices] = useState(() => loadCommunityInvoices());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleInvoiceSubmitted = () => {
    setCommunityInvoices(loadCommunityInvoices());
  };

  const totalVerifiedSampleCount = 1480 + communityInvoices.length;

  return (
    <div className="space-y-8">
      {/* Subpage Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>VERIFIED COMMUNITY TELEMETRY</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-sans font-medium text-zinc-700 dark:text-zinc-300">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span><span className="font-mono tabular-nums">{totalVerifiedSampleCount.toLocaleString()}</span> Verified Invoices Indexed</span>
            {communityInvoices.length > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                (<span className="font-mono tabular-nums">+{communityInvoices.length}</span> Yours)
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-ink dark:text-zinc-100 mb-2">
          Driver &amp; Fleet Telemetry Reviews
        </h1>
        <p className="text-sm text-body dark:text-zinc-300 max-w-2xl leading-relaxed">
          Real-world ownership costs, repair invoices, and depreciation data submitted by vehicle owners.
        </p>
      </div>

      {/* Main Reviews Grid */}
      <ReviewsSection
        communityInvoices={communityInvoices}
        onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        onInvoiceSubmitted={handleInvoiceSubmitted}
      />

      {/* Community Contribution Box */}
      <div className="p-6 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink dark:text-zinc-100 mb-1">
            Tracked Your Vehicle&apos;s True Cost to Own?
          </h3>
          <p className="text-xs text-body dark:text-zinc-300">
            Submit workshop receipts to benchmark repair expenses against regional fleet averages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onNavigateToTco && (
            <button
              type="button"
              onClick={() => onNavigateToTco()}
              className="px-4 py-2.5 rounded-lg text-xs font-sans font-medium bg-subtle dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-ink dark:text-zinc-100 border border-border dark:border-zinc-700 flex items-center gap-1.5 transition-colors duration-150"
            >
              <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span>TCO Calculator</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-5 py-2.5 rounded-lg text-xs font-sans font-medium bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 shrink-0 transition-colors duration-150 shadow-sm"
          >
            <span>Audit Your Vehicle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Community Invoice & Price Spread Modal */}
      <CommunityInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onInvoiceSubmitted={handleInvoiceSubmitted}
      />
    </div>
  );
}
