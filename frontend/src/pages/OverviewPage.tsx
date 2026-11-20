import React from 'react';
import { UploadSection } from '../components/dashboard/UploadSection';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { AnalyticsCharts } from '../components/dashboard/AnalyticsCharts';
import { TopInsights } from '../components/dashboard/TopInsights';
import { ReviewsTable } from '../components/reviews/ReviewsTable';
import { EnrichedReview, ProcessingMetrics, CleaningStats, GlobalInsights } from '../types';

interface OverviewPageProps {
  reviews: EnrichedReview[];
  metrics: ProcessingMetrics | null;
  cleaningStats: CleaningStats | null;
  insights: GlobalInsights | null;
  products: string[];
  onDataLoaded: (reviews: any[], metrics: ProcessingMetrics, stats: CleaningStats) => void;
  onOpenReplyModal: (review: EnrichedReview) => void;
  onViewAllReviews: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  reviews,
  metrics,
  cleaningStats,
  insights,
  products,
  onDataLoaded,
  onOpenReplyModal,
  onViewAllReviews,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Store Review Intelligence</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Automated customer sentiment analysis, topic detection, and proactive reply generation.
        </p>
      </div>

      {/* CSV Upload & Quick Load */}
      <UploadSection
        onDataLoaded={onDataLoaded}
        cleaningStats={cleaningStats}
        metrics={metrics}
      />

      {/* KPI Stat Cards */}
      <SummaryCards metrics={metrics} insights={insights} />

      {/* Visual Analytics */}
      <AnalyticsCharts insights={insights} />

      {/* Top Praises and Friction Points */}
      <TopInsights insights={insights} />

      {/* Quick Recent Reviews Table Preview */}
      {reviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Customer Reviews</h2>
              <p className="text-xs text-slate-500">Live preview of analyzed feedback</p>
            </div>
            <button
              onClick={onViewAllReviews}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View Full Table &rarr;
            </button>
          </div>
          <ReviewsTable
            reviews={reviews.slice(0, 5)}
            onOpenReplyModal={onOpenReplyModal}
            products={products}
          />
        </div>
      )}
    </div>
  );
};
