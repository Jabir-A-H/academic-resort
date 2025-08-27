// Search Speed Optimizer - Maximizes browser search performance
// Implements virtual scrolling, indexed search, and DOM optimization

class SearchSpeedOptimizer {
  constructor(options = {}) {
    this.config = {
      virtualScrollThreshold: options.virtualScrollThreshold || 100,
      searchDebounceMs: options.searchDebounceMs || 150,
      maxVisibleItems: options.maxVisibleItems || 50,
      prefetchThreshold: options.prefetchThreshold || 10,
      ...options
    };

    // Search state
    this.searchIndex = new Map();
    this.searchCache = new Map();
    this.lastSearchTerm = '';
    this.searchHistory = [];

    // Virtual scrolling
    this.virtualScroll = {
      enabled: false,
      totalItems: 0,
      visibleItems: [],
      scrollTop: 0,
      itemHeight: 60, // Estimated height per item
      containerHeight: 0
    };

    // Performance tracking
    this.performance = {
      searchTimes: [],
      renderTimes: [],
      lastSearchTime: 0,
      lastRenderTime: 0
    };

    // DOM optimization
    this.domPool = new Map(); // Object pool for DOM elements
    this.fragmentBuffer = document.createDocumentFragment();

    this.init();
  }

  init() {
    this.setupVirtualScrolling();
    this.setupSearchOptimization();
    this.setupMemoryManagement();
  }

  // ========== SEARCH OPTIMIZATION ==========

  // Build search index for fast lookups
  buildSearchIndex(items) {
    console.log(`🔍 Building search index for ${items.length} items...`);
    const startTime = performance.now();

    this.searchIndex.clear();

    items.forEach((item, index) => {
      const searchableText = this.extractSearchableText(item);
      const words = this.tokenizeText(searchableText);

      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word).add(index);
      });
    });

    const buildTime = performance.now() - startTime;
    console.log(`✅ Search index built in ${buildTime.toFixed(2)}ms`);

    return buildTime;
  }

  // Fast indexed search
  indexedSearch(searchTerm, items) {
    if (!searchTerm || searchTerm.length < 2) {
      return items.map((_, index) => index);
    }

    const startTime = performance.now();
    const queryWords = this.tokenizeText(searchTerm.toLowerCase());
    const candidateSets = [];

    // Get candidate item indices for each query word
    queryWords.forEach(word => {
      if (this.searchIndex.has(word)) {
        candidateSets.push(this.searchIndex.get(word));
      }
    });

    if (candidateSets.length === 0) {
      return [];
    }

    // Find intersection of all candidate sets (items containing all query words)
    let resultIndices = Array.from(candidateSets[0]);
    for (let i = 1; i < candidateSets.length; i++) {
      resultIndices = resultIndices.filter(index => candidateSets[i].has(index));
    }

    // Score and sort results
    const scoredResults = resultIndices.map(index => ({
      index,
      score: this.calculateRelevanceScore(items[index], queryWords)
    })).sort((a, b) => b.score - a.score);

    const searchTime = performance.now() - startTime;
    this.performance.searchTimes.push(searchTime);
    this.performance.lastSearchTime = searchTime;

    console.log(`🔍 Indexed search completed in ${searchTime.toFixed(2)}ms, found ${scoredResults.length} results`);

    return scoredResults.map(result => result.index);
  }

  // Calculate relevance score for search results
  calculateRelevanceScore(item, queryWords) {
    const searchableText = this.extractSearchableText(item).toLowerCase();
    let score = 0;

    queryWords.forEach(word => {
      const wordIndex = searchableText.indexOf(word);
      if (wordIndex !== -1) {
        // Boost score for matches at the beginning
        score += wordIndex === 0 ? 100 : 50;

        // Boost score for exact matches
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(searchableText)) {
          score += 25;
        }
      }
    });

    return score;
  }

  // Extract searchable text from item
  extractSearchableText(item) {
    if (typeof item === 'string') return item;

    // Handle different item formats
    const fields = ['name', 'title', 'content', 'description', 'text'];
    for (const field of fields) {
      if (item[field]) {
        return String(item[field]);
      }
    }

    return JSON.stringify(item);
  }

  // Tokenize text for indexing
  tokenizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  // ========== VIRTUAL SCROLLING ==========

  setupVirtualScrolling() {
    this.virtualScroll.container = document.createElement('div');
    this.virtualScroll.container.className = 'virtual-scroll-container';

    // Intersection Observer for efficient scroll handling
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleViewportEnter(entry.target);
          } else {
            this.handleViewportExit(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
  }

  // Enable virtual scrolling for large result sets
  enableVirtualScrolling(container, items, itemHeight = 60) {
    if (items.length < this.config.virtualScrollThreshold) {
      return false; // Not worth it for small lists
    }

    console.log(`📜 Enabling virtual scrolling for ${items.length} items`);

    this.virtualScroll.enabled = true;
    this.virtualScroll.totalItems = items.length;
    this.virtualScroll.itemHeight = itemHeight;
    this.virtualScroll.containerHeight = container.clientHeight;

    // Calculate visible range
    const visibleCount = Math.ceil(this.virtualScroll.containerHeight / itemHeight) + 10; // + buffer
    this.virtualScroll.visibleItems = this.calculateVisibleRange(0, visibleCount);

    // Replace container content
    container.innerHTML = '';
    container.appendChild(this.renderVirtualScrollContainer());

    this.updateVirtualScrollContent();

    return true;
  }

  calculateVisibleRange(scrollTop, visibleCount) {
    const start = Math.floor(scrollTop / this.virtualScroll.itemHeight);
    const end = Math.min(start + visibleCount, this.virtualScroll.totalItems);
    return { start, end };
  }

  renderVirtualScrollContainer() {
    const container = document.createElement('div');
    container.className = 'virtual-scroll-viewport';
    container.style.height = `${this.virtualScroll.totalItems * this.virtualScroll.itemHeight}px`;
    container.style.position = 'relative';

    const content = document.createElement('div');
    content.className = 'virtual-scroll-content';
    content.style.position = 'absolute';
    content.style.top = '0';
    content.style.left = '0';
    content.style.right = '0';

    container.appendChild(content);
    this.virtualScroll.content = content;

    return container;
  }

  updateVirtualScrollContent() {
    if (!this.virtualScroll.enabled) return;

    const { start, end } = this.virtualScroll.visibleItems;
    const content = this.virtualScroll.content;

    // Clear existing content
    content.innerHTML = '';

    // Render visible items
    for (let i = start; i < end; i++) {
      const item = this.virtualScroll.allItems[i];
      const element = this.renderVirtualItem(item, i);
      element.style.position = 'absolute';
      element.style.top = `${i * this.virtualScroll.itemHeight}px`;
      element.style.height = `${this.virtualScroll.itemHeight}px`;
      content.appendChild(element);
    }
  }

  renderVirtualItem(item, index) {
    // Use object pool for DOM elements
    let element = this.domPool.get('item');
    if (!element) {
      element = document.createElement('div');
      element.className = 'virtual-scroll-item';
      this.domPool.set('item', element);
    }

    element.textContent = this.extractSearchableText(item);
    element.dataset.index = index;

    return element;
  }

  // ========== DOM OPTIMIZATION ==========

  // Optimized DOM updates using document fragments
  optimizedRender(items, container) {
    const startTime = performance.now();

    // Clear container efficiently
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Use document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const element = this.createOptimizedElement(item, index);
      fragment.appendChild(element);
    });

    container.appendChild(fragment);

    const renderTime = performance.now() - startTime;
    this.performance.renderTimes.push(renderTime);
    this.performance.lastRenderTime = renderTime;

    console.log(`🎨 Rendered ${items.length} items in ${renderTime.toFixed(2)}ms`);

    return renderTime;
  }

  createOptimizedElement(item, index) {
    // Reuse DOM elements when possible
    let element = this.domPool.get('result-item');
    if (!element) {
      element = document.createElement('div');
      element.className = 'search-result-item';
      this.domPool.set('result-item', element);
    }

    // Update content efficiently
    element.innerHTML = this.generateItemHTML(item);
    element.dataset.index = index;

    return element;
  }

  generateItemHTML(item) {
    // Generate HTML string once, then reuse
    return `
      <div class="item-title">${item.name || item.title || 'Untitled'}</div>
      <div class="item-meta">${item.type || item.category || ''}</div>
    `;
  }

  // ========== MEMORY MANAGEMENT ==========

  setupMemoryManagement() {
    // Clean up event listeners and object pools on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Periodic cleanup
    setInterval(() => {
      this.performMaintenance();
    }, 30000); // Every 30 seconds
  }

  performMaintenance() {
    // Clean up old search cache entries
    if (this.searchCache.size > 50) {
      const entries = Array.from(this.searchCache.entries());
      entries.sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);

      // Remove oldest 20% of entries
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.searchCache.delete(entries[i][0]);
      }

      console.log(`🧹 Cleaned up ${toRemove} old search cache entries`);
    }

    // Clean up DOM pool if too large
    if (this.domPool.size > 100) {
      this.domPool.clear();
      console.log('🧹 Cleared DOM element pool');
    }
  }

  cleanup() {
    this.searchIndex.clear();
    this.searchCache.clear();
    this.domPool.clear();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  // ========== PERFORMANCE MONITORING ==========

  getPerformanceStats() {
    const avgSearchTime = this.performance.searchTimes.length > 0 ?
      this.performance.searchTimes.reduce((sum, time) => sum + time, 0) / this.performance.searchTimes.length : 0;

    const avgRenderTime = this.performance.renderTimes.length > 0 ?
      this.performance.renderTimes.reduce((sum, time) => sum + time, 0) / this.performance.renderTimes.length : 0;

    return {
      searchIndexSize: this.searchIndex.size,
      searchCacheSize: this.searchCache.size,
      domPoolSize: this.domPool.size,
      avgSearchTime: Math.round(avgSearchTime * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      lastSearchTime: Math.round(this.performance.lastSearchTime * 100) / 100,
      lastRenderTime: Math.round(this.performance.lastRenderTime * 100) / 100,
      virtualScrollEnabled: this.virtualScroll.enabled
    };
  }

  // ========== PUBLIC API ==========

  // Perform optimized search
  async search(searchTerm, items, options = {}) {
    const {
      enableVirtualScroll = true,
      container = null,
      onProgress = null
    } = options;

    // Debounce search
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    return new Promise((resolve) => {
      this.searchDebounceTimer = setTimeout(async () => {
        // Build index if needed
        if (this.searchIndex.size === 0) {
          this.buildSearchIndex(items);
        }

        // Perform indexed search
        const resultIndices = this.indexedSearch(searchTerm, items);

        // Get result items
        const results = resultIndices.map(index => items[index]);

        // Enable virtual scrolling for large result sets
        if (enableVirtualScroll && container && results.length > this.config.virtualScrollThreshold) {
          this.virtualScroll.allItems = results;
          this.enableVirtualScrolling(container, results);
          resolve(results);
        } else {
          // Regular optimized rendering
          if (container) {
            this.optimizedRender(results, container);
          }
          resolve(results);
        }

        // Update search history
        this.updateSearchHistory(searchTerm, results.length);

      }, this.config.searchDebounceMs);
    });
  }

  updateSearchHistory(term, resultCount) {
    this.searchHistory.unshift({
      term,
      resultCount,
      timestamp: Date.now()
    });

    // Keep only last 20 searches
    if (this.searchHistory.length > 20) {
      this.searchHistory.pop();
    }
  }
}

// Export for global use
window.SearchSpeedOptimizer = SearchSpeedOptimizer;</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/search-speed-optimizer.js
