// Smart Cache Preloader - Learns from user behavior
// Preloads cache based on usage patterns and predictions

class SmartCachePreloader {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.usagePatterns = this.loadUsagePatterns();
    this.isPreloading = false;
    this.preloadQueue = [];
    this.preloadHistory = [];
  }

  // Load usage patterns from localStorage
  loadUsagePatterns() {
    try {
      const patterns = localStorage.getItem('cacheUsagePatterns');
      return patterns ? JSON.parse(patterns) : {
        pageViews: {},
        searchTerms: {},
        folderAccess: {},
        timePatterns: {},
        lastUpdated: Date.now()
      };
    } catch {
      return {
        pageViews: {},
        searchTerms: {},
        folderAccess: {},
        timePatterns: {},
        lastUpdated: Date.now()
      };
    }
  }

  // Track user behavior
  trackPageView(page) {
    this.usagePatterns.pageViews[page] = (this.usagePatterns.pageViews[page] || 0) + 1;
    this.saveUsagePatterns();
  }

  trackSearchTerm(term) {
    if (term.length < 3) return; // Ignore very short terms
    this.usagePatterns.searchTerms[term] = (this.usagePatterns.searchTerms[term] || 0) + 1;
    this.saveUsagePatterns();
  }

  trackFolderAccess(folderId, folderName) {
    this.usagePatterns.folderAccess[folderName] = {
      id: folderId,
      accessCount: (this.usagePatterns.folderAccess[folderName]?.accessCount || 0) + 1,
      lastAccessed: Date.now()
    };
    this.saveUsagePatterns();
  }

  saveUsagePatterns() {
    try {
      localStorage.setItem('cacheUsagePatterns', JSON.stringify(this.usagePatterns));
    } catch (error) {
      console.warn('Failed to save usage patterns:', error);
    }
  }

  // Predict what to preload based on patterns
  getPreloadPredictions() {
    const predictions = {
      folders: [],
      searchTerms: [],
      priority: 'low'
    };

    // Get most accessed folders
    const folderEntries = Object.entries(this.usagePatterns.folderAccess)
      .sort(([,a], [,b]) => b.accessCount - a.accessCount)
      .slice(0, 5);

    predictions.folders = folderEntries.map(([name, data]) => ({
      name,
      id: data.id,
      priority: data.accessCount > 10 ? 'high' : data.accessCount > 5 ? 'normal' : 'low'
    }));

    // Get popular search terms
    const searchEntries = Object.entries(this.usagePatterns.searchTerms)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    predictions.searchTerms = searchEntries.map(([term, count]) => ({
      term,
      count,
      priority: count > 20 ? 'high' : count > 10 ? 'normal' : 'low'
    }));

    // Determine overall priority
    const highPriorityItems = [...predictions.folders, ...predictions.searchTerms]
      .filter(item => item.priority === 'high');

    if (highPriorityItems.length > 0) {
      predictions.priority = 'high';
    } else if ([...predictions.folders, ...predictions.searchTerms]
      .some(item => item.priority === 'normal')) {
      predictions.priority = 'normal';
    }

    return predictions;
  }

  // Smart preloading based on predictions
  async startSmartPreloading() {
    if (this.isPreloading) return;

    this.isPreloading = true;
    console.log('🧠 Starting smart cache preloading...');

    try {
      const predictions = this.getPreloadPredictions();

      if (predictions.folders.length === 0 && predictions.searchTerms.length === 0) {
        console.log('📊 No usage patterns found, using default preloading');
        await this.fallbackPreloading();
        return;
      }

      // Preload high-priority folders first
      const highPriorityFolders = predictions.folders.filter(f => f.priority === 'high');
      for (const folder of highPriorityFolders) {
        await this.preloadFolder(folder.id, folder.name, 'high');
      }

      // Then normal priority
      const normalPriorityFolders = predictions.folders.filter(f => f.priority === 'normal');
      for (const folder of normalPriorityFolders) {
        await this.preloadFolder(folder.id, folder.name, 'normal');
      }

      console.log(`✅ Smart preloading complete! Preloaded ${predictions.folders.length} folders`);

    } catch (error) {
      console.warn('Smart preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  // Preload a specific folder
  async preloadFolder(folderId, folderName, priority = 'normal') {
    try {
      // Check if already cached
      const cacheKey = `folder_${folderId}`;
      const existing = await this.cacheManager.load(cacheKey);
      if (existing) {
        console.log(`📋 ${folderName} already cached`);
        return;
      }

      console.log(`🔄 Preloading ${folderName}...`);

      // Use Drive API to get folder contents
      const apiKey = window.DriveKeyManager?.getNextApiKey() || '';
      if (!apiKey) {
        console.warn('No API key available for preloading');
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)&pageSize=100`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files || [];

      // Cache the results
      await this.cacheManager.save(cacheKey, files, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        priority,
        tags: ['preloaded', 'folder', folderName]
      });

      console.log(`💾 Preloaded ${folderName}: ${files.length} files`);

    } catch (error) {
      console.warn(`Failed to preload ${folderName}:`, error);
    }
  }

  // Fallback preloading when no patterns exist
  async fallbackPreloading() {
    // Preload some common/popular folders
    const commonFolders = [
      { id: '1st-semester', name: '1st Semester' },
      { id: '2nd-semester', name: '2nd Semester' },
      { id: 'browse-resources', name: 'Browse Resources' }
    ];

    for (const folder of commonFolders) {
      // This would need actual folder IDs from drive-mapping.json
      console.log(`🔄 Fallback preloading for ${folder.name}`);
    }
  }

  // Get preloading statistics
  getPreloadStats() {
    const predictions = this.getPreloadPredictions();

    return {
      patterns: {
        foldersTracked: Object.keys(this.usagePatterns.folderAccess).length,
        searchTermsTracked: Object.keys(this.usagePatterns.searchTerms).length,
        pageViewsTracked: Object.keys(this.usagePatterns.pageViews).length
      },
      predictions: {
        foldersToPreload: predictions.folders.length,
        searchTerms: predictions.searchTerms.length,
        priority: predictions.priority
      },
      isPreloading: this.isPreloading
    };
  }

  // Manual preloading trigger
  async preloadNow(options = {}) {
    const { folders = [], searchTerms = [] } = options;

    console.log('🚀 Manual preloading triggered...');

    for (const folder of folders) {
      await this.preloadFolder(folder.id, folder.name, folder.priority || 'high');
    }

    // Could also preload search results for common terms
    // This would require more complex implementation

    console.log('✅ Manual preloading complete');
  }
}

// Export for global use
window.SmartCachePreloader = SmartCachePreloader;</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/smart-cache-preloader.js
