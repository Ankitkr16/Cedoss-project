import React, { useState, useEffect } from 'react';
import {
  Key,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [geminiStatus, setGeminiStatus] = useState<{
    hasKey: boolean;
    model: string;
    totalCalls: number;
  } | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    totalEntries: number;
    hits: number;
    misses: number;
    cacheHitRatio: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getSettings();
      if (res.success) {
        setGeminiStatus(res.gemini);
        setCacheStats(res.cache);
      }
    } catch (err: any) {
      console.error('Error fetching settings status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setErrorMsg('Please enter a valid Gemini API key.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.updateApiKey(apiKeyInput.trim());
      if (res.success) {
        setSuccessMsg('Gemini API key updated successfully.');
        setApiKeyInput('');
        fetchStatus();
      } else {
        setErrorMsg(res.error || 'Failed to update API key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the persistent SHA-256 analysis cache?')) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.clearCache();
      if (res.success) {
        setSuccessMsg('Cache cleared successfully.');
        fetchStatus();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear cache.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System & AI Settings</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Configure Google Gemini API credentials, manage persistent SHA-256 caching, and review system diagnostics.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Gemini API Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Google Gemini API Credentials</h2>
            <p className="text-xs text-slate-500 font-medium">
              Secure server-side API key configuration (never exposed to client browser)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs">
            <span className="font-semibold text-slate-700">Status: </span>
            {geminiStatus?.hasKey ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active & Ready
              </span>
            ) : (
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                No Key Detected (.env or settings)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Model: <strong className="text-slate-800">{geminiStatus?.model || 'gemini-1.5-flash'}</strong>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Update GEMINI_API_KEY
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Key'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Obtain a free API key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline"
            >
              Google AI Studio
            </a>
            .
          </p>
        </form>
      </div>

      {/* 2. Persistent Cache Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Persistent SHA-256 Cache</h2>
            <p className="text-xs text-slate-500 font-medium">
              Survives restarts and avoids duplicate LLM calls
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Cached Reviews</span>
            <p className="text-lg font-bold text-slate-800">{cacheStats?.totalEntries ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Cache Hits</span>
            <p className="text-lg font-bold text-emerald-600">{cacheStats?.hits ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Cache Misses</span>
            <p className="text-lg font-bold text-slate-800">{cacheStats?.misses ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Hit Ratio</span>
            <p className="text-lg font-bold text-indigo-600">{cacheStats?.cacheHitRatio ?? 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Disk location: <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">backend/data/cache.json</code>
          </p>
          <button
            onClick={handleClearCache}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {/* 3. System Architecture Diagnostics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">System Architecture Diagnostics</h2>
            <p className="text-xs text-slate-500 font-medium">Pipeline specifications and thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Batch Processing
            </span>
            <p className="text-slate-500">Chunk size: 5 reviews per request</p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-600" /> Rate Limit Backoff
            </span>
            <p className="text-slate-500">Exponential 1s, 2s, 4s (Max 3 retries)</p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Schema Validation
            </span>
            <p className="text-slate-500">Zod strict validation + 1 corrective retry</p>
          </div>
        </div>
      </div>
    </div>
  );
};
