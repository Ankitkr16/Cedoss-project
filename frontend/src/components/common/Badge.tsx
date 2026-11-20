import React from 'react';
import { Sentiment, PermittedTopic } from '../../types';

export const SentimentBadge: React.FC<{ sentiment?: Sentiment }> = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Pending
      </span>
    );
  }

  const styles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-700 border-amber-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const labels = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[sentiment]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          sentiment === 'positive'
            ? 'bg-emerald-500'
            : sentiment === 'neutral'
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />
      {labels[sentiment]}
    </span>
  );
};

export const TopicTag: React.FC<{ topic: PermittedTopic }> = ({ topic }) => {
  const styles: Record<PermittedTopic, string> = {
    quality: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivery: 'bg-blue-50 text-blue-700 border-blue-200',
    price: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    packaging: 'bg-purple-50 text-purple-700 border-purple-200',
    support: 'bg-amber-50 text-amber-800 border-amber-200',
    size_fit: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    other: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels: Record<PermittedTopic, string> = {
    quality: 'Quality',
    delivery: 'Delivery',
    price: 'Price',
    packaging: 'Packaging',
    support: 'Support',
    size_fit: 'Size & Fit',
    other: 'Other',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
        styles[topic] || styles.other
      }`}
    >
      {labels[topic] || topic}
    </span>
  );
};

export const RatingBadge: React.FC<{ rating: number | null }> = ({ rating }) => {
  if (rating === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Unknown
      </span>
    );
  }

  const color =
    rating >= 4
      ? 'text-amber-500'
      : rating === 3
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <span className="inline-flex items-center gap-1 font-semibold text-xs text-slate-700">
      <span className={color}>{'★'.repeat(rating)}</span>
      <span className="text-slate-400">{'★'.repeat(5 - rating)}</span>
      <span className="ml-1 text-slate-500 text-[11px]">({rating})</span>
    </span>
  );
};
