/**
 * Shared Cache Management Utilities
 * 
 * This module centralizes cache operations across the Academic Resort website.
 * It eliminates code duplication by providing shared caching functionality for:
 * - Google Drive API responses (24-hour localStorage caching)
 * - Batch data and folder mappings
 * - Search results and folder structures
 * 
 * Benefits:
 * - Faster page loads by avoiding repeated API calls
 * - Consistent cache management across all pages
 * - Automatic cleanup of expired cache entries
 * - Centralized cache statistics and debugging
 */

// Cache configuration constants
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_VERSION = "v1"; // Increment this to force cache refresh on updates

/**
 * Get cache key for a folder with page-specific prefix
 */
function getCacheKey(folderId, pagePrefix = 'drive', depth = 0) {
  return `driveCache_${pagePrefix}_${CACHE_VERSION}_${folderId}_${depth}`;
}

/**
 * Get global cache metadata key for a specific page
 */
function getGlobalCacheKey(pagePrefix = 'drive') {
  return `driveCacheMetadata_${pagePrefix}_${CACHE_VERSION}`;
}

/**
 * Save data to persistent cache with timestamp
 */
function saveToPersistentCache(folderId, data, pagePrefix = 'drive', depth = 0) {
  try {
    const cacheKey = getCacheKey(folderId, pagePrefix, depth);
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    // Update metadata
    updateCacheMetadata(cacheKey, pagePrefix);
  } catch (error) {
    console.warn("Failed to save to persistent cache:", error);
  }
}

/**
 * Load data from persistent cache
 */
function loadFromPersistentCache(folderId, pagePrefix = 'drive', depth = 0) {
  try {
    const cacheKey = getCacheKey(folderId, pagePrefix, depth);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if cache is expired or version mismatch
    if (age > CACHE_DURATION || cacheData.version !== CACHE_VERSION) {
      localStorage.removeItem(cacheKey);
      removeCacheFromMetadata(cacheKey, pagePrefix);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn("Failed to load from persistent cache:", error);
    return null;
  }
}

/**
 * Update cache metadata for cleanup
 */
function updateCacheMetadata(cacheKey, pagePrefix = 'drive') {
  try {
    const metaKey = getGlobalCacheKey(pagePrefix);
    let metadata = JSON.parse(
      localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
    );
    
    if (!metadata.keys.includes(cacheKey)) {
      metadata.keys.push(cacheKey);
    }
    metadata.lastUpdated = Date.now();
    
    localStorage.setItem(metaKey, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to update cache metadata:", error);
  }
}

/**
 * Remove cache key from metadata
 */
function removeCacheFromMetadata(cacheKey, pagePrefix = 'drive') {
  try {
    const metaKey = getGlobalCacheKey(pagePrefix);
    let metadata = JSON.parse(
      localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
    );
    
    metadata.keys = metadata.keys.filter(key => key !== cacheKey);
    localStorage.setItem(metaKey, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to remove cache from metadata:", error);
  }
}

/**
 * Get cache statistics for debugging
 */
function getCacheStats(pagePrefix = 'drive') {
  try {
    const metaKey = getGlobalCacheKey(pagePrefix);
    const metadata = JSON.parse(
      localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
    );
    
    const stats = {
      totalKeys: metadata.keys.length,
      totalSize: 0,
      validKeys: 0,
      expiredKeys: 0,
    };
    
    metadata.keys.forEach(key => {
      const cached = localStorage.getItem(key);
      if (cached) {
        stats.totalSize += cached.length;
        try {
          const cacheData = JSON.parse(cached);
          const age = Date.now() - cacheData.timestamp;
          if (age > CACHE_DURATION || cacheData.version !== CACHE_VERSION) {
            stats.expiredKeys++;
          } else {
            stats.validKeys++;
          }
        } catch {
          stats.expiredKeys++;
        }
      }
    });
    
    return stats;
  } catch (error) {
    console.warn("Failed to get cache stats:", error);
    return { totalKeys: 0, totalSize: 0, validKeys: 0, expiredKeys: 0 };
  }
}

/**
 * Clear all cache for a specific page
 */
function clearPageCache(pagePrefix = 'drive') {
  try {
    const metaKey = getGlobalCacheKey(pagePrefix);
    const metadata = JSON.parse(
      localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
    );
    
    metadata.keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    localStorage.removeItem(metaKey);
    console.log(`Cleared ${metadata.keys.length} cache entries for ${pagePrefix}`);
  } catch (error) {
    console.warn("Failed to clear page cache:", error);
  }
}

/**
 * Clear ALL cache for the entire website
 * This function clears cache from all pages (semester pages, homepage, etc.)
 */
function clearAllWebsiteCache() {
  try {
    let totalCleared = 0;
    
    // List of all known page prefixes used across the website
    const allPagePrefixes = [
      'drive', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', 
      'MBA-1ST', 'MBA-2ND'
    ];
    
    // Clear cache for each page prefix
    allPagePrefixes.forEach(pagePrefix => {
      try {
        const metaKey = getGlobalCacheKey(pagePrefix);
        const metadata = JSON.parse(
          localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
        );
        
        metadata.keys.forEach(key => {
          localStorage.removeItem(key);
          totalCleared++;
        });
        
        localStorage.removeItem(metaKey);
      } catch (error) {
        console.warn(`Failed to clear cache for ${pagePrefix}:`, error);
      }
    });
    
    // Also clear any additional cache entries that might exist
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('driveCache_') || key.includes('driveCacheMetadata_') || 
          key.includes('resolvedFolderCache_') || key.includes('BATCH_DATA_CACHE')) {
        localStorage.removeItem(key);
        totalCleared++;
      }
    });
    
    console.log(`🗑️ Cleared ${totalCleared} cache entries from entire website`);
    return totalCleared;
  } catch (error) {
    console.warn("Failed to clear all website cache:", error);
    return 0;
  }
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(pagePrefix = 'drive') {
  try {
    const metaKey = getGlobalCacheKey(pagePrefix);
    const metadata = JSON.parse(
      localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
    );
    
    const validKeys = [];
    let cleanedCount = 0;
    
    metadata.keys.forEach(key => {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          const age = Date.now() - cacheData.timestamp;
          if (age > CACHE_DURATION || cacheData.version !== CACHE_VERSION) {
            localStorage.removeItem(key);
            cleanedCount++;
          } else {
            validKeys.push(key);
          }
        } catch {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    // Update metadata with valid keys only
    metadata.keys = validKeys;
    metadata.lastCleanup = Date.now();
    localStorage.setItem(metaKey, JSON.stringify(metadata));
    
    console.log(`Cleaned ${cleanedCount} expired cache entries for ${pagePrefix}`);
    return cleanedCount;
  } catch (error) {
    console.warn("Failed to clean expired cache:", error);
    return 0;
  }
}

// Export functions to global scope for use in semester pages
window.CacheUtils = {
  getCacheKey,
  getGlobalCacheKey,
  saveToPersistentCache,
  loadFromPersistentCache,
  updateCacheMetadata,
  removeCacheFromMetadata,
  getCacheStats,
  clearPageCache,
  clearAllWebsiteCache,
  cleanExpiredCache,
  CACHE_DURATION,
  CACHE_VERSION
};