import React, { useState } from 'react';
import {
  Package,
  ThumbsUp,
  ThumbsDown,
  MessageSquareWarning,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { EnrichedReview, GlobalInsights, ProductInsight } from '../types';
import { RatingBadge, SentimentBadge } from '../components/common/Badge';

interface ProductsPageProps {
  reviews: EnrichedReview[];
  insights: GlobalInsights | null;
  onOpenReplyModal: (review: EnrichedReview) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  reviews,
  insights,
  onOpenReplyModal,
}) => {
  const productInsights = insights?.productInsights || [];
  const [selectedProduct, setSelectedProduct] = useState<string>(
    productInsights[0]?.product || ''
  );

  const activeInsight =
    productInsights.find((p) => p.product === selectedProduct) || productInsights[0];

  const productReviews = reviews.filter((r) => r.product === activeInsight?.product);

  if (!insights || productInsights.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
        No product reviews available. Please upload a CSV file or load the sample dataset.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Analytics</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Detailed sentiment split, friction points, and customer satisfaction metrics per product line.
        </p>
      </div>

      {/* Product Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {productInsights.map((p) => (
          <button
            key={p.product}
            onClick={() => setSelectedProduct(p.product)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeInsight?.product === p.product
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{p.product}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeInsight?.product === p.product
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {p.totalReviews}
            </span>
          </button>
        ))}
      </div>

      {activeInsight && (
        <div className="space-y-6">
          {/* Product Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Reviews</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{activeInsight.totalReviews}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Positive Reviews</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {activeInsight.sentimentBreakdown.positive}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-rose-700 uppercase">Negative Reviews</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {activeInsight.sentimentBreakdown.negative}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-amber-700 uppercase">Needs Reply</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{activeInsight.needsReplyCount}</p>
            </div>
          </div>

          {/* Top Praises and Complaints for this Product */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-rose-700 font-bold text-xs">
                <ThumbsDown className="w-4 h-4" />
                <span>Top Reported Complaints</span>
              </div>
              {activeInsight.topComplaints.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No negative complaints recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {activeInsight.topComplaints.map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 bg-rose-50/40 p-2.5 rounded-lg border border-rose-100/60 font-medium leading-relaxed"
                    >
                      &bull; {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-emerald-700 font-bold text-xs">
                <ThumbsUp className="w-4 h-4" />
                <span>Top Customer Praises</span>
              </div>
              {activeInsight.topPraises.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No praises recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {activeInsight.topPraises.map((p, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/60 font-medium leading-relaxed"
                    >
                      &bull; {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Product Specific Reviews Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                Feedback for {activeInsight.product} ({productReviews.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {productReviews.map((r) => (
                <div key={r.review_id} className="p-4 hover:bg-slate-50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{r.review_id}</span>
                      <RatingBadge rating={r.rating} />
                      <SentimentBadge sentiment={r.sentiment} />
                    </div>
                    {r.needs_reply && (
                      <button
                        onClick={() => onOpenReplyModal(r)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        {r.suggested_reply ? 'View Reply' : 'Generate Reply'}
                      </button>
                    )}
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">"{r.review_text}"</p>
                  {r.summary && (
                    <p className="text-[11px] text-slate-500">
                      <strong>AI Summary:</strong> {r.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

