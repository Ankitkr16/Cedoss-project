import React from 'react';
import {
  CheckCircle2,
  Smile,
  Meh,
  Frown,
  MessageSquareWarning,
  AlertTriangle,
  Zap,
  Clock,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { ProcessingMetrics, GlobalInsights } from '../../types';

interface SummaryCardsProps {
  metrics: ProcessingMetrics | null;
  insights: GlobalInsights | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics, insights }) => {
  if (!metrics || !insights) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Analysed" value="0" subtitle="Upload CSV to start" icon={CheckCircle2} />
        <StatCard title="Positive %" value="0%" subtitle="No reviews yet" icon={Smile} color="emerald" />
        <StatCard title="Negative %" value="0%" subtitle="No reviews yet" icon={Frown} color="rose" />
        <StatCard title="Needs Reply" value="0" subtitle="No complaints" icon={MessageSquareWarning} color="amber" />
      </div>
    );
  }

  const { sentimentPercentages, needsReplyCount, totalAnalyzed } = insights;

  return (
    <div className="space-y-4 mb-6">
      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Analysed"
          value={totalAnalyzed}
          subtitle={`${metrics.total_rows} total rows uploaded`}
          icon={CheckCircle2}
          color="indigo"
        />

        <StatCard
          title="Positive Reviews"
          value={`${sentimentPercentages.positive}%`}
          subtitle="Satisfied customers"
          icon={Smile}
          color="emerald"
          trend={`${sentimentPercentages.positive}%`}
          trendColor="green"
        />

        <StatCard
          title="Neutral Reviews"
          value={`${sentimentPercentages.neutral}%`}
          subtitle="Mixed or average"
          icon={Meh}
          color="amber"
        />

        <StatCard
          title="Negative Reviews"
          value={`${sentimentPercentages.negative}%`}
          subtitle="Issues & complaints"
          icon={Frown}
          color="rose"
          trend={`${sentimentPercentages.negative}%`}
          trendColor={sentimentPercentages.negative > 30 ? 'red' : 'neutral'}
        />

        <StatCard
          title="Needs Reply"
          value={needsReplyCount}
          subtitle="Actionable complaints"
          icon={MessageSquareWarning}
          color="amber"
          trend={needsReplyCount > 0 ? 'Action Required' : 'All clear'}
          trendColor={needsReplyCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Bonus Diagnostics: Rating Mismatch & Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Rating Mismatches</p>
              <p className="text-lg font-bold text-slate-900">
                {metrics.mismatch_count}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({metrics.agreement_percentage}% agreement)
                </span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            e.g. R008, R003
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Cache Hits</p>
              <p className="text-lg font-bold text-slate-900">
                {metrics.cache_hits}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({metrics.ai_calls} live AI calls)
                </span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            SHA-256
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Processing Time</p>
              <p className="text-lg font-bold text-slate-900">
                {(metrics.processing_time_ms / 1000).toFixed(2)}s
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            Batch size: 5
          </span>
        </div>
      </div>
    </div>
  );
};
