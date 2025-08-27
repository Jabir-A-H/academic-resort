// Cache Enhancement Integration
// Integrates all cache improvements into your existing system

class CacheEnhancementSuite {
  constructor() {
    this.enhancedCache = null;
    this.smartPreloader = null;
    this.performanceMonitor = null;
    this.initialized = false;
  }

  // Initialize all cache enhancements
  async init() {
    if (this.initialized) return;

    console.log('🚀 Initializing Cache Enhancement Suite...');

    // Load enhanced cache manager
    if (typeof EnhancedCacheManager !== 'undefined') {
      this.enhancedCache = new EnhancedCacheManager('v3', 50); // 50MB limit
      console.log('✅ Enhanced Cache Manager loaded');
    }

    // Load smart preloader
    if (typeof SmartCachePreloader !== 'undefined' && this.enhancedCache) {
      this.smartPreloader = new SmartCachePreloader(this.enhancedCache);
      console.log('✅ Smart Cache Preloader loaded');
    }

    // Load performance monitor
    if (typeof CachePerformanceMonitor !== 'undefined' && this.enhancedCache) {
      this.performanceMonitor = new CachePerformanceMonitor(this.enhancedCache);
      this.performanceMonitor.startMonitoring();
      console.log('✅ Cache Performance Monitor loaded');
    }

    this.initialized = true;
    console.log('🎉 Cache Enhancement Suite ready!');

    // Start smart preloading after a delay
    setTimeout(() => {
      if (this.smartPreloader) {
        this.smartPreloader.startSmartPreloading();
      }
    }, 5000); // 5 seconds delay
  }

  // Enhanced cache operations with monitoring
  async save(key, data, options = {}) {
    if (!this.enhancedCache) return;

    const startTime = performance.now();
    await this.enhancedCache.save(key, data, options);
    const loadTime = performance.now() - startTime;

    if (this.performanceMonitor) {
      this.performanceMonitor.recordHit(loadTime);
    }
  }

  async load(key) {
    if (!this.enhancedCache) return null;

    const startTime = performance.now();
    const data = await this.enhancedCache.load(key);
    const loadTime = performance.now() - startTime;

    if (this.performanceMonitor) {
      if (data !== null) {
        this.performanceMonitor.recordHit(loadTime);
      } else {
        this.performanceMonitor.recordMiss();
      }
    }

    return data;
  }

  // Get comprehensive cache status
  async getCacheStatus() {
    if (!this.initialized) return { status: 'not_initialized' };

    const [cacheStats, preloadStats, performanceReport] = await Promise.all([
      this.enhancedCache?.getCacheStats() || Promise.resolve({}),
      this.smartPreloader?.getPreloadStats() || Promise.resolve({}),
      this.performanceMonitor?.getPerformanceReport() || Promise.resolve({})
    ]);

    return {
      status: 'active',
      cache: cacheStats,
      preloader: preloadStats,
      performance: performanceReport.summary || {},
      recommendations: performanceReport.recommendations || []
    };
  }

  // Manual cache optimization
  async optimizeCache() {
    console.log('🔧 Starting cache optimization...');

    // Clear low-priority cache entries
    if (this.enhancedCache) {
      await this.enhancedCache.clearCache({ priority: 'low' });
      console.log('✅ Cleared low-priority cache entries');
    }

    // Trigger smart preloading
    if (this.smartPreloader) {
      await this.smartPreloader.startSmartPreloading();
      console.log('✅ Smart preloading triggered');
    }

    // Collect fresh metrics
    if (this.performanceMonitor) {
      await this.performanceMonitor.collectMetrics();
      console.log('✅ Performance metrics updated');
    }

    console.log('🎯 Cache optimization complete!');
  }

  // Debug utilities
  debug() {
    console.group('🔍 Cache Enhancement Suite Debug Info');
    console.log('Initialized:', this.initialized);
    console.log('Enhanced Cache:', !!this.enhancedCache);
    console.log('Smart Preloader:', !!this.smartPreloader);
    console.log('Performance Monitor:', !!this.performanceMonitor);

    if (this.enhancedCache) {
      this.enhancedCache.getCacheStats().then(stats => {
        console.log('Cache Stats:', stats);
      });
    }

    if (this.smartPreloader) {
      console.log('Preloader Stats:', this.smartPreloader.getPreloadStats());
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.getPerformanceReport().then(report => {
        console.log('Performance Report:', report.summary);
      });
    }

    console.groupEnd();
  }
}

// Global instance
window.CacheEnhancementSuite = new CacheEnhancementSuite();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CacheEnhancementSuite.init();
  });
} else {
  // DOM is already ready
  window.CacheEnhancementSuite.init();
}

// Console commands for manual control
window.cacheDebug = () => window.CacheEnhancementSuite.debug();
window.cacheStatus = () => window.CacheEnhancementSuite.getCacheStatus().then(status => console.table(status));
window.cacheOptimize = () => window.CacheEnhancementSuite.optimizeCache();
window.cacheExport = () => window.CacheEnhancementSuite.performanceMonitor?.exportData();

console.log(`
🎯 Cache Enhancement Suite loaded!
💡 Try these console commands:
   cacheDebug()     - Show debug information
   cacheStatus()    - Show cache status
   cacheOptimize()  - Optimize cache
   cacheExport()    - Export performance data
`);</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/cache-enhancement-suite.js
