import Papa from 'papaparse';
import { RawReviewRow, CleanedReview, CleaningStats } from '../types/review.js';
import { normalizeText, generateTextHash, sanitizeHtml } from '../utils/text.js';

export interface CleaningResult {
  reviews: CleanedReview[];
  stats: CleaningStats;
}

export const REQUIRED_COLUMNS = ['review_id', 'product', 'rating', 'date', 'review_text'];

/**
 * Validates whether the parsed CSV headers contain all required columns.
 */
export function validateCsvHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col.toLowerCase()));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Parses raw CSV content string with PapaParse, supporting malformed rows and quotes.
 */
export function parseCsvContent(csvString: string): RawReviewRow[] {
  const result = Papa.parse<RawReviewRow>(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    // Log non-fatal errors for debugging
    console.warn('[CSV Parser] Warnings during parse:', result.errors);
  }

  return result.data;
}

/**
 * Cleans and validates raw review rows according to assessment specifications:
 * - Validate required columns: review_id, product, rating, date, review_text
 * - Handle malformed CSV rows without crashing
 * - Skip or flag empty review text
 * - Treat missing ratings as unknown (null)
 * - Treat invalid ratings such as "five" as unknown (null)
 * - Detect duplicate reviews using normalized review text and SHA-256 hash
 * - Preserves original records and associates duplicate records with original analysis
 * - Sanitize review text before displaying
 */
export function cleanReviews(rawRows: RawReviewRow[]): CleaningResult {
  const seenHashMap = new Map<string, string>(); // hash -> first review_id seen
  const cleaned: CleanedReview[] = [];

  let totalRows = 0;
  let validReviews = 0;
  let emptyReviews = 0;
  let duplicateReviews = 0;
  let invalidRatings = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;

    // Fallback ID if missing
    const reviewId = (row.review_id || `R_GEN_${i + 1}`).trim();
    const product = (row.product || 'Unknown Product').trim();
    const rawRating = row.rating !== undefined && row.rating !== null ? String(row.rating).trim() : '';
    const date = (row.date || new Date().toISOString().split('T')[0]).trim();
    const rawText = row.review_text !== undefined && row.review_text !== null ? String(row.review_text) : '';

    totalRows++;

    // Parse rating: must be integer or float 1..5
    let numericRating: number | null = null;
    let ratingIsUnknown = false;

    if (!rawRating) {
      numericRating = null;
      ratingIsUnknown = true;
      invalidRatings++;
    } else {
      const parsed = Number(rawRating);
      if (isNaN(parsed) || parsed < 1 || parsed > 5) {
        numericRating = null;
        ratingIsUnknown = true;
        invalidRatings++;
      } else {
        numericRating = parsed;
      }
    }

    // Check empty text
    const trimmedText = rawText.trim();
    const isEmpty = trimmedText.length === 0;

    if (isEmpty) {
      emptyReviews++;
    }

    // Normalize text and generate SHA-256 hash
    const normalized = normalizeText(rawText);
    const hash = generateTextHash(normalized);
    const sanitized = sanitizeHtml(rawText);

    let isDuplicate = false;
    let duplicateOf: string | undefined = undefined;

    // Only non-empty reviews undergo duplicate tracking
    if (!isEmpty) {
      if (seenHashMap.has(hash)) {
        isDuplicate = true;
        duplicateOf = seenHashMap.get(hash);
        duplicateReviews++;
      } else {
        seenHashMap.set(hash, reviewId);
        validReviews++;
      }
    }

    cleaned.push({
      review_id: reviewId,
      product,
      rating: numericRating,
      raw_rating: rawRating,
      date,
      review_text: rawText,
      sanitized_text: sanitized,
      normalized_text: normalized,
      text_hash: hash,
      is_empty: isEmpty,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf,
      rating_is_unknown: ratingIsUnknown,
    });
  }

  return {
    reviews: cleaned,
    stats: {
      total_rows: totalRows,
      valid_reviews: validReviews,
      empty_reviews: emptyReviews,
      duplicate_reviews: duplicateReviews,
      invalid_ratings: invalidRatings,
    },
  };
}
