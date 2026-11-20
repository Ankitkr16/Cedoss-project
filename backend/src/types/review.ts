import { z } from 'zod';

export const PermittedTopics = [
  'quality',
  'delivery',
  'price',
  'packaging',
  'support',
  'size_fit',
  'other',
] as const;

export type PermittedTopic = (typeof PermittedTopics)[number];

export const SentimentEnum = z.enum(['positive', 'neutral', 'negative']);
export type Sentiment = z.infer<typeof SentimentEnum>;

export const TopicEnum = z.enum(PermittedTopics);

export const AnalysisResultSchema = z.object({
  sentiment: SentimentEnum,
  topics: z.array(TopicEnum).min(1, 'At least one permitted topic is required'),
  summary: z.string().min(1, 'Summary must not be empty and must be in English'),
  needs_reply: z.boolean(),
}).strict();

export type AIAnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const BatchAnalysisItemSchema = z.object({
  review_id: z.string(),
  sentiment: SentimentEnum,
  topics: z.array(TopicEnum).min(1),
  summary: z.string().min(1),
  needs_reply: z.boolean(),
}).strict();

export const BatchAnalysisResultSchema = z.array(BatchAnalysisItemSchema);

export type BatchAnalysisItem = z.infer<typeof BatchAnalysisItemSchema>;

export interface RawReviewRow {
  review_id?: string;
  product?: string;
  rating?: string | number;
  date?: string;
  review_text?: string;
  [key: string]: any;
}

export interface CleanedReview {
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
}

export type AnalysisStatus = 'analyzed' | 'skipped_empty' | 'analysis_failed' | 'cached';
export type SuggestedReplyStatus = 'not_generated' | 'generating' | 'generated' | 'failed';

export interface EnrichedReview extends CleanedReview {
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
