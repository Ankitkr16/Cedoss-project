import {
  CleanedReview,
  EnrichedReview,
  ProcessingMetrics,
  AIAnalysisResult,
  Sentiment,
  PermittedTopic,
} from '../types/review.js';
import { detectRatingMismatch } from '../utils/text.js';
import { persistentCache } from './cacheService.js';
import { geminiService } from './geminiService.js';

export interface BatchProcessingOptions {
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
}

export class BatchProcessor {
  /**
   * Processes cleaned reviews in batches of 5, checking the cache and deduplicating.
   */
  public async processReviews(
    cleanedReviews: CleanedReview[],
    options: BatchProcessingOptions = {}
  ): Promise<{ reviews: EnrichedReview[]; metrics: ProcessingMetrics }> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 5;

    let cacheHits = 0;
    let initialAiCalls = geminiService.totalApiCalls;

    const enrichedMap = new Map<string, EnrichedReview>();
    const uniqueTextToResult = new Map<string, AIAnalysisResult>();

    // 1. Initial pass: identify empty reviews and cache hits
    const pendingAnalysisReviews: CleanedReview[] = [];

    for (const item of cleanedReviews) {
      if (item.is_empty) {
        enrichedMap.set(item.review_id, {
          ...item,
          analysis_status: 'skipped_empty',
          rating_mismatch: false,
          summary: 'Review text was empty; skipped from AI analysis.',
        });
        continue;
      }

      // Check cache by SHA-256 hash
      const cachedResult = persistentCache.get(item.text_hash);
      if (cachedResult) {
        cacheHits++;
        uniqueTextToResult.set(item.text_hash, cachedResult);
        const mismatch = detectRatingMismatch(item.rating, cachedResult.sentiment);
        enrichedMap.set(item.review_id, {
          ...item,
          ...cachedResult,
          analysis_status: 'cached',
          rating_mismatch: mismatch,
        });
        continue;
      }

      // If this review is an in-dataset duplicate of a text already processed
      if (uniqueTextToResult.has(item.text_hash)) {
        const existingResult = uniqueTextToResult.get(item.text_hash)!;
        const mismatch = detectRatingMismatch(item.rating, existingResult.sentiment);
        enrichedMap.set(item.review_id, {
          ...item,
          ...existingResult,
          analysis_status: 'cached',
          rating_mismatch: mismatch,
        });
        continue;
      }

      // If it's a duplicate of another row within this batch that hasn't been analyzed yet,
      // we only need to analyze the FIRST unique instance!
      const isAlreadyInPending = pendingAnalysisReviews.some((r) => r.text_hash === item.text_hash);
      if (!isAlreadyInPending) {
        pendingAnalysisReviews.push(item);
      }
    }

    // 2. Process unique pending reviews in batches of 5
    const totalPending = pendingAnalysisReviews.length;
    let processedCount = 0;

    for (let i = 0; i < totalPending; i += batchSize) {
      const batch = pendingAnalysisReviews.slice(i, i + batchSize);

      try {
        const batchResults = await geminiService.analyzeBatch(
          batch.map((b) => ({
            review_id: b.review_id,
            product: b.product,
            rating: b.rating,
            review_text: b.review_text,
          }))
        );

        for (const review of batch) {
          const aiResult = batchResults.get(review.review_id);
          if (aiResult) {
            // Save to persistent cache
            persistentCache.set(review.text_hash, aiResult);
            uniqueTextToResult.set(review.text_hash, aiResult);

            const mismatch = detectRatingMismatch(review.rating, aiResult.sentiment);
            enrichedMap.set(review.review_id, {
              ...review,
              ...aiResult,
              analysis_status: 'analyzed',
              rating_mismatch: mismatch,
            });
          } else {
            // Mark as analysis failed for this specific review without crashing
            enrichedMap.set(review.review_id, {
              ...review,
              analysis_status: 'analysis_failed',
              error_reason: 'AI did not return a valid structured result for this review',
              rating_mismatch: false,
            });
          }
        }
      } catch (batchErr: any) {
        console.error(`[BatchProcessor] Error processing batch ${i / batchSize + 1}:`, batchErr.message);
        // Mark all items in this batch as analysis_failed
        for (const review of batch) {
          enrichedMap.set(review.review_id, {
            ...review,
            analysis_status: 'analysis_failed',
            error_reason: batchErr.message || 'Batch analysis encountered an error',
            rating_mismatch: false,
          });
        }
      }

      processedCount += batch.length;
      if (options.onProgress) {
        options.onProgress(processedCount, totalPending);
      }
    }

    // 3. Populate any duplicates that were waiting on unique analyses
    for (const item of cleanedReviews) {
      if (!enrichedMap.has(item.review_id)) {
        const resolvedResult = uniqueTextToResult.get(item.text_hash);
        if (resolvedResult) {
          const mismatch = detectRatingMismatch(item.rating, resolvedResult.sentiment);
          enrichedMap.set(item.review_id, {
            ...item,
            ...resolvedResult,
            analysis_status: 'cached',
            rating_mismatch: mismatch,
          });
        } else {
          enrichedMap.set(item.review_id, {
            ...item,
            analysis_status: 'analysis_failed',
            error_reason: 'Original review analysis failed or unavailable',
            rating_mismatch: false,
          });
        }
      }
    }

    // Convert map back to original ordering
    const finalReviews: EnrichedReview[] = cleanedReviews.map(
      (c) => enrichedMap.get(c.review_id)!
    );

    // Compute metrics
    const durationMs = Date.now() - startTime;
    const aiCallsMade = geminiService.totalApiCalls - initialAiCalls;

    let validCount = 0;
    let emptyCount = 0;
    let duplicateCount = 0;
    let invalidRatingCount = 0;
    let analyzedCount = 0;
    let failedCount = 0;
    let mismatchCount = 0;
    let totalRatingsWithSentiment = 0;
    let matchingRatingsWithSentiment = 0;

    for (const r of finalReviews) {
      if (r.is_empty) emptyCount++;
      if (r.is_duplicate) duplicateCount++;
      if (r.rating_is_unknown) invalidRatingCount++;
      if (!r.is_empty && !r.is_duplicate) validCount++;

      if (r.analysis_status === 'analyzed' || r.analysis_status === 'cached') {
        analyzedCount++;
      } else if (r.analysis_status === 'analysis_failed') {
        failedCount++;
      }

      if (r.rating_mismatch) {
        mismatchCount++;
      }

      // Calculate rating agreement for items with valid rating & sentiment
      if (r.rating !== null && r.sentiment) {
        totalRatingsWithSentiment++;
        const isAgreement =
          (r.rating >= 4 && r.sentiment === 'positive') ||
          (r.rating === 3 && r.sentiment === 'neutral') ||
          (r.rating <= 2 && r.sentiment === 'negative');
        if (isAgreement) {
          matchingRatingsWithSentiment++;
        }
      }
    }

    const agreementPercentage =
      totalRatingsWithSentiment > 0
        ? Number(((matchingRatingsWithSentiment / totalRatingsWithSentiment) * 100).toFixed(1))
        : 100;

    const metrics: ProcessingMetrics = {
      total_rows: finalReviews.length,
      valid_reviews: validCount,
      empty_reviews: emptyCount,
      duplicate_reviews: duplicateCount,
      invalid_ratings: invalidRatingCount,
      analyzed_count: analyzedCount,
      failed_count: failedCount,
      cache_hits: cacheHits,
      ai_calls: aiCallsMade,
      processing_time_ms: durationMs,
      mismatch_count: mismatchCount,
      agreement_percentage: agreementPercentage,
    };

    return {
      reviews: finalReviews,
      metrics,
    };
  }
}

export const batchProcessor = new BatchProcessor();

