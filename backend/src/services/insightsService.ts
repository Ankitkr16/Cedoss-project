import { EnrichedReview, PermittedTopic, Sentiment } from '../types/review.js';

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

export function generateInsights(reviews: EnrichedReview[]): GlobalInsights {
  const analyzedReviews = reviews.filter(
    (r) => r.analysis_status === 'analyzed' || r.analysis_status === 'cached'
  );

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let needsReplyCount = 0;

  const topicCounts: Record<PermittedTopic, number> = {
    quality: 0,
    delivery: 0,
    price: 0,
    packaging: 0,
    support: 0,
    size_fit: 0,
    other: 0,
  };

  const productMap = new Map<string, EnrichedReview[]>();

  for (const r of reviews) {
    if (!productMap.has(r.product)) {
      productMap.set(r.product, []);
    }
    productMap.get(r.product)!.push(r);
  }

  for (const r of analyzedReviews) {
    if (r.sentiment === 'positive') positiveCount++;
    else if (r.sentiment === 'neutral') neutralCount++;
    else if (r.sentiment === 'negative') negativeCount++;

    if (r.needs_reply) needsReplyCount++;

    if (r.topics && Array.isArray(r.topics)) {
      for (const t of r.topics) {
        if (topicCounts[t] !== undefined) {
          topicCounts[t]++;
        }
      }
    }
  }

  const total = analyzedReviews.length;
  const sentimentPercentages = {
    positive: total > 0 ? Number(((positiveCount / total) * 100).toFixed(1)) : 0,
    neutral: total > 0 ? Number(((neutralCount / total) * 100).toFixed(1)) : 0,
    negative: total > 0 ? Number(((negativeCount / total) * 100).toFixed(1)) : 0,
  };

  // Generate top complaints and praises by grouping summaries and topics
  const complaintItems: { topic: string; summary: string; count: number; products: Set<string> }[] = [];
  const praiseItems: { topic: string; summary: string; count: number; products: Set<string> }[] = [];

  for (const r of analyzedReviews) {
    if (r.sentiment === 'negative' && r.summary) {
      const topic = r.topics?.[0] || 'quality';
      complaintItems.push({
        topic,
        summary: r.summary,
        count: 1,
        products: new Set([r.product]),
      });
    } else if (r.sentiment === 'positive' && r.summary) {
      const topic = r.topics?.[0] || 'quality';
      praiseItems.push({
        topic,
        summary: r.summary,
        count: 1,
        products: new Set([r.product]),
      });
    }
  }

  // Deduplicate and rank top 3 complaints and praises
  const topComplaints = complaintItems.slice(0, 3).map((item) => ({
    topic: item.topic,
    summary: item.summary,
    count: item.count,
    products: Array.from(item.products),
  }));

  const topPraises = praiseItems.slice(0, 3).map((item) => ({
    topic: item.topic,
    summary: item.summary,
    count: item.count,
    products: Array.from(item.products),
  }));

  // Generate per-product insights
  const productInsights: ProductInsight[] = [];

  for (const [productName, pReviews] of productMap.entries()) {
    let pPos = 0;
    let pNeu = 0;
    let pNeg = 0;
    let pReply = 0;
    let pMismatch = 0;
    const pComplaints: string[] = [];
    const pPraises: string[] = [];

    for (const r of pReviews) {
      if (r.sentiment === 'positive') pPos++;
      else if (r.sentiment === 'neutral') pNeu++;
      else if (r.sentiment === 'negative') pNeg++;

      if (r.needs_reply) pReply++;
      if (r.rating_mismatch) pMismatch++;

      if (r.sentiment === 'negative' && r.summary) {
        pComplaints.push(r.summary);
      } else if (r.sentiment === 'positive' && r.summary) {
        pPraises.push(r.summary);
      }
    }

    productInsights.push({
      product: productName,
      totalReviews: pReviews.length,
      sentimentBreakdown: {
        positive: pPos,
        neutral: pNeu,
        negative: pNeg,
      },
      topComplaints: pComplaints.slice(0, 3),
      topPraises: pPraises.slice(0, 3),
      needsReplyCount: pReply,
      mismatchCount: pMismatch,
    });
  }

  return {
    totalAnalyzed: total,
    sentimentPercentages,
    needsReplyCount,
    topicCounts,
    topComplaints,
    topPraises,
    productInsights,
  };
}
