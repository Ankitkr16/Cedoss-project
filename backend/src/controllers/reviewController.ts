import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseCsvContent,
  validateCsvHeaders,
  cleanReviews,
} from '../services/cleaningService.js';
import { batchProcessor } from '../services/batchProcessor.js';
import { persistentCache } from '../services/cacheService.js';
import { geminiService } from '../services/geminiService.js';
import { generateInsights } from '../services/insightsService.js';
import { EnrichedReview, ProcessingMetrics } from '../types/review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory active review store for the current session
let currentReviews: EnrichedReview[] = [];
let currentMetrics: ProcessingMetrics | null = null;

export const uploadReviews = async (req: Request, res: Response) => {
  try {
    let csvContent = '';

    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.csvContent) {
      csvContent = req.body.csvContent;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No CSV file or csvContent provided in request.',
      });
    }

    if (!csvContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded CSV content is empty.',
      });
    }

    // 1. Parse CSV
    const rawRows = parseCsvContent(csvContent);
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'CSV contains no rows or could not be parsed.',
      });
    }

    // 2. Validate Headers
    const firstRowKeys = Object.keys(rawRows[0] || {});
    const headerValidation = validateCsvHeaders(firstRowKeys);
    if (!headerValidation.valid) {
      return res.status(400).json({
        success: false,
        error: `CSV missing required column(s): ${headerValidation.missing.join(', ')}. Required: review_id, product, rating, date, review_text`,
      });
    }

    // 3. Clean and normalize data
    const cleaningResult = cleanReviews(rawRows);

    // 4. Batch process with Gemini & Persistent Cache
    const { reviews: enriched, metrics } = await batchProcessor.processReviews(
      cleaningResult.reviews
    );

    currentReviews = enriched;
    currentMetrics = metrics;

    const insights = generateInsights(currentReviews);

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${metrics.total_rows} reviews.`,
      metrics,
      cleaning_stats: cleaningResult.stats,
      insights,
      reviews: currentReviews,
    });
  } catch (error: any) {
    console.error('[ReviewController] Error in uploadReviews:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An internal error occurred during review processing.',
    });
  }
};

export const loadSampleReviews = async (req: Request, res: Response) => {
  try {
    const samplePath = path.resolve(__dirname, '../../../data/reviews.csv');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({
        success: false,
        error: 'Sample reviews.csv file not found on server.',
      });
    }

    const sampleContent = fs.readFileSync(samplePath, 'utf-8');
    const rawRows = parseCsvContent(sampleContent);
    const cleaningResult = cleanReviews(rawRows);

    const { reviews: enriched, metrics } = await batchProcessor.processReviews(
      cleaningResult.reviews
    );

    currentReviews = enriched;
    currentMetrics = metrics;

    const insights = generateInsights(currentReviews);

    return res.status(200).json({
      success: true,
      message: `Loaded and processed 30 assessment reviews.`,
      metrics,
      cleaning_stats: cleaningResult.stats,
      insights,
      reviews: currentReviews,
    });
  } catch (error: any) {
    console.error('[ReviewController] Error loading sample reviews:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load sample reviews.',
    });
  }
};

export const getReviews = (req: Request, res: Response) => {
  try {
    let filtered = [...currentReviews];

    const {
      product,
      sentiment,
      topic,
      needs_reply,
      has_mismatch,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    if (product && typeof product === 'string') {
      filtered = filtered.filter((r) => r.product.toLowerCase() === product.toLowerCase());
    }

    if (sentiment && typeof sentiment === 'string') {
      filtered = filtered.filter((r) => r.sentiment === sentiment);
    }

    if (topic && typeof topic === 'string') {
      filtered = filtered.filter((r) => r.topics && r.topics.includes(topic as any));
    }

    if (needs_reply !== undefined) {
      const boolVal = needs_reply === 'true';
      filtered = filtered.filter((r) => !!r.needs_reply === boolVal);
    }

    if (has_mismatch !== undefined) {
      const boolVal = has_mismatch === 'true';
      filtered = filtered.filter((r) => r.rating_mismatch === boolVal);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.review_id.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.review_text.toLowerCase().includes(q) ||
          (r.summary && r.summary.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy && typeof sortBy === 'string') {
      const order = sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        if (sortBy === 'rating') {
          const rateA = a.rating ?? -1;
          const rateB = b.rating ?? -1;
          return (rateA - rateB) * order;
        }
        if (sortBy === 'date') {
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order;
        }
        if (sortBy === 'review_id') {
          return a.review_id.localeCompare(b.review_id) * order;
        }
        return 0;
      });
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 50;
    const totalCount = filtered.length;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      metrics: currentMetrics,
      insights: generateInsights(currentReviews),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const suggestReply = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = currentReviews.find((r) => r.review_id === id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: `Review with ID "${id}" not found.`,
      });
    }

    if (!review.review_text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate reply for an empty review.',
      });
    }

    review.suggested_reply_status = 'generating';

    const suggestedReply = await geminiService.generateSuggestedReply({
      product: review.product,
      review_text: review.review_text,
      summary: review.summary,
      topics: review.topics,
    });

    review.suggested_reply = suggestedReply;
    review.suggested_reply_status = 'generated';

    return res.status(200).json({
      success: true,
      review_id: id,
      suggested_reply: suggestedReply,
    });
  } catch (err: any) {
    console.error('[ReviewController] Error generating suggested reply:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate AI suggested reply.',
    });
  }
};

export const getSampleCsv = (req: Request, res: Response) => {
  const samplePath = path.resolve(__dirname, '../../../data/reviews.csv');
  if (fs.existsSync(samplePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews.csv"');
    return fs.createReadStream(samplePath).pipe(res);
  } else {
    return res.status(404).send('Sample file not found');
  }
};

export const getInsights = (req: Request, res: Response) => {
  const insights = generateInsights(currentReviews);
  return res.status(200).json({
    success: true,
    insights,
    metrics: currentMetrics,
  });
};

export const getSettings = (req: Request, res: Response) => {
  const geminiStatus = geminiService.getStatus();
  const cacheStats = persistentCache.getStats();

  return res.status(200).json({
    success: true,
    gemini: geminiStatus,
    cache: cacheStats,
  });
};

export const updateApiKey = (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid Gemini API key.',
    });
  }

  geminiService.updateApiKey(apiKey.trim());
  return res.status(200).json({
    success: true,
    message: 'Gemini API key updated successfully.',
    status: geminiService.getStatus(),
  });
};

export const clearCache = (req: Request, res: Response) => {
  persistentCache.clear();
  return res.status(200).json({
    success: true,
    message: 'Persistent cache cleared successfully.',
    cache: persistentCache.getStats(),
  });
};
