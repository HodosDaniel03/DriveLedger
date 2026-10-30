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
      <div className="p-6 sm:p-8 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-code font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>VERIFIED COMMUNITY TELEMETRY</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-subtle dark:bg-slate-800 border border-border dark:border-slate-700 text-xs font-code text-ink dark:text-slate-100">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{totalVerifiedSampleCount.toLocaleString()} Verified Invoices Indexed</span>
            {communityInvoices.length > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                (+{communityInvoices.length} Yours)
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-ink dark:text-slate-100 mb-2">
          Driver &amp; Fleet Telemetry Reviews
        </h1>
        <p className="text-sm text-body dark:text-slate-300 max-w-2xl leading-relaxed">
          Real-world cost accuracy, preventative repair interventions, and depreciation verification submitted by vehicle owners, independent master mechanics, and fleet operators.
        </p>
      </div>

      {/* Main Reviews Grid */}
      <ReviewsSection
        communityInvoices={communityInvoices}
        onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        onInvoiceSubmitted={handleInvoiceSubmitted}
      />

      {/* Community Contribution Box */}
      <div className="p-6 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink dark:text-slate-100 mb-1">
            Tracked Your Vehicle&apos;s True Cost to Own?
          </h3>
          <p className="text-xs text-body dark:text-slate-300">
            Submit your actual workshop invoices and live PID logs to benchmark your repair cost percentile and calibrate the ShiftMetric thermodynamic wear models.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onNavigateToTco && (
            <button
              type="button"
              onClick={() => onNavigateToTco()}
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-subtle dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-ink dark:text-slate-100 border border-border dark:border-slate-700 flex items-center gap-1.5 transition-all font-code"
            >
              <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span>TCO Calculator</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 shrink-0 transition-all font-code shadow-sm"
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
