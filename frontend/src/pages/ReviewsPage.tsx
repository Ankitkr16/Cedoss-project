import React from 'react';
import { ReviewsTable } from '../components/reviews/ReviewsTable';
import { EnrichedReview } from '../types';

interface ReviewsPageProps {
  reviews: EnrichedReview[];
  products: string[];
  onOpenReplyModal: (review: EnrichedReview) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
  reviews,
  products,
  onOpenReplyModal,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">All Customer Reviews</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Search, filter by sentiment or topic, detect rating mismatches, and generate customer care responses.
        </p>
      </div>

      <ReviewsTable
        reviews={reviews}
        onOpenReplyModal={onOpenReplyModal}
        products={products}
      />
    </div>
  );
};
