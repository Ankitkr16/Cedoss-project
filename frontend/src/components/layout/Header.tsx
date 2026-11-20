import React from 'react';
import { Search, Sparkles, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  products: string[];
  selectedProduct: string;
  onSelectProduct: (product: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasApiKey: boolean;
  totalApiCalls: number;
  cacheHits: number;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  searchQuery,
  onSearchChange,
  hasApiKey,
  totalApiCalls,
  cacheHits,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search and Product Selector */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reviews by keyword, ID, or AI summary..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Global Product Selector */}
        <select
          value={selectedProduct}
          onChange={(e) => onSelectProduct(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Products ({products.length})</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Right Side Stats & Profile */}
      <div className="flex items-center gap-4">
        {/* Gemini Engine Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
          {hasApiKey ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-700">Gemini 1.5</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-800 font-semibold">API Key Required</span>
            </>
          )}
        </div>

        {/* Cache / Call Counter */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-4">
          <div className="flex items-center gap-1.5" title="Total calls dispatched to Gemini API">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Calls: <strong className="text-slate-800">{totalApiCalls}</strong></span>
          </div>
          <div className="flex items-center gap-1.5" title="Requests fulfilled instantly from SHA-256 persistent cache">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cache: <strong className="text-slate-800">{cacheHits}</strong></span>
          </div>
        </div>

        {/* User Profile Placeholder */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-semibold text-indigo-700">
            EO
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Ekta Sharma</p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">Store Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
};
