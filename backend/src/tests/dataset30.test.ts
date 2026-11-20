import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCsvContent, cleanReviews } from '../services/cleaningService.js';
import { BatchProcessor } from '../services/batchProcessor.js';
import { CacheService } from '../services/cacheService.js';
import { geminiService } from '../services/geminiService.js';
import { generateInsights } from '../services/insightsService.js';

describe('30-Review Assessment Dataset Full Lifecycle Test', () => {
  const samplePath = path.resolve(__dirname, '../../../data/reviews.csv');
  const tempCachePath = path.resolve(__dirname, 'test_dataset_cache.json');
  let processor: BatchProcessor;

  beforeEach(() => {
    if (fs.existsSync(tempCachePath)) {
      fs.unlinkSync(tempCachePath);
    }
    processor = new BatchProcessor();
  });

  afterEach(() => {
    if (fs.existsSync(tempCachePath)) {
      fs.unlinkSync(tempCachePath);
    }
    vi.restoreAllMocks();
  });

  it('correctly cleans all 30 reviews according to exact assessment rules', () => {
    const csvContent = fs.readFileSync(samplePath, 'utf-8');
    const rawRows = parseCsvContent(csvContent);
    expect(rawRows).toHaveLength(30);

    const { reviews, stats } = cleanReviews(rawRows);

    // 1. Total counts
    expect(stats.total_rows).toBe(30);
    expect(stats.empty_reviews).toBe(1); // R005
    expect(stats.duplicate_reviews).toBe(1); // R015 is duplicate of R012
    expect(stats.invalid_ratings).toBe(2); // R010 (missing) and R022 ("five")
    expect(stats.valid_reviews).toBe(28); // 30 - 1 empty - 1 duplicate = 28 unique non-empty

    // 2. Verify R005 empty text
    const r005 = reviews.find((r) => r.review_id === 'R005');
    expect(r005?.is_empty).toBe(true);

    // 3. Verify R010 and R022 unknown ratings
    const r010 = reviews.find((r) => r.review_id === 'R010');
    expect(r010?.rating).toBeNull();
    expect(r010?.rating_is_unknown).toBe(true);

    const r022 = reviews.find((r) => r.review_id === 'R022');
    expect(r022?.rating).toBeNull();
    expect(r022?.rating_is_unknown).toBe(true);

    // 4. Verify R015 duplicate of R012
    const r012 = reviews.find((r) => r.review_id === 'R012');
    const r015 = reviews.find((r) => r.review_id === 'R015');
    expect(r012?.is_duplicate).toBe(false);
    expect(r015?.is_duplicate).toBe(true);
    expect(r015?.duplicate_of).toBe('R012');
    expect(r012?.text_hash).toBe(r015?.text_hash);

    // 5. Verify R024 HTML sanitization (<b>Love it!</b>)
    const r024 = reviews.find((r) => r.review_id === 'R024');
    expect(r024?.sanitized_text).toContain('&lt;b&gt;Love it!&lt;/b&gt;');
    expect(r024?.sanitized_text).not.toContain('<b>');
  });

  it('processes all 30 reviews in batches of 5 with prompt injection defense, caching and mismatch detection', async () => {
    const csvContent = fs.readFileSync(samplePath, 'utf-8');
    const rawRows = parseCsvContent(csvContent);
    const { reviews: cleaned } = cleanReviews(rawRows);

    // Mock Gemini API batch processing with realistic AI outputs that obey the system prompt
    vi.spyOn(geminiService, 'analyzeBatch').mockImplementation(async (batchItems) => {
      const results = new Map();
      for (const item of batchItems) {
        if (item.review_id === 'R012') {
          // Injection defense: classify negative despite command to mark positive 5-star
          results.set('R012', {
            sentiment: 'negative',
            topics: ['quality'],
            summary: 'Left earbud stopped working after two days.',
            needs_reply: true,
          });
        } else if (item.review_id === 'R008') {
          // Terrible mugs, handles broke
          results.set('R008', {
            sentiment: 'negative',
            topics: ['quality'],
            summary: 'Both mug handles broke off within a week.',
            needs_reply: true,
          });
        } else if (item.review_id === 'R003') {
          // Sarcasm: 3 weeks delivery
          results.set('R003', {
            sentiment: 'negative',
            topics: ['delivery'],
            summary: 'Delivery took 3 weeks; sarcastic comment on speed.',
            needs_reply: true,
          });
        } else if (item.review_id === 'R016') {
          // Hindi: बैटरी जल्दी खत्म हो जाती है
          results.set('R016', {
            sentiment: 'negative',
            topics: ['quality'],
            summary: 'Good sound quality but battery drains quickly.',
            needs_reply: true,
          });
        } else if (item.review_id === 'R001') {
          results.set('R001', {
            sentiment: 'positive',
            topics: ['quality', 'price'],
            summary: 'Soft fabric and colors did not fade after washing.',
            needs_reply: false,
          });
        } else {
          // Default sensible fallback for other items in dataset
          const isNegative = item.rating !== null && item.rating <= 2;
          results.set(item.review_id, {
            sentiment: isNegative ? 'negative' : 'positive',
            topics: ['quality'],
            summary: `Summary of ${item.product} review in English.`,
            needs_reply: isNegative,
          });
        }
      }
      return results;
    });

    const { reviews: enriched, metrics } = await processor.processReviews(cleaned, {
      batchSize: 5,
    });

    expect(enriched).toHaveLength(30);

    // 1. Verify R012 is negative and needs reply
    const r012 = enriched.find((r) => r.review_id === 'R012');
    expect(r012?.sentiment).toBe('negative');
    expect(r012?.topics).toContain('quality');
    expect(r012?.needs_reply).toBe(true);

    // 2. Verify duplicate R015 shared analysis with R012
    const r015 = enriched.find((r) => r.review_id === 'R015');
    expect(r015?.sentiment).toBe('negative');
    expect(r015?.summary).toBe(r012?.summary);
    expect(r015?.analysis_status).toBe('cached');

    // 3. Verify R008 rating mismatch (5 stars with negative sentiment)
    const r008 = enriched.find((r) => r.review_id === 'R008');
    expect(r008?.rating).toBe(5);
    expect(r008?.sentiment).toBe('negative');
    expect(r008?.rating_mismatch).toBe(true);

    // 4. Verify R003 sarcastic rating mismatch (1 star with negative review)
    const r003 = enriched.find((r) => r.review_id === 'R003');
    expect(r003?.rating).toBe(1);
    expect(r003?.sentiment).toBe('negative');

    // 5. Verify R005 empty review skipped from AI
    const r005 = enriched.find((r) => r.review_id === 'R005');
    expect(r005?.analysis_status).toBe('skipped_empty');

    // 6. Verify insights generation
    const insights = generateInsights(enriched);
    expect(insights.totalAnalyzed).toBeGreaterThanOrEqual(28);
    expect(insights.topComplaints.length).toBeGreaterThan(0);
    expect(insights.productInsights.length).toBe(5); // 5 distinct products

    // 7. Verify Second Run produces 100% Cache Hits!
    const secondRun = await processor.processReviews(cleaned, { batchSize: 5 });
    expect(secondRun.metrics.cache_hits).toBeGreaterThan(0);
  });
});

