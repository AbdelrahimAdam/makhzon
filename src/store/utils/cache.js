import { SPARK_CONFIG } from './constants';

// SPARK ENHANCED SEARCH CACHE
export class SearchCache {
  constructor() {
    this.cache = new Map();
    this.accessLog = new Map();
    this.size = 0;
    this.maxSize = SPARK_CONFIG.MAX_CACHE_ENTRIES;
    this.cleanupTimer = null;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      // Update access time
      this.accessLog.set(key, Date.now());
      return entry.results;
    }
    return null;
  }

  set(key, results) {
    // Cleanup if needed
    if (this.size >= this.maxSize) {
      this.cleanup();
    }

    const entry = {
      results,
      timestamp: Date.now(),
      size: JSON.stringify(results).length
    };

    this.cache.set(key, entry);
    this.accessLog.set(key, Date.now());
    this.size++;

    // Schedule cleanup
    this.scheduleCleanup();
  }

  cleanup() {
    const now = Date.now();
    const toDelete = [];

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > SPARK_CONFIG.CACHE_TTL) {
        toDelete.push(key);
      }
    }

    // If still over limit, remove least recently used
    if (this.size - toDelete.length > this.maxSize) {
      const lruEntries = Array.from(this.accessLog.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.maxSize / 2);

      lruEntries.forEach(([key]) => {
        if (!toDelete.includes(key)) {
          toDelete.push(key);
        }
      });
    }

    // Delete entries
    toDelete.forEach(key => {
      this.cache.delete(key);
      this.accessLog.delete(key);
      this.size--;
    });

    if (toDelete.length > 0) {
      console.log(`🧹 SPARK Cache cleaned: removed ${toDelete.length} entries`);
    }
  }

  scheduleCleanup() {
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => this.cleanup(), SPARK_CONFIG.CACHE_CLEANUP_INTERVAL);
  }

  clear() {
    const oldSize = this.size;
    this.cache.clear();
    this.accessLog.clear();
    this.size = 0;
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.log(`🧹 SPARK Cache cleared: ${oldSize} entries removed`);
    return oldSize;
  }
}

// Helper: Get cache key
export const getCacheKey = (searchTerm, warehouseId, limit = SPARK_CONFIG.MAX_RESULTS) => {
  return `${warehouseId || 'all'}:${searchTerm.toLowerCase().trim()}:${limit}:${Date.now() % 10000}`;
};