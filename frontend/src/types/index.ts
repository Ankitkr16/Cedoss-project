export type Sentiment = 'positive' | 'neutral' | 'negative';

export type PermittedTopic =
  | 'quality'
  | 'delivery'
  | 'price'
  | 'packaging'
  | 'support'
  | 'size_fit'
  | 'other';

export type AnalysisStatus = 'analyzed' | 'skipped_empty' | 'analysis_failed' | 'cached';
export type SuggestedReplyStatus = 'not_generated' | 'generating' | 'generated' | 'failed';

export interface EnrichedReview {
  review_id: string;
  product: string;
  rating: number | null;
  raw_rating: string;
  date: string;
  review_text: string;
  sanitized_text: string;
  normalized_text: string;
  text_hash: string;
  is_empty: boolean;
  is_duplicate: boolean;
  duplicate_of?: string;
  rating_is_unknown: boolean;
  sentiment?: Sentiment;
  topics?: PermittedTopic[];
  summary?: string;
  needs_reply?: boolean;
  analysis_status: AnalysisStatus;
  error_reason?: string;
  rating_mismatch: boolean;
  suggested_reply?: string;
  suggested_reply_status?: SuggestedReplyStatus;
  suggested_reply_error?: string;
}

export interface CleaningStats {
  total_rows: number;
  valid_reviews: number;
  empty_reviews: number;
  duplicate_reviews: number;
  invalid_ratings: number;
}

export interface ProcessingMetrics {
  total_rows: number;
  valid_reviews: number;
  empty_reviews: number;
  duplicate_reviews: number;
  invalid_ratings: number;
  analyzed_count: number;
  failed_count: number;
  cache_hits: number;
  ai_calls: number;
  processing_time_ms: number;
  mismatch_count: number;
  agreement_percentage: number;
}

export interface ProductInsight {
  product: string;
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topComplaints: string[];
  topPraises: string[];
  needsReplyCount: number;
  mismatchCount: number;
}

export interface GlobalInsights {
  totalAnalyzed: number;
  sentimentPercentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  needsReplyCount: number;
  topicCounts: Record<PermittedTopic, number>;
  topComplaints: { topic: string; summary: string; count: number; products: string[] }[];
  topPraises: { topic: string; summary: string; count: number; products: string[] }[];
  productInsights: ProductInsight[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  metrics?: ProcessingMetrics;
  cleaning_stats?: CleaningStats;
  insights?: GlobalInsights;
  reviews?: EnrichedReview[];
}

