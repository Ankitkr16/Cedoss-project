import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReplyModal } from './components/reviews/ReplyModal';
import {
  EnrichedReview,
  ProcessingMetrics,
  CleaningStats,
  GlobalInsights,
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [cleaningStats, setCleaningStats] = useState<CleaningStats | null>(null);
  const [insights, setInsights] = useState<GlobalInsights | null>(null);

  // Filters & State
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyModalReview, setReplyModalReview] = useState<EnrichedReview | null>(null);

  // Gemini Settings State
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [totalApiCalls, setTotalApiCalls] = useState<number>(0);
  const [cacheHits, setCacheHits] = useState<number>(0);

  // Load initial settings and data
  useEffect(() => {
    const init = async () => {
      try {
        const settingsRes = await api.getSettings();
        if (settingsRes.success) {
          setHasApiKey(settingsRes.gemini.hasKey);
          setTotalApiCalls(settingsRes.gemini.totalCalls);
          setCacheHits(settingsRes.cache.hits);
        }

        const reviewsRes = await api.getReviews();
        if (reviewsRes.success && reviewsRes.data.length > 0) {
          setReviews(reviewsRes.data);
          if (reviewsRes.metrics) setMetrics(reviewsRes.metrics);
          if (reviewsRes.insights) setInsights(reviewsRes.insights);
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    };
    init();
  }, []);

  const handleDataLoaded = (
    loadedReviews: EnrichedReview[],
    loadedMetrics: ProcessingMetrics,
    loadedStats: CleaningStats
  ) => {
    setReviews(loadedReviews);
    setMetrics(loadedMetrics);
    setCleaningStats(loadedStats);

    api.getInsights().then((res) => {
      if (res.success && res.insights) {
        setInsights(res.insights);
      }
    });

    api.getSettings().then((res) => {
      if (res.success) {
        setHasApiKey(res.gemini.hasKey);
        setTotalApiCalls(res.gemini.totalCalls);
        setCacheHits(res.cache.hits);
      }
    });
  };

  const handleReplyGenerated = (reviewId: string, reply: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.review_id === reviewId
          ? { ...r, suggested_reply: reply, suggested_reply_status: 'generated' }
          : r
      )
    );
  };

  // Derive distinct products
  const products = Array.from(new Set(reviews.map((r) => r.product).filter(Boolean)));

  // Filter reviews by global header search or product selector
  const visibleReviews = reviews.filter((r) => {
    if (selectedProduct !== 'ALL' && r.product !== selectedProduct) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.review_id.toLowerCase().includes(q);
      const matchProd = r.product.toLowerCase().includes(q);
      const matchText = r.review_text.toLowerCase().includes(q);
      const matchSummary = r.summary?.toLowerCase().includes(q);
      if (!matchId && !matchProd && !matchText && !matchSummary) return false;
    }
    return true;
  });

  const needsReplyCount = reviews.filter((r) => r.needs_reply).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        reviewCount={reviews.length}
        needsReplyCount={needsReplyCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header
          products={products}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasApiKey={hasApiKey}
          totalApiCalls={totalApiCalls}
          cacheHits={cacheHits}
        />

        <main className="p-8 max-w-7xl w-full mx-auto flex-1">
          {currentTab === 'overview' && (
            <OverviewPage
              reviews={visibleReviews}
              metrics={metrics}
              cleaningStats={cleaningStats}
              insights={insights}
              products={products}
              onDataLoaded={handleDataLoaded}
              onOpenReplyModal={setReplyModalReview}
              onViewAllReviews={() => setCurrentTab('reviews')}
            />
          )}

          {currentTab === 'reviews' && (
            <ReviewsPage
              reviews={visibleReviews}
              products={products}
              onOpenReplyModal={setReplyModalReview}
            />
          )}

          {currentTab === 'products' && (
            <ProductsPage
              reviews={reviews}
              insights={insights}
              onOpenReplyModal={setReplyModalReview}
            />
          )}

          {currentTab === 'insights' && <InsightsPage reviews={reviews} />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Suggested Reply Modal */}
      <ReplyModal
        review={replyModalReview}
        onClose={() => setReplyModalReview(null)}
        onReplyGenerated={handleReplyGenerated}
      />
    </div>
  );
};

export default App;
