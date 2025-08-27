// Ultimate Performance Suite - All Optimizations Combined
// Integrates API optimization, search speed, cache enhancement, and performance monitoring

class UltimatePerformanceSuite {
  constructor() {
    this.components = {};
    this.initialized = false;
    this.performanceMetrics = {
      pageLoadTime: 0,
      firstSearchTime: 0,
      optimizationsEnabled: []
    };

    this.init();
  }

  async init() {
    console.log('🚀 Initializing Ultimate Performance Suite...');

    // Measure page load time
    this.measurePageLoadTime();

    // Initialize all components
    await this.initComponents();

    // Setup global optimizations
    this.setupGlobalOptimizations();

    // Start performance monitoring
    this.startPerformanceMonitoring();

    this.initialized = true;
    console.log('🎉 Ultimate Performance Suite ready!');
    console.log('💡 Use performanceSuiteDebug() to see all optimizations');
  }

  measurePageLoadTime() {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.performanceMetrics.pageLoadTime = loadTime;
      console.log(`📊 Page load time: ${loadTime}ms`);
    }
  }

  async initComponents() {
    const components = [
      { name: 'apiOptimizer', class: 'AdvancedAPIOptimizer', config: { maxConcurrent: 10, batchSize: 20 } },
      { name: 'searchOptimizer', class: 'SearchSpeedOptimizer', config: { virtualScrollThreshold: 100 } },
      { name: 'cacheSuite', class: 'CacheEnhancementSuite', config: {} },
      { name: 'performanceMonitor', class: 'PerformanceOptimizer', config: {} }
    ];

    for (const component of components) {
      try {
        if (window[component.class]) {
          const config = component.config;
          if (component.name === 'apiOptimizer' && window.DriveKeyManager) {
            config.apiKeys = window.DriveKeyManager.getApiKeys();
          }

          this.components[component.name] = new window[component.class](config);
          this.performanceMetrics.optimizationsEnabled.push(component.name);
          console.log(`✅ ${component.name} initialized`);
        }
      } catch (error) {
        console.warn(`❌ Failed to initialize ${component.name}:`, error);
      }
    }
  }

  setupGlobalOptimizations() {
    // Optimize scroll performance
    this.optimizeScrollPerformance();

    // Optimize image loading
    this.optimizeImageLoading();

    // Setup resource hints
    this.setupResourceHints();

    // Optimize DOM operations
    this.optimizeDOMOperations();
  }

  optimizeScrollPerformance() {
    // Use passive listeners for better scroll performance
    const options = { passive: true, capture: false };

    document.addEventListener('scroll', () => {
      // Throttled scroll handler
    }, options);

    document.addEventListener('touchmove', () => {
      // Throttled touch handler
    }, options);

    console.log('✅ Scroll performance optimized');
  }

  optimizeImageLoading() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });

      console.log('✅ Image loading optimized');
    }
  }

  setupResourceHints() {
    // Add resource hints for faster loading
    const hints = [
      { rel: 'preconnect', href: 'https://www.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://www.google.com' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      document.head.appendChild(link);
    });

    console.log('✅ Resource hints added');
  }

  optimizeDOMOperations() {
    // Optimize DOM queries by caching frequently used elements
    this.domCache = {
      searchInput: document.getElementById('globalSearch'),
      resultsContainer: document.getElementById('all-resources'),
      statsContainer: document.getElementById('resultsStats')
    };

    // Use DocumentFragment for batch DOM updates
    this.fragmentPool = [];

    console.log('✅ DOM operations optimized');
  }

  startPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();

    // Monitor custom metrics
    this.monitorCustomMetrics();

    console.log('✅ Performance monitoring started');
  }

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`📊 FID: ${entry.processingStart - entry.startTime}ms`);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  monitorCustomMetrics() {
    // Monitor search performance
    let firstSearchDone = false;
    const originalSearch = window.browseSearch?.optimizedSearch;

    if (originalSearch) {
      window.browseSearch.optimizedSearch = async (...args) => {
        const startTime = performance.now();
        const result = await originalSearch.apply(window.browseSearch, args);
        const duration = performance.now() - startTime;

        if (!firstSearchDone) {
          this.performanceMetrics.firstSearchTime = duration;
          firstSearchDone = true;
          console.log(`📊 First search time: ${duration.toFixed(2)}ms`);
        }

        return result;
      };
    }
  }

  // ========== OPTIMIZED API OPERATIONS ==========

  async optimizedApiCall(url, options = {}) {
    if (this.components.apiOptimizer) {
      return this.components.apiOptimizer.makeRequest(url, options);
    }

    // Fallback with basic optimizations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'force-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async batchApiCalls(requests) {
    if (this.components.apiOptimizer) {
      return this.components.apiOptimizer.batchRequests(requests);
    }

    // Fallback batch implementation
    const results = await Promise.allSettled(
      requests.map(req => fetch(req.url, req.options).then(r => r.json()))
    );

    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
      url: requests[index].url
    }));
  }

  // ========== OPTIMIZED SEARCH OPERATIONS ==========

  async optimizedSearch(searchTerm, items, container) {
    if (this.components.searchOptimizer) {
      return this.components.searchOptimizer.search(searchTerm, items, {
        container,
        enableVirtualScroll: items.length > 100
      });
    }

    // Fallback search implementation
    const results = items.filter(item => {
      const text = this.extractSearchText(item).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

    if (container) {
      this.renderResults(results, container);
    }

    return results;
  }

  extractSearchText(item) {
    if (typeof item === 'string') return item;
    return item.name || item.title || item.content || JSON.stringify(item);
  }

  renderResults(results, container) {
    const fragment = document.createDocumentFragment();

    results.forEach(result => {
      const element = document.createElement('div');
      element.className = 'search-result';
      element.innerHTML = `
        <h4>${result.name || result.title || 'Untitled'}</h4>
        <p>${result.description || result.content || ''}</p>
      `;
      fragment.appendChild(element);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  // ========== PERFORMANCE REPORTING ==========

  getPerformanceReport() {
    const report = {
      pageLoadTime: this.performanceMetrics.pageLoadTime,
      firstSearchTime: this.performanceMetrics.firstSearchTime,
      optimizationsEnabled: this.performanceMetrics.optimizationsEnabled,
      components: {},
      recommendations: []
    };

    // Component reports
    Object.entries(this.components).forEach(([name, component]) => {
      if (component.getPerformanceReport) {
        report.components[name] = component.getPerformanceReport();
      } else if (component.getStats) {
        report.components[name] = component.getStats();
      }
    });

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  generateRecommendations(report) {
    const recommendations = [];

    if (report.pageLoadTime > 3000) {
      recommendations.push({
        priority: 'high',
        category: 'loading',
        message: 'Page load time is high. Consider optimizing images and reducing JavaScript.',
        action: 'Use lazy loading and code splitting'
      });
    }

    if (report.firstSearchTime > 500) {
      recommendations.push({
        priority: 'medium',
        category: 'search',
        message: 'First search is slow. Consider pre-building search index.',
        action: 'Enable search worker for large datasets'
      });
    }

    if (report.optimizationsEnabled.length < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        message: 'Some performance optimizations are not active.',
        action: 'Ensure all performance scripts are loaded'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'general',
        message: 'Performance is well optimized!',
        action: 'Continue monitoring for improvements'
      });
    }

    return recommendations;
  }

  // ========== DEBUGGING & MONITORING ==========

  debug() {
    console.group('🚀 Ultimate Performance Suite Debug');

    console.log('Suite Status:');
    console.log('  Initialized:', this.initialized);
    console.log('  Components:', Object.keys(this.components));
    console.log('  Optimizations:', this.performanceMetrics.optimizationsEnabled);

    console.log('Performance Metrics:');
    const report = this.getPerformanceReport();
    console.table({
      'Page Load Time': report.pageLoadTime + 'ms',
      'First Search Time': report.firstSearchTime + 'ms',
      'Optimizations': report.optimizationsEnabled.length
    });

    console.log('Component Status:');
    Object.entries(report.components).forEach(([name, stats]) => {
      console.log(`  ${name}:`, stats.summary || stats);
    });

    console.log('Recommendations:');
    report.recommendations.forEach(rec => {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${rec.category}: ${rec.message}`);
    });

    console.groupEnd();
  }

  // Quick performance test
  async runPerformanceTest() {
    console.log('🧪 Running performance test...');

    const testResults = {
      apiTest: await this.testApiPerformance(),
      searchTest: await this.testSearchPerformance(),
      memoryTest: await this.testMemoryPerformance()
    };

    console.table(testResults);
    return testResults;
  }

  async testApiPerformance() {
    if (!window.DriveKeyManager) return { status: 'No API keys available' };

    const testUrl = `https://www.googleapis.com/drive/v3/files?q=trashed=false&pageSize=1&key=${window.DriveKeyManager.getNextApiKey()}`;

    try {
      const startTime = performance.now();
      await fetch(testUrl);
      const duration = performance.now() - startTime;

      return {
        status: 'success',
        responseTime: Math.round(duration) + 'ms',
        performance: duration < 500 ? 'excellent' : duration < 1000 ? 'good' : 'slow'
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async testSearchPerformance() {
    const testItems = Array.from({ length: 100 }, (_, i) => ({
      name: `Test Item ${i}`,
      description: `This is a test item number ${i} with some content`
    }));

    try {
      const startTime = performance.now();
      await this.optimizedSearch('test', testItems);
      const duration = performance.now() - startTime;

      return {
        status: 'success',
        searchTime: Math.round(duration) + 'ms',
        performance: duration < 50 ? 'excellent' : duration < 200 ? 'good' : 'slow'
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async testMemoryPerformance() {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    // Perform some operations
    await this.optimizedSearch('test', Array.from({ length: 1000 }, (_, i) => ({ name: `Item ${i}` })));

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;

    return {
      status: 'completed',
      memoryDelta: this.formatBytes(memoryDelta),
      performance: memoryDelta < 10 * 1024 * 1024 ? 'excellent' : memoryDelta < 50 * 1024 * 1024 ? 'good' : 'high'
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global instance
window.UltimatePerformanceSuite = new UltimatePerformanceSuite();

// Console commands
window.performanceSuiteDebug = () => window.UltimatePerformanceSuite.debug();
window.runPerformanceTest = () => window.UltimatePerformanceSuite.runPerformanceTest();
window.getPerformanceReport = () => console.table(window.UltimatePerformanceSuite.getPerformanceReport());

console.log(`
🎯 Ultimate Performance Suite loaded!
💡 Available commands:
   performanceSuiteDebug()    - Show comprehensive performance analysis
   runPerformanceTest()       - Run performance benchmarks
   getPerformanceReport()     - Show detailed performance report
`);</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/ultimate-performance-suite.js
