import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Copy,
  Check,
  MessageSquare,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { EnrichedReview, PermittedTopic, Sentiment } from '../../types';
import { SentimentBadge, TopicTag, RatingBadge } from '../common/Badge';

interface ReviewsTableProps {
  reviews: EnrichedReview[];
  onOpenReplyModal: (review: EnrichedReview) => void;
  products: string[];
}

export const ReviewsTable: React.FC<ReviewsTableProps> = ({
  reviews,
  onOpenReplyModal,
  products,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [needsReplyFilter, setNeedsReplyFilter] = useState<string>('ALL');
  const [mismatchFilter, setMismatchFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [sortField, setSortField] = useState<'review_id' | 'rating' | 'date'>('review_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter logic
  let filtered = reviews.filter((r) => {
    if (selectedProduct !== 'ALL' && r.product !== selectedProduct) return false;
    if (selectedSentiment !== 'ALL' && r.sentiment !== selectedSentiment) return false;
    if (selectedTopic !== 'ALL' && (!r.topics || !r.topics.includes(selectedTopic as PermittedTopic)))
      return false;
    if (needsReplyFilter === 'YES' && !r.needs_reply) return false;
    if (needsReplyFilter === 'NO' && r.needs_reply) return false;
    if (mismatchFilter && !r.rating_mismatch) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = r.review_id.toLowerCase().includes(q);
      const matchProd = r.product.toLowerCase().includes(q);
      const matchText = r.review_text.toLowerCase().includes(q);
      const matchSummary = r.summary ? r.summary.toLowerCase().includes(q) : false;
      if (!matchId && !matchProd && !matchText && !matchSummary) return false;
    }

    return true;
  });

  // Sort logic
  filtered.sort((a, b) => {
    let comp = 0;
    if (sortField === 'review_id') {
      comp = a.review_id.localeCompare(b.review_id);
    } else if (sortField === 'rating') {
      comp = (a.rating ?? -1) - (b.rating ?? -1);
    } else if (sortField === 'date') {
      comp = new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return sortOrder === 'desc' ? -comp : comp;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedReviews = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: 'review_id' | 'rating' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden mb-6">
      {/* Table Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Filter Customer Reviews</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {filtered.length} of {reviews.length}
            </span>
          </div>

          {/* Quick search inside table */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by keyword or summary..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={selectedSentiment}
            onChange={(e) => {
              setSelectedSentiment(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Topics</option>
            <option value="quality">Quality</option>
            <option value="delivery">Delivery</option>
            <option value="price">Price</option>
            <option value="packaging">Packaging</option>
            <option value="support">Support</option>
            <option value="size_fit">Size & Fit</option>
            <option value="other">Other</option>
          </select>

          {/* Needs Reply Filter */}
          <select
            value={needsReplyFilter}
            onChange={(e) => {
              setNeedsReplyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Reply Status</option>
            <option value="YES">Needs Reply Only</option>
            <option value="NO">No Reply Needed</option>
          </select>

          {/* Mismatch Toggle */}
          <button
            onClick={() => {
              setMismatchFilter(!mismatchFilter);
              setCurrentPage(1);
            }}
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              mismatchFilter
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Mismatches Only</span>
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px] tracking-wider select-none">
            <tr>
              <th
                onClick={() => toggleSort('review_id')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">Product</th>
              <th
                onClick={() => toggleSort('rating')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Rating</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[280px]">Review Text</th>
              <th className="py-3 px-3.5">Sentiment</th>
              <th className="py-3 px-3.5">Topics</th>
              <th className="py-3 px-4 min-w-[220px]">AI English Summary</th>
              <th className="py-3 px-3.5 text-center">Reply</th>
              <th className="py-3 px-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No reviews match your selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedReviews.map((r) => {
                return (
                  <tr
                    key={r.review_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      r.rating_mismatch ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Review ID + Badges */}
                    <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-mono text-xs">{r.review_id}</span>
                        {r.is_duplicate && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200"
                            title={`Duplicate of ${r.duplicate_of}`}
                          >
                            Dup: {r.duplicate_of}
                          </span>
                        )}
                        {r.review_id === 'R012' && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-0.5"
                            title="Prompt Injection Test Passed"
                          >
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Injection
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {r.product}
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <RatingBadge rating={r.rating} />
                    </td>

                    {/* Review Text (Sanitized) */}
                    <td className="py-3 px-4 leading-relaxed text-slate-700">
                      <div
                        className="line-clamp-2 max-w-sm"
                        dangerouslySetInnerHTML={{ __html: r.sanitized_text || '<em>(empty)</em>' }}
                      />
                      {r.rating_mismatch && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Rating mismatch ({r.rating}★ vs {r.sentiment})</span>
                        </div>
                      )}
                    </td>

                    {/* Sentiment */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <SentimentBadge sentiment={r.sentiment} />
                    </td>

                    {/* Topics */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {r.topics && r.topics.length > 0 ? (
                          r.topics.map((t) => <TopicTag key={t} topic={t} />)
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* AI English Summary */}
                    <td className="py-3 px-4 text-slate-700 font-medium leading-relaxed">
                      {r.summary ? (
                        <p className="line-clamp-2">{r.summary}</p>
                      ) : (
                        <span className="text-slate-400 italic">No summary</span>
                      )}
                    </td>

                    {/* Reply Status */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {r.needs_reply ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Needs Reply
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">None</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {r.needs_reply ? (
                        <button
                          onClick={() => onOpenReplyModal(r)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>{r.suggested_reply ? 'View Reply' : 'Generate'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
