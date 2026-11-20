import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIAnalysisResult } from '../types/review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CacheEntry {
  hash: string;
  result: AIAnalysisResult;
  cached_at: string;
}

export class CacheService {
  private cacheFilePath: string;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  constructor(customPath?: string) {
    if (customPath) {
      this.cacheFilePath = customPath;
    } else if (process.env.CACHE_FILE_PATH) {
      this.cacheFilePath = process.env.CACHE_FILE_PATH;
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } else {
      const dataDir = process.env.CACHE_DIR || path.resolve(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.cacheFilePath = path.join(dataDir, 'cache.json');
    }
    this.loadCache();
  }

  private loadCache(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.hash && item.result) {
              this.memoryCache.set(item.hash, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[CacheService] Failed to load cache from disk, initializing fresh:', err);
      this.memoryCache.clear();
    }
  }

  private persistCache(): void {
    try {
      const arrayData = Array.from(this.memoryCache.values());
      const tempPath = `${this.cacheFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(arrayData, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.cacheFilePath);
    } catch (err) {
      console.error('[CacheService] Error saving cache to disk:', err);
    }
  }

  public get(hash: string): AIAnalysisResult | null {
    const entry = this.memoryCache.get(hash);
    if (entry) {
      this.hits++;
      return entry.result;
    }
    this.misses++;
    return null;
  }

  public set(hash: string, result: AIAnalysisResult): void {
    // Only store valid successful results
    if (!result || !result.sentiment || !result.summary) {
      return;
    }

    const entry: CacheEntry = {
      hash,
      result,
      cached_at: new Date().toISOString(),
    };

    this.memoryCache.set(hash, entry);
    this.persistCache();
  }

  public has(hash: string): boolean {
    return this.memoryCache.has(hash);
  }

  public clear(): void {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.writeFileSync(this.cacheFilePath, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[CacheService] Error clearing cache file:', err);
    }
  }

  public getStats() {
    return {
      totalEntries: this.memoryCache.size,
      hits: this.hits,
      misses: this.misses,
      cacheHitRatio:
        this.hits + this.misses > 0 ? Number(((this.hits / (this.hits + this.misses)) * 100).toFixed(1)) : 0,
      cacheFilePath: this.cacheFilePath,
    };
  }
}

export const persistentCache = new CacheService();

