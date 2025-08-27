/**
 * Background Cache Preloader System
 * 
 * This system builds cache in background on any page for faster search experience.
 * It's designed to run with low priority to not interfere with user interactions.
 * 
 * Usage:
 * 1. Include this file: <script src="assets/background-preloader.js" defer></script>
 * 2. Call initBackgroundCachePreloader() when you want to start preloading
 * 3. Use window.backgroundCachePreloader for debugging and manual control
 */

// === BACKGROUND CACHE PRELOADER ===
// Builds cache in background on any page for faster search experience

function initBackgroundCachePreloader() {
  // Different delays for different pages
  const path = location.pathname || '';
  const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  
  // Index page: longer delay to not interfere with main page experience
  // Other pages: shorter delay for faster cache building
  const delay = isIndex ? 10000 : 2000; // 10s for index, 2s for other pages
  
  console.log(`🕒 Background cache preloader will start in ${delay/1000}s...`);

  // Start background preloading after delay
  setTimeout(() => {
    startBackgroundCachePreloader();
  }, delay);
}

class BackgroundCachePreloader {
  constructor() {
    this.DRIVE_API_KEY = "AIzaSyAEOadL6D0G_c8z5EB-sEp0T3hanYAnmF0";
    this.CACHE_VERSION = "v1";
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.isPreloading = false;
    this.preloadProgress = this.getPreloadProgress();
    
    // Background rate limiter - slower to not interfere with user actions
    this.rateLimiter = new BackgroundRateLimiter(2, 300); // Max 2 concurrent, 300ms delay
  }

  getPreloadProgress() {
    try {
      const progress = localStorage.getItem(`cachePreloadProgress_${this.CACHE_VERSION}`);
      return progress ? JSON.parse(progress) : { completed: [], total: 0, lastUpdated: 0 };
    } catch {
      return { completed: [], total: 0, lastUpdated: 0 };
    }
  }

  savePreloadProgress() {
    try {
      localStorage.setItem(`cachePreloadProgress_${this.CACHE_VERSION}`, JSON.stringify(this.preloadProgress));
    } catch (error) {
      console.warn('Failed to save preload progress:', error);
    }
  }

  async loadDriveMapping() {
    try {
      // Get the base URL and construct the correct absolute path
      const currentURL = new URL(window.location.href);
      let mappingURL;
      
      if (currentURL.pathname.includes('/pages/')) {
        // We're in a subdirectory, go up one level to assets folder
        mappingURL = new URL('../assets/drive-mapping.json', currentURL.href);
      } else {
        // We're in root directory, go to assets folder
        mappingURL = new URL('./assets/drive-mapping.json', currentURL.href);
      }
      
      console.log(`🗂️ Loading drive mapping from: ${mappingURL.href}`);
      const response = await fetch(mappingURL.href);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Failed to load drive mapping for background preloader:', error);
      return {};
    }
  }

  async startPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Starting background cache preloader...');
    console.log('📍 Current location:', window.location.href);

    try {
      const driveMapping = await this.loadDriveMapping();
      
      if (!driveMapping || Object.keys(driveMapping).length === 0) {
        console.warn('⚠️ No drive mapping loaded, preloader cannot continue');
        this.isPreloading = false;
        return;
      }
      
      const folderList = this.getFolderList(driveMapping);
      
      this.preloadProgress.total = folderList.length;
      
      // Skip already completed folders
      const remainingFolders = folderList.filter(folder => 
        !this.preloadProgress.completed.includes(folder.folderId)
      );

      console.log(`📦 Background preloader: ${remainingFolders.length}/${folderList.length} folders remaining`);

      for (const folder of remainingFolders) {
        if (!this.isPreloading) break; // Allow stopping

        try {
          await this.preloadFolder(folder);
          this.preloadProgress.completed.push(folder.folderId);
          this.preloadProgress.lastUpdated = Date.now();
          this.savePreloadProgress();
        } catch (error) {
          console.warn(`Failed to preload ${folder.label}:`, error);
        }
      }

      console.log('✅ Background cache preloading completed!');
    } catch (error) {
      console.warn('Background preloader error:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  getFolderList(driveMapping) {
    const folders = [];
    for (const [semester, batches] of Object.entries(driveMapping)) {
      for (const [batchKey, batchInfo] of Object.entries(batches)) {
        folders.push({
          folderId: batchInfo.folderId,
          label: batchInfo.label,
          semester,
          batchKey
        });
      }
    }
    return folders;
  }

  async preloadFolder(folder) {
    await this.preloadFolderRecursive(folder.folderId, 0, 4); // Depth 4 like browse page
  }

  async preloadFolderRecursive(folderId, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;

    // Check if already cached
    const cacheKey = this.getCacheKey(folderId, currentDepth);
    const existing = localStorage.getItem(cacheKey);
    if (existing) {
      try {
        const cached = JSON.parse(existing);
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          // Use cached data to continue recursive preloading
          const folders = (cached.data || []).filter(file => 
            file.mimeType === "application/vnd.google-apps.folder"
          );
          
          // Preload subfolders
          for (const folder of folders) {
            await this.preloadFolderRecursive(folder.id, currentDepth + 1, maxDepth);
          }
          return;
        }
      } catch {
        // Invalid cache, will refetch
      }
    }

    // Fetch fresh data
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${this.DRIVE_API_KEY}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;
    
    try {
      const data = await this.rateLimiter.makeRequest(url);
      
      // Save to cache
      const cacheData = {
        data: data.files || [],
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
        depth: currentDepth
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Preload subfolders
      const folders = (data.files || []).filter(file => 
        file.mimeType === "application/vnd.google-apps.folder"
      );
      
      for (const folder of folders) {
        await this.preloadFolderRecursive(folder.id, currentDepth + 1, maxDepth);
      }
    } catch (error) {
      console.warn(`Background preloader failed for folder ${folderId}:`, error);
    }
  }

  getCacheKey(folderId, currentDepth) {
    return `driveCache_${this.CACHE_VERSION}_${folderId}_${currentDepth}`;
  }

  stopPreloading() {
    this.isPreloading = false;
    console.log('⏹️ Background preloader stopped');
  }

  getStats() {
    return {
      isPreloading: this.isPreloading,
      progress: this.preloadProgress,
      rateLimiterStats: this.rateLimiter.getStats()
    };
  }
}

// Background-specific rate limiter (slower, less aggressive)
class BackgroundRateLimiter {
  constructor(maxConcurrent = 2, delayBetween = 300) {
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

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { url, resolve, reject } = this.requestQueue.shift();
      this.activeRequests++;

      this.executeRequest(url, resolve, reject);
      
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetween));
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(url, resolve, reject) {
    try {
      const response = await fetch(url);
      this.activeRequests--;
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      resolve(data);
      
      setTimeout(() => this.processQueue(), this.delayBetween);
      
    } catch (error) {
      this.activeRequests--;
      reject(error);
      setTimeout(() => this.processQueue(), this.delayBetween);
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Global preloader instance
let backgroundPreloader = null;

function startBackgroundCachePreloader() {
  if (!backgroundPreloader) {
    backgroundPreloader = new BackgroundCachePreloader();
  }
  
  // Only start if not already preloading and cache might be stale
  const progress = backgroundPreloader.getPreloadProgress();
  const isStale = Date.now() - progress.lastUpdated > backgroundPreloader.CACHE_DURATION;
  
  if (!backgroundPreloader.isPreloading && (progress.total === 0 || isStale)) {
    backgroundPreloader.startPreloading();
  }
}

// Make preloader available globally for debugging and manual control
window.backgroundCachePreloader = {
  start: startBackgroundCachePreloader,
  stop: () => backgroundPreloader?.stopPreloading(),
  stats: () => backgroundPreloader?.getStats(),
  instance: () => backgroundPreloader
};

// Auto-start if this file is included (comment out if you want manual control)
// initBackgroundCachePreloader();
