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
import { Card, PageHeader, Pill } from '../components/common/OdometerPrimitives';
import ReviewsSection from '../components/home/ReviewsSection';
import CommunityInvoiceModal, { loadCommunityInvoices } from '../components/home/CommunityInvoiceModal';

export default function ReviewsPage({ onNavigateToTco, onNavigateToRisk }) {
  const [communityInvoices, setCommunityInvoices] = useState(() => loadCommunityInvoices());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleInvoiceSubmitted = () => {
    setCommunityInvoices(loadCommunityInvoices());
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeader
          title="Owner Reviews & Repair Cost Notes"
          subtitle="Compare your workshop repair quotes against regional parts and labor estimates, and keep a personal log of your vehicle maintenance notes."
          className="mb-0"
        />
        <Pill tone="neutral" className="self-start sm:self-end shrink-0">
          {communityInvoices.length > 0
            ? `${communityInvoices.length} Quote Note${communityInvoices.length === 1 ? '' : 's'} Saved`
            : 'Local Workshop Quote Benchmark'}
        </Pill>
      </div>

      {/* Main Reviews Grid */}
      <ReviewsSection
        communityInvoices={communityInvoices}
        onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        onInvoiceSubmitted={handleInvoiceSubmitted}
      />

      {/* Community Contribution Box */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink dark:text-zinc-100 mb-1">
            Have a Workshop Repair Quote?
          </h3>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-300">
            Compare your repair quote against regional parts and labor estimates and save your note locally in your browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onNavigateToTco && (
            <button
              type="button"
              onClick={() => onNavigateToTco()}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl text-xs font-sans font-medium bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 text-ink dark:text-zinc-100 border border-border/80 dark:border-zinc-700 flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
            >
              <Calculator aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" />
              <span>TCO Calculator</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="min-h-[44px] sm:min-h-[38px] px-5 py-2 rounded-xl text-xs font-sans font-semibold bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white flex items-center gap-2 shrink-0 transition-colors duration-150 cursor-pointer"
          >
            <span>Compare a Workshop Quote</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        </div>
      </Card>

      {/* Interactive Community Invoice & Price Spread Modal */}
      <CommunityInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onInvoiceSubmitted={handleInvoiceSubmitted}
      />
    </div>
  );
}
