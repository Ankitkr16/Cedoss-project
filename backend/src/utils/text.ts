import crypto from 'crypto';

/**
 * Normalizes review text for consistent duplicate detection and caching:
 * - Trims leading/trailing whitespace
 * - Converts to lower-case
 * - Collapses consecutive whitespace characters (including newlines and tabs) to single space
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Generates SHA-256 hash of normalized text
 */
export function generateTextHash(normalizedText: string): string {
  return crypto.createHash('sha256').update(normalizedText, 'utf8').digest('hex');
}

/**
 * Sanitizes text to prevent Cross-Site Scripting (XSS) when rendering in the UI.
 * Escapes HTML characters: &, <, >, ", '
 */
export function sanitizeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks if a rating and sentiment exhibit a mismatch.
 * Rules:
 * - High rating (4 or 5 stars) but negative sentiment -> mismatch (e.g., R008)
 * - Low rating (1 or 2 stars) but positive sentiment -> mismatch (e.g., R003 sarcasm, accidental 1 star)
 * - Unknown ratings (null) are excluded from mismatch detection.
 */
export function detectRatingMismatch(rating: number | null, sentiment?: string): boolean {
  if (rating === null || !sentiment) return false;
  if ((rating === 4 || rating === 5) && sentiment === 'negative') return true;
  if ((rating === 1 || rating === 2) && sentiment === 'positive') return true;
  return false;
}
