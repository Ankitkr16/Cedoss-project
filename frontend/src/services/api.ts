import { ApiResponse, EnrichedReview, GlobalInsights, ProcessingMetrics } from '../types';

const API_BASE = '/api';

export const api = {
  async uploadCsv(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/reviews/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async loadSampleReviews(): Promise<ApiResponse> {
    const res = await fetch(`${API_BASE}/reviews/load-sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async getReviews(params: Record<string, any> = {}): Promise<{
    success: boolean;
    data: EnrichedReview[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    metrics?: ProcessingMetrics;
    insights?: GlobalInsights;
    error?: string;
  }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const res = await fetch(`${API_BASE}/reviews?${query.toString()}`);
    return res.json();
  },

  async generateReply(reviewId: string): Promise<{
    success: boolean;
    review_id?: string;
    suggested_reply?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/suggest-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async getInsights(): Promise<{ success: boolean; insights: GlobalInsights; metrics: ProcessingMetrics }> {
    const res = await fetch(`${API_BASE}/reviews/insights`);
    return res.json();
  },

  async getSettings(): Promise<{
    success: boolean;
    gemini: { hasKey: boolean; model: string; totalCalls: number };
    cache: { totalEntries: number; hits: number; misses: number; cacheHitRatio: number };
  }> {
    const res = await fetch(`${API_BASE}/reviews/settings/status`);
    return res.json();
  },

  async updateApiKey(apiKey: string): Promise<ApiResponse> {
    const res = await fetch(`${API_BASE}/reviews/settings/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    return res.json();
  },

  async clearCache(): Promise<ApiResponse> {
    const res = await fetch(`${API_BASE}/reviews/cache/clear`, {
      method: 'POST',
    });
    return res.json();
  },

  downloadSampleCsvUrl(): string {
    return `${API_BASE}/reviews/sample`;
  },
};
