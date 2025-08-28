/**
 * Unified Drive Manager
 * Handles all Drive API operations, caching, and rate limiting
 */

class DriveManager {
  constructor(config = window.SiteConfig) {
    this.config = config;
    this.apiKeys = config.apiKeys;
    this.currentApiIndex = 0;

    // Cache settings
    this.cacheVersion = config.cache.version;
    this.cacheDuration = config.cache.duration;

    // Rate limiter settings
    this.maxConcurrent = config.cache.maxConcurrent;
    this.delayBetween = config.cache.delayBetween;

    // State
    this.allDriveResources = {};
    this.allFiles = [];
    this.isLoading = false;
    this.fileCache = new Map();
    this.loadedFolders = new Set();
    this.activeRequests = new Map();

    // Initialize rate limiter
    this.apiLimiter = new APIRateLimiter(this.maxConcurrent, this.delayBetween);

    // Initialize resolved folder cache
    if (!window.resolvedFolderCache) {
      window.resolvedFolderCache = new Map();
    }
  }

  // ========== INITIALIZATION ==========

  init() {
    this.loadDriveMapping();
    this.loadResolvedFolderCache();
    this.cleanExpiredCache();
    console.log('✅ Drive Manager initialized');
  }

  loadDriveMapping() {
    this.allDriveResources = this.config.driveMapping;
    console.log(`📁 Loaded ${Object.keys(this.allDriveResources).length} semesters`);
  }

  // ========== API KEY MANAGEMENT ==========

  getNextApiKey() {
    const key = this.apiKeys[this.currentApiIndex];
    this.currentApiIndex = (this.currentApiIndex + 1) % this.apiKeys.length;
    return key;
  }

  // ========== CACHE MANAGEMENT ==========

  getCacheKey(folderId, currentDepth) {
    return `driveCache_${this.cacheVersion}_${folderId}_${currentDepth}`;
  }

  getGlobalCacheKey() {
    return `driveCacheMetadata_${this.cacheVersion}`;
  }

  saveToPersistentCache(folderId, currentDepth, data) {
    try {
      const cacheKey = this.getCacheKey(folderId, currentDepth);
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        version: this.cacheVersion,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      this.updateCacheMetadata(cacheKey);
    } catch (error) {
      console.warn("Failed to save to persistent cache:", error);
    }
  }

  loadFromPersistentCache(folderId, currentDepth) {
    try {
      const cacheKey = this.getCacheKey(folderId, currentDepth);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > this.cacheDuration || cacheData.version !== this.cacheVersion) {
        localStorage.removeItem(cacheKey);
        this.removeCacheFromMetadata(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Failed to load from persistent cache:", error);
      return null;
    }
  }

  updateCacheMetadata(cacheKey) {
    try {
      const metaKey = this.getGlobalCacheKey();
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

  removeCacheFromMetadata(cacheKey) {
    try {
      const metaKey = this.getGlobalCacheKey();
      let metadata = JSON.parse(
        localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
      );
      metadata.keys = metadata.keys.filter((key) => key !== cacheKey);
      localStorage.setItem(metaKey, JSON.stringify(metadata));
    } catch (error) {
      console.warn("Failed to remove from cache metadata:", error);
    }
  }

  cleanExpiredCache() {
    try {
      const metaKey = this.getGlobalCacheKey();
      let metadata = JSON.parse(
        localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
      );

      // Only run cleanup once per hour
      if (Date.now() - metadata.lastCleanup < 60 * 60 * 1000) return;

      const validKeys = [];

      metadata.keys.forEach((cacheKey) => {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (
              age <= this.cacheDuration &&
              cacheData.version === this.cacheVersion
            ) {
              validKeys.push(cacheKey);
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        } catch (error) {
          // Remove invalid cache entries
          localStorage.removeItem(cacheKey);
        }
      });

      metadata.keys = validKeys;
      metadata.lastCleanup = Date.now();
      localStorage.setItem(metaKey, JSON.stringify(metadata));
    } catch (error) {
      console.warn("Cache cleanup failed:", error);
    }
  }

  // ========== FOLDER CACHE MANAGEMENT ==========

  loadResolvedFolderCache() {
    try {
      const cached = localStorage.getItem("resolvedFolderCache_v1");
      if (cached) {
        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;

        // Cache valid for 24 hours
        if (age <= this.cacheDuration && cacheData.version === this.cacheVersion) {
          window.resolvedFolderCache = new Map(
            Object.entries(cacheData.data)
          );
          console.log(
            `📁 Loaded ${window.resolvedFolderCache.size} resolved folder links from cache`
          );
        } else {
          localStorage.removeItem("resolvedFolderCache_v1");
        }
      }
    } catch (error) {
      console.warn("Failed to load resolved folder cache:", error);
    }

    if (!window.resolvedFolderCache) {
      window.resolvedFolderCache = new Map();
    }
  }

  saveResolvedFolderCache() {
    if (
      !window.resolvedFolderCache ||
      window.resolvedFolderCache.size === 0
    ) {
      return; // Nothing to save
    }

    try {
      const cacheData = {
        data: Object.fromEntries(window.resolvedFolderCache),
        timestamp: Date.now(),
        version: this.cacheVersion,
      };
      localStorage.setItem(
        "resolvedFolderCache_v1",
        JSON.stringify(cacheData)
      );
      console.log(
        `💾 Saved ${window.resolvedFolderCache.size} folder links to cache`
      );
    } catch (error) {
      console.warn("Failed to save resolved folder cache:", error);
    }
  }

  // ========== API OPERATIONS ==========

  async searchFolder(folderId, path = "", maxDepth = 5, searchTerm = "", currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    // Check persistent cache first
    let cachedFiles = this.loadFromPersistentCache(folderId, currentDepth);
    if (cachedFiles) {
      this.fileCache.set(`${folderId}_${currentDepth}`, cachedFiles);
      return await this.processFilesRecursively(
        cachedFiles,
        path,
        maxDepth,
        searchTerm,
        currentDepth
      );
    }

    // Check in-memory cache
    const cacheKey = `${folderId}_${currentDepth}`;
    if (this.fileCache.has(cacheKey)) {
      const memCachedFiles = this.fileCache.get(cacheKey);
      return await this.processFilesRecursively(
        memCachedFiles,
        path,
        maxDepth,
        searchTerm,
        currentDepth
      );
    }

    try {
      const apiKey = this.getNextApiKey();
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;

      const data = await this.apiLimiter.makeRequest(url);

      // Cache the response
      const files = data.files || [];
      this.fileCache.set(cacheKey, files);
      this.saveToPersistentCache(folderId, currentDepth, files);

      return await this.processFilesRecursively(
        files,
        path,
        maxDepth,
        searchTerm,
        currentDepth
      );
    } catch (error) {
      console.error(`Error searching folder ${folderId}:`, error);
      return [];
    }
  }

  async processFilesRecursively(files, path, maxDepth, searchTerm, currentDepth) {
    const results = [];
    const subfolderPromises = [];

    files.forEach((file) => {
      const filePath = path ? `${path}/${file.name}` : file.name;
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";

      // Enhanced fuzzy search
      const matchesSearch = !searchTerm || this.smartMatch(searchTerm, file.name, filePath);

      if (matchesSearch) {
        results.push({
          ...file,
          path: filePath,
          depth: currentDepth,
          isFolder: isFolder,
          parentPath: path,
        });
      }

      // Store folder IDs during initial search
      if (isFolder && window.resolvedFolderCache) {
        const exactKey = `${filePath}`;
        window.resolvedFolderCache.set(exactKey, file.id);
      }

      // Search subfolders recursively
      if (isFolder && currentDepth < maxDepth - 1) {
        subfolderPromises.push(
          this.searchFolder(file.id, filePath, maxDepth, searchTerm, currentDepth + 1)
        );
      }
    });

    // Wait for all subfolder searches
    if (subfolderPromises.length > 0) {
      const subfolderResults = await Promise.all(subfolderPromises);
      results.push(...subfolderResults.flat());
    }

    return results;
  }

  // ========== SEARCH MATCHING ==========

  smartMatch(searchTerm, fileName, filePath) {
    const search = searchTerm.toLowerCase().trim();
    const name = fileName.toLowerCase();
    const path = filePath.toLowerCase();

    // If search is empty, don't match anything
    if (!search) return false;

    // Exact phrase match
    if (name.includes(search) || path.includes(search)) {
      return true;
    }

    // Complete word boundaries
    const searchWords = search.split(/\s+/).filter((word) => word.length > 0);

    if (searchWords.length === 1) {
      const word = searchWords[0];
      const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return wordBoundaryRegex.test(name) || wordBoundaryRegex.test(path);
    }

    // All words must be present
    const allWordsPresent = searchWords.every((word) => {
      const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return wordBoundaryRegex.test(name) || wordBoundaryRegex.test(path);
    });

    return allWordsPresent;
  }

  // ========== UTILITIES ==========

  getCacheStats() {
    try {
      const metaKey = this.getGlobalCacheKey();
      const metadata = JSON.parse(
        localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
      );

      let totalSize = 0;
      let validEntries = 0;

      metadata.keys.forEach((cacheKey) => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          totalSize += cached.length;
          validEntries++;
        }
      });

      return {
        entries: validEntries,
        sizeKB: Math.round(totalSize / 1024),
        lastUpdated: metadata.lastUpdated
          ? new Date(metadata.lastUpdated).toLocaleString()
          : "Never",
      };
    } catch (error) {
      return { entries: 0, sizeKB: 0, lastUpdated: "Error" };
    }
  }

  clearAllCache() {
    try {
      const metaKey = this.getGlobalCacheKey();
      const metadata = JSON.parse(
        localStorage.getItem(metaKey) || '{"keys":[],"lastCleanup":0}'
      );

      // Remove all cache entries
      metadata.keys.forEach((cacheKey) => {
        localStorage.removeItem(cacheKey);
      });

      // Clear metadata
      localStorage.removeItem(metaKey);

      // Clear folder link cache
      localStorage.removeItem("resolvedFolderCache_v1");

      // Clear in-memory caches
      this.fileCache.clear();

      // Clear resolved folder cache
      if (window.resolvedFolderCache) {
        window.resolvedFolderCache.clear();
      }

      return true;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return false;
    }
  }
}

// ========== API RATE LIMITER ==========

class APIRateLimiter {
  constructor(maxConcurrent = 50, delayBetween = 5) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetween = delayBetween;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrent
    ) {
      const { url, resolve, reject } = this.requestQueue.shift();
      this.activeRequests++;

      this.executeRequest(url, resolve, reject);

      // Small delay between starting requests
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetween));
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(url, resolve, reject) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Handle different error types
        if (response.status === 500 || response.status === 403 ||
            response.status === 404 || response.status === 429 ||
            response.status === 401) {
          resolve({ files: [] });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      resolve(data);
    } catch (error) {
      console.warn(`🚫 API Error:`, error.message);
      resolve({ files: [] }); // Return empty result to continue search
    } finally {
      // Always decrement counter
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      setTimeout(() => this.processQueue(), this.delayBetween);
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// ========== UTILITY FUNCTIONS ==========

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========== GLOBAL EXPORTS ==========

window.DriveManager = DriveManager;
window.APIRateLimiter = APIRateLimiter;
window.debounce = debounce;
