import React, { useState, useRef } from 'react';
import { Upload, Download, Play, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { CleaningStats, ProcessingMetrics } from '../../types';
import { api } from '../../services/api';

interface UploadSectionProps {
  onDataLoaded: (reviews: any[], metrics: ProcessingMetrics, stats: CleaningStats) => void;
  cleaningStats: CleaningStats | null;
  metrics: ProcessingMetrics | null;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onDataLoaded,
  cleaningStats,
  metrics,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please upload a valid .csv file.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.uploadCsv(file);
      if (res.success && res.reviews && res.metrics && res.cleaning_stats) {
        onDataLoaded(res.reviews, res.metrics, res.cleaning_stats);
      } else {
        setErrorMessage(res.error || 'Failed to process CSV file.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.loadSampleReviews();
      if (res.success && res.reviews && res.metrics && res.cleaning_stats) {
        onDataLoaded(res.reviews, res.metrics, res.cleaning_stats);
      } else {
        setErrorMessage(res.error || 'Failed to load assessment sample.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading sample dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isLoading ? 'Processing batch with AI & cache...' : 'Drop your reviews.csv here or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Required columns: review_id, product, rating, date, review_text
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Load 30 Assessment Reviews</span>
          </button>

          <a
            href={api.downloadSampleCsvUrl()}
            download="reviews.csv"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download Sample CSV</span>
          </a>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Processing Summary Bar */}
      {cleaningStats && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Rows
            </span>
            <span className="text-base font-bold text-slate-800">{cleaningStats.total_rows}</span>
          </div>

          <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Valid Reviews
            </span>
            <span className="text-base font-bold text-emerald-800">{cleaningStats.valid_reviews}</span>
          </div>

          <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Empty Text (Skipped)
            </span>
            <span className="text-base font-bold text-amber-800">{cleaningStats.empty_reviews}</span>
          </div>

          <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              Duplicates (Reused)
            </span>
            <span className="text-base font-bold text-blue-800">{cleaningStats.duplicate_reviews}</span>
          </div>

          <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
              Unknown Ratings
            </span>
            <span className="text-base font-bold text-purple-800">{cleaningStats.invalid_ratings}</span>
          </div>
        </div>
      )}
    </div>
  );
};

