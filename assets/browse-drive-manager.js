/**
 * Browse Drive Manager - Optimized version
 * Handles comprehensive Drive search across all semesters and batches
 */

class BrowseDriveManager {
  constructor(apiKeys) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.currentApiIndex = 0;
    this.allDriveResources = {};
    this.allFiles = [];
    this.isLoading = false;
    this.fileCache = new Map();
    this.loadedFolders = new Set();
    this.cacheVersion = "v2";
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    this.activeRequests = new Map();
    
    // Initialize DOM cache
    this.domCache = {
      globalSearch: null,
      resultsStats: null,
      semesterFilter: null,
      batchFilter: null,
      allResources: null,
      accordionControls: null
    };

    // Initialize rate limiter
    this.apiLimiter = new APIRateLimiter(200, 2); // Aggressive settings for browse page
    
    // Initialize resolved folder cache
    if (!window.resolvedFolderCache) {
      window.resolvedFolderCache = new Map();
    }
  }

  // ========== INITIALIZATION ==========

  init() {
    this.initDOMCache();
    this.loadResolvedFolderCache();
    this.cleanExpiredCache();
    this.setupInitialStats();
    this.loadDriveMapping();
  }

  initDOMCache() {
    this.domCache.globalSearch = document.getElementById("globalSearch");
    this.domCache.resultsStats = document.getElementById("resultsStats");
    this.domCache.semesterFilter = document.getElementById("semesterFilter");
    this.domCache.batchFilter = document.getElementById("batchFilter");
    this.domCache.allResources = document.getElementById("all-resources");
    this.domCache.accordionControls = document.getElementById("accordionControls");
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

            if (age <= this.cacheDuration && cacheData.version === this.cacheVersion) {
              validKeys.push(cacheKey);
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        } catch (error) {
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
        apiKeys: this.apiKeys.length
      };
    } catch (error) {
      return { entries: 0, sizeKB: 0, lastUpdated: "Error", apiKeys: 0 };
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
      if (window.resolvedFolderCache) {
        window.resolvedFolderCache.clear();
      }

      console.log("🗑️ All browse cache data cleared");
      return true;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return false;
    }
  }

  // ========== MAPPING AND INITIALIZATION ==========

  async loadDriveMapping() {
    try {
      const response = await fetch("../assets/drive-mapping.json");
      if (!response.ok) throw new Error(`Failed to load mapping: ${response.status}`);
      
      const mapping = await response.json();

      // Convert to expected format
      this.allDriveResources = {};
      Object.entries(mapping).forEach(([semester, semesterData]) => {
        this.allDriveResources[semester] = {};
        Object.entries(semesterData.batches).forEach(([batchKey, batchData]) => {
          this.allDriveResources[semester][batchKey] = {
            label: batchData.label,
            folderId: batchData.folderId
          };
        });
      });

      this.updateStatsAfterMapping();
      return this.allDriveResources;
    } catch (error) {
      console.error("Error loading drive mapping:", error);
      this.domCache.resultsStats.textContent = "Failed to load drive mapping. Please refresh the page.";
      return {};
    }
  }

  setupInitialStats() {
    const cacheStats = this.getCacheStats();
    if (cacheStats.entries > 0) {
      this.domCache.resultsStats.innerHTML = `Ready! ${cacheStats.entries} folders available. Enter search terms to find resources. <a href="#" onclick="browseDrive.clearCacheAndReload()" class="cache-reload-link" title="Clear cache and reload fresh data">⟳</a>`;
    } else {
      this.domCache.resultsStats.textContent = "Ready to search. Enter search terms to find resources.";
    }
  }

  updateStatsAfterMapping() {
    const updatedCacheStats = this.getCacheStats();
    if (updatedCacheStats.entries > 0) {
      this.domCache.resultsStats.innerHTML = `Ready! ${updatedCacheStats.entries} folders available. Enter search terms to find resources. <a href="#" onclick="browseDrive.clearCacheAndReload()" class="cache-reload-link" title="Clear cache and reload fresh data">⟳</a>`;
    } else {
      this.domCache.resultsStats.textContent = "Ready to search. Enter search terms to find resources.";
    }
    this.displayResults([]);
  }

  // ========== RESOLVED FOLDER CACHE ==========

  loadResolvedFolderCache() {
    try {
      const cached = localStorage.getItem("resolvedFolderCache_v1");
      if (cached) {
        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;

        if (age <= this.cacheDuration && cacheData.version === this.cacheVersion) {
          window.resolvedFolderCache = new Map(Object.entries(cacheData.data));
          console.log(`📋 Loaded ${window.resolvedFolderCache.size} folder links from cache`);
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
    if (!window.resolvedFolderCache || window.resolvedFolderCache.size === 0) {
      return;
    }

    try {
      const cacheData = {
        data: Object.fromEntries(window.resolvedFolderCache),
        timestamp: Date.now(),
        version: this.cacheVersion,
      };
      localStorage.setItem("resolvedFolderCache_v1", JSON.stringify(cacheData));
      console.log(`💾 Saved ${window.resolvedFolderCache.size} folder links to cache`);
    } catch (error) {
      console.warn("Failed to save resolved folder cache:", error);
    }
  }

  // ========== CACHE MANAGEMENT UI ==========

  clearCacheAndReload() {
    if (confirm("Clear all cached data and rebuild? Since you're already on the search page, rebuilding will be faster!")) {
      this.clearAllCache();

      // Update status to show rebuilding
      this.domCache.resultsStats.textContent = "🔄 Cache cleared! Rebuilding cache with priority speed...";

      // Start immediate foreground rebuilding
      setTimeout(() => {
        this.startImmediateRebuild();
      }, 500);
    }
  }

  async startImmediateRebuild() {
    this.domCache.resultsStats.textContent = "🚀 Fast rebuilding cache...";

    try {
      await this.loadDriveMapping();

      const folderList = Object.entries(this.allDriveResources).flatMap(
        ([semester, batches]) =>
          Object.entries(batches).map(([batchKey, batchData]) => ({
            semester,
            batchKey,
            folderId: batchData.folderId
          }))
      );

      let completed = 0;

      for (const folder of folderList) {
        completed++;
        this.domCache.resultsStats.textContent = `🔄 Rebuilding cache: ${completed}/${folderList.length} folders (${Math.round((completed / folderList.length) * 100)}%)`;

        try {
          await this.rebuildFolderCache(folder.folderId, 0, 4);
        } catch (error) {
          console.warn(`Rebuild failed for ${folder.semester} ${folder.batchKey}:`, error);
        }
      }

      // Get fresh cache stats
      const cacheStats = this.getCacheStats();
      this.domCache.resultsStats.innerHTML = `Ready! ${cacheStats.entries} folders available. Enter search terms to find resources. <a href="#" onclick="browseDrive.clearCacheAndReload()" class="cache-reload-link" title="Clear cache and reload fresh data">⟳</a>`;
    } catch (error) {
      this.domCache.resultsStats.textContent = "Rebuild failed. Please refresh the page.";
    }
  }

  async rebuildFolderCache(folderId, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;

    const apiKey = this.getNextApiKey();
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;

    try {
      const data = await this.apiLimiter.makeRequest(url);

      // Save to cache
      this.saveToPersistentCache(folderId, currentDepth, data.files || []);

      // Rebuild subfolders
      const folders = (data.files || []).filter(
        (file) => file.mimeType === "application/vnd.google-apps.folder"
      );

      for (const folder of folders) {
        await this.rebuildFolderCache(folder.id, currentDepth + 1, maxDepth);
      }
    } catch (error) {
      console.warn(`Rebuild failed for folder ${folderId}:`, error);
    }
  }
}

// Export for global use
window.BrowseDriveManager = BrowseDriveManager;
