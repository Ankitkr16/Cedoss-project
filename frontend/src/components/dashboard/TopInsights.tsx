import React from 'react';
import { ThumbsUp, ThumbsDown, Package, ArrowUpRight } from 'lucide-react';
import { GlobalInsights } from '../../types';

interface TopInsightsProps {
  insights: GlobalInsights | null;
  onSelectTopic?: (topic: string) => void;
}

export const TopInsights: React.FC<TopInsightsProps> = ({ insights, onSelectTopic }) => {
  if (!insights || insights.totalAnalyzed === 0) return null;

  const { topComplaints, topPraises } = insights;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Top 3 Complaints */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 3 Customer Complaints</h3>
            <p className="text-xs text-slate-500">Highest friction points across all products</p>
          </div>
        </div>

        {topComplaints.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No negative feedback recorded.</p>
        ) : (
          <div className="space-y-3">
            {topComplaints.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-rose-50/40 border border-rose-100/80 hover:bg-rose-50/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    #{idx + 1} {item.topic}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Package className="w-3 h-3 text-slate-400" />
                    {item.products.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{item.summary}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 3 Praises */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 3 Customer Praises</h3>
            <p className="text-xs text-slate-500">Most celebrated product highlights</p>
          </div>
        </div>

        {topPraises.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No positive feedback recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {topPraises.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100/80 hover:bg-emerald-50/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    #{idx + 1} {item.topic}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Package className="w-3 h-3 text-slate-400" />
                    {item.products.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{item.summary}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
