import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { EnrichedReview } from '../../types';
import { api } from '../../services/api';
import { SentimentBadge, RatingBadge } from '../common/Badge';

interface ReplyModalProps {
  review: EnrichedReview | null;
  onClose: () => void;
  onReplyGenerated: (reviewId: string, reply: string) => void;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  review,
  onClose,
  onReplyGenerated,
}) => {
  if (!review) return null;

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(
    review.suggested_reply || null
  );

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.generateReply(review.review_id);
      if (res.success && res.suggested_reply) {
        setSuggestedReply(res.suggested_reply);
        onReplyGenerated(review.review_id, res.suggested_reply);
      } else {
        setErrorMessage(res.error || 'Failed to generate AI suggested reply.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!suggestedReply) return;
    navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                AI Suggested Customer Reply ({review.review_id})
              </h3>
              <p className="text-xs text-slate-500 font-medium">{review.product}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Review Details Box */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <RatingBadge rating={review.rating} />
              <SentimentBadge sentiment={review.sentiment} />
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
              "{review.review_text}"
            </p>
            {review.summary && (
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">AI Summary:</span> {review.summary}
              </p>
            )}
          </div>

          {/* Suggested Reply Generation Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Suggested Response
              </label>
              {suggestedReply && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Reply</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {suggestedReply ? (
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg text-xs leading-relaxed text-slate-800 font-medium relative">
                {suggestedReply}
              </div>
            ) : (
              <div className="p-6 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-3">
                  Click below to generate a tailored, empathetic response using Gemini AI.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Generating reply...' : 'Generate Customer Reply'}</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Security & Ethical Guardrails Callout */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-[11px] text-amber-800 leading-relaxed font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Guardrail:</span> AI responses are strictly
              programmed to be empathetic and constructive without making unauthorized promises of
              unconditional refunds, replacements, or financial compensation.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
          >
            Close
          </button>

          {suggestedReply && (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
