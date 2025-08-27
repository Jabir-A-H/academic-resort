// Performance Monitor & Optimizer Integration
// Combines all performance enhancements with real-time monitoring

class PerformanceOptimizer {
  constructor() {
    this.apiOptimizer = null;
    this.searchOptimizer = null;
    this.cacheSuite = null;
    this.searchWorker = null;

    this.metrics = {
      apiCalls: [],
      searchOperations: [],
      pageLoadTimes: [],
      memoryUsage: [],
      lastOptimizationTime: 0
    };

    this.isMonitoring = false;
    this.monitoringInterval = null;

    this.init();
  }

  async init() {
    console.log('🚀 Initializing Performance Optimizer...');

    // Initialize components if available
    if (window.DriveKeyManager) {
      this.apiOptimizer = new AdvancedAPIOptimizer(
        window.DriveKeyManager.getApiKeys(),
        {
          maxConcurrent: 8,
          batchSize: 15,
          retryAttempts: 3
        }
      );
      console.log('✅ API Optimizer initialized');
    }

    this.searchOptimizer = new SearchSpeedOptimizer({
      virtualScrollThreshold: 100,
      searchDebounceMs: 100,
      maxVisibleItems: 50
    });
    console.log('✅ Search Speed Optimizer initialized');

    if (window.CacheEnhancementSuite) {
      this.cacheSuite = window.CacheEnhancementSuite;
      console.log('✅ Cache Enhancement Suite connected');
    }

    // Initialize search worker
    this.initSearchWorker();

    // Start monitoring
    this.startMonitoring();

    console.log('🎉 Performance Optimizer ready!');
    console.log('💡 Use performanceDebug() to see optimization stats');
  }

  // Initialize Web Worker for search operations
  initSearchWorker() {
    try {
      const workerBlob = new Blob([window.SearchWorkerCode], {
        type: 'application/javascript'
      });
      const workerUrl = URL.createObjectURL(workerBlob);
      this.searchWorker = new Worker(workerUrl);

      this.searchWorker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };

      console.log('✅ Search Worker initialized');
    } catch (error) {
      console.warn('❌ Failed to initialize search worker:', error);
    }
  }

  // Handle messages from search worker
  handleWorkerMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'SEARCH_COMPLETE':
        this.handleSearchComplete(data);
        break;
      case 'INDEX_BUILD_COMPLETE':
        this.handleIndexBuildComplete(data);
        break;
      case 'INDEX_BUILD_PROGRESS':
        this.handleIndexBuildProgress(data);
        break;
      case 'STATS':
        this.handleWorkerStats(data);
        break;
    }
  }

  handleSearchComplete(data) {
    console.log(`🔍 Worker search completed in ${data.searchTime.toFixed(2)}ms, found ${data.resultCount} results`);
    this.metrics.searchOperations.push({
      type: 'worker_search',
      duration: data.searchTime,
      resultCount: data.resultCount,
      timestamp: Date.now()
    });
  }

  handleIndexBuildComplete(data) {
    console.log(`📚 Search index built in ${data.buildTime.toFixed(2)}ms (${data.indexSize} unique words)`);
  }

  handleIndexBuildProgress(data) {
    console.log(`📚 Building search index: ${data.progress.toFixed(1)}% (${data.processed}/${data.total})`);
  }

  handleWorkerStats(data) {
    console.log('📊 Search Worker Stats:', data.stats);
  }

  // ========== API OPTIMIZATION ==========

  // Optimized API request with automatic batching and retry
  async optimizedApiRequest(url, options = {}) {
    if (!this.apiOptimizer) {
      // Fallback to regular fetch
      return fetch(url, options).then(r => r.json());
    }

    const startTime = performance.now();
    try {
      const result = await this.apiOptimizer.makeRequest(url, options);
      const duration = performance.now() - startTime;

      this.metrics.apiCalls.push({
        url: url.substring(0, 100) + '...',
        duration,
        success: true,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.metrics.apiCalls.push({
        url: url.substring(0, 100) + '...',
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // Batch multiple API requests
  async batchApiRequests(requests) {
    if (!this.apiOptimizer) {
      // Fallback to sequential requests
      const results = [];
      for (const request of requests) {
        try {
          const result = await fetch(request.url, request.options).then(r => r.json());
          results.push({ success: true, data: result, url: request.url });
        } catch (error) {
          results.push({ success: false, error: error.message, url: request.url });
        }
      }
      return results;
    }

    return this.apiOptimizer.batchRequests(requests);
  }

  // ========== SEARCH OPTIMIZATION ==========

  // Perform optimized search with worker support
  async optimizedSearch(searchTerm, items, options = {}) {
    const startTime = performance.now();

    if (this.searchWorker && items.length > 500) {
      // Use worker for large datasets
      return this.workerSearch(searchTerm, items, options);
    } else {
      // Use main thread optimizer
      const results = await this.searchOptimizer.search(searchTerm, items, options);
      const duration = performance.now() - startTime;

      this.metrics.searchOperations.push({
        type: 'main_thread_search',
        duration,
        resultCount: results.length,
        itemCount: items.length,
        timestamp: Date.now()
      });

      return results;
    }
  }

  // Search using web worker
  async workerSearch(searchTerm, items, options = {}) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now() + '_' + Math.random();

      const timeout = setTimeout(() => {
        reject(new Error('Search worker timeout'));
      }, 10000); // 10 second timeout

      const messageHandler = (e) => {
        const { type, data } = e.data;
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.searchWorker.removeEventListener('message', messageHandler);

          if (type === 'SEARCH_COMPLETE') {
            const results = data.results.map(index => items[index]);
            resolve(results);
          } else {
            reject(new Error('Search failed'));
          }
        }
      };

      this.searchWorker.addEventListener('message', messageHandler);

      // Send search request to worker
      this.searchWorker.postMessage({
        type: 'SEARCH',
        data: { searchTerm, items },
        id: requestId
      });
    });
  }

  // Build search index using worker
  async buildSearchIndex(items) {
    if (!this.searchWorker) {
      return this.searchOptimizer.buildSearchIndex(items);
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now() + '_' + Math.random();

      const timeout = setTimeout(() => {
        reject(new Error('Index build timeout'));
      }, 30000); // 30 second timeout

      const messageHandler = (e) => {
        const { type, data } = e.data;
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          this.searchWorker.removeEventListener('message', messageHandler);

          if (type === 'INDEX_BUILD_COMPLETE') {
            resolve(data);
          } else {
            reject(new Error('Index build failed'));
          }
        }
      };

      this.searchWorker.addEventListener('message', messageHandler);

      // Send build request to worker
      this.searchWorker.postMessage({
        type: 'BUILD_INDEX',
        data: { items },
        id: requestId
      });
    });
  }

  // ========== MEMORY OPTIMIZATION ==========

  // Monitor and optimize memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      this.metrics.memoryUsage.push({
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // Trigger garbage collection if memory usage is high
      if (memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.8) {
        console.log('🧹 High memory usage detected, triggering optimization...');
        this.performMemoryOptimization();
      }
    }
  }

  async performMemoryOptimization() {
    // Clear old cache entries
    if (this.cacheSuite) {
      await this.cacheSuite.optimizeCache();
    }

    // Clean up search optimizer
    if (this.searchOptimizer) {
      this.searchOptimizer.performMaintenance();
    }

    // Force garbage collection (if available)
    if (window.gc) {
      window.gc();
      console.log('🗑️ Manual garbage collection triggered');
    }

    this.lastOptimizationTime = Date.now();
  }

  // ========== MONITORING & ANALYTICS ==========

  startMonitoring(intervalMs = 10000) { // 10 seconds
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Performance monitoring started');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }

  collectMetrics() {
    this.monitorMemoryUsage();

    // Clean old metrics (keep last 100 entries per type)
    Object.keys(this.metrics).forEach(key => {
      if (Array.isArray(this.metrics[key]) && this.metrics[key].length > 100) {
        this.metrics[key] = this.metrics[key].slice(-50);
      }
    });
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    const apiStats = this.getApiStats();
    const searchStats = this.getSearchStats();
    const memoryStats = this.getMemoryStats();
    const cacheStats = this.cacheSuite ? this.cacheSuite.getCacheStatus() : {};

    return {
      summary: {
        apiCalls: apiStats.totalCalls,
        searchOperations: searchStats.totalOperations,
        avgApiResponseTime: apiStats.avgResponseTime,
        avgSearchTime: searchStats.avgSearchTime,
        memoryUsage: memoryStats.currentUsage,
        cacheStatus: cacheStats.status || 'unknown'
      },
      api: apiStats,
      search: searchStats,
      memory: memoryStats,
      cache: cacheStats,
      recommendations: this.generateRecommendations()
    };
  }

  getApiStats() {
    const calls = this.metrics.apiCalls;
    const successful = calls.filter(c => c.success);
    const failed = calls.filter(c => !c.success);

    return {
      totalCalls: calls.length,
      successfulCalls: successful.length,
      failedCalls: failed.length,
      successRate: calls.length > 0 ? (successful.length / calls.length * 100).toFixed(1) + '%' : '0%',
      avgResponseTime: calls.length > 0 ? (calls.reduce((sum, c) => sum + c.duration, 0) / calls.length).toFixed(2) + 'ms' : '0ms',
      recentCalls: calls.slice(-5)
    };
  }

  getSearchStats() {
    const operations = this.metrics.searchOperations;

    return {
      totalOperations: operations.length,
      avgSearchTime: operations.length > 0 ? (operations.reduce((sum, op) => sum + op.duration, 0) / operations.length).toFixed(2) + 'ms' : '0ms',
      totalResultsFound: operations.reduce((sum, op) => sum + (op.resultCount || 0), 0),
      recentOperations: operations.slice(-5)
    };
  }

  getMemoryStats() {
    const memoryData = this.metrics.memoryUsage;
    if (memoryData.length === 0) {
      return { currentUsage: 'Unknown', trend: 'unknown' };
    }

    const latest = memoryData[memoryData.length - 1];
    const previous = memoryData.length > 1 ? memoryData[memoryData.length - 2] : latest;

    const trend = latest.used > previous.used ? 'increasing' :
                 latest.used < previous.used ? 'decreasing' : 'stable';

    return {
      currentUsage: this.formatBytes(latest.used),
      peakUsage: this.formatBytes(Math.max(...memoryData.map(m => m.used))),
      trend,
      usagePercent: ((latest.used / latest.limit) * 100).toFixed(1) + '%'
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const report = this.getPerformanceReport();

    if (report.api.successRate < 95) {
      recommendations.push({
        type: 'warning',
        category: 'api',
        message: 'API success rate is low. Consider checking API keys or network connectivity.',
        action: 'Monitor API failures and consider fallback strategies'
      });
    }

    if (report.search.avgSearchTime > 200) {
      recommendations.push({
        type: 'info',
        category: 'search',
        message: 'Search operations are slow. Consider using web worker for large datasets.',
        action: 'Enable web worker search for datasets > 500 items'
      });
    }

    if (report.memory.usagePercent > 80) {
      recommendations.push({
        type: 'warning',
        category: 'memory',
        message: 'High memory usage detected. Consider optimizing cache or triggering garbage collection.',
        action: 'Run memory optimization or reduce cache size'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        category: 'general',
        message: 'Performance is optimal!',
        action: 'Keep monitoring for any changes'
      });
    }

    return recommendations;
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Debug utilities
  debug() {
    console.group('🚀 Performance Optimizer Debug');

    console.log('Components Status:');
    console.log('  API Optimizer:', !!this.apiOptimizer);
    console.log('  Search Optimizer:', !!this.searchOptimizer);
    console.log('  Cache Suite:', !!this.cacheSuite);
    console.log('  Search Worker:', !!this.searchWorker);

    console.log('Performance Report:');
    const report = this.getPerformanceReport();
    console.table(report.summary);

    console.log('Recent API Calls:');
    console.table(report.api.recentCalls);

    console.log('Recent Search Operations:');
    console.table(report.search.recentOperations);

    console.log('Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  ${rec.type.toUpperCase()}: ${rec.message}`);
    });

    console.groupEnd();
  }
}

// Global instance
window.PerformanceOptimizer = new PerformanceOptimizer();

// Console commands
window.performanceDebug = () => window.PerformanceOptimizer.debug();
window.performanceReport = () => console.table(window.PerformanceOptimizer.getPerformanceReport().summary);
window.optimizeMemory = () => window.PerformanceOptimizer.performMemoryOptimization();

console.log(`
🎯 Performance Optimizer loaded!
💡 Available commands:
   performanceDebug()    - Show detailed performance analysis
   performanceReport()   - Show performance summary
   optimizeMemory()      - Trigger memory optimization
`);</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/performance-optimizer.js
